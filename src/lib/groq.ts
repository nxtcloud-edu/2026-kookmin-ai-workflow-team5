import OpenAI from "openai";
import type { NewsItem } from "./mockData";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

type GroqResult = {
  impact: "호재" | "악재" | "중립";
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
};

// 뉴스 목록을 받아 호재/악재/중립 분류 + 요약
export async function analyzeNews(
  items: Pick<NewsItem, "id" | "title">[]
): Promise<Map<string, GroqResult>> {
  const numbered = items
    .map((item, i) => `${i + 1}. [${item.id}] ${item.title}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `당신은 한국 주식 시장 뉴스를 분석하는 전문가입니다.
각 뉴스 제목을 읽고 주가에 미치는 영향을 분석하세요.
반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "id": "뉴스ID",
    "impact": "호재" | "악재" | "중립",
    "sentiment": "positive" | "negative" | "neutral",
    "summary": "주가 영향을 한 문장으로 요약 (30자 이내)"
  }
]`,
      },
      {
        role: "user",
        content: `다음 뉴스들을 분석해주세요:\n\n${numbered}`,
      },
    ],
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content ?? "[]";

  let parsed: (GroqResult & { id: string })[];
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }

  return new Map(parsed.map((r) => [r.id, { impact: r.impact, sentiment: r.sentiment, summary: r.summary }]));
}

type TopicResult = {
  selectedIndices: number[];
  results: Map<number, GroqResult>;
};

// 넓게 수집한 뉴스에서 현재 가장 중요한 이슈를 감지하고 관련 기사 6개 선별 + 분석
// ID 대신 번호(1~N)를 사용해 매칭 오류 방지
export async function detectTopicAndAnalyze(
  items: Pick<NewsItem, "id" | "title">[]
): Promise<TopicResult> {
  const numbered = items
    .map((item, i) => `${i + 1}. ${item.title}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
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
sentiment must be one of: positive, negative, neutral`,
      },
      {
        role: "user",
        content: `From the following ${numbered.split("\n").length} headlines, select EXACTLY 6 that best represent the most important current market theme. Return EXACTLY 6 items:\n\n${numbered}`,
      },
    ],
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content ?? '{"selected":[]}';
  console.log("[Groq raw response]", raw);

  // 응답에 JSON 외 텍스트가 포함될 수 있으므로 JSON 블록만 추출
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let parsed: { selected: (GroqResult & { number: number })[] };
  try {
    parsed = JSON.parse(jsonMatch?.[0] ?? '{"selected":[]}');
  } catch {
    parsed = { selected: [] };
  }
  console.log("[Groq parsed selected count]", parsed.selected?.length ?? 0);

  const selected = parsed.selected ?? [];
  return {
    selectedIndices: selected.map((r) => r.number - 1), // 1-indexed → 0-indexed
    results: new Map(selected.map((r) => [r.number - 1, { impact: r.impact, sentiment: r.sentiment, summary: r.summary }])),
  };
}
