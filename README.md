# AWS Charting

미국 주식 초보자를 위한 발표용 로컬 위험 정보 대시보드입니다. 첫 화면은 loading 상태로 시작하며, 서버 Route Handler가 FRED 지수 데이터, Twelve Data/Alpha Vantage 주가 API, Google News RSS를 조회한 뒤 실데이터만 표시합니다.

## 주요 기능

- FRED 기반 S&P 500 장기 선 그래프, 사각형 마커, 이동평균선, 줌/가로 스크롤 탐색
- 미국 8개 종목 카드와 비체계적 위험 요약
- `/stocks/[symbol]` 종목 상세 라우트
- 종목별 2016-01-01 이후 장기 봉차트, 기간 선택, 줌/가로 스크롤 탐색
- 차트 상승 구간은 빨간색, 하락 구간은 파란색 계열로 표시
- FRED CSV 기반 S&P 500 일별 종가 조회, 2016-01-01 이후 장기 데이터 표시
- Twelve Data 우선, Alpha Vantage 백업 기반 미국 주식 일봉 OHLC 장기 조회
- Google News RSS 기반 뉴스 조회
- 선택적 Groq 뉴스 분류/요약과 로컬 규칙 기반 fallback
- SML, PER, RSI 지표 설명
- 조회 데이터 기반 LLM-like 데모 추천
- 라이트/다크 모드 전환과 브라우저 로컬 저장
- 클릭 가능한 뉴스 링크

## API 설정

```bash
cp .env.example .env.local
```

`.env.local`에 필요한 값을 채웁니다.

```env
GROQ_API_KEY=
TWELVE_DATA_API_KEY=
ALPHA_VANTAGE_API_KEY=
```

FRED와 Google News RSS는 별도 API 키가 필요 없습니다. 종목 가격은 Twelve Data를 먼저 조회하고, 실패하면 Alpha Vantage를 백업으로 조회합니다. 두 API 모두 캐시가 없고 조회에 실패하면 해당 종목은 표시하지 않습니다. 브라우저는 `/api/market`, `/api/stocks/[symbol]`을 1분 간격으로 다시 조회합니다.

`TWELVE_DATA_API_KEY`는 Twelve Data 회원 가입 후 대시보드의 API Key 메뉴에서 발급받아 `.env.local`에 넣습니다. Twelve Data는 무료 Basic 플랜을 제공하므로 발표용 1차 종목 가격 API로 사용합니다.

`GROQ_API_KEY`는 선택 사항입니다. 키가 있으면 Google News RSS 제목을 Groq로 분류/요약하고, 키가 없거나 호출에 실패하면 로컬 키워드 규칙으로 호재/악재/중립을 분류합니다. Google News RSS는 최근 10일 이내 기사만 사용합니다.

외부 조회 제한을 피하기 위해 서버는 FRED S&P 500 종가를 30분 동안, Twelve Data와 Alpha Vantage 종목별 일봉 OHLC를 6시간 동안 메모리에 캐시합니다. Twelve Data가 실패하면 1시간 동안 재시도하지 않고 Alpha Vantage 백업을 확인합니다. Alpha Vantage가 rate limit 등으로 실패하면 해당 종목은 6시간 동안 재시도하지 않습니다. 마지막 성공 캐시가 있을 때만 종목을 표시하고, 캐시가 전혀 없으면 loading 이후 오류 또는 빈 상태를 표시합니다. 메인 페이지의 여러 종목 조회는 실제 요청이 필요한 경우에만 1.2초 간격으로 순차 처리합니다.

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
curl http://localhost:3000/api/market
curl http://localhost:3000/api/stocks/AAPL
```

## 주의

이 프로젝트는 교육과 발표를 위한 데모입니다. 추천 문구는 실제 투자 조언이 아니며, 조회 데이터와 규칙 기반 로직으로 생성됩니다.
