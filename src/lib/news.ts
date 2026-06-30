import type { NewsItem } from "./mockData";
import { analyzeNews } from "./groq";

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTag(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdata) return cdata[1].trim();
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  return plain ? plain[1].trim() : "";
}

function parseRSS(xml: string, prefix: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let i = 0;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const rawTitle = extractTag(content, "title");
    const url = extractTag(content, "link");
    const pubDate = extractTag(content, "pubDate");
    const source = extractTag(content, "source") || "Google 뉴스";

    // 제목에서 " - 출처명" 제거
    const title = rawTitle.replace(/\s+-\s+[^-]+$/, "").trim();

    // description은 HTML 엔티티로 인코딩되어 있으므로 먼저 디코딩 후 태그·URL 제거
    const description = decodeEntities(extractTag(content, "description"))
      .replace(/<[^>]*>/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!title) continue;

    const pubDateObj = pubDate ? new Date(pubDate) : new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 10);
    if (pubDateObj < cutoff) continue;

    const date = pubDateObj.toISOString().split("T")[0];

    items.push({
      id: `${prefix}-${i++}`,
      title,
      source,
      date,
      sentiment: "neutral",
      impact: "중립",
      summary: description.slice(0, 120) || title,
      url,
    });
  }

  return items;
}

async function fetchGoogleNews(query: string, prefix: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Google News 요청 실패: ${query}`);
  const xml = await res.text();
  const items = parseRSS(xml, prefix).slice(0, 6);

  // Groq으로 호재/악재/중립 분류 + 요약
  const analysis = await analyzeNews(items.map((item) => ({ id: item.id, title: item.title }))).catch(() => new Map());
  return items.map((item) => {
    const result = analysis.get(item.id);
    if (!result) return item;
    return { ...item, sentiment: result.sentiment, impact: result.impact, summary: result.summary };
  });
}

// 체계적 위험: 시장 전체에 영향을 주는 거시경제 뉴스
export async function fetchSystematicNews(): Promise<NewsItem[]> {
  return fetchGoogleNews("KOSPI 주식 금리 환율 경제", "sys");
}

// 비체계적 위험: 종목별 뉴스 (종목명으로 검색)
export async function fetchUnsystematicNews(stockName: string): Promise<NewsItem[]> {
  return fetchGoogleNews(`${stockName} 주가`, stockName);
}
