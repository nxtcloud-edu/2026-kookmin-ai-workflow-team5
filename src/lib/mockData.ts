export type Sentiment = "positive" | "negative" | "neutral";

export type CandlePoint = {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  date: string;
  sentiment: Sentiment;
  impact: "호재" | "악재" | "중립";
  summary: string;
  url: string;
};

export type StockMetricSet = {
  sml: {
    beta: number;
    expectedReturn: number;
    marketReturn: number;
    riskFreeRate: number;
    alpha: number;
  };
  per: {
    value: number;
    sectorAverage: number;
  };
  rsi: {
    value: number;
  };
};

export type Stock = {
  symbol: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
  sector: string;
  currentPrice: number;
  priceChangePercent: number;
  riskScore: number;
  volatility: number;
  chart: CandlePoint[];
  metrics: StockMetricSet;
  highlights: {
    positive: string;
    negative: string;
  };
  news: NewsItem[];
};

type ClosePoint = {
  label: string;
  close: number;
};

function createCandles(points: ClosePoint[], spread: number): CandlePoint[] {
  return points.map((point, index) => {
    const previousClose =
      points[index - 1]?.close ?? Math.round(point.close - spread * 0.4);
    const open = previousClose;
    const high = Math.max(open, point.close) + spread;
    const low = Math.min(open, point.close) - spread;

    return {
      label: point.label,
      open,
      high,
      low,
      close: point.close
    };
  });
}

export const marketIndex = {
  code: "KOSPI",
  name: "KOSPI 종합",
  currentValue: 2784.12,
  changePercent: 0.84,
  updatedAt: "2026-06-30 09:30",
  summary:
    "반도체 수출 회복과 환율 안정 기대가 지수에 우호적으로 작용한 데모 데이터입니다.",
  chart: createCandles(
    [
      { label: "6/17", close: 2714 },
      { label: "6/18", close: 2721 },
      { label: "6/19", close: 2708 },
      { label: "6/20", close: 2738 },
      { label: "6/23", close: 2756 },
      { label: "6/24", close: 2749 },
      { label: "6/25", close: 2768 },
      { label: "6/26", close: 2772 },
      { label: "6/27", close: 2761 },
      { label: "6/30", close: 2784 }
    ],
    9
  )
};

export const systematicNews: NewsItem[] = [
  {
    id: "sys-1",
    title: "수출 회복 기대가 대형 제조주 투자심리를 개선",
    source: "Mock Market Brief",
    date: "2026-06-30",
    sentiment: "positive",
    impact: "호재",
    summary:
      "반도체와 자동차 수출 회복 기대가 시장 전체의 이익 전망을 끌어올리는 요인으로 해석됩니다.",
    url: "https://example.com/mock-news/korea-export-rebound"
  },
  {
    id: "sys-2",
    title: "원/달러 환율 변동성 확대가 외국인 수급 부담으로 작용",
    source: "Mock Macro Desk",
    date: "2026-06-30",
    sentiment: "negative",
    impact: "악재",
    summary:
      "환율 변동성이 커지면 외국인 투자자의 매수 강도가 약해질 수 있어 시장 공통 위험으로 분류됩니다.",
    url: "https://example.com/mock-news/fx-volatility"
  },
  {
    id: "sys-3",
    title: "기준금리 동결 전망으로 성장주 할인율 부담 완화",
    source: "Mock Rate Watch",
    date: "2026-06-29",
    sentiment: "positive",
    impact: "호재",
    summary:
      "금리가 급하게 오르지 않을 것이라는 기대는 성장주와 고PER 종목의 부담을 일부 낮춥니다.",
    url: "https://example.com/mock-news/rate-hold"
  }
];

