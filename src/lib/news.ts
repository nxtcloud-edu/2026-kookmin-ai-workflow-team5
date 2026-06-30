import type { NewsItem } from "./mockData";
import { analyzeNews } from "./groq";

const POSITIVE = [
  "상승",
  "호재",
  "급등",
  "성장",
  "회복",
  "개선",
  "흑자",
  "증가",
  "돌파",
  "기대",
  "강세",
  "반등",
  "gain",
  "growth",
  "beat",
  "beats",
  "surge",
  "rally",
  "strong",
  "upgrade",
  "record"
];
const NEGATIVE = [
  "하락",
  "악재",
  "급락",
  "우려",
  "부진",
  "적자",
  "감소",
  "둔화",
  "약세",
  "위기",
  "폭락",
  "하향",
  "fall",
  "falls",
  "drop",
  "drops",
  "slump",
  "risk",
  "concern",
  "weak",
  "downgrade",
  "miss"
];

function detectSentiment(text: string): { sentiment: NewsItem["sentiment"]; impact: NewsItem["impact"] } {
  const normalized = text.toLowerCase();

  if (POSITIVE.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return { impact: "호재", sentiment: "positive" };
  }

  if (NEGATIVE.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return { impact: "악재", sentiment: "negative" };
  }

  return { impact: "중립", sentiment: "neutral" };
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

    const pubDateObj = pubDate ? new Date(pubDate) : new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 10);
    if (pubDateObj < cutoff) continue;

    const date = pubDateObj.toISOString().split("T")[0];
    const { sentiment, impact } = detectSentiment(`${title} ${description}`);

    items.push({
      id: `${prefix}-${i++}`,
      title,
      source,
      date,
      sentiment,
      impact,
      summary: description.slice(0, 120) || title,
      url
    });
  }

  return items;
}

async function fetchGoogleNews(query: string, prefix: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Google News 요청 실패: ${query}`);
  const xml = await res.text();
  const items = parseRSS(xml, prefix).slice(0, 6);

  const analysis = await analyzeNews(items.map((item) => ({ id: item.id, title: item.title }))).catch(() => new Map());

  return items.map((item) => {
    const result = analysis.get(item.id);

    if (!result) return item;

    return { ...item, sentiment: result.sentiment, impact: result.impact, summary: result.summary };
  });
}

export async function fetchSystematicNews(query = "S&P 500 interest rates dollar AI semiconductor", prefix = "sys"): Promise<NewsItem[]> {
  return fetchGoogleNews(query, prefix);
}

export async function fetchUnsystematicNews(stockName: string, symbol = stockName): Promise<NewsItem[]> {
  return fetchGoogleNews(`${stockName} ${symbol} stock`, symbol);
}
