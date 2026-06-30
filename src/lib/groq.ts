import type { NewsItem, Stock } from "./mockData";
import type { Recommendation } from "./recommendation";

type GroqResult = {
  impact: "호재" | "악재" | "중립";
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function isImpact(value: unknown): value is GroqResult["impact"] {
  return value === "호재" || value === "악재" || value === "중립";
}

function isSentiment(value: unknown): value is GroqResult["sentiment"] {
  return value === "positive" || value === "negative" || value === "neutral";
}

function hasGroqConfig() {
  return Boolean(process.env.GROQ_API_KEY);
}

function normalizeResult(value: Partial<GroqResult>): GroqResult | null {
  if (!isImpact(value.impact) || !isSentiment(value.sentiment) || !value.summary) {
    return null;
  }

  return {
    impact: value.impact,
    sentiment: value.sentiment,
    summary: value.summary.slice(0, 80)
  };
}

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    body: JSON.stringify({
      messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.1
    }),
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    method: "POST",
    next: { revalidate: 600 }
  });

  if (!response.ok) return "";
  const payload = (await response.json()) as GroqResponse;
  return payload.choices?.[0]?.message?.content ?? "";
}

export async function analyzeNews(
  items: Pick<NewsItem, "id" | "title">[]
): Promise<Map<string, GroqResult>> {
  if (!hasGroqConfig() || items.length === 0) {
    return new Map();
  }

  const numbered = items
    .map((item, index) => `${index + 1}. [${item.id}] ${item.title}`)
    .join("\n");

  const raw = await callGroq([
    {
      content: `You classify stock market news for an educational demo.
Return only a JSON array. Do not include markdown or extra text.

[
  {
    "id": "news id",
    "impact": "호재" | "악재" | "중립",
    "sentiment": "positive" | "negative" | "neutral",
    "summary": "Korean summary under 40 characters"
  }
]`,
      role: "system"
    },
    {
      content: `Classify these news titles:\n\n${numbered}`,
      role: "user"
    }
  ]).catch(() => "");

  if (!raw) return new Map();

  try {
    const parsed = JSON.parse(raw) as Array<Partial<GroqResult> & { id?: string }>;

    return new Map(
      parsed.flatMap((item) => {
        if (!item.id) return [];
        const normalized = normalizeResult(item);
        return normalized ? [[item.id, normalized]] : [];
      })
    );
  } catch {
    return new Map();
  }
}

type TopicResult = {
  selectedIndices: number[];
  results: Map<number, GroqResult>;
};

export async function detectTopicAndAnalyze(
  items: Pick<NewsItem, "id" | "title">[]
): Promise<TopicResult> {
  if (!hasGroqConfig() || items.length === 0) {
    return { selectedIndices: [], results: new Map() };
  }

  const numbered = items.map((item, i) => `${i + 1}. ${item.title}`).join("\n");

  const raw = await callGroq([
    {
      role: "system",
      content: `You are a financial news analyst. You will receive a numbered list of news headlines.

Your task:
1. Identify the most important current economic or market theme/issue across all headlines
2. Select EXACTLY 6 articles most relevant to that theme
3. For each selected article, classify its impact on the stock market

You MUST return EXACTLY 6 items in the "selected" array. No more, no less.

Respond ONLY with valid JSON in this exact format:
{
  "selected": [
    { "number": 2, "impact": "호재", "sentiment": "positive", "summary": "한 문장 요약" },
    { "number": 5, "impact": "악재", "sentiment": "negative", "summary": "한 문장 요약" },
    { "number": 8, "impact": "중립", "sentiment": "neutral", "summary": "한 문장 요약" },
    { "number": 11, "impact": "호재", "sentiment": "positive", "summary": "한 문장 요약" },
    { "number": 14, "impact": "악재", "sentiment": "negative", "summary": "한 문장 요약" },
    { "number": 17, "impact": "중립", "sentiment": "neutral", "summary": "한 문장 요약" }
  ]
}

impact must be one of: 호재, 악재, 중립
sentiment must be one of: positive, negative, neutral`
    },
    {
      role: "user",
      content: `From the following ${items.length} headlines, select EXACTLY 6 that best represent the most important current market theme. Return EXACTLY 6 items:\n\n${numbered}`
    }
  ]).catch(() => "");

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let parsed: { selected: (Partial<GroqResult> & { number: number })[] };
  try {
    parsed = JSON.parse(jsonMatch?.[0] ?? '{"selected":[]}');
  } catch {
    parsed = { selected: [] };
  }

  const selected = parsed.selected ?? [];
  return {
    selectedIndices: selected.map((r) => r.number - 1),
    results: new Map(
      selected.flatMap((r) => {
        const normalized = normalizeResult(r);
        return normalized ? [[r.number - 1, normalized]] : [];
      })
    )
  };
}

export async function analyzeStockWithGroq(stock: Stock): Promise<Recommendation | null> {
  if (!hasGroqConfig()) return null;

  const newsSummaries = stock.news
    .slice(0, 6)
    .map((n, i) => `${i + 1}. [${n.impact}] ${n.title}`)
    .join("\n");

  const raw = await callGroq([
    {
      role: "system",
      content: `당신은 주식 교육용 AI 분석가입니다. 주어진 종목 데이터를 바탕으로 투자 참고 분석을 제공합니다.
반드시 아래 JSON 형식만 반환하세요. 마크다운이나 설명 텍스트를 포함하지 마세요.

{
  "status": "관심" 또는 "관망" 또는 "주의",
  "score": 0에서 100 사이 정수,
  "summary": "50자 이내 한국어 한 문장 종합 분석",
  "reasons": ["이유1 (30자 이내)", "이유2 (30자 이내)", "이유3 (30자 이내)"]
}

판단 기준:
- 관심: score 68 이상, 긍정 지표 우세
- 관망: score 50~67, 긍정·부정 혼재
- 주의: score 49 이하, 부정 지표 우세`
    },
    {
      role: "user",
      content: `다음 종목을 분석해주세요:

종목: ${stock.name} (${stock.symbol}) / ${stock.sector}
현재가: $${stock.currentPrice} (${stock.priceChangePercent >= 0 ? "+" : ""}${stock.priceChangePercent}%)
리스크 점수: ${stock.riskScore}/100
변동성: ${stock.volatility}%
PER: ${stock.metrics.per.value}배 (업종 평균 ${stock.metrics.per.sectorAverage}배)
RSI: ${stock.metrics.rsi.value}
SML 알파: ${stock.metrics.sml.alpha >= 0 ? "+" : ""}${stock.metrics.sml.alpha.toFixed(1)}%p (베타 ${stock.metrics.sml.beta})

최근 뉴스:
${newsSummaries || "뉴스 없음"}`
    }
  ]).catch(() => "");

  if (!raw) return null;

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? "{}") as {
      status?: unknown;
      score?: unknown;
      summary?: unknown;
      reasons?: unknown;
    };

    if (
      (parsed.status !== "관심" && parsed.status !== "관망" && parsed.status !== "주의") ||
      typeof parsed.score !== "number" ||
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.reasons)
    ) {
      return null;
    }

    return {
      status: parsed.status,
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      summary: parsed.summary.slice(0, 80),
      reasons: (parsed.reasons as unknown[]).slice(0, 3).map((r) => String(r).slice(0, 60))
    };
  } catch {
    return null;
  }
}