export const stocks: Stock[] = [
  {
    symbol: "005930",
    name: "삼성전자",
    market: "KOSPI",
    sector: "반도체",
    currentPrice: 78400,
    priceChangePercent: 1.31,
    riskScore: 43,
    volatility: 18,
    chart: createCandles(
      [
        { label: "6/17", close: 74600 },
        { label: "6/18", close: 75200 },
        { label: "6/19", close: 74800 },
        { label: "6/20", close: 76000 },
        { label: "6/23", close: 77100 },
        { label: "6/24", close: 76600 },
        { label: "6/25", close: 77500 },
        { label: "6/26", close: 78100 },
        { label: "6/27", close: 77400 },
        { label: "6/30", close: 78400 }
      ],
      650
    ),
    metrics: {
      sml: {
        beta: 1.05,
        expectedReturn: 8.7,
        marketReturn: 7.5,
        riskFreeRate: 3.2,
        alpha: 0.4
      },
      per: {
        value: 18.6,
        sectorAverage: 21.2
      },
      rsi: {
        value: 58
      }
    },
    highlights: {
      positive: "메모리 가격 회복 기대",
      negative: "환율과 글로벌 수요 둔화 가능성"
    },
    news: [
      {
        id: "005930-1",
        title: "AI 서버 수요 확대가 메모리 업황 개선 기대를 자극",
        source: "Mock Semiconductor Note",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "고성능 메모리 수요가 늘면 이익 회복 속도가 빨라질 수 있다는 데모 분석입니다.",
        url: "https://example.com/mock-news/samsung-memory-ai"
      },
      {
        id: "005930-2",
        title: "스마트폰 교체 수요 회복은 아직 제한적",
        source: "Mock Device Tracker",
        date: "2026-06-29",
        sentiment: "negative",
        impact: "악재",
        summary:
          "모바일 부문 회복이 느리면 반도체 개선 효과가 일부 상쇄될 수 있습니다.",
        url: "https://example.com/mock-news/samsung-mobile-demand"
      }
    ]
  },
  {
    symbol: "005380",
    name: "현대차",
    market: "KOSPI",
    sector: "자동차",
    currentPrice: 248500,
    priceChangePercent: -0.42,
    riskScore: 51,
    volatility: 22,
    chart: createCandles(
      [
        { label: "6/17", close: 242000 },
        { label: "6/18", close: 244500 },
        { label: "6/19", close: 247000 },
        { label: "6/20", close: 251000 },
        { label: "6/23", close: 253000 },
        { label: "6/24", close: 250500 },
        { label: "6/25", close: 249000 },
        { label: "6/26", close: 252000 },
        { label: "6/27", close: 249500 },
        { label: "6/30", close: 248500 }
      ],
      2100
    ),
    metrics: {
      sml: {
        beta: 1.18,
        expectedReturn: 9.4,
        marketReturn: 7.5,
        riskFreeRate: 3.2,
        alpha: -0.2
      },
      per: {
        value: 6.4,
        sectorAverage: 8.1
      },
      rsi: {
        value: 49
      }
    },
    highlights: {
      positive: "낮은 PER과 수출 경쟁력",
      negative: "전기차 수요 둔화 우려"
    },
    news: [
      {
        id: "005380-1",
        title: "하이브리드 판매 호조가 이익 방어 요인으로 부각",
        source: "Mock Auto Brief",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "전기차 성장 둔화 구간에서 하이브리드 판매가 실적 안정성을 높일 수 있습니다.",
        url: "https://example.com/mock-news/hyundai-hybrid-sales"
      },
      {
        id: "005380-2",
        title: "미국 전기차 보조금 정책 변화 가능성은 부담",
        source: "Mock Policy Watch",
        date: "2026-06-28",
        sentiment: "negative",
        impact: "악재",
        summary:
          "정책 변화는 해외 판매 전략과 마진에 영향을 줄 수 있는 개별 종목 위험입니다.",
        url: "https://example.com/mock-news/hyundai-ev-policy"
      }
    ]
  },
  {
    symbol: "035420",
    name: "NAVER",
    market: "KOSPI",
    sector: "인터넷",
    currentPrice: 192300,
    priceChangePercent: 0.26,
    riskScore: 57,
    volatility: 27,
    chart: createCandles(
      [
        { label: "6/17", close: 184000 },
        { label: "6/18", close: 186500 },
        { label: "6/19", close: 185800 },
        { label: "6/20", close: 188500 },
        { label: "6/23", close: 190200 },
        { label: "6/24", close: 191000 },
        { label: "6/25", close: 189400 },
        { label: "6/26", close: 193000 },
        { label: "6/27", close: 191800 },
        { label: "6/30", close: 192300 }
      ],
      1700
    ),
    metrics: {
      sml: {
        beta: 1.32,
        expectedReturn: 10.1,
        marketReturn: 7.5,
        riskFreeRate: 3.2,
        alpha: 0.1
      },
      per: {
        value: 28.8,
        sectorAverage: 24.5
      },
      rsi: {
        value: 63
      }
    },
    highlights: {
      positive: "AI 검색과 광고 회복 기대",
      negative: "높은 밸류에이션 부담"
    },
    news: [
      {
        id: "035420-1",
        title: "AI 검색 서비스 고도화가 광고 단가 개선 기대를 형성",
        source: "Mock Platform Note",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "검색 체류시간이 늘면 광고 효율과 커머스 전환율에 긍정적일 수 있습니다.",
        url: "https://example.com/mock-news/naver-ai-search"
      },
      {
        id: "035420-2",
        title: "플랫폼 규제 논의는 성장주 할인 요인",
        source: "Mock Regulation Desk",
        date: "2026-06-29",
        sentiment: "negative",
        impact: "악재",
        summary:
          "수수료와 데이터 활용 규제가 강화되면 플랫폼 사업의 이익률이 압박받을 수 있습니다.",
        url: "https://example.com/mock-news/naver-platform-regulation"
      }
    ]
  },
  {
    symbol: "068270",
    name: "셀트리온",
    market: "KOSPI",
    sector: "바이오",
    currentPrice: 184700,
    priceChangePercent: -1.08,
    riskScore: 68,
    volatility: 34,
    chart: createCandles(
      [
        { label: "6/17", close: 191000 },
        { label: "6/18", close: 188500 },
        { label: "6/19", close: 190200 },
        { label: "6/20", close: 189000 },
        { label: "6/23", close: 186500 },
        { label: "6/24", close: 185300 },
        { label: "6/25", close: 187600 },
        { label: "6/26", close: 186800 },
        { label: "6/27", close: 185900 },
        { label: "6/30", close: 184700 }
      ],
      1900
    ),
    metrics: {
      sml: {
        beta: 1.41,
        expectedReturn: 10.8,
        marketReturn: 7.5,
        riskFreeRate: 3.2,
        alpha: -0.6
      },
      per: {
        value: 36.2,
        sectorAverage: 32.7
      },
      rsi: {
        value: 38
      }
    },
    highlights: {
      positive: "바이오시밀러 포트폴리오 확대",
      negative: "임상과 허가 일정 변동성"
    },
    news: [
      {
        id: "068270-1",
        title: "신규 바이오시밀러 판매 지역 확대 기대",
        source: "Mock Bio Brief",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "판매 지역이 늘면 매출 기반이 넓어질 수 있지만 초기 비용도 함께 확인해야 합니다.",
        url: "https://example.com/mock-news/celltrion-biosimilar"
      },
      {
        id: "068270-2",
        title: "임상 일정 지연 가능성이 투자심리 부담",
        source: "Mock Healthcare Watch",
        date: "2026-06-28",
        sentiment: "negative",
        impact: "악재",
        summary:
          "바이오 업종은 허가와 임상 일정 변화에 따라 주가 변동성이 커질 수 있습니다.",
        url: "https://example.com/mock-news/celltrion-clinical-delay"
      }
    ]
  }
];

export function getStockBySymbol(symbol: string) {
  return stocks.find((stock) => stock.symbol === symbol);
}
