import { isTradableStock, type Stock } from "./mockData";

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

  if (!isTradableStock(stock)) {
    const score = clampScore(52 + sentimentScore - (stock.riskScore >= 60 ? 8 : 0));
    const status: RecommendationStatus =
      score >= 68 ? "관심" : score >= 45 ? "관망" : "주의";
    const hasNews = stock.news.length > 0;
    const summaryByStatus: Record<RecommendationStatus, string> = {
      관심: `${stock.name}은 기업 뉴스 흐름이 우호적이지만 비상장 유동성 리스크를 함께 확인해야 합니다.`,
      관망: `${stock.name}은 공개시장 가격 지표보다 기업 뉴스와 비상장 유동성 리스크를 함께 확인해야 합니다.`,
      주의: `${stock.name}은 비상장 유동성 리스크와 부담 요인을 신중히 확인해야 합니다.`
    };

    return {
      status,
      score,
      summary: summaryByStatus[status],
      reasons: [
        "거래소 상장 주식이 아니어서 주가, PER, RSI, SML 지표를 제공하지 않습니다.",
        !hasNews
          ? "외부 API 호출 없이 비상장 기업 기본 정보만 표시합니다."
          : positiveNews > negativeNews
          ? "최근 뉴스 흐름에서 성장 기대 요인이 더 많이 확인됩니다."
          : negativeNews > positiveNews
            ? "최근 뉴스 흐름에서 일정, 규제, 비용 부담을 더 신중히 확인해야 합니다."
            : "최근 뉴스 흐름은 긍정과 부담 요인이 함께 섞여 있습니다.",
        "비상장 기업은 일반 투자자가 직접 매매하기 어렵고 가격 투명성이 낮습니다."
      ]
    };
  }

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
    관심: `${stock.name}은 현재 지표와 뉴스 흐름이 비교적 안정적으로 맞물린 관심 구간입니다.`,
    관망: `${stock.name}은 긍정 요인과 부담 요인이 함께 있어 추가 확인이 필요한 관망 구간입니다.`,
    주의: `${stock.name}은 변동성 또는 밸류에이션 부담이 커서 신중한 확인이 필요한 주의 구간입니다.`
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
