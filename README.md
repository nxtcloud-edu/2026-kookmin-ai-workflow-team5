# AWS Charting

한국 주식 초보자를 위한 발표용 로컬 위험 정보 대시보드입니다. 모든 데이터는 mock data이며, 외부 유료 API나 LLM API를 호출하지 않습니다.

## 주요 기능

- KOSPI 지수 봉차트, 이동평균선, 시장 공통 위험 뉴스
- 한국 종목 카드와 비체계적 위험 요약
- `/stocks/[symbol]` 종목 상세 라우트
- 종목별 봉차트와 3일 이동평균선
- SML, PER, RSI 지표 설명
- mock data 기반 LLM-like 데모 추천
- 클릭 가능한 뉴스 링크

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 검증 명령

```bash
npm run lint
npm run build
```

## 주의

이 프로젝트는 교육과 발표를 위한 데모입니다. 추천 문구는 실제 투자 조언이 아니며, mock data와 규칙 기반 로직으로 생성됩니다.
