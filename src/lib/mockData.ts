export type Sentiment = "positive" | "negative" | "neutral";

export type CandlePoint = {
  label: string;
  date?: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type LinePoint = {
  label: string;
  value: number;
  date?: string;
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
  volume: {
    individual: number;
    institutional: number;
    foreign: number;
  };
};

export type Stock = {
  symbol: string;
  name: string;
  market: "NASDAQ" | "NYSE";
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
      points[index - 1]?.close ?? Number((point.close - spread * 0.4).toFixed(2));
    const open = previousClose;
    const high = Number((Math.max(open, point.close) + spread).toFixed(2));
    const low = Number((Math.min(open, point.close) - spread).toFixed(2));

    return {
      label: point.label,
      open,
      high,
      low,
      close: point.close
    };
  });
}

export type FearGreedLevel = "extreme-fear" | "fear" | "neutral" | "greed" | "extreme-greed";

export const fearGreedIndex = {
  value: 62,
  level: "greed" as FearGreedLevel,
  label: "탐욕",
  updatedAt: "2026-06-30",
  description: "투자자 심리가 탐욕 구간에 진입했습니다. 과열 여부를 함께 확인하세요."
};

export const marketIndex = {
  code: "S&P 500",
  name: "S&P 500",
  currentValue: 5487.03,
  changePercent: 0.42,
  updatedAt: "2026-06-30 09:30",
  summary:
    "AI 인프라 투자와 금리 인하 기대가 대형 기술주 중심의 투자심리를 지지하는 흐름입니다.",
  chart: [
    { label: "6/17", value: 5412.8 },
    { label: "6/18", value: 5398.4 },
    { label: "6/19", value: 5421.2 },
    { label: "6/20", value: 5448.6 },
    { label: "6/23", value: 5460.1 },
    { label: "6/24", value: 5442.7 },
    { label: "6/25", value: 5471.3 },
    { label: "6/26", value: 5480.8 },
    { label: "6/27", value: 5469.5 },
    { label: "6/30", value: 5487.03 }
  ]
};

export const systematicNews: NewsItem[] = [
  {
    id: "sys-1",
    title: "미국 장기금리 안정 기대가 성장주 부담을 낮춤",
    source: "Macro Brief",
    date: "2026-06-30",
    sentiment: "positive",
    impact: "호재",
    summary:
      "금리가 급등하지 않는 환경은 미래 이익 비중이 큰 기술주 밸류에이션에 우호적입니다.",
    url: "https://example.com/mock-news/us-rates-growth"
  },
  {
    id: "sys-2",
    title: "달러 강세는 해외 매출 비중이 큰 기업의 환산 이익 부담",
    source: "FX Desk",
    date: "2026-06-30",
    sentiment: "negative",
    impact: "악재",
    summary:
      "미국 대형주는 해외 매출 비중이 높아 달러 강세가 실적 환산에 부담으로 작용할 수 있습니다.",
    url: "https://example.com/mock-news/us-dollar-risk"
  },
  {
    id: "sys-3",
    title: "AI 인프라 투자 확대로 반도체와 클라우드 수요 기대 지속",
    source: "Tech Watch",
    date: "2026-06-29",
    sentiment: "positive",
    impact: "호재",
    summary:
      "데이터센터 투자 증가는 반도체, 클라우드, 소프트웨어 기업에 공통 호재로 분류됩니다.",
    url: "https://example.com/mock-news/ai-infra-demand"
  }
];

