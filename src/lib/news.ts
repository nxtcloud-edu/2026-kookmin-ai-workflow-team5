import type { NewsItem } from "./mockData";

const POSITIVE = ["상승", "호재", "급등", "성장", "회복", "개선", "흑자", "증가", "돌파", "기대", "강세", "반등"];
const NEGATIVE = ["하락", "악재", "급락", "우려", "부진", "적자", "감소", "둔화", "약세", "위기", "폭락", "하향"];

function detectSentiment(text: string): { sentiment: NewsItem["sentiment"]; impact: NewsItem["impact"] } {
  if (POSITIVE.some((kw) => text.includes(kw))) return { sentiment: "positive", impact: "호재" };
  if (NEGATIVE.some((kw) => text.includes(kw))) return { sentiment: "negative", impact: "악재" };
  return { sentiment: "neutral", impact: "중립" };
}

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

    const date = pubDate
      ? new Date(pubDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const { sentiment, impact } = detectSentiment(title + description);

    items.push({
      id: `${prefix}-${i++}`,
      title,
      source,
      date,
      sentiment,
      impact,
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
  return parseRSS(xml, prefix).slice(0, 6);
}

// 체계적 위험: 시장 전체에 영향을 주는 거시경제 뉴스
export async function fetchSystematicNews(): Promise<NewsItem[]> {
  return fetchGoogleNews("KOSPI 주식 금리 환율 경제", "sys");
}

// 비체계적 위험: 종목별 뉴스 (종목명으로 검색)
export async function fetchUnsystematicNews(stockName: string): Promise<NewsItem[]> {
  return fetchGoogleNews(`${stockName} 주가`, stockName);
}
