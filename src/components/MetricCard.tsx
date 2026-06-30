type Verdict = {
  label: string;
  cls: "positive" | "negative" | "neutral" | "caution";
};

type Gauge = {
  value: number;
  minLabel: string;
  maxLabel: string;
  zones?: { at: number; label: string }[];
};

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  detail: string;
  verdict?: Verdict;
  gauge?: Gauge;
};

export function MetricCard({ label, value, description, detail, verdict, gauge }: MetricCardProps) {
  return (
    <article className="metricCard">
      <p className="eyebrow">{label}</p>
      <div className="metricValueRow">
        <strong>{value}</strong>
        {verdict ? (
          <span className={`verdictBadge ${verdict.cls}`}>{verdict.label}</span>
        ) : null}
      </div>
      {gauge ? (
        <div className="metricGauge" aria-label={`${label} 게이지`}>
          <div className="metricGaugeTrack">
            <div className="metricGaugeFill" style={{ width: `${Math.max(2, Math.min(98, gauge.value))}%` }} />
            <div className="metricGaugeDot" style={{ left: `${Math.max(2, Math.min(98, gauge.value))}%` }} />
            {gauge.zones?.map((z) => (
              <div
                key={z.at}
                className="metricGaugeZone"
                style={{ left: `${z.at}%` }}
                title={z.label}
              />
            ))}
          </div>
          <div className="metricGaugeLabels">
            <span>{gauge.minLabel}</span>
            <span>{gauge.maxLabel}</span>
          </div>
        </div>
      ) : null}
      <p>{description}</p>
      <span>{detail}</span>
    </article>
  );
}
