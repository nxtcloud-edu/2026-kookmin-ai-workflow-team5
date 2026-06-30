import type { LinePoint } from "@/lib/mockData";

type DataPointChartProps = {
  title: string;
  subtitle: string;
  points: LinePoint[];
  movingAverageWindow?: number;
};

function createMovingAverage(points: LinePoint[], windowSize: number) {
  return points.map((point, index) => {
    const windowStart = Math.max(0, index - windowSize + 1);
    const windowPoints = points.slice(windowStart, index + 1);
    const valueSum = windowPoints.reduce((sum, item) => sum + item.value, 0);

    return {
      label: point.label,
      value: valueSum / windowPoints.length
    };
  });
}

function formatChartValue(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

export function DataPointChart({
  title,
  subtitle,
  points,
  movingAverageWindow = 5
}: DataPointChartProps) {
  const width = 640;
  const height = 280;
  const padding = 30;
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const rawRange = maxValue - minValue || 1;
  const min = minValue - rawRange * 0.08;
  const max = maxValue + rawRange * 0.08;
  const range = max - min || 1;
  const xStep = (width - padding * 2) / Math.max(points.length - 1, 1);

  const scaleY = (value: number) =>
    padding + (1 - (value - min) / range) * (height - padding * 2);

  const plottedPoints = points.map((point, index) => ({
    ...point,
    x: padding + index * xStep,
    y: scaleY(point.value)
  }));
  const movingAverageLine = createMovingAverage(points, movingAverageWindow)
    .map((point, index) => `${padding + index * xStep},${scaleY(point.value)}`)
    .join(" ");
  const markerStep = Math.max(1, Math.ceil(points.length / 6));
  const axisMarkers = plottedPoints.filter(
    (_point, index) => index % markerStep === 0 || index === plottedPoints.length - 1
  );

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
          <i className="legendDot index" />
          FRED 일별 종가 포인트
        </span>
        <span>
          <i className="legendLine" />
          {movingAverageWindow}일 이동평균선
        </span>
      </div>

      <svg
        aria-label={`${title} 일별 데이터 포인트와 ${movingAverageWindow}일 이동평균선`}
        className="dataPointChart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
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
        {plottedPoints.map((point, index) => {
          const isLatest = index === plottedPoints.length - 1;

          return (
            <g
              className={`dataPoint${isLatest ? " latest" : ""}`}
              key={`${point.date ?? point.label}-${point.value}`}
            >
              <line
                className="pointGuide"
                x1={point.x}
                x2={point.x}
                y1={point.y}
                y2={height - padding}
              />
              <circle cx={point.x} cy={point.y} r={isLatest ? 5 : 3.5}>
                <title>
                  {point.date ?? point.label}: {formatChartValue(point.value)}
                </title>
              </circle>
            </g>
          );
        })}
        {axisMarkers.map((point) => (
          <text className="axisLabel" key={`label-${point.date ?? point.label}`} x={point.x} y={height - 8}>
            {point.label}
          </text>
        ))}
      </svg>
    </section>
  );
}
