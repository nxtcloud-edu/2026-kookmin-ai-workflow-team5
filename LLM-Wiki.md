# LLM-Wiki

## 프로젝트 목표

`aws-charting`은 미국 주식 초보자가 체계적 위험과 비체계적 위험을 구분해서 볼 수 있도록 만든 로컬 Next.js 대시보드입니다.

## 주요 요구사항

- 로컬 환경에서 실행
- 첫 화면은 loading 상태이며, FRED 지수 데이터, Twelve Data/Alpha Vantage 주가 API, Google News RSS 조회 성공 후 실데이터만 표시
- KIS 인증 문제를 피하기 위해 미국 주식 일봉 API는 Twelve Data 우선, Alpha Vantage 백업으로 변경
- 실시간 WebSocket이 아닌 1분 간격 조회 방식
- 미국 주식과 FRED `SP500` S&P 500 지수 중심
- 메인 페이지에서 지수 차트, 체계적 위험 뉴스, 종목별 요약 제공
- 종목 상세 페이지를 `/stocks/[symbol]` 별도 라우트로 제공
- 상세 페이지에서 종목 차트, SML, PER, RSI, 개별 뉴스 제공
- 추천 UI는 실제 LLM 호출 없이 규칙 기반 위험 분석으로 구현
- API 조회 실패 시 정적 fallback 없이 오류 또는 빈 상태 표시

## 정적 카탈로그 구성

- `src/lib/mockData.ts`
- 라우팅, 종목명, 지표 설명에 필요한 정적 카탈로그
- Apple, Microsoft, NVIDIA, Tesla, Alphabet, Amazon, Meta Platforms, JPMorgan Chase 종목 식별자
- 화면 표시 가격, 차트, 뉴스는 API/RSS 조회 성공값만 사용

## API 연동 구성

- `.env.local`에 Twelve Data API 키와 Alpha Vantage 백업 API 키를 설정
- `src/app/api/market/route.ts`: 메인 페이지용 시장/종목/뉴스 데이터 조회
- `src/app/api/stocks/[symbol]/route.ts`: 종목 상세 데이터 조회
- `src/lib/fredClient.ts`: FRED CSV `SP500` 기반 S&P 500 일별 종가를 2016-01-01 이후로 조회
- `src/lib/twelveDataClient.ts`: Twelve Data `time_series` 기반 2016-01-01 이후 일봉 OHLC 1차 조회
- `src/lib/alphaVantageClient.ts`: Alpha Vantage `TIME_SERIES_DAILY` 기반 2016-01-01 이후 일봉 OHLC 백업 조회
- `src/lib/news.ts`: Google News RSS 조회와 RSS XML 파싱
- `src/lib/groq.ts`: `GROQ_API_KEY`가 있을 때만 Groq 뉴스 분류/요약을 선택 실행
- `src/lib/marketService.ts`: 실데이터와 캐시를 합성하고 실패 항목은 숨김
- 클라이언트 컴포넌트는 1분 간격으로 API route를 다시 호출
- FRED S&P 500 종가는 서버 메모리에 30분 캐시
- Twelve Data 일봉 OHLC는 서버 메모리에 6시간 성공 캐시
- Twelve Data 실패 응답은 종목별 1시간 쿨다운 후 Alpha Vantage 백업 확인
- Alpha Vantage 일봉 OHLC는 서버 메모리에 6시간 성공 캐시
- Alpha Vantage 실패 응답은 종목별 6시간 쿨다운으로 저장해 1분 새로고침이 API 제한을 계속 소모하지 않도록 처리
- 캐시 만료 후 API 실패 시 마지막 성공 캐시를 재사용
- 캐시가 없고 API도 실패하면 정적 fallback 없이 503과 오류 상태 표시
- 메인 페이지의 다중 종목 조회는 실제 Twelve Data 또는 Alpha Vantage 요청이 필요한 경우에만 1.2초 간격 순차 처리
- Google News RSS는 최근 10일 이내 기사만 사용
- Groq 키가 없거나 호출 실패 시 로컬 키워드 규칙으로 호재/악재/중립 분류

## 추천 로직 가정

- `src/lib/recommendation.ts`
- 뉴스 감성, PER의 업종 평균 대비 위치, RSI, SML 알파, 위험 점수, 변동성을 점수화
- RSI는 Twelve Data 또는 Alpha Vantage 일봉 데이터가 있으면 최신 봉차트 기준으로 재계산
- 점수에 따라 `관심`, `관망`, `주의` 상태를 표시
- 실제 LLM API를 호출하지 않고 조회 데이터와 규칙 기반 점수로 위험 분석 문구 생성

