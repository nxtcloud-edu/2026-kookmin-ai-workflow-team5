import { notFound } from "next/navigation";
import { StockDetailClient } from "@/components/StockDetailClient";
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

  return (
    <main className="page">
      <div className="shell">
        <StockDetailClient symbol={symbol} />
      </div>
    </main>
  );
}
