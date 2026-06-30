import type { NewsItem } from "./mockData";

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

export async function analyzeNews(
  items: Pick<NewsItem, "id" | "title">[]
): Promise<Map<string, GroqResult>> {
  if (!hasGroqConfig() || items.length === 0) {
    return new Map();
  }

  const numbered = items
    .map((item, index) => `${index + 1}. [${item.id}] ${item.title}`)
    .join("\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
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
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1
    }),
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    method: "POST",
    next: { revalidate: 600 }
  });

  if (!response.ok) {
    return new Map();
  }

  const payload = (await response.json()) as GroqResponse;
  const raw = payload.choices?.[0]?.message?.content ?? "[]";

  try {
    const parsed = JSON.parse(raw) as Array<Partial<GroqResult> & { id?: string }>;

    return new Map(
      parsed.flatMap((item) => {
        if (!item.id) {
          return [];
        }

        const normalized = normalizeResult(item);

        return normalized ? [[item.id, normalized]] : [];
      })
    );
  } catch {
    return new Map();
  }
}
