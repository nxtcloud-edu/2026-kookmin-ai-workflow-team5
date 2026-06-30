export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const chartRangeOptions = [
  { key: "all", label: "전체", days: null },
  { key: "5y", label: "5년", days: 365 * 5 },
  { key: "1y", label: "1년", days: 365 },
  { key: "6m", label: "6개월", days: 183 },
  { key: "3m", label: "3개월", days: 92 }
] as const;

export const chartZoomLevels = [
  { label: "압축", gap: 2.4 },
  { label: "기본", gap: 5 },
  { label: "확대", gap: 9 },
  { label: "상세", gap: 14 }
] as const;

export type ChartRangeKey = (typeof chartRangeOptions)[number]["key"];

export function getDateTime(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(`${value}T00:00:00`);

  return Number.isFinite(parsed) ? parsed : null;
}

export function filterByDateRange<T>(
  points: T[],
  days: number | null,
  getDate: (point: T) => string | undefined
) {
  if (!days) {
    return points;
  }

  const latestPoint = points.at(-1);
  const latestTime = latestPoint ? getDateTime(getDate(latestPoint)) : null;

  if (!latestTime) {
    return points;
  }

  const threshold = latestTime - days * MS_PER_DAY;
  const rangedPoints = points.filter((point) => {
    const pointTime = getDateTime(getDate(point));

    return pointTime == null || pointTime >= threshold;
  });

  return rangedPoints.length >= 2 ? rangedPoints : points;
}

export function formatDateForChart(
  date: string | undefined,
  fallback: string,
  mode: "full" | "axis" = "full"
) {
  if (!date) {
    return fallback;
  }

  const [year, month, day] = date.split("-");

  if (mode === "axis") {
    return `${year}.${Number(month)}`;
  }

  return `${year}.${Number(month)}.${Number(day)}`;
}
