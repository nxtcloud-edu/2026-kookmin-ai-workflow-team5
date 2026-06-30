type VolumeCardProps = {
  individual: number;
  institutional: number;
  foreign: number;
};

const BARS = [
  { key: "individual" as const, label: "개인", cls: "volIndividual" },
  { key: "institutional" as const, label: "기관", cls: "volInstitutional" },
  { key: "foreign" as const, label: "외국인", cls: "volForeign" },
];

function interpretation(individual: number, institutional: number, foreign: number) {
  if (institutional >= 55) return "기관 주도 — 안정적 수급, 방향성 신뢰도 높음";
  if (foreign >= 35) return "외국인 주도 — 글로벌 자금 유입, 환율 민감";
  if (individual >= 45) return "개인 주도 — 단기 변동성 주의, 심리에 민감";
  if (institutional >= individual && institutional >= foreign) return "기관 우위 — 비교적 안정적 수급";
  return "복합 수급 — 특정 주체 편향 없음";
}

export function VolumeCard({ individual, institutional, foreign }: VolumeCardProps) {
  const values = { individual, institutional, foreign };
  const note = interpretation(individual, institutional, foreign);

  return (
    <article className="metricCard volumeCard">
      <p className="eyebrow">거래량 수급</p>
      <div className="metricValueRow">
        <strong className="volumeTitle">주체별 거래 비중</strong>
      </div>
      <div className="volumeBars">
        {BARS.map(({ key, label, cls }) => (
          <div key={key} className="volumeRow">
            <span className="volumeLabel">{label}</span>
            <div className="volumeBarWrap">
              <div className={`volumeBar ${cls}`} style={{ width: `${values[key]}%` }} />
            </div>
            <span className="volumePct">{values[key]}%</span>
          </div>
        ))}
      </div>
      <p className="volumeNote">{note}</p>
    </article>
  );
}