export const stocks: Stock[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    market: "NASDAQ",
    sector: "Consumer Electronics",
    currentPrice: 214.1,
    priceChangePercent: 0.62,
    riskScore: 42,
    volatility: 19,
    chart: createCandles(
      [
        { label: "6/17", close: 207.4 },
        { label: "6/18", close: 208.6 },
        { label: "6/19", close: 207.9 },
        { label: "6/20", close: 210.1 },
        { label: "6/23", close: 211.8 },
        { label: "6/24", close: 210.7 },
        { label: "6/25", close: 212.9 },
        { label: "6/26", close: 213.4 },
        { label: "6/27", close: 212.8 },
        { label: "6/30", close: 214.1 }
      ],
      1.8
    ),
    metrics: {
      sml: {
        beta: 1.12,
        expectedReturn: 9.1,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: 0.2
      },
      per: {
        value: 29.4,
        sectorAverage: 31.2
      },
      rsi: {
        value: 57
      },
      volume: {
        individual: 22,
        institutional: 58,
        foreign: 20
      }
    },
    highlights: {
      positive: "서비스 매출과 자사주 매입",
      negative: "하드웨어 교체 수요 둔화"
    },
    news: [
      {
        id: "AAPL-1",
        title: "서비스 매출 비중 확대가 이익 안정성 기대를 높임",
        source: "US Equity Brief",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "구독과 앱스토어 매출이 늘면 하드웨어 경기 변동의 영향을 일부 줄일 수 있습니다.",
        url: "https://example.com/mock-news/apple-services"
      },
      {
        id: "AAPL-2",
        title: "스마트폰 교체 주기 장기화는 단기 성장 부담",
        source: "Device Tracker",
        date: "2026-06-29",
        sentiment: "negative",
        impact: "악재",
        summary:
          "신제품 수요가 예상보다 약하면 매출 성장률과 밸류에이션 부담을 함께 확인해야 합니다.",
        url: "https://example.com/mock-news/apple-device-demand"
      }
    ]
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    market: "NASDAQ",
    sector: "Cloud Software",
    currentPrice: 452.3,
    priceChangePercent: 0.38,
    riskScore: 39,
    volatility: 17,
    chart: createCandles(
      [
        { label: "6/17", close: 441.8 },
        { label: "6/18", close: 444.1 },
        { label: "6/19", close: 443.6 },
        { label: "6/20", close: 446.9 },
        { label: "6/23", close: 449.5 },
        { label: "6/24", close: 448.2 },
        { label: "6/25", close: 450.8 },
        { label: "6/26", close: 453.1 },
        { label: "6/27", close: 450.6 },
        { label: "6/30", close: 452.3 }
      ],
      3.6
    ),
    metrics: {
      sml: {
        beta: 0.96,
        expectedReturn: 8.1,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: 0.5
      },
      per: {
        value: 34.8,
        sectorAverage: 36.4
      },
      rsi: {
        value: 61
      },
      volume: {
        individual: 18,
        institutional: 62,
        foreign: 20
      }
    },
    highlights: {
      positive: "클라우드와 AI 소프트웨어 수요",
      negative: "높은 기대치에 따른 실적 민감도"
    },
    news: [
      {
        id: "MSFT-1",
        title: "클라우드 AI 수요가 장기 성장 기대를 지지",
        source: "Cloud Note",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "기업용 클라우드와 AI 기능 판매가 함께 늘면 반복 매출 기반이 강화됩니다.",
        url: "https://example.com/mock-news/microsoft-cloud-ai"
      },
      {
        id: "MSFT-2",
        title: "AI 인프라 투자 비용 증가는 마진 확인 요인",
        source: "Margin Watch",
        date: "2026-06-28",
        sentiment: "negative",
        impact: "악재",
        summary:
          "데이터센터 투자가 빨라질수록 매출 성장과 비용 증가의 균형을 확인해야 합니다.",
        url: "https://example.com/mock-news/microsoft-ai-capex"
      }
    ]
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    market: "NASDAQ",
    sector: "Semiconductors",
    currentPrice: 126.7,
    priceChangePercent: 1.46,
    riskScore: 61,
    volatility: 32,
    chart: createCandles(
      [
        { label: "6/17", close: 119.8 },
        { label: "6/18", close: 121.6 },
        { label: "6/19", close: 120.9 },
        { label: "6/20", close: 123.2 },
        { label: "6/23", close: 125.9 },
        { label: "6/24", close: 124.1 },
        { label: "6/25", close: 127.4 },
        { label: "6/26", close: 128.2 },
        { label: "6/27", close: 124.9 },
        { label: "6/30", close: 126.7 }
      ],
      2.4
    ),
    metrics: {
      sml: {
        beta: 1.72,
        expectedReturn: 12.4,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: 0.7
      },
      per: {
        value: 42.5,
        sectorAverage: 35.7
      },
      rsi: {
        value: 66
      },
      volume: {
        individual: 35,
        institutional: 48,
        foreign: 17
      }
    },
    highlights: {
      positive: "AI 가속기 수요와 데이터센터 성장",
      negative: "높은 변동성과 밸류에이션 부담"
    },
    news: [
      {
        id: "NVDA-1",
        title: "데이터센터 GPU 수요가 실적 기대를 견인",
        source: "Semiconductor Note",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "AI 학습과 추론 수요가 늘면 고성능 GPU 매출 기대가 높아질 수 있습니다.",
        url: "https://example.com/mock-news/nvidia-datacenter"
      },
      {
        id: "NVDA-2",
        title: "공급망과 고객 집중도는 변동성 요인",
        source: "Supply Watch",
        date: "2026-06-29",
        sentiment: "negative",
        impact: "악재",
        summary:
          "대형 고객의 주문 변화나 공급 차질은 고성장 종목의 주가 변동성을 키울 수 있습니다.",
        url: "https://example.com/mock-news/nvidia-supply-risk"
      }
    ]
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    market: "NASDAQ",
    sector: "Electric Vehicles",
    currentPrice: 189.4,
    priceChangePercent: -0.84,
    riskScore: 70,
    volatility: 38,
    chart: createCandles(
      [
        { label: "6/17", close: 198.2 },
        { label: "6/18", close: 195.4 },
        { label: "6/19", close: 193.8 },
        { label: "6/20", close: 196.1 },
        { label: "6/23", close: 192.5 },
        { label: "6/24", close: 190.7 },
        { label: "6/25", close: 193.2 },
        { label: "6/26", close: 191.8 },
        { label: "6/27", close: 190.1 },
        { label: "6/30", close: 189.4 }
      ],
      4.1
    ),
    metrics: {
      sml: {
        beta: 2.05,
        expectedReturn: 14.1,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: -0.5
      },
      per: {
        value: 58.3,
        sectorAverage: 24.6
      },
      rsi: {
        value: 41
      },
      volume: {
        individual: 45,
        institutional: 38,
        foreign: 17
      }
    },
    highlights: {
      positive: "자율주행과 에너지 사업 기대",
      negative: "전기차 가격 경쟁과 높은 변동성"
    },
    news: [
      {
        id: "TSLA-1",
        title: "자율주행 소프트웨어 기대가 장기 성장 서사를 지지",
        source: "Auto Tech Brief",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "소프트웨어 매출이 확대되면 자동차 제조 마진 의존도를 낮출 수 있습니다.",
        url: "https://example.com/mock-news/tesla-autonomy"
      },
      {
        id: "TSLA-2",
        title: "전기차 가격 경쟁은 단기 마진 부담",
        source: "EV Watch",
        date: "2026-06-28",
        sentiment: "negative",
        impact: "악재",
        summary:
          "판매량 방어를 위한 가격 인하는 매출 성장에도 이익률을 압박할 수 있습니다.",
        url: "https://example.com/mock-news/tesla-price-competition"
      }
    ]
  },
  {
    symbol: "GOOGL",
    name: "Alphabet",
    market: "NASDAQ",
    sector: "Digital Advertising",
    currentPrice: 176.2,
    priceChangePercent: 0.74,
    riskScore: 48,
    volatility: 21,
    chart: createCandles(
      [
        { label: "6/17", close: 169.8 },
        { label: "6/18", close: 171.2 },
        { label: "6/19", close: 170.4 },
        { label: "6/20", close: 172.8 },
        { label: "6/23", close: 174.1 },
        { label: "6/24", close: 173.5 },
        { label: "6/25", close: 175.3 },
        { label: "6/26", close: 176.8 },
        { label: "6/27", close: 174.9 },
        { label: "6/30", close: 176.2 }
      ],
      2.1
    ),
    metrics: {
      sml: {
        beta: 1.06,
        expectedReturn: 8.7,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: 0.4
      },
      per: {
        value: 24.6,
        sectorAverage: 27.8
      },
      rsi: {
        value: 59
      }
    },
    highlights: {
      positive: "검색 광고와 클라우드 AI 수요",
      negative: "광고 경기와 규제 리스크"
    },
    news: [
      {
        id: "GOOGL-1",
        title: "AI 검색 기능 확대가 광고와 클라우드 기대를 지지",
        source: "Platform Brief",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "검색과 클라우드에 AI 기능이 붙으면 광고 효율과 기업용 수요가 함께 개선될 수 있습니다.",
        url: "https://example.com/mock-news/alphabet-ai-search"
      },
      {
        id: "GOOGL-2",
        title: "플랫폼 규제와 광고 경기 둔화는 확인 요인",
        source: "Regulation Watch",
        date: "2026-06-28",
        sentiment: "negative",
        impact: "악재",
        summary:
          "검색과 광고 시장 규제가 강화되면 수익성 기대와 밸류에이션에 부담이 생길 수 있습니다.",
        url: "https://example.com/mock-news/alphabet-regulation"
      }
    ]
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    market: "NASDAQ",
    sector: "E-Commerce & Cloud",
    currentPrice: 187.5,
    priceChangePercent: 0.91,
    riskScore: 50,
    volatility: 24,
    chart: createCandles(
      [
        { label: "6/17", close: 180.6 },
        { label: "6/18", close: 182.4 },
        { label: "6/19", close: 181.7 },
        { label: "6/20", close: 184.2 },
        { label: "6/23", close: 185.1 },
        { label: "6/24", close: 184.6 },
        { label: "6/25", close: 186.4 },
        { label: "6/26", close: 188.1 },
        { label: "6/27", close: 186.7 },
        { label: "6/30", close: 187.5 }
      ],
      2.8
    ),
    metrics: {
      sml: {
        beta: 1.22,
        expectedReturn: 9.8,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: 0.3
      },
      per: {
        value: 39.2,
        sectorAverage: 41.5
      },
      rsi: {
        value: 62
      }
    },
    highlights: {
      positive: "AWS 성장과 리테일 마진 개선",
      negative: "물류비와 소비 둔화 부담"
    },
    news: [
      {
        id: "AMZN-1",
        title: "AWS 수요와 리테일 효율화가 이익 개선 기대를 높임",
        source: "Retail Cloud Note",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "클라우드 성장과 물류 효율화가 동시에 나타나면 매출과 영업이익률을 함께 확인할 수 있습니다.",
        url: "https://example.com/mock-news/amazon-aws-margin"
      },
      {
        id: "AMZN-2",
        title: "배송비와 소비 둔화는 단기 이익률 부담",
        source: "Consumer Watch",
        date: "2026-06-29",
        sentiment: "negative",
        impact: "악재",
        summary:
          "소비 지출이 둔화되거나 배송 비용이 늘면 리테일 부문의 이익 개선 속도가 느려질 수 있습니다.",
        url: "https://example.com/mock-news/amazon-consumer-cost"
      }
    ]
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    market: "NASDAQ",
    sector: "Social Platforms",
    currentPrice: 514.8,
    priceChangePercent: -0.22,
    riskScore: 54,
    volatility: 27,
    chart: createCandles(
      [
        { label: "6/17", close: 506.2 },
        { label: "6/18", close: 510.4 },
        { label: "6/19", close: 508.8 },
        { label: "6/20", close: 516.1 },
        { label: "6/23", close: 518.7 },
        { label: "6/24", close: 515.5 },
        { label: "6/25", close: 519.2 },
        { label: "6/26", close: 521.0 },
        { label: "6/27", close: 516.4 },
        { label: "6/30", close: 514.8 }
      ],
      5.2
    ),
    metrics: {
      sml: {
        beta: 1.18,
        expectedReturn: 9.5,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: 0.1
      },
      per: {
        value: 26.8,
        sectorAverage: 29.4
      },
      rsi: {
        value: 55
      }
    },
    highlights: {
      positive: "AI 광고 효율과 이용자 참여",
      negative: "규제와 대규모 투자 비용"
    },
    news: [
      {
        id: "META-1",
        title: "AI 광고 추천 개선이 매출 효율을 높일 가능성",
        source: "Ad Tech Brief",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "광고 타기팅과 추천 품질이 개선되면 같은 이용자 기반에서도 광고 매출 효율이 높아질 수 있습니다.",
        url: "https://example.com/mock-news/meta-ai-ads"
      },
      {
        id: "META-2",
        title: "규제 조사와 인프라 투자는 비용 부담 요인",
        source: "Platform Risk",
        date: "2026-06-28",
        sentiment: "negative",
        impact: "악재",
        summary:
          "개인정보 규제와 AI 인프라 투자가 동시에 커지면 단기 비용 부담을 확인해야 합니다.",
        url: "https://example.com/mock-news/meta-regulation-capex"
      }
    ]
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    market: "NYSE",
    sector: "Banking",
    currentPrice: 202.6,
    priceChangePercent: -0.31,
    riskScore: 44,
    volatility: 18,
    chart: createCandles(
      [
        { label: "6/17", close: 206.1 },
        { label: "6/18", close: 205.4 },
        { label: "6/19", close: 204.2 },
        { label: "6/20", close: 203.8 },
        { label: "6/23", close: 204.7 },
        { label: "6/24", close: 203.1 },
        { label: "6/25", close: 202.4 },
        { label: "6/26", close: 203.5 },
        { label: "6/27", close: 202.9 },
        { label: "6/30", close: 202.6 }
      ],
      2.2
    ),
    metrics: {
      sml: {
        beta: 1.08,
        expectedReturn: 8.8,
        marketReturn: 7.8,
        riskFreeRate: 4.3,
        alpha: -0.1
      },
      per: {
        value: 12.4,
        sectorAverage: 13.6
      },
      rsi: {
        value: 48
      }
    },
    highlights: {
      positive: "순이자이익과 신용 건전성",
      negative: "상업용 부동산과 규제 부담"
    },
    news: [
      {
        id: "JPM-1",
        title: "견조한 예대마진과 신용 품질이 방어력을 높임",
        source: "Bank Brief",
        date: "2026-06-30",
        sentiment: "positive",
        impact: "호재",
        summary:
          "대형 은행은 예금 기반과 신용 관리가 안정적이면 경기 둔화 국면에서도 상대적으로 버틸 수 있습니다.",
        url: "https://example.com/mock-news/jpm-net-interest"
      },
      {
        id: "JPM-2",
        title: "상업용 부동산 익스포저와 규제 비용은 부담",
        source: "Credit Watch",
        date: "2026-06-29",
        sentiment: "negative",
        impact: "악재",
        summary:
          "부동산 대출 건전성이나 자본 규제가 강화되면 은행 이익과 배당 여력을 확인해야 합니다.",
        url: "https://example.com/mock-news/jpm-credit-risk"
      }
    ]
  }
];

export function getStockBySymbol(symbol: string) {
  return stocks.find((stock) => stock.symbol === symbol.toUpperCase());
}
