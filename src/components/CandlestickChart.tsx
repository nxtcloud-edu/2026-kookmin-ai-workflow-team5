import type { CandlePoint } from "@/lib/mockData";

type CandlestickChartProps = {
  title: string;
  subtitle: string;
  points: CandlePoint[];
  tone?: "market" | "stock";
};

const MA_CONFIGS = [
  { days: 3,  cls: "ma3",  label: "3일",  color: "var(--green)" },
  { days: 5,  cls: "ma5",  label: "5일",  color: "var(--amber)" },
  { days: 10, cls: "ma10", label: "10일", color: "var(--violet)" },
] as const;

function calcMA(points: CandlePoint[], window: number) {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((s, p) => s + p.close, 0) / slice.length;
  });
}

type Cross = { index: number; type: "golden" | "dead" };

function detectCrosses(fast: number[], slow: number[]): Cross[] {
  const out: Cross[] = [];
  for (let i = 1; i < fast.length; i++) {
    const pf = fast[i - 1], ps = slow[i - 1];
    const cf = fast[i],     cs = slow[i];
    if (pf <= ps && cf > cs) out.push({ index: i, type: "golden" });
    else if (pf >= ps && cf < cs) out.push({ index: i, type: "dead" });
  }
  return out;
}

function getTrend(ma3: number[], ma5: number[]) {
  const n = ma3.length - 1;
  const diff = ma3[n] - ma5[n];
  const slope = ma3[n] - ma3[Math.max(0, n - 2)];
  if (diff > 0 && slope > 0) return { label: "상승 추세", arrow: "↗", cls: "positive" };
  if (diff < 0 && slope < 0) return { label: "하락 추세", arrow: "↘", cls: "negative" };
  return { label: "횡보", arrow: "→", cls: "neutral" };
}

export function CandlestickChart({
  title,
  subtitle,
  points,
  tone = "market"
}: CandlestickChartProps) {
  const W = 640, H = 280, PAD = 30;
  const vals = points.flatMap((p) => [p.high, p.low]);
  const rawMin = Math.min(...vals), rawMax = Math.max(...vals);
  const spread = rawMax - rawMin || 1;
  const min = rawMin - spread * 0.06;
  const max = rawMax + spread * 0.06;
  const range = max - min;
  const xStep = (W - PAD * 2) / Math.max(points.length - 1, 1);
  const candleWidth = Math.min(28, Math.max(12, xStep * 0.42));
  const sy = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2);
  const sx = (i: number) => PAD + i * xStep;

  const maArrays = MA_CONFIGS.map((cfg) => calcMA(points, cfg.days));
  const ma3 = maArrays[0], ma5 = maArrays[1];
  const crosses = detectCrosses(ma3, ma5);
  const trend = getTrend(ma3, ma5);

  const candles = points.map((p, i) => {
    const x = sx(i);
    const openY = sy(p.open), closeY = sy(p.close);
    const highY = sy(p.high), lowY = sy(p.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(2, Math.abs(openY - closeY));
    const direction = p.close > p.open ? "up" : p.close < p.open ? "down" : "flat";
    return { ...p, x, openY, closeY, highY, lowY, bodyTop, bodyHeight, direction };
  });

  const maLines = maArrays.map((arr) =>
    arr.map((v, i) => `${sx(i)},${sy(v)}`).join(" ")
  );

  return (
    <section className="chartBlock" aria-label={title}>
      <div className="chartHeader">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <div className="chartHeaderRight">
          <span className={`trendPill ${trend.cls}`}>
            {trend.arrow} {trend.label}
          </span>
          <div className="rangeLabel">
            <span>{points[0].label}</span>
            <span>{points[points.length - 1].label}</span>
          </div>
        </div>
      </div>

      <div className="chartLegend" aria-label="차트 범례">
        <span><i className="legendBox up" />상승봉</span>
        <span><i className="legendBox down" />하락봉</span>
        {MA_CONFIGS.map((cfg) => (
          <span key={cfg.days}>
            <i className="legendLine" style={{ background: cfg.color }} />
            {cfg.label}선
          </span>
        ))}
      </div>

      <svg
        aria-label={`${title} 봉차트와 이동평균선`}
        className={`candleChart ${tone}`}
        role="img"
        viewBox={`0 0 ${W} ${H}`}
      >
        <line className="axis" x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} />
        <line className="axis" x1={PAD} x2={PAD} y1={PAD} y2={H - PAD} />

        {/* 이동평균선 — 긴 것 먼저 */}
        {[...maLines].reverse().map((pts, ri) => {
          const i = MA_CONFIGS.length - 1 - ri;
          return (
            <polyline
              key={MA_CONFIGS[i].cls}
              className={`movingAverage ${MA_CONFIGS[i].cls}`}
              points={pts}
              style={{ stroke: MA_CONFIGS[i].color }}
            />
          );
        })}

        {/* 봉 */}
        {candles.map((p) => (
          <g className={`candle ${p.direction}`} key={`${p.label}-${p.close}`}>
            <line className="wick" x1={p.x} x2={p.x} y1={p.highY} y2={p.lowY} />
            <rect height={p.bodyHeight} rx="2" width={candleWidth} x={p.x - candleWidth / 2} y={p.bodyTop} />
          </g>
        ))}

        {/* 골든/데드 크로스 링 마커 */}
        {crosses.map((c) => {
          const x = sx(c.index);
          const y = sy(ma3[c.index]);
          return <circle key={`${c.type}-${c.index}`} className={`crossDot ${c.type}`} cx={x} cy={y} r="8" />;
        })}
      </svg>
    </section>
  );
}
