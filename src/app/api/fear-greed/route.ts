import { NextResponse } from "next/server";
import type { FearGreedLevel } from "@/lib/mockData";

const CNN_URL = "http://production.dataviz.cnn.io/index/fearandgreed/graphdata";

const CNN_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://edition.cnn.com/"
};

const RATING_MAP: Record<string, { level: FearGreedLevel; label: string }> = {
  "extreme fear": { level: "extreme-fear", label: "극도 공포" },
  fear: { level: "fear", label: "공포" },
  neutral: { level: "neutral", label: "중립" },
  greed: { level: "greed", label: "탐욕" },
  "extreme greed": { level: "extreme-greed", label: "극도 탐욕" }
};

const DESCRIPTIONS: Record<FearGreedLevel, string> = {
  "extreme-fear": "시장이 극도 공포 구간입니다. 투매 압력과 반등 가능성을 함께 확인하세요.",
  fear: "투자자 심리가 위축된 공포 구간입니다. 가격 변동성과 심리 회복 여부를 확인하세요.",
  neutral: "투자자 심리가 중립 구간에 있습니다. 시장 방향성을 추가로 확인하세요.",
  greed: "투자자 심리가 탐욕 구간에 진입했습니다. 과열 여부를 함께 확인하세요.",
  "extreme-greed": "시장이 극도 탐욕 구간입니다. 조정 가능성이 높으니 리스크 관리에 유의하세요."
};

export async function GET() {
  try {
    const res = await fetch(CNN_URL, {
      headers: CNN_HEADERS,
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error(`CNN API ${res.status}`);

    const json = await res.json();
    const fg = json.fear_and_greed;
    const score = Math.round(fg.score);
    const rating = fg.rating.toLowerCase();
    const { level, label } = RATING_MAP[rating] ?? { level: "neutral" as FearGreedLevel, label: "중립" };

    return NextResponse.json({
      score,
      level,
      label,
      description: DESCRIPTIONS[level],
      previousClose: Math.round(fg.previous_close),
      updatedAt: fg.timestamp.slice(0, 10),
      source: "CNN Business"
    });
  } catch {
    return NextResponse.json(
      {
        message: "CNN Business 시장 심리 데이터를 조회하지 못했습니다."
      },
      { status: 503 }
    );
  }
}
