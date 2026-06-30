"use client";

import { useEffect, useRef, useState } from "react";
import type { FearGreedLevel } from "@/lib/mockData";

type FearGreedData = {
  score: number;
  level: FearGreedLevel;
  label: string;
  description: string;
  previousClose: number | null;
  updatedAt: string;
  source?: string;
};

const POLL_MS = 60 * 60 * 1000;

function zoneOf(score: number): string {
  if (score <= 25) return "extreme-fear";
  if (score <= 45) return "fear";
  if (score <= 55) return "neutral";
  if (score <= 75) return "greed";
  return "extreme-greed";
}

function useFearGreed() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoneChanged, setZoneChanged] = useState(false);
  const prevZone = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/fear-greed");
        if (!res.ok) {
          throw new Error("fear greed api failed");
        }
        const next: FearGreedData = await res.json();
        const nextZone = zoneOf(next.score);
        if (prevZone.current && nextZone !== prevZone.current) {
          setZoneChanged(true);
          setTimeout(() => setZoneChanged(false), 6000);
        }
        prevZone.current = nextZone;
        setError(null);
        setData(next);
      } catch {
        setError("시장 심리 데이터를 불러오지 못했습니다.");
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return { data, error, zoneChanged };
}

export function FearGreedBanner() {
  const { data, error, zoneChanged } = useFearGreed();

  if (!data) {
    return (
      <div className="fgAlert neutral" role="status">
        <span className="fgAlertLabel">{error ? "조회 불가" : "조회 중"}</span>
        <span className="fgAlertDesc">
          {error ?? "CNN Business 시장 심리 데이터를 조회 중입니다."}
        </span>
      </div>
    );
  }

  const diff =
    data.previousClose !== null ? data.score - data.previousClose : null;

  return (
    <div className={`fgAlert ${data.level}${zoneChanged ? " zoneChanged" : ""}`} role="status">
      <span className="fgAlertLabel">{data.label}</span>
      <span className="fgAlertValue">{data.score}</span>
      {diff !== null && (
        <span className={`fgAlertDiff ${diff >= 0 ? "up" : "down"}`}>
          전일比 {diff >= 0 ? "▲" : "▼"}{Math.abs(diff)}
        </span>
      )}
      <span className="fgAlertDesc">{data.description}</span>
      {zoneChanged && <span className="fgZoneTag">구간 변경</span>}
      <span className="fgAlertSource">출처: {data.source ?? "CNN Business"}</span>
    </div>
  );
}
