import type { CandlePoint } from "@/lib/mockData";

type CandlestickChartProps = {
  title: string;
  subtitle: string;
  points: CandlePoint[];
  tone?: "market" | "stock";
  movingAverageWindow?: number;
};

function createMovingAverage(points: CandlePoint[], windowSize: number) {
  return points.map((point, index) => {
    const windowStart = Math.max(0, index - windowSize + 1);
    const windowPoints = points.slice(windowStart, index + 1);
    const closeSum = windowPoints.reduce((sum, item) => sum + item.close, 0);

    return {
      label: point.label,
      value: closeSum / windowPoints.length
    };
  });
}

export function CandlestickChart({
  title,
  subtitle,
  points,
  tone = "market",
  movingAverageWindow = 3
}: CandlestickChartProps) {
  const width = 640;
  const height = 280;
  const padding = 30;
  const values = points.flatMap((point) => [point.high, point.low]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = (width - padding * 2) / Math.max(points.length - 1, 1);
  const candleWidth = Math.min(28, Math.max(12, xStep * 0.42));

  const scaleY = (value: number) =>
    padding + (1 - (value - min) / range) * (height - padding * 2);

  const candles = points.map((point, index) => {
    const x = padding + index * xStep;
    const openY = scaleY(point.open);
    const closeY = scaleY(point.close);
    const highY = scaleY(point.high);
    const lowY = scaleY(point.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(2, Math.abs(openY - closeY));
    const direction =
      point.close > point.open
        ? "up"
        : point.close < point.open
          ? "down"
          : "flat";

    return {
      ...point,
      x,
      openY,
      closeY,
      highY,
      lowY,
      bodyTop,
      bodyHeight,
      direction
    };
  });

  const movingAveragePoints = createMovingAverage(points, movingAverageWindow).map(
    (point, index) => ({
      ...point,
      x: padding + index * xStep,
      y: scaleY(point.value)
    })
  );
  const movingAverageLine = movingAveragePoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <section className="chartBlock" aria-label={title}>
      <div className="chartHeader">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <div className="rangeLabel">
          <span>{points[0].label}</span>
          <span>{points[points.length - 1].label}</span>
        </div>
      </div>

      <div className="chartLegend" aria-label="차트 범례">
        <span>
          <i className="legendBox up" />
          상승봉
        </span>
        <span>
          <i className="legendBox down" />
          하락봉
        </span>
        <span>
          <i className="legendLine" />
          {movingAverageWindow}일 이동평균선
        </span>
      </div>

      <svg
        className={`candleChart ${tone}`}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        aria-label={`${title} 봉차트와 ${movingAverageWindow}일 이동평균선`}
      >
        <line
          className="axis"
          x1={padding}
          x2={width - padding}
          y1={height - padding}
          y2={height - padding}
        />
        <line className="axis" x1={padding} x2={padding} y1={padding} y2={height - padding} />
        <polyline className="movingAverage" points={movingAverageLine} />
        {candles.map((point) => (
          <g className={`candle ${point.direction}`} key={`${point.label}-${point.close}`}>
            <line className="wick" x1={point.x} x2={point.x} y1={point.highY} y2={point.lowY} />
            <rect
              height={point.bodyHeight}
              rx="2"
              width={candleWidth}
              x={point.x - candleWidth / 2}
              y={point.bodyTop}
            />
          </g>
        ))}
      </svg>
    </section>
  );
}
