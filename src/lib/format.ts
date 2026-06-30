import type { Sentiment } from "./mockData";
import type { RecommendationStatus } from "./recommendation";

export function formatKRW(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatIndex(value: number) {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function sentimentClass(sentiment: Sentiment) {
  if (sentiment === "positive") {
    return "positive";
  }

  if (sentiment === "negative") {
    return "negative";
  }

  return "neutral";
}

export function statusClass(status: RecommendationStatus) {
  if (status === "관심") {
    return "positive";
  }

  if (status === "주의") {
    return "negative";
  }

  return "neutral";
}
