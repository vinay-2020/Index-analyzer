export interface HistoricalMetrics {
  // Period returns (CAGR where period >= 1Y, absolute return / annualized appropriately)
  cagr1Y?: number;   // 1-Year CAGR (%)
  cagr3Y?: number;   // 3-Year CAGR (%)
  cagr5Y?: number;   // 5-Year CAGR (%)
  cagr10Y?: number;  // 10-Year CAGR (%)
  cagr15Y?: number;  // 15-Year CAGR (%)
  cagrMax?: number;  // Max available CAGR (%)
  
  // Total cumulative returns
  totalReturnPct?: number; // Total return from inception/start of data to current
  
  // Consistency & Risk Metrics
  annualizedVolatility?: number; // Annualized standard deviation of daily returns (%)
  maxDrawdownPct?: number;       // Peak-to-trough maximum drawdown (%)
  positiveYearPct?: number;      // % of calendar years with positive returns (%)
  bestYearReturnPct?: number;    // Return of best calendar year (%)
  worstYearReturnPct?: number;   // Return of worst calendar year (%)
  
  // Historical data boundaries
  firstObservationDate?: string;
  lastObservationDate?: string;
  totalYearsCovered?: number;
  dataPointsCount?: number;
  
  // Hypothetical ₹1L (₹100,000) growth value
  growthOf100k?: number;
}

export interface HistoricalPricePoint {
  date: string;
  close: number;
}

export interface IndexHistoricalSeries {
  symbol: string;
  name: string;
  category: 'Broad' | 'Sectoral' | 'Thematic' | 'Strategy' | 'Other';
  points: HistoricalPricePoint[];
  metrics: HistoricalMetrics;
}

export interface IndexDataRow {
  id: string;
  symbol: string;
  name: string;
  category: 'Broad' | 'Sectoral' | 'Thematic' | 'Strategy' | 'Other';
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose: number;
  changePercent: number;
  volume?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  macdCross: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  aboveEma200: boolean;
  healthyPullback: boolean; // above 200 EMA & RSI between 45 and 60
  historical?: HistoricalMetrics;
  rawRecord?: Record<string, any>;
}

