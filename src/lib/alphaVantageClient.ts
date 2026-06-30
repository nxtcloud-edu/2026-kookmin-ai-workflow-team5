import type { CandlePoint, Stock } from "./mockData";
import { calculateRsi } from "./indicators";

type AlphaVantageDailyResponse = {
  "Time Series (Daily)"?: Record<
    string,
    {
      "1. open"?: string;
      "2. high"?: string;
      "3. low"?: string;
      "4. close"?: string;
      "5. volume"?: string;
    }
  >;
  "Error Message"?: string;
  Note?: string;
  Information?: string;
};

type CandleCacheEntry = {
  data: CandlePoint[];
  expiresAt: number;
};

type FailureCacheEntry = {
  reason: string;
  retryAfter: number;
};

const candleCache = new Map<string, CandleCacheEntry>();
const failureCache = new Map<string, FailureCacheEntry>();
const dailyStartDate = "2016-01-01";
const candleCacheTtlMs = 6 * 60 * 60 * 1000;
const failureCooldownMs = 6 * 60 * 60 * 1000;

function hasAlphaVantageConfig() {
  return Boolean(process.env.ALPHA_VANTAGE_API_KEY);
}

export function shouldRequestAlphaVantage(symbol: string) {
  const cached = candleCache.get(symbol);
  const failed = failureCache.get(symbol);

  return (
    hasAlphaVantageConfig() &&
    (!cached || cached.expiresAt <= Date.now()) &&
    (!failed || failed.retryAfter <= Date.now())
  );
}

function formatDateLabel(value: string) {
  const [, month, day] = value.split("-");

  return `${Number(month)}/${Number(day)}`;
}

function toNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function rememberFailure(symbol: string, reason: string) {
  failureCache.set(symbol, {
    reason,
    retryAfter: Date.now() + failureCooldownMs
  });
}

function hasFailureCooldown(symbol: string) {
  const failed = failureCache.get(symbol);

  return Boolean(failed && failed.retryAfter > Date.now());
}

async function fetchDailyCandles(symbol: string): Promise<CandlePoint[] | null> {
  if (!hasAlphaVantageConfig()) {
    return null;
  }

  const cached = candleCache.get(symbol);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (hasFailureCooldown(symbol)) {
    return cached?.data ?? null;
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "TIME_SERIES_DAILY");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("outputsize", "full");
  url.searchParams.set("apikey", process.env.ALPHA_VANTAGE_API_KEY ?? "");

  try {
    const response = await fetch(url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage request failed: ${response.status}`);
    }

    const payload = (await response.json()) as AlphaVantageDailyResponse;

    if (payload["Error Message"] || payload.Note || payload.Information) {
      const reason =
        payload["Error Message"] ?? payload.Note ?? payload.Information ?? "Alpha Vantage error";

      rememberFailure(symbol, reason);

      return cached?.data ?? null;
    }

    const rows = payload["Time Series (Daily)"];

    if (!rows) {
      rememberFailure(symbol, "Alpha Vantage response did not include daily rows.");

      return cached?.data ?? null;
    }

    const candles = Object.entries(rows)
      .map(([date, row]): CandlePoint | null => {
        const open = toNumber(row["1. open"]);
        const high = toNumber(row["2. high"]);
        const low = toNumber(row["3. low"]);
        const close = toNumber(row["4. close"]);

        if (!open || !high || !low || !close) {
          return null;
        }

        return {
          date,
          label: formatDateLabel(date),
          open,
          high,
          low,
          close
        };
      })
      .filter((point): point is CandlePoint => Boolean(point))
      .filter((point) => !point.date || point.date >= dailyStartDate)
      .reverse();

    if (candles.length === 0) {
      rememberFailure(symbol, "Alpha Vantage daily rows were empty.");

      return cached?.data ?? null;
    }

    failureCache.delete(symbol);
    candleCache.set(symbol, {
      data: candles,
      expiresAt: Date.now() + candleCacheTtlMs
    });

    return candles;
  } catch (error) {
    rememberFailure(
      symbol,
      error instanceof Error ? error.message : "Alpha Vantage request failed."
    );

    return cached?.data ?? null;
  }
}

export async function hydrateStockWithAlphaVantage(stock: Stock): Promise<Stock | null> {
  const candles = await fetchDailyCandles(stock.symbol);

  if (!candles || candles.length === 0) {
    return null;
  }

  const latest = candles.at(-1);
  const previous = candles.at(-2);
  const priceChangePercent =
    latest && previous
      ? ((latest.close - previous.close) / previous.close) * 100
      : stock.priceChangePercent;

  return {
    ...stock,
    currentPrice: latest?.close ?? stock.currentPrice,
    priceChangePercent,
    chart: candles,
    metrics: {
      ...stock.metrics,
      rsi: {
        value: calculateRsi(candles)
      }
    }
  };
}
