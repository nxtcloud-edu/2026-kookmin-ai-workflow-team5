import { MarketDashboard } from "@/components/MarketDashboard";
import type { MarketPayload } from "@/lib/marketService";
import { marketIndex, stocks, systematicNews } from "@/lib/mockData";

export default function Home() {
  const initialData: MarketPayload = {
    marketIndex,
    systematicNews: [],
    stocks,
    source: "mock",
    updatedAt: new Date().toISOString(),
    message: "API 조회 전 초기 mock data입니다."
  };

  return (
    <main className="page">
      <div className="shell">
        <MarketDashboard initialData={initialData} />
      </div>
    </main>
  );
}
