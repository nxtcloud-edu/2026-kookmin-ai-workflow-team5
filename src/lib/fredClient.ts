import { marketIndex, type LinePoint } from "./mockData";

type MarketIndex = typeof marketIndex;

type FredCacheEntry = {
  data: MarketIndex;
  expiresAt: number;
};

type FredLinePoint = LinePoint & {
  date: string;
};

const fredCsvUrl = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=SP500";
const fredCacheTtlMs = 30 * 60 * 1000;
const fredCache = new Map<string, FredCacheEntry>();

function formatDateLabel(value: string) {
  const [, month, day] = value.split("-");

  return `${Number(month)}/${Number(day)}`;
}

function parseFredCsv(csv: string): FredLinePoint[] {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, rawValue] = line.split(",");
      const normalizedValue = rawValue?.trim();

      if (!date || !normalizedValue || normalizedValue === ".") {
        return null;
      }

      const value = Number(normalizedValue);

      if (!Number.isFinite(value)) {
        return null;
      }

      return {
        date,
        label: formatDateLabel(date),
        value
      };
    })
    .filter((point): point is FredLinePoint => Boolean(point))
    .slice(-40);
}

function createFredMarketIndex(points: LinePoint[]): MarketIndex | null {
  const latest = points.at(-1);
  const previous = points.at(-2);

  if (!latest) {
    return null;
  }

  const changePercent =
    previous && previous.value !== 0
      ? ((latest.value - previous.value) / previous.value) * 100
      : marketIndex.changePercent;

  return {
    ...marketIndex,
    code: "FRED:SP500",
    currentValue: latest.value,
    changePercent,
    updatedAt: latest.date ?? new Date().toLocaleString("ko-KR"),
    summary:
      "FRED의 S&P 500 일별 종가를 기준으로 시장 전체 흐름을 보여줍니다. 발표용으로 1분마다 화면을 갱신하되 서버는 30분 캐시를 사용합니다.",
    chart: points
  };
}

export function shouldRequestFredIndex() {
  const cached = fredCache.get("SP500");

  return !cached || cached.expiresAt <= Date.now();
}

export async function hydrateMarketIndexWithFred(): Promise<MarketIndex | null> {
  const cached = fredCache.get("SP500");

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const response = await fetch(fredCsvUrl, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`FRED request failed: ${response.status}`);
    }

    const csv = await response.text();
    const points = parseFredCsv(csv);
    const data = createFredMarketIndex(points);

    if (!data) {
      return cached?.data ?? null;
    }

    fredCache.set("SP500", {
      data,
      expiresAt: Date.now() + fredCacheTtlMs
    });

    return data;
  } catch {
    return cached?.data ?? null;
  }
}
