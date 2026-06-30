"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CandlestickChart } from "@/components/CandlestickChart";
import { LoadingState } from "@/components/LoadingState";
import { MetricCard } from "@/components/MetricCard";
import { NewsList } from "@/components/NewsList";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatPercent, formatUSD } from "@/lib/format";
import type { StockPayload } from "@/lib/marketService";

type StockDetailClientProps = {
  symbol: string;
};

const refreshIntervalMs = 60 * 1000;

export function StockDetailClient({ symbol }: StockDetailClientProps) {
  const [data, setData] = useState<StockPayload | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshStock = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/stocks/${symbol}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        throw new Error(errorPayload?.message ?? `stock api failed: ${response.status}`);
      }

      const payload = (await response.json()) as StockPayload;

      setData(payload);
      setLastError(null);
    } catch (error) {
      setLastError(
        error instanceof Error
          ? error.message
          : "종목 실데이터를 불러오지 못했습니다. 잠시 후 다시 조회하세요."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [symbol]);

  useEffect(() => {
    const firstRefresh = window.setTimeout(() => {
      void refreshStock();
    }, 0);
    const timer = window.setInterval(() => {
      void refreshStock();
    }, refreshIntervalMs);

    return () => {
      window.clearTimeout(firstRefresh);
      window.clearInterval(timer);
    };
  }, [refreshStock]);

  if (!data && isRefreshing) {
    return (
      <>
        <Link className="backLink" href="/">
          전체 시장으로 돌아가기
        </Link>
        <LoadingState
          description="Twelve Data, Alpha Vantage 가격 데이터와 Google News RSS 응답을 기다리는 중입니다."
          title="종목 실데이터를 조회 중입니다"
        />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Link className="backLink" href="/">
          전체 시장으로 돌아가기
        </Link>
        <section className="emptyState" aria-live="polite">
          <p className="eyebrow">Data unavailable</p>
          <h2>{symbol} 실데이터를 표시할 수 없습니다</h2>
          <p>{lastError ?? "종목 데이터를 아직 조회하지 못했습니다."}</p>
          <button className="ghostButton" disabled={isRefreshing} onClick={refreshStock} type="button">
            {isRefreshing ? "조회 중" : "다시 조회"}
          </button>
        </section>
      </>
    );
  }

  const stock = data.stock;
  const changeClass = stock.priceChangePercent >= 0 ? "positiveText" : "negativeText";

  return (
    <>
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
        <div className="detailActions">
          <ThemeToggle />
          <div className="detailPrice">
            <strong>{formatUSD(stock.currentPrice)}</strong>
            <span className={changeClass}>{formatPercent(stock.priceChangePercent)}</span>
          </div>
        </div>
      </header>

      <section className="dataStatus" aria-live="polite">
        <span>{data.message}</span>
        <span>{new Date(data.updatedAt).toLocaleString("ko-KR")}</span>
        {lastError ? <span className="negativeText">{lastError}</span> : null}
        <button className="ghostButton" disabled={isRefreshing} onClick={refreshStock} type="button">
          {isRefreshing ? "조회 중" : "새로고침"}
        </button>
      </section>

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
    </>
  );
}
