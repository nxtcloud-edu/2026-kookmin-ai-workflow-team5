import {
  hydrateStockWithAlphaVantage,
  shouldRequestAlphaVantage
} from "./alphaVantageClient";
import { hydrateMarketIndexWithFred } from "./fredClient";
import { analyzeStockWithGroq } from "./groq";
import { fetchSystematicNews, fetchUnsystematicNews } from "./news";
import { getStockBySymbol, marketIndex, stocks, type NewsItem, type Stock } from "./mockData";
import type { Recommendation } from "./recommendation";
import { hydrateStockWithTwelveData, shouldRequestTwelveData } from "./twelveDataClient";

export type DataSource = "live" | "partial";

export type MarketPayload = {
  marketIndex: typeof marketIndex;
  systematicNews: NewsItem[];
  stocks: Stock[];
  source: DataSource;
  updatedAt: string;
  message: string;
};

export type StockPayload = {
  stock: Stock;
  recommendation: Recommendation | null;
  source: DataSource;
  updatedAt: string;
  message: string;
};

function getTimestamp() {
  return new Date().toISOString();
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class DataUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataUnavailableError";
  }
}

// 단순 주가 등락 표현은 메인 카드 하이라이트에서 제외 (급등·급락 등 극단적 움직임은 허용)
const EXTREME_PRICE = /급등|급락|폭등|폭락/;
const SIMPLE_PRICE = /^(주가|가격|시세|주식)\s*(상승|하락|오름|내림|반등|소폭|강세|약세|변동|등락)/;

function isSimplePriceAction(summary: string): boolean {
  if (EXTREME_PRICE.test(summary)) return false;
  return SIMPLE_PRICE.test(summary);
}

function highlightsFromNews(news: NewsItem[]) {
  const positives = news.filter((item) => item.sentiment === "positive");
  const negatives = news.filter((item) => item.sentiment === "negative");

  function joinSummaries(items: NewsItem[]) {
    if (items.length === 0) return null;
    const seen = new Set<string>();
    const unique = items
      .map((item) => item.summary || item.title)
      .filter((text) => {
        if (isSimplePriceAction(text)) return false;
        const key = text.replace(/\s/g, "").slice(0, 10);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return unique.length > 0 ? unique.slice(0, 3).join(" · ") : null;
  }

  return {
    positive: joinSummaries(positives) ?? "조회된 호재 뉴스가 아직 없습니다.",
    negative: joinSummaries(negatives) ?? "조회된 악재 뉴스가 아직 없습니다."
  };
}

async function hydrateStocksSequentially() {
  const hydratedStocks: Stock[] = [];
  let hasMadeExternalStockRequest = false;

  for (const stock of stocks) {
    const willRequestTwelveData = shouldRequestTwelveData(stock.symbol);

    if (willRequestTwelveData && hasMadeExternalStockRequest) {
      await wait(1200);
    }

    const twelveDataStock = await hydrateStockWithTwelveData(stock);

    if (willRequestTwelveData) {
      hasMadeExternalStockRequest = true;
    }

    if (twelveDataStock) {
      hydratedStocks.push(twelveDataStock);
      continue;
    }

    const willRequestAlphaVantage = shouldRequestAlphaVantage(stock.symbol);

    if (willRequestAlphaVantage && hasMadeExternalStockRequest) {
      await wait(1200);
    }

    const hydratedStock = await hydrateStockWithAlphaVantage(stock);

    if (hydratedStock) {
      hydratedStocks.push(hydratedStock);
    }

    if (willRequestAlphaVantage) {
      hasMadeExternalStockRequest = true;
    }
  }

  return hydratedStocks;
}

async function attachLiveNews(stock: Stock) {
  const news = await fetchUnsystematicNews(stock.name, stock.symbol).catch(() => []);

  return {
    ...stock,
    highlights: highlightsFromNews(news),
    news
  };
}

function messageFromSource(source: DataSource) {
  if (source === "live") {
    return "FRED/Twelve Data/Alpha Vantage/Google News RSS에서 조회한 데이터입니다.";
  }

  return "일부 실데이터만 표시 중입니다. 조회에 실패한 항목은 숨겼습니다.";
}

export async function getMarketPayload(): Promise<MarketPayload> {
  const [liveMarketIndex, hydratedStocks] = await Promise.all([
    hydrateMarketIndexWithFred(),
    hydrateStocksSequentially()
  ]);
  const liveStocks = await Promise.all(hydratedStocks.map((stock) => attachLiveNews(stock)));
  const liveSystematicNews = await fetchSystematicNews(
    "S&P 500 interest rates dollar AI semiconductor",
    "sys-live"
  ).catch(() => []);

  if (!liveMarketIndex) {
    throw new DataUnavailableError("FRED S&P 500 지수 데이터를 조회하지 못했습니다.");
  }

  const source: DataSource =
    liveStocks.length === stocks.length && liveSystematicNews.length > 0 ? "live" : "partial";

  return {
    marketIndex: liveMarketIndex,
    systematicNews: liveSystematicNews,
    stocks: liveStocks,
    source,
    updatedAt: getTimestamp(),
    message: messageFromSource(source)
  };
}

export async function getStockPayload(symbol: string): Promise<StockPayload | null> {
  const catalogStock = getStockBySymbol(symbol);

  if (!catalogStock) {
    return null;
  }

  const liveStock =
    (await hydrateStockWithTwelveData(catalogStock)) ??
    (await hydrateStockWithAlphaVantage(catalogStock));

  if (!liveStock) {
    throw new DataUnavailableError(`${catalogStock.symbol} 가격 데이터를 조회하지 못했습니다.`);
  }

  const stockNews = await fetchUnsystematicNews(
    catalogStock.name,
    catalogStock.symbol
  ).catch(() => []);
  const source: DataSource = stockNews.length > 0 ? "live" : "partial";

  const stockWithNews: Stock = {
    ...liveStock,
    highlights: highlightsFromNews(stockNews),
    news: stockNews
  };

  const recommendation = await analyzeStockWithGroq(stockWithNews).catch(() => null);

  return {
    stock: stockWithNews,
    recommendation,
    source,
    updatedAt: getTimestamp(),
    message: messageFromSource(source)
  };
}
