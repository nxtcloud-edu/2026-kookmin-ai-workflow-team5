import { LoadingState } from "@/components/LoadingState";

export default function StockLoading() {
  return (
    <main className="page">
      <div className="shell">
        <LoadingState
          description="Alpha Vantage 가격 데이터와 Google News RSS 응답을 기다리는 중입니다."
          title="종목 실데이터를 조회 중입니다"
        />
      </div>
    </main>
  );
}
