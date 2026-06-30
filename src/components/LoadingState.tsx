type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = "실데이터를 조회 중입니다",
  description = "FRED, Alpha Vantage, Google News RSS 응답을 기다리는 중입니다."
}: LoadingStateProps) {
  return (
    <section className="loadingState" aria-live="polite">
      <div className="loadingSpinner" aria-hidden="true" />
      <div>
        <p className="eyebrow">Loading</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
