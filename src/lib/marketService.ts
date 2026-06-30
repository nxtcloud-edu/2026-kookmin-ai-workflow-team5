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

function highlightsFromNews(news: NewsItem[]) {
  const positive = news.find((item) => item.sentiment === "positive");
  const negative = news.find((item) => item.sentiment === "negative");

  return {
    positive: positive?.summary ?? positive?.title ?? "조회된 호재 뉴스가 아직 없습니다.",
    negative: negative?.summary ?? negative?.title ?? "조회된 악재 뉴스가 아직 없습니다."
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
