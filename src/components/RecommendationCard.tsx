import type { Stock } from "@/lib/mockData";
import { createRecommendation } from "@/lib/recommendation";
import { statusClass } from "@/lib/format";

type RecommendationCardProps = {
  stock: Stock;
};

export function RecommendationCard({ stock }: RecommendationCardProps) {
  const recommendation = createRecommendation(stock);

  return (
    <aside className="recommendationCard">
      <div className="recommendationTop">
        <p className="eyebrow">규칙 기반 위험 분석</p>
        <span className={`pill ${statusClass(recommendation.status)}`}>
          {recommendation.status}
        </span>
      </div>
      <h2>{recommendation.summary}</h2>
      <div className="scoreBar" aria-label={`위험 분석 점수 ${recommendation.score}점`}>
        <span style={{ width: `${recommendation.score}%` }} />
      </div>
      <ul>
        {recommendation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="smallNotice">
        조회 데이터와 규칙 기반 로직으로 산출한 위험 분석 결과입니다.
      </p>
    </aside>
  );
}