## 화면 구조

- `/`: FRED S&P 500 장기 선 그래프, 사각형 마커, 이동평균선, `전체/5년/1년/6개월/3개월` 기간 선택, 줌/가로 스크롤 탐색, 시장 공통 뉴스, 종목 카드 목록, 라이트/다크 모드 토글, `/api/market` 1분 간격 조회
- `/stocks/[symbol]`: 선택 종목의 2016-01-01 이후 장기 봉차트, `전체/5년/1년/6개월/3개월` 기간 선택, 줌/가로 스크롤 탐색, 추천 카드, SML/PER/RSI, 개별 뉴스, 라이트/다크 모드 토글, `/api/stocks/[symbol]` 1분 간격 조회
- `/loading.tsx`, `/stocks/[symbol]/loading.tsx`: 실데이터 조회 중 loading page 표시
- `origin/feat/team5-member`의 Groq 뉴스 분석과 10일 뉴스 필터링 커밋을 반영하되, 추가 npm 패키지 없이 native `fetch` 기반 선택 호출로 통합

## 구현한 기능

- App Router 기반 Next.js 프로젝트 구조
- 반응형 미니멀 대시보드 UI
- SVG 기반 지수 장기 선 그래프, 사각형 마커, 이동평균선, 기간 선택, 줌 슬라이더, 가로 스크롤 탐색
- SVG 기반 종목 장기 봉차트, 이동평균선, 기간 선택, 줌 슬라이더, 가로 스크롤 탐색
- 지수/종목 차트와 기간 선택 영역의 가로 스크롤 기능은 유지하되 scrollbar는 숨김
- 한국 주식 차트 관례에 맞춰 상승 구간은 빨간색, 하락 구간은 파란색 계열로 표시
- 종목별 상세 라우팅
- 클릭 가능한 뉴스 링크와 `noopener noreferrer` 적용
- 규칙 기반 분석 기준 안내 문구
- API data/partial data 상태 표시
- 초기 샘플 initialData 제거와 loading/error 상태 추가
- 수동 새로고침 버튼과 1분 간격 자동 조회
- 미국 종목 카탈로그 4개 추가로 총 8개 종목 제공
- 라이트/다크 테마 토글과 localStorage 기반 테마 유지

## 실행 방법

```bash
npm install
npm run dev
```

API 키 설정:

```bash
cp .env.example .env.local
```

## 검증 결과

- `npm run lint` 통과
- `npm run build` 통과
- FRED CSV `SP500` 응답 `200` 확인
- 기존 `localhost:3000`의 `/api/market` 응답에서 `indexCode: FRED:SP500`, 지수 포인트 40개 확인
- loading/error 전환 후 기존 `localhost:3000`의 `/api/market` 응답에서 `source: partial`, `indexCode: FRED:SP500`, 실패 종목 숨김 확인
- 기존 `localhost:3000`의 `/api/stocks/AAPL` 응답에서 Alpha Vantage 실패 시 `503`과 오류 메시지 확인
- Alpha Vantage 실패 쿨다운 적용 후 기존 `localhost:3000`의 `/api/market` 연속 호출 결과 `23ms -> 5ms`로 재시도 억제 확인
- `origin/feat/team5-member` 병합 후 기존 `localhost:3000`의 `/api/market` 응답에서 `newsCount: 6`, `indexCode: FRED:SP500`, 실패 종목 숨김 확인
- Twelve Data 1차 provider 추가 후 `npm run lint`, `npm run build` 통과
- `TWELVE_DATA_API_KEY` 미설정 상태에서 기존 `localhost:3000`의 `/api/market` 응답 `source: partial`, `indexCode: FRED:SP500`, `newsCount: 6` 확인
- 종목 장기 차트, 공통 기간 옵션, 조회 문구 변경 후 `npm run lint`, `npm run build` 통과
- 라이트/다크 테마 토글 추가 후 `npm run lint`, `git diff --check`, `npm run build` 통과
- 모든 차트/기간 선택 스크롤 영역 scrollbar hide 적용 후 `npm run lint`, `git diff --check`, `npm run build` 통과

## 남은 개선 사항

- 관심 주제별 종목 필터와 섹터 그룹 표시
- 정적 카탈로그 명칭을 실제 데이터 소스 구조에 맞춰 분리
- 추천 점수 계산 기준을 분석 기준 문서와 맞춰 조정
