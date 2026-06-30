import { calculateRsi } from "./indicators";
import type { CandlePoint, Stock } from "./mockData";

type TwelveDataTimeSeriesResponse = {
  values?: Array<{
    datetime?: string;
    open?: string;
    high?: string;
    low?: string;
    close?: string;
  }>;
  status?: string;
  code?: number;
  message?: string;
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
const failureCooldownMs = 60 * 60 * 1000;

function hasTwelveDataConfig() {
  return Boolean(process.env.TWELVE_DATA_API_KEY);
}

export function shouldRequestTwelveData(symbol: string) {
  const cached = candleCache.get(symbol);
  const failed = failureCache.get(symbol);

  return (
    hasTwelveDataConfig() &&
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

function hydrateStockFromCandles(stock: Stock, candles: CandlePoint[]) {
  const latest = candles.at(-1);
  const previous = candles.at(-2);
  const priceChangePercent =
    latest && previous && previous.close !== 0
      ? ((latest.close - previous.close) / previous.close) * 100
      : stock.priceChangePercent;

  return {
    ...stock,
    chart: candles,
    currentPrice: latest?.close ?? stock.currentPrice,
    metrics: {
      ...stock.metrics,
      rsi: {
        value: calculateRsi(candles)
      }
    },
    priceChangePercent
  };
}

async function fetchDailyCandles(symbol: string): Promise<CandlePoint[] | null> {
  if (!hasTwelveDataConfig()) {
    return null;
  }

  const cached = candleCache.get(symbol);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (hasFailureCooldown(symbol)) {
    return cached?.data ?? null;
  }

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "1day");
  url.searchParams.set("start_date", dailyStartDate);
  url.searchParams.set("outputsize", "5000");
  url.searchParams.set("apikey", process.env.TWELVE_DATA_API_KEY ?? "");

  try {
    const response = await fetch(url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Twelve Data request failed: ${response.status}`);
    }

    const payload = (await response.json()) as TwelveDataTimeSeriesResponse;

    if (payload.status === "error" || payload.message) {
      rememberFailure(symbol, payload.message ?? "Twelve Data error");

      return cached?.data ?? null;
    }

    if (!payload.values || payload.values.length === 0) {
      rememberFailure(symbol, "Twelve Data response did not include daily values.");

      return cached?.data ?? null;
    }

    const candles = payload.values
      .map((row): CandlePoint | null => {
        const open = toNumber(row.open);
        const high = toNumber(row.high);
        const low = toNumber(row.low);
        const close = toNumber(row.close);

        if (!row.datetime || open == null || high == null || low == null || close == null) {
          return null;
        }

        return {
          close,
          date: row.datetime,
          high,
          label: formatDateLabel(row.datetime),
          low,
          open
        };
      })
      .filter((point): point is CandlePoint => Boolean(point))
      .reverse();

    if (candles.length === 0) {
      rememberFailure(symbol, "Twelve Data daily values were empty.");

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
      error instanceof Error ? error.message : "Twelve Data request failed."
    );

    return cached?.data ?? null;
  }
}

export async function hydrateStockWithTwelveData(stock: Stock): Promise<Stock | null> {
  const candles = await fetchDailyCandles(stock.symbol);

  if (!candles || candles.length === 0) {
    return null;
  }

  return hydrateStockFromCandles(stock, candles);
}
