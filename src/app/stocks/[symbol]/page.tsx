import Link from "next/link";
import { notFound } from "next/navigation";
import { CandlestickChart } from "@/components/CandlestickChart";
import { MetricCard } from "@/components/MetricCard";
import { NewsList } from "@/components/NewsList";
import { RecommendationCard } from "@/components/RecommendationCard";
import { formatKRW, formatPercent } from "@/lib/format";
import { getStockBySymbol, stocks } from "@/lib/mockData";

type StockPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export function generateStaticParams() {
  return stocks.map((stock) => ({
    symbol: stock.symbol
  }));
}

export async function generateMetadata({ params }: StockPageProps) {
  const { symbol } = await params;
  const stock = getStockBySymbol(symbol);

  if (!stock) {
    return {
      title: "종목 없음 - AWS Charting"
    };
  }

  return {
    title: `${stock.name} 위험 분석 - AWS Charting`,
    description: `${stock.name}의 차트, SML, PER, RSI와 비체계적 위험 뉴스`
  };
}

export default async function StockDetailPage({ params }: StockPageProps) {
  const { symbol } = await params;
  const stock = getStockBySymbol(symbol);

  if (!stock) {
    notFound();
  }

  const changeClass = stock.priceChangePercent >= 0 ? "positiveText" : "negativeText";

  return (
    <main className="page">
      <div className="shell">
        <Link className="backLink" href="/">
          전체 시장으로 돌아가기
        </Link>

        <header className="detailHeader">
          <div>
            <p className="eyebrow">
              {stock.market} - {stock.sector}
            </p>
            <h1>{stock.name}</h1>
            <p>{stock.symbol}</p>
          </div>
          <div className="detailPrice">
            <strong>{formatKRW(stock.currentPrice)}</strong>
            <span className={changeClass}>{formatPercent(stock.priceChangePercent)}</span>
          </div>
        </header>

        <section className="detailGrid">
          <CandlestickChart
            points={stock.chart}
            subtitle="선택 종목 가격"
            title={`${stock.name} 가격 차트`}
            tone="stock"
          />
          <RecommendationCard stock={stock} />
        </section>

        <section className="contentSection">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">세부 지표</p>
              <h2>SML, PER, RSI로 보는 종목 상태</h2>
            </div>
            <p>
              숫자 자체보다 시장 평균과 비교했을 때 위험이 커지는지, 부담이 줄어드는지를
              간단히 확인합니다.
            </p>
          </div>

          <div className="metricGrid">
            <MetricCard
              description="시장 위험을 감수한 만큼 기대수익이 적절한지 보는 기준선입니다."
              detail={`베타 ${stock.metrics.sml.beta}, 기대수익 ${stock.metrics.sml.expectedReturn}%`}
              label="SML"
              value={`${stock.metrics.sml.alpha >= 0 ? "+" : ""}${stock.metrics.sml.alpha.toFixed(1)}%p`}
            />
            <MetricCard
              description="주가가 이익 대비 얼마나 비싼지 보는 주가수익비율입니다."
              detail={`업종 평균 ${stock.metrics.per.sectorAverage}배와 비교`}
              label="PER"
              value={`${stock.metrics.per.value}배`}
            />
            <MetricCard
              description="최근 가격 흐름이 과열인지 침체인지 보는 단기 모멘텀 지표입니다."
              detail="보통 70 이상은 과열, 30 이하는 침체로 해석합니다."
              label="RSI"
              value={`${stock.metrics.rsi.value}`}
            />
          </div>
        </section>

        <NewsList
          description="비체계적 위험"
          items={stock.news}
          title={`${stock.name} 개별 호재와 악재`}
        />
      </div>
    </main>
  );
}
