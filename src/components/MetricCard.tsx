type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  detail: string;
};

export function MetricCard({ label, value, description, detail }: MetricCardProps) {
  return (
    <article className="metricCard">
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <p>{description}</p>
      <span>{detail}</span>
    </article>
  );
}
