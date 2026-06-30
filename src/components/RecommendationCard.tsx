import type { Stock } from "@/lib/mockData";
import type { Recommendation } from "@/lib/recommendation";
import { createRecommendation } from "@/lib/recommendation";
import { statusClass } from "@/lib/format";

type RecommendationCardProps = {
  stock: Stock;
  recommendation?: Recommendation | null;
};

export function RecommendationCard({ stock, recommendation }: RecommendationCardProps) {
  const result = recommendation ?? createRecommendation(stock);
  const isAI = Boolean(recommendation);

  return (
    <aside className="recommendationCard">
      <div className="recommendationTop">
        <p className="eyebrow">{isAI ? "AI 종목 분석" : "규칙 기반 위험 분석"}</p>
        <span className={`pill ${statusClass(result.status)}`}>
          {result.status}
        </span>
      </div>
      <h2>{result.summary}</h2>
      <div className="scoreBar" aria-label={`위험 분석 점수 ${result.score}점`}>
        <span style={{ width: `${result.score}%` }} />
      </div>
      <ul>
        {result.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {!isAI && (
        <p className="smallNotice">
          조회 데이터와 규칙 기반 로직으로 산출한 위험 분석 결과입니다.
        </p>
      )}
    </aside>
  );
}
