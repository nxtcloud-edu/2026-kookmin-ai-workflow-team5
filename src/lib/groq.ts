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
