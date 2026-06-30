"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CandlestickChart } from "@/components/CandlestickChart";
import { LoadingState } from "@/components/LoadingState";
import { MetricCard } from "@/components/MetricCard";
import { NewsList } from "@/components/NewsList";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VolumeCard } from "@/components/VolumeCard";
import { formatPercent, formatUSD } from "@/lib/format";
import type { StockPayload } from "@/lib/marketService";

type StockDetailClientProps = {
  symbol: string;
};

const refreshIntervalMs = 60 * 1000;

function smlVerdict(alpha: number) {
  if (alpha >= 1.5) return { label: "크게 저평가", cls: "positive" as const };
  if (alpha >= 0.3) return { label: "소폭 저평가", cls: "positive" as const };
  if (alpha >= -0.3) return { label: "적정 평가", cls: "neutral" as const };
  if (alpha >= -1.5) return { label: "소폭 고평가", cls: "caution" as const };
  return { label: "크게 고평가", cls: "negative" as const };
}

function smlGauge(alpha: number) {
  const clamped = Math.max(-3, Math.min(3, alpha));
  return Math.round(((clamped + 3) / 6) * 100);
}

function perVerdict(value: number, avg: number) {
  const pct = ((value - avg) / avg) * 100;
  if (pct <= -20) return { label: "크게 저평가", cls: "positive" as const };
  if (pct <= -5) return { label: "소폭 저평가", cls: "positive" as const };
  if (pct <= 5) return { label: "업종 평균", cls: "neutral" as const };
  if (pct <= 20) return { label: "소폭 고평가", cls: "caution" as const };
  return { label: "크게 고평가", cls: "negative" as const };
}

function perGauge(value: number, avg: number) {
  const pct = ((value - avg) / avg) * 100;
  const clamped = Math.max(-50, Math.min(50, pct));
  return Math.round(50 - clamped);
}

function rsiVerdict(rsi: number) {
  if (rsi >= 80) return { label: "극도 과열", cls: "negative" as const };
  if (rsi >= 70) return { label: "과열 구간", cls: "caution" as const };
  if (rsi >= 50) return { label: "상승 모멘텀", cls: "positive" as const };
  if (rsi >= 30) return { label: "하락 모멘텀", cls: "neutral" as const };
  if (rsi >= 20) return { label: "침체 구간", cls: "caution" as const };
  return { label: "극도 침체", cls: "negative" as const };
}

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
  const { sml, per, rsi, volume } = stock.metrics;
  const perPct = (((per.value - per.sectorAverage) / per.sectorAverage) * 100).toFixed(1);
  const perSign = per.value <= per.sectorAverage ? "" : "+";

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
        <RecommendationCard stock={stock} recommendation={data.recommendation} />
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
            detail={`베타 ${sml.beta} · 기대수익 ${sml.expectedReturn}% · 무위험수익 ${sml.riskFreeRate}%`}
            gauge={{
              value: smlGauge(sml.alpha),
              minLabel: "크게 고평가",
              maxLabel: "크게 저평가",
            }}
            label="SML"
            value={`${sml.alpha >= 0 ? "+" : ""}${sml.alpha.toFixed(1)}%p`}
            verdict={smlVerdict(sml.alpha)}
          />
          <MetricCard
            description="주가가 이익 대비 얼마나 비싼지 보는 주가수익비율입니다."
            detail={`업종 평균 ${per.sectorAverage}배 대비 ${perSign}${perPct}%`}
            gauge={{
              value: perGauge(per.value, per.sectorAverage),
              minLabel: "크게 고평가",
              maxLabel: "크게 저평가",
            }}
            label="PER"
            value={`${per.value}배`}
            verdict={perVerdict(per.value, per.sectorAverage)}
          />
          <MetricCard
            description="최근 가격 흐름이 과열인지 침체인지 보는 단기 모멘텀 지표입니다."
            detail="30 이하 침체 · 50 중립 · 70 이상 과열"
            gauge={{
              value: rsi.value,
              minLabel: "극도 침체",
              maxLabel: "극도 과열",
              zones: [
                { at: 30, label: "침체 경계 30" },
                { at: 50, label: "중립 50" },
                { at: 70, label: "과열 경계 70" },
              ],
            }}
            label="RSI"
            value={`${rsi.value}`}
            verdict={rsiVerdict(rsi.value)}
          />
        </div>

        {volume && (
          <div className="volumeSection">
            <VolumeCard
              foreign={volume.foreign}
              individual={volume.individual}
              institutional={volume.institutional}
            />
          </div>
        )}
      </section>

      <NewsList
        description="비체계적 위험"
        items={stock.news}
        title={`${stock.name} 개별 호재와 악재`}
      />
    </>
  );
}
