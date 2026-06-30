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
        <p className="eyebrow">LLM-like 데모 분석</p>
        <span className={`pill ${statusClass(recommendation.status)}`}>
          {recommendation.status}
        </span>
      </div>
      <h2>{recommendation.summary}</h2>
      <div className="scoreBar" aria-label={`데모 점수 ${recommendation.score}점`}>
        <span style={{ width: `${recommendation.score}%` }} />
      </div>
      <ul>
        {recommendation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="smallNotice">
        실제 LLM 호출 없이 mock data와 규칙 기반 로직으로 만든 교육용 데모 분석입니다.
      </p>
    </aside>
  );
}
