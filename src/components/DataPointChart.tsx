import type { LinePoint } from "@/lib/mockData";

type DataPointChartProps = {
  title: string;
  subtitle: string;
  points: LinePoint[];
};

const MA_CONFIGS = [
  { days: 5,  cls: "ma5",  label: "5일" },
  { days: 10, cls: "ma10", label: "10일" },
  { days: 20, cls: "ma20", label: "20일" },
] as const;

function calcMA(points: LinePoint[], window: number) {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((s, p) => s + p.value, 0) / slice.length;
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

function getTrend(ma5: number[], ma20: number[]) {
  const n = ma5.length - 1;
  const diff = ma5[n] - ma20[n];
  const slope = ma5[n] - ma5[Math.max(0, n - 3)];
  if (diff > 0 && slope > 0) return { label: "상승 추세", arrow: "↗", cls: "positive" };
  if (diff < 0 && slope < 0) return { label: "하락 추세", arrow: "↘", cls: "negative" };
  return { label: "횡보", arrow: "→", cls: "neutral" };
}

function formatChartValue(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

export function DataPointChart({ title, subtitle, points }: DataPointChartProps) {
  const width = 640;
  const height = 280;
  const padding = 30;
  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const rawRange = maxValue - minValue || 1;
  const min = minValue - rawRange * 0.08;
  const max = maxValue + rawRange * 0.08;
  const range = max - min || 1;
  const xStep = (width - padding * 2) / Math.max(points.length - 1, 1);

  const scaleY = (v: number) => padding + (1 - (v - min) / range) * (height - padding * 2);
  const scaleX = (i: number) => padding + i * xStep;

  const maArrays = MA_CONFIGS.map((cfg) => calcMA(points, cfg.days));
  const ma5 = maArrays[0], ma20 = maArrays[2];
  const crosses = detectCrosses(ma5, ma20);
  const trend = getTrend(ma5, ma20);

  const maLines = maArrays.map((arr) =>
    arr.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ")
  );

  const plottedPoints = points.map((point, index) => ({
    ...point,
    x: scaleX(index),
    y: scaleY(point.value)
  }));
  const indexLine = plottedPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const markerStep = Math.max(1, Math.ceil(points.length / 6));
  const axisMarkers = plottedPoints.filter(
    (_, i) => i % markerStep === 0 || i === plottedPoints.length - 1
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
        <span><i className="legendSquare index" />FRED 종가선</span>
        {MA_CONFIGS.map((cfg) => (
          <span key={cfg.days}>
            <i className={`legendLine ${cfg.cls}`} />
            {cfg.label}선
          </span>
        ))}
      </div>

      <svg
        aria-label={`${title} 일별 종가선, 사각형 마커와 이동평균선`}
        className="dataPointChart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line className="axis" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <line className="axis" x1={padding} x2={padding} y1={padding} y2={height - padding} />

        <polyline className="indexLine" points={indexLine} />

        {/* 이동평균선 — 긴 것 먼저 */}
        {[...maLines].reverse().map((pts, ri) => {
          const i = MA_CONFIGS.length - 1 - ri;
          return <polyline key={MA_CONFIGS[i].cls} className={`movingAverage ${MA_CONFIGS[i].cls}`} points={pts} />;
        })}

        {/* 종가선 사각형 마커 */}
        {plottedPoints.map((point, index) => {
          const isLatest = index === plottedPoints.length - 1;
          const markerSize = isLatest ? 9 : 7;
          return (
            <g className={`dataPoint${isLatest ? " latest" : ""}`} key={`${point.date ?? point.label}-${point.value}`}>
              <title>{point.date ?? point.label}: {formatChartValue(point.value)}</title>
              <rect
                height={markerSize}
                rx="1.5"
                width={markerSize}
                x={point.x - markerSize / 2}
                y={point.y - markerSize / 2}
              />
            </g>
          );
        })}

        {/* 골든/데드 크로스 링 마커 */}
        {crosses.map((c) => {
          const x = scaleX(c.index);
          const y = scaleY(ma5[c.index]);
          return <circle key={`${c.type}-${c.index}`} className={`crossDot ${c.type}`} cx={x} cy={y} r="8" />;
        })}

        {/* X축 레이블 */}
        {axisMarkers.map((point) => (
          <text className="axisLabel" key={`label-${point.date ?? point.label}`} x={point.x} y={height - 8}>
            {point.label}
          </text>
        ))}
      </svg>
    </section>
  );
}
