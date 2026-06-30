import type { NewsItem } from "./mockData";
import { analyzeNews, detectTopicAndAnalyze } from "./groq";

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

    const title = rawTitle.replace(/\s+-\s+[^-]+$/, "").trim();

    const description = decodeEntities(extractTag(content, "description"))
      .replace(/<[^>]*>/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!title) continue;

    const pubDateObj = pubDate ? new Date(pubDate) : new Date();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
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
      url
    });
  }

  return items;
}

async function fetchGoogleNewsRaw(query: string, prefix: string, limit = 20): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Google News 요청 실패: ${query}`);
  const xml = await res.text();
  return parseRSS(xml, prefix).slice(0, limit);
}

// 체계적 위험: 넓게 수집 후 Groq이 현재 가장 중요한 이슈 감지 → 관련 기사 6개 선별 + 분석
export async function fetchSystematicNews(_query?: string, prefix = "sys"): Promise<NewsItem[]> {
  const broadItems = await fetchGoogleNewsRaw("economy stock market interest rates inflation currency", prefix, 20);
  const { selectedIndices, results } = await detectTopicAndAnalyze(
    broadItems.map((item) => ({ id: item.id, title: item.title }))
  ).catch(() => ({ selectedIndices: [] as number[], results: new Map() }));

  const validIndices = selectedIndices.filter((i) => i >= 0 && i < broadItems.length);
  const selected = validIndices.length > 0
    ? validIndices.map((i) => broadItems[i])
    : broadItems.slice(0, 6);

  return selected.map((item, idx) => {
    const result = results.get(validIndices[idx] ?? idx);
    if (!result) return item;
    return { ...item, sentiment: result.sentiment, impact: result.impact, summary: result.summary };
  });
}

// 비체계적 위험: 종목명으로 검색 후 Groq 분석
export async function fetchUnsystematicNews(stockName: string, symbol = stockName): Promise<NewsItem[]> {
  const items = await fetchGoogleNewsRaw(`${stockName} ${symbol} stock`, symbol, 6);
  const analysis = await analyzeNews(items.map((item) => ({ id: item.id, title: item.title }))).catch(() => new Map());

  return items.map((item) => {
    const result = analysis.get(item.id);
    if (!result) return item;
    return { ...item, sentiment: result.sentiment, impact: result.impact, summary: result.summary };
  });
}
