import Link from "next/link";
import { isTradableStock, type Stock } from "@/lib/mockData";
import { formatPercent, formatUSD, statusClass } from "@/lib/format";
import { createRecommendation } from "@/lib/recommendation";

type StockCardProps = {
  stock: Stock;
};

export function StockCard({ stock }: StockCardProps) {
  const recommendation = createRecommendation(stock);
  const isTradable = isTradableStock(stock);
  const changeClass = stock.priceChangePercent >= 0 ? "positiveText" : "negativeText";

  return (
    <Link className="stockCard" href={`/stocks/${stock.symbol}`}>
      <div className="stockCardTop">
        <div>
          <span className="marketLabel">{stock.market}</span>
          <h3>{stock.name}</h3>
          <p>{stock.symbol}</p>
        </div>
        <span className={`pill ${statusClass(recommendation.status)}`}>
          {recommendation.status}
        </span>
      </div>

      {isTradable ? (
        <div className="stockPriceLine">
          <strong>{formatUSD(stock.currentPrice)}</strong>
          <span className={changeClass}>{formatPercent(stock.priceChangePercent)}</span>
        </div>
      ) : (
        <div className="stockPriceLine private">
          <strong>비상장 기업</strong>
          <span>뉴스 기반 확인</span>
        </div>
      )}

      <dl className="stockFacts">
        <div>
          <dt>호재</dt>
          <dd>{stock.highlights.positive}</dd>
        </div>
        <div>
          <dt>악재</dt>
          <dd>{stock.highlights.negative}</dd>
        </div>
      </dl>

      <p className="cardSummary">{recommendation.summary}</p>
      <span className="detailLink">자세히 보기</span>
    </Link>
  );
}
