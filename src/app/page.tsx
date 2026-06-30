import { CandlestickChart } from "@/components/CandlestickChart";
import { NewsList } from "@/components/NewsList";
import { StockCard } from "@/components/StockCard";
import { formatIndex, formatPercent } from "@/lib/format";
import { marketIndex, stocks, systematicNews } from "@/lib/mockData";

export default function Home() {
  return (
    <main className="page">
      <div className="shell">
        <header className="topBar">
          <div>
            <p className="eyebrow">AWS Charting</p>
            <h1>한국 주식 위험 대시보드</h1>
          </div>
          <p className="demoBadge">교육용 mock data</p>
        </header>

        <section className="heroGrid">
          <CandlestickChart
            points={marketIndex.chart}
            subtitle={`${marketIndex.code} - ${marketIndex.updatedAt}`}
            title={marketIndex.name}
          />

          <aside className="indexSummary">
            <p className="eyebrow">시장 전체 흐름</p>
            <strong>{formatIndex(marketIndex.currentValue)}</strong>
            <span className="positiveText">{formatPercent(marketIndex.changePercent)}</span>
            <p>{marketIndex.summary}</p>
            <div className="beginnerNote">
              체계적 위험은 금리, 환율, 수출처럼 여러 종목에 함께 영향을 주는
              시장 공통 요인입니다.
            </div>
          </aside>
        </section>

        <NewsList
          description="체계적 위험"
          items={systematicNews}
          title="시장 공통 호재와 악재"
        />

        <section className="contentSection">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">비체계적 위험</p>
              <h2>한국 종목별 데모 분석</h2>
            </div>
            <p>
              비체계적 위험은 특정 기업의 실적, 규제, 제품, 임상 일정처럼 한 종목에
              직접 영향을 주는 요인입니다.
            </p>
          </div>

          <div className="stockGrid">
            {stocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
