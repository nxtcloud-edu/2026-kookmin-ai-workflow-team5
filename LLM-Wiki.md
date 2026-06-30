# LLM-Wiki

## 프로젝트 목표

`aws-charting`은 한국 주식 초보자가 체계적 위험과 비체계적 위험을 구분해서 볼 수 있도록 만든 발표용 로컬 Next.js 대시보드입니다.

## 주요 요구사항

- 로컬 발표용으로 실행
- 외부 유료 API, API Key, 서버 비용 없음
- 한국 주식과 한국 지수 중심
- 메인 페이지에서 지수 차트, 체계적 위험 뉴스, 종목별 요약 제공
- 종목 상세 페이지를 `/stocks/[symbol]` 별도 라우트로 제공
- 상세 페이지에서 종목 차트, SML, PER, RSI, 개별 뉴스 제공
- LLM-like 추천 UI는 실제 LLM 호출 없이 규칙 기반으로 구현

## Mock Data 구성

- `src/lib/mockData.ts`
- KOSPI 지수 mock OHLC 봉차트 데이터
- 체계적 위험 뉴스 3건
- 삼성전자, 현대차, NAVER, 셀트리온 종목 데이터
- 각 종목별 가격 OHLC 봉차트 데이터, PER, RSI, SML 지표, 개별 호재/악재 뉴스

## 추천 로직 가정

- `src/lib/recommendation.ts`
- 뉴스 감성, PER의 업종 평균 대비 위치, RSI, SML 알파, 위험 점수, 변동성을 점수화
- 점수에 따라 `관심`, `관망`, `주의` 상태를 표시
- 자연어 요약처럼 보이지만 실제 LLM API를 호출하지 않는 데모 분석

## 화면 구조

- `/`: 지수 봉차트와 3일 이동평균선, 시장 공통 뉴스, 종목 카드 목록
- `/stocks/[symbol]`: 선택 종목 봉차트와 3일 이동평균선, 추천 카드, SML/PER/RSI, 개별 뉴스

## 구현한 기능

- App Router 기반 Next.js 프로젝트 구조
- 반응형 미니멀 대시보드 UI
- SVG 기반 로컬 봉차트 컴포넌트와 3일 이동평균선
- 종목별 상세 라우팅
- 클릭 가능한 뉴스 링크와 `noopener noreferrer` 적용
- 교육용 데모 안내 문구

## 실행 방법

```bash
npm install
npm run dev
```

## 검증 결과

- 초기 구현 후 `npm run lint`와 `npm run build`를 실행해 확인합니다.

## 남은 개선 사항

- 발표 주제에 맞춘 종목 추가
- mock news 링크를 실제 발표 자료 링크로 교체
- 추천 점수 계산 기준을 발표용 설명 슬라이드와 맞춰 조정
