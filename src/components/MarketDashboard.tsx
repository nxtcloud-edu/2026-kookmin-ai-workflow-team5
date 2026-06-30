"use client";

import { useCallback, useEffect, useState } from "react";
import { DataPointChart } from "@/components/DataPointChart";
import { FearGreedBanner } from "@/components/FearGreedWidget";
import { LoadingState } from "@/components/LoadingState";
import { NewsList } from "@/components/NewsList";
import { StockCard } from "@/components/StockCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatIndex, formatPercent } from "@/lib/format";
import type { MarketPayload } from "@/lib/marketService";

const refreshIntervalMs = 60 * 1000;

export function MarketDashboard() {
  const [data, setData] = useState<MarketPayload | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshMarket = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/market", {
        cache: "no-store"
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        throw new Error(errorPayload?.message ?? `market api failed: ${response.status}`);
      }

      const payload = (await response.json()) as MarketPayload;

      setData(payload);
      setLastError(null);
    } catch (error) {
      setLastError(
        error instanceof Error
          ? error.message
          : "실데이터를 불러오지 못했습니다. 잠시 후 다시 조회하세요."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const firstRefresh = window.setTimeout(() => {
      void refreshMarket();
    }, 0);
    const timer = window.setInterval(() => {
      void refreshMarket();
    }, refreshIntervalMs);

    return () => {
      window.clearTimeout(firstRefresh);
      window.clearInterval(timer);
    };
  }, [refreshMarket]);

  if (!data && isRefreshing) {
    return <LoadingState />;
  }

  if (!data) {
    return (
      <section className="emptyState" aria-live="polite">
        <p className="eyebrow">Data unavailable</p>
        <h2>표시할 실데이터가 없습니다</h2>
        <p>{lastError ?? "시장 데이터를 아직 조회하지 못했습니다."}</p>
        <button className="ghostButton" disabled={isRefreshing} onClick={refreshMarket} type="button">
          {isRefreshing ? "조회 중" : "다시 조회"}
        </button>
      </section>
    );
  }

  return (
    <>
      <header className="topBar">
        <div>
          <p className="eyebrow">AWS Charting</p>
          <h1>미국 주식 위험 대시보드</h1>
        </div>
        <div className="statusActions">
          <ThemeToggle />
          <p className={`dataBadge ${data.source}`}>
            {data.source === "live" ? "API data" : "partial data"}
          </p>
          <button className="ghostButton" disabled={isRefreshing} onClick={refreshMarket} type="button">
            {isRefreshing ? "조회 중" : "새로고침"}
          </button>
        </div>
      </header>

      <section className="dataStatus" aria-live="polite">
        <span>{data.message}</span>
        <span>{new Date(data.updatedAt).toLocaleString("ko-KR")}</span>
        {lastError ? <span className="negativeText">{lastError}</span> : null}
      </section>

      <FearGreedBanner />

      <section className="heroGrid">
        <DataPointChart
          points={data.marketIndex.chart}
          subtitle={`${data.marketIndex.code} - ${data.marketIndex.updatedAt}`}
          title={data.marketIndex.name}
        />

        <aside className="indexSummary">
          <p className="eyebrow">시장 전체 흐름</p>
          <strong>{formatIndex(data.marketIndex.currentValue)}</strong>
          <span className="positiveText">{formatPercent(data.marketIndex.changePercent)}</span>
          <p>{data.marketIndex.summary}</p>
          <div className="beginnerNote">
            체계적 위험은 금리, 환율, 수출처럼 여러 종목에 함께 영향을 주는 시장
            공통 요인입니다.
          </div>
        </aside>
      </section>

      <NewsList
        description="체계적 위험"
        items={data.systematicNews}
        title="시장 공통 호재와 악재"
      />

      <section className="contentSection">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">비체계적 위험</p>
            <h2>미국 종목별 위험 분석</h2>
          </div>
          <p>
            비체계적 위험은 특정 기업의 실적, 규제, 제품, 임상 일정처럼 한 종목에
            직접 영향을 주는 요인입니다.
          </p>
        </div>

        <div className="stockGrid">
          {data.stocks.length > 0 ? (
            data.stocks.map((stock) => <StockCard key={stock.symbol} stock={stock} />)
          ) : (
            <div className="emptyInline">조회된 종목 실데이터가 없습니다.</div>
          )}
        </div>
      </section>
    </>
  );
}