export interface ScreenerFilterState {
  search: string;
  category: string;
  preset: 'ALL' | 'MACD_BULLISH' | 'HEALTHY_PULLBACK' | 'ABOVE_200_EMA' | 'BELOW_200_EMA';
  minRsi: number;
  maxRsi: number;
  minChange: number;
  maxChange: number;
  macdCrossFilter: 'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface ResearchFilterState {
  search: string;
  category: string;
  selectedPeriod: '1Y' | '3Y' | '5Y' | '10Y' | '15Y' | 'MAX';
  minCagr?: number;
  minYearsTracked?: number;
  sortBy: 'cagrMax' | 'cagr15Y' | 'cagr10Y' | 'cagr5Y' | 'cagr3Y' | 'cagr1Y' | 'maxDrawdownPct' | 'annualizedVolatility' | 'positiveYearPct' | 'name';
  sortDirection: 'asc' | 'desc';
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

export interface MarketBreadthSummary {
  total: number;
  advances: number;
  declines: number;
  unchanged: number;
  aboveEma200Count: number;
  aboveEma200Pct: number;
  macdBullishCount: number;
  macdBearishCount: number;
  healthyPullbackCount: number;
  avgRsi: number;
  avgChange: number;
}

// ----------------------------------------------------
// Monthly Heatmap & Seasonality Types
// ----------------------------------------------------
export type HeatmapPeriod = 'MAX' | '15Y' | '10Y' | '5Y' | '3Y';

export interface MonthEndPricePoint {
  date: string;       // e.g. '2024-01-31'
  year: number;       // e.g. 2024
  month: number;      // 1 to 12
  close: number;      // Last valid trading day close of that month
}

export interface MonthlyReturnObservation {
  year: number;
  month: number;      // 1 to 12
  monthName: string;  // 'Jan', 'Feb', ...
  date: string;
  close: number;
  prevClose: number;  // December of previous year for January, or M-1 for others
  returnPct: number;  // ((close - prevClose) / prevClose) * 100
}

export interface MonthlyCellStats {
  month: number;      // 1 to 12
  monthName: string;  // 'Jan', 'Feb', ...
  sampleSize: number; // Number of valid historical observations
  avgReturn: number;  // Mean monthly return %
  medianReturn: number; // Median monthly return %
  winRatePct: number; // Percentage of years positive (> 0%)
  positiveCount: number;
  negativeCount: number;
  bestYear: { year: number; returnPct: number };
  worstYear: { year: number; returnPct: number };
  stdDev: number;     // Sample standard deviation / volatility of monthly return
  insufficientHistory: boolean; // Flagged if sampleSize < 3
  observations: MonthlyReturnObservation[];
}

export interface IndexPeriodSummary {
  averageReturn: number;      // Arithmetic mean of all valid monthly returns in selected period
  winRatePct: number;         // Positive Months / Total Valid Months * 100 (Monthly Return > 0)
  loseRatePct: number;        // Negative Months / Total Valid Months * 100 (Monthly Return < 0)
  positiveCount: number;
  negativeCount: number;
  zeroCount: number;
  maxReturn: number;          // Highest individual monthly return observed
  minReturn: number;          // Lowest individual monthly return observed
  stdDev: number;             // Sample standard deviation of individual monthly returns
  totalObservations: number;  // Sample size of valid monthly observations in selected period
}

export interface IndexMonthlySeasonality {
  symbol: string;
  name: string;
  category: 'Broad' | 'Sectoral' | 'Thematic' | 'Strategy' | 'Other';
  inceptionDate: string;
  totalObservations: number;
  periodSummary: IndexPeriodSummary;
  months: Record<number, MonthlyCellStats>; // Keyed 1 through 12
  bestMonth: { month: number; monthName: string; avgReturn: number };
  worstMonth: { month: number; monthName: string; avgReturn: number };
  overallWinRate: number;
  yearlyMatrix: {
    year: number;
    returns: Record<number, number | undefined>; // 1 to 12
    annualReturn?: number;
  }[];
}

export interface MarketMonthlySeasonality {
  month: number;
  monthName: string;
  avgReturn: number;
  medianReturn: number;
  winRatePct: number;
  indicesPositiveCount: number;
  totalIndices: number;
}

export interface DatasetQualitySummary {
  totalIndices: number;
  startDate: string;
  endDate: string;
  totalYears: number;
  totalMonthlyObservations: number;
  totalDailyRows: number;
  missingDeduplicatedCount: number;
  lastRefreshDate: string;
  datasetName: string;
}

// ----------------------------------------------------
// Quarterly Heatmap & Seasonality Types
// ----------------------------------------------------
export interface QuarterlyReturnObservation {
  year: number;
  quarter: number;      // 1 to 4
  quarterName: string;  // 'Q1', 'Q2', 'Q3', 'Q4'
  returnPct: number;    // Compounded quarterly return %
  months: {
    month: number;
    monthName: string;
    returnPct?: number;
  }[];
}

export interface QuarterlyCellStats {
  quarter: number;      // 1 to 4
  quarterName: string;  // 'Q1', 'Q2', 'Q3', 'Q4'
  periodLabel: string;  // 'Jan - Mar', 'Apr - Jun', 'Jul - Sep', 'Oct - Dec'
  sampleSize: number;   // Total valid historical observations
  avgReturn: number;    // Arithmetic mean return %
  medianReturn: number; // Median return %
  winRatePct: number;   // % of quarters > 0
  loseRatePct: number;  // % of quarters < 0
  positiveCount: number;
  negativeCount: number;
  zeroCount: number;
  bestYear: { year: number; returnPct: number };
  worstYear: { year: number; returnPct: number };
  stdDev: number;       // Volatility / dispersion
  insufficientHistory: boolean;
  observations: QuarterlyReturnObservation[];
}

export interface IndexQuarterlySeasonality {
  symbol: string;
  name: string;
  category: 'Broad' | 'Sectoral' | 'Thematic' | 'Strategy' | 'Other';
  inceptionDate: string;
  totalObservations: number;
  periodSummary: IndexPeriodSummary;
  quarters: Record<number, QuarterlyCellStats>; // 1 to 4
  bestQuarter: { quarter: number; quarterName: string; avgReturn: number };
  worstQuarter: { quarter: number; quarterName: string; avgReturn: number };
  overallWinRate: number;
  yearlyQuarterlyMatrix: {
    year: number;
    quarters: Record<number, number | undefined>; // 1 to 4
    months: Record<number, number | undefined>;   // 1 to 12
    annualReturn?: number;
  }[];
  monthlyProfile: IndexMonthlySeasonality;
}

export interface MarketQuarterlySeasonality {
  quarter: number;
  quarterName: string;
  periodLabel: string;
  avgReturn: number;
  medianReturn: number;
  winRatePct: number;
  indicesPositiveCount: number;
  totalIndices: number;
}

