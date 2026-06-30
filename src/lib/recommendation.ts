import type { Stock } from "./mockData";

export type RecommendationStatus = "관심" | "관망" | "주의";

export type Recommendation = {
  status: RecommendationStatus;
  score: number;
  summary: string;
  reasons: string[];
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function createRecommendation(stock: Stock): Recommendation {
  const positiveNews = stock.news.filter((news) => news.sentiment === "positive").length;
  const negativeNews = stock.news.filter((news) => news.sentiment === "negative").length;
  const sentimentScore = (positiveNews - negativeNews) * 8;
  const perScore =
    stock.metrics.per.value <= stock.metrics.per.sectorAverage ? 8 : -6;
  const rsiScore =
    stock.metrics.rsi.value < 35 ? 5 : stock.metrics.rsi.value > 70 ? -8 : 3;
  const smlScore = stock.metrics.sml.alpha >= 0 ? 6 : -5;
  const riskPenalty = stock.riskScore >= 65 ? -12 : stock.riskScore >= 55 ? -6 : 2;
  const volatilityPenalty = stock.volatility >= 30 ? -8 : stock.volatility >= 24 ? -4 : 1;

  const score = clampScore(
    54 + sentimentScore + perScore + rsiScore + smlScore + riskPenalty + volatilityPenalty
  );

  const status: RecommendationStatus =
    score >= 68 ? "관심" : score >= 50 ? "관망" : "주의";

  const summaryByStatus: Record<RecommendationStatus, string> = {
    관심: `${stock.name}은 현재 지표와 뉴스 흐름이 비교적 안정적으로 맞물린 데모 관심 종목입니다.`,
    관망: `${stock.name}은 긍정 요인과 부담 요인이 함께 있어 추가 확인이 필요한 데모 관망 종목입니다.`,
    주의: `${stock.name}은 변동성 또는 밸류에이션 부담이 커서 초보자에게는 신중한 확인이 필요한 데모 종목입니다.`
  };

  const reasons = [
    stock.metrics.per.value <= stock.metrics.per.sectorAverage
      ? `PER ${stock.metrics.per.value}배로 업종 평균 ${stock.metrics.per.sectorAverage}배보다 낮습니다.`
      : `PER ${stock.metrics.per.value}배로 업종 평균 ${stock.metrics.per.sectorAverage}배보다 높습니다.`,
    stock.metrics.rsi.value >= 70
      ? `RSI ${stock.metrics.rsi.value}로 단기 과열 가능성을 확인해야 합니다.`
      : stock.metrics.rsi.value <= 35
        ? `RSI ${stock.metrics.rsi.value}로 단기 침체 구간에 가까운 흐름입니다.`
        : `RSI ${stock.metrics.rsi.value}로 단기 수급은 중립권에 가깝습니다.`,
    stock.metrics.sml.alpha >= 0
      ? `SML 기준 초과수익 알파가 +${stock.metrics.sml.alpha.toFixed(1)}%p로 표시됩니다.`
      : `SML 기준 초과수익 알파가 ${stock.metrics.sml.alpha.toFixed(1)}%p로 표시됩니다.`
  ];

  return {
    status,
    score,
    summary: summaryByStatus[status],
    reasons
  };
}
