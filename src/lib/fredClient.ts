import { marketIndex, type LinePoint } from "./mockData";

type MarketIndex = typeof marketIndex;

type FredCacheEntry = {
  data: MarketIndex;
  expiresAt: number;
};

type FredLinePoint = LinePoint & {
  date: string;
};

type FredObservation = {
  date: string;
  value: string;
};

type FredObservationResponse = {
  observations?: FredObservation[];
  error_code?: number;
  error_message?: string;
};

const fredApiUrl = "https://api.stlouisfed.org/fred/series/observations";
const fredSeriesId = "SP500";
const fredStartDate = "2016-01-01";
const fredCacheTtlMs = 30 * 60 * 1000;
const fredTimeoutMs = 10000;
const fredCache = new Map<string, FredCacheEntry>();

function formatDateLabel(value: string) {
  const [, month, day] = value.split("-");

  return `${Number(month)}/${Number(day)}`;
}

function getFredApiKey() {
  return process.env.FRED_API_KEY?.trim() ?? "";
}

function createFredRequestUrl(apiKey: string) {
  const url = new URL(fredApiUrl);

  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("observation_start", fredStartDate);
  url.searchParams.set("series_id", fredSeriesId);

  return url;
}

function parseFredObservations(payload: FredObservationResponse): FredLinePoint[] {
  return (payload.observations ?? [])
    .map((observation) => {
      const date = observation.date;
      const normalizedValue = observation.value?.trim();

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
    .filter((point) => point.date >= fredStartDate);
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
      "FRED의 S&P 500 일별 종가를 2016년부터 현재까지 보여주며, 화면은 1분마다 갱신되고 서버는 30분 캐시를 사용합니다.",
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

  const apiKey = getFredApiKey();

  if (!apiKey) {
    console.warn("FRED_API_KEY is not configured.");
    return cached?.data ?? null;
  }

  try {
    const response = await fetch(createFredRequestUrl(apiKey), {
      cache: "no-store",
      signal: AbortSignal.timeout(fredTimeoutMs)
    });

    if (!response.ok) {
      throw new Error(`FRED request failed: ${response.status}`);
    }

    const payload = (await response.json()) as FredObservationResponse;

    if (payload.error_code) {
      throw new Error(`FRED API error: ${payload.error_code}`);
    }

    const points = parseFredObservations(payload);
    const data = createFredMarketIndex(points);

    if (!data) {
      return cached?.data ?? null;
    }

    fredCache.set("SP500", {
      data,
      expiresAt: Date.now() + fredCacheTtlMs
    });

    return data;
  } catch (error) {
    console.warn(
      "FRED API request failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return cached?.data ?? null;
  }
}
