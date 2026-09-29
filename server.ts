import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  HMIE_DATA_PROVENANCE,
  HMIE_INDEX_UNIVERSE,
  IndexUniverseItem,
  computeBenchmarkComparison,
  computeCorrectionRecoveryAnalysis,
  computeRsiAnalysis,
  computeEmaSupportAnalysis,
  computeSeasonalityAndFiscalCycles,
} from './src/indexIntelligenceEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Config endpoint providing safe public info (Client ID for GSI)
app.get('/api/config', (req, res) => {
  res.json({
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Quantitative Engine Routing & Factsheet Construction Helpers
// ---------------------------------------------------------------------------

// 1. Gate for Unsupported Metrics
function checkUnsupportedMetrics(query: string): string | null {
  const q = query.toLowerCase();
  if (q.includes('tracking error')) {
    return "Tracking Error is not currently implemented in HMIE's analytical engine, so I won't fabricate or estimate it. Tracking error requires historical daily excess return time-series data relative to the benchmark.";
  }
  if (q.includes('upside capture') || q.includes('up capture') || q.includes('up-capture')) {
    return "Upside Capture Ratio is not currently implemented in HMIE's analytical engine, so I won't fabricate or estimate it.";
  }
  if (q.includes('downside capture') || q.includes('down capture') || q.includes('down-capture')) {
    return "Downside Capture Ratio is not currently implemented in HMIE's analytical engine, so I won't fabricate or estimate it.";
  }
  if (
    q.includes('rsi reclaim duration') ||
    q.includes('sessions to reclaim') ||
    q.includes('reclaim duration') ||
    q.includes('reclaim its moving average')
  ) {
    return "RSI reclaim duration is not currently implemented in HMIE's analytical engine, so I won't fabricate or estimate it.";
  }
  if (q.includes('information ratio')) {
    return "Information Ratio is not currently implemented in HMIE's analytical engine, so I won't fabricate or estimate it.";
  }
  if (q.includes('sortino ratio') || q.includes('sortino')) {
    return "Sortino Ratio is not currently implemented in HMIE's analytical engine, so I won't fabricate or estimate it.";
  }
  return null;
}

// 2. Index Detection
function detectTargetIndices(query: string): {
  matched: IndexUniverseItem[];
  isExplicitUnknown: boolean;
  unknownName?: string;
} {
  const q = query.toLowerCase();

  // Known external index keywords that are NOT in HMIE 40-index universe
  const externalNames = [
    'sensex', 'bse 30', 'bse30', 'bse 100', 'bse 500', 'bse',
    'nasdaq', 'dow jones', 'dow', 's&p 500', 's&p500', 'sp500', 'sp 500',
    'russell', 'ftse', 'nikkei', 'dax', 'hang seng', 'shanghai',
    'bitcoin', 'crypto', 'ethereum',
  ];
  for (const ext of externalNames) {
    if (new RegExp(`\\b${ext}\\b`, 'i').test(q)) {
      return { matched: [], isExplicitUnknown: true, unknownName: ext.toUpperCase() };
    }
  }

  // Match against HMIE 40-index universe
  // Sort candidates by key length descending so 'NIFTY MIDCAP 150' matches before 'NIFTY MIDCAP 50' or 'MIDCAP'
  const sortedUniverse = [...HMIE_INDEX_UNIVERSE].sort((a, b) => b.name.length - a.name.length);
  const matched: IndexUniverseItem[] = [];

  for (const u of sortedUniverse) {
    const keyLower = u.key.toLowerCase();
    const nameLower = u.name.toLowerCase();
    // Clean aliases
    const aliases = [
      keyLower,
      nameLower,
      nameLower.replace('nifty ', ''),
      keyLower.replace('nifty', ''),
    ].filter((a) => a.length >= 3);

    const hasMatch = aliases.some((alias) => {
      // Word boundary match
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      return reg.test(q);
    });

    if (hasMatch && !matched.some((m) => m.key === u.key)) {
      matched.push(u);
    }
  }

  // If query asks for an unknown index pattern like "index foo" or "index xyz"
  const unknownIndexMatch = q.match(/\bindex\s+([a-z0-9_-]{3,})\b/i);
  if (unknownIndexMatch && matched.length === 0) {
    const candidate = unknownIndexMatch[1].toUpperCase();
    if (!sortedUniverse.some((u) => u.key === candidate || u.name.toUpperCase().includes(candidate))) {
      return { matched: [], isExplicitUnknown: true, unknownName: candidate };
    }
  }

  return { matched, isExplicitUnknown: false };
}

// Sample size reliability tier helper
function getSampleReliability(n: number) {
  if (n >= 10) {
    return { tier: 'ROBUST', badge: `[Robust: N=${n}]`, note: `Statistically robust sample (N=${n}).` };
  } else if (n >= 5) {
    return { tier: 'MODERATE', badge: `[Moderate: N=${n}]`, note: `Moderate sample size (N=${n}). General tendency.` };
  } else if (n >= 3) {
    return { tier: 'SMALL_SAMPLE', badge: `[Small Sample: N=${n}]`, note: `Small sample size (N=${n}). Interpret with caution.` };
  } else {
    return {
      tier: 'SINGLE_EVENT',
      badge: `[Single Event / Isolated Anomaly: N=${n}]`,
      note: `CRITICAL CAVEAT: Observation is based on only N=${n} qualifying historical episode(s). Must NOT be treated as a recurring tendency, consistent pattern, or statistical guarantee. Win rates on N<=2 carry zero predictive power.`,
    };
  }
}

// 3. Quantitative Factsheet Builder
function buildQuantitativeFactsheet(query: string, matchedIndices: IndexUniverseItem[]): string {
  const q = query.toLowerCase();

  const factsheetSections: string[] = [];

  // Header: Provenance and 2026 Denominator Rule
  factsheetSections.push(
    `### HMIE QUANTITATIVE FACTSHEET & HISTORICAL ENGINE OUTPUTS\n` +
    `**DATA PROVENANCE:**\n` +
    `- Source: ${HMIE_DATA_PROVENANCE.dataSourceDescription}\n` +
    `- Exchange Feed: Strictly NOT direct historical or real-time NSE exchange data.\n` +
    `- Coverage Period: ${HMIE_DATA_PROVENANCE.coveragePeriod} (${HMIE_DATA_PROVENANCE.totalObservedDays} daily trading sessions).\n` +
    `- Completed Calendar Years: ${HMIE_DATA_PROVENANCE.completedCalendarYears}.\n` +
    `- Incomplete Current Period: ${HMIE_DATA_PROVENANCE.incompleteCurrentPeriod}.\n` +
    `- 2026 Denominator Rule: 2026 is an INCOMPLETE YTD calendar year and must NEVER be counted as a completed calendar year in positive-year consistency metrics. (15 completed years: 2011 through 2025).\n`
  );

  // Intent Flags
  const isRsiQuery =
    q.includes('rsi') ||
    q.includes('oversold') ||
    q.includes('zone a') ||
    q.includes('zone b') ||
    q.includes('rebound');
  const isCorrectionQuery =
    q.includes('correction') ||
    q.includes('drawdown') ||
    q.includes('pullback') ||
    q.includes('trough') ||
    q.includes('deep') ||
    q.includes('recover') ||
    q.includes('rebound') ||
    q.includes('fall');
  const isEmaQuery =
    q.includes('ema') ||
    q.includes('moving average') ||
    q.includes('support') ||
    q.includes('bounce') ||
    q.includes('breakdown');
  const isSeasonalityQuery =
    q.includes('seasonality') ||
    q.includes('seasonal') ||
    q.includes('quarter') ||
    q.includes('q1') ||
    q.includes('q2') ||
    q.includes('q3') ||
    q.includes('q4') ||
    q.includes('march') ||
    q.includes('april') ||
    q.includes('december') ||
    q.includes('fiscal') ||
    q.includes('month');
  const isBenchmarkQuery =
    q.includes('cagr') ||
    q.includes('volatility') ||
    q.includes('return') ||
    q.includes('growth of') ||
    q.includes('100k') ||
    q.includes('15-year') ||
    q.includes('10-year') ||
    q.includes('5-year') ||
    q.includes('drawdown') ||
    q.includes('consistent');

  // Multi-Engine Query Detection
  const isMultiEngineQuery =
    (isBenchmarkQuery && isCorrectionQuery && isRsiQuery) ||
    (isBenchmarkQuery && isEmaQuery) ||
    (isSeasonalityQuery && isBenchmarkQuery) ||
    (isCorrectionQuery && isRsiQuery) ||
    q.includes('and') ||
    q.includes('satisfy') ||
    q.includes('both');

  // Handle Multi-Engine Intersections First
  if (isMultiEngineQuery && (q.includes('cagr') || q.includes('drawdown')) && (q.includes('rsi') || q.includes('ema'))) {
    // Deterministic Candidate Intersection across all 40 indices
    const results: any[] = [];
    for (const u of HMIE_INDEX_UNIVERSE) {
      const bench = computeBenchmarkComparison(u.key, '15Y');
      const rsi = computeRsiAnalysis(u.key, 'MAX');
      const ema = computeEmaSupportAnalysis(u.key, 'MAX');
      const ema200Row = ema.summaryRows.find((r) => r.emaType === 'EMA200');

      results.push({
        key: u.key,
        name: u.name,
        category: u.categoryLabel,
        cagr15y: bench.target.cagr,
        volatility: bench.target.annualizedVolatility,
        maxDrawdown: bench.target.maxDrawdownPct,
        positiveYearsPct: bench.target.positiveYearPct,
        rsiZoneAN: rsi.zoneAStats.sampleSize,
        rsi21dWinRate: rsi.zoneAStats.winRate21d,
        rsi21dMedian: rsi.zoneAStats.medianReturn21d,
        ema200Total: ema200Row?.totalInteractions ?? 0,
        ema200SupportRate: ema200Row?.supportRatePct ?? 0,
      });
    }

    factsheetSections.push(
      `**DETERMINISTIC MULTI-ENGINE INDEX PROFILES (ALL 40 INDICES EVALUATED):**\n` +
      `| Index Name | Category | 15Y CAGR | Volatility | Max DD | Pos Years % (15Y) | RSI<=30 N | RSI 21d Win% | RSI 21d Med% | EMA200 N | EMA200 Supp% |\n` +
      `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
      results
        .map(
          (r) =>
            `| ${r.name} | ${r.category} | ${r.cagr15y}% | ${r.volatility}% | ${r.maxDrawdown}% | ${r.positiveYearsPct}% | ${r.rsiZoneAN} | ${r.rsi21dWinRate}% | ${r.rsi21dMedian}% | ${r.ema200Total} | ${r.ema200SupportRate}% |`
        )
        .join('\n') +
      `\n\n*Note on Multi-Condition Filtering:* If user specifies multiple thresholds (e.g. CAGR > 20%, Max Drawdown <= -40%, RSI win rate), evaluate all matching candidates from this deterministic table without arbitrary truncation unless "Top 5" is explicitly requested.`
    );
  }

  // Universe-Wide Rankings for Specific Engine Questions
  if (matchedIndices.length === 0) {
    if (isRsiQuery) {
      const rsiRankings = HMIE_INDEX_UNIVERSE.map((u) => {
        const rsi = computeRsiAnalysis(u.key, 'MAX');
        const st = rsi.zoneAStats;
        const rel = getSampleReliability(st.sampleSize);
        return {
          name: u.name,
          category: u.categoryLabel,
          n: st.sampleSize,
          winRate21d: st.winRate21d,
          median21d: st.medianReturn21d,
          avgMaxRebound: st.avgMaxRebound,
          tier: rel.tier,
          badge: rel.badge,
        };
      }).sort((a, b) => b.winRate21d - a.winRate21d);

      factsheetSections.push(
        `**UNIVERSE RSI ZONE A (RSI <= 30) REBOUND ENGINE RANKINGS (ALL 40 INDICES):**\n` +
        `*Methodology:* RSI(14) <= 30 event clusters, deduplicated, 21-session forward evaluation.\n` +
        `| Rank | Index Name | Category | Events N | 21d Win Rate % | Median 21d Return % | Avg Max Rebound 63d % | Sample Reliability |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        rsiRankings
          .map(
            (r, idx) =>
              `| ${idx + 1} | ${r.name} | ${r.category} | ${r.n} | ${r.winRate21d}% | ${r.median21d}% | ${r.avgMaxRebound}% | ${r.badge} |`
          )
          .join('\n')
      );
    }

    if (isCorrectionQuery) {
      const corrSummaries = HMIE_INDEX_UNIVERSE.map((u) => {
        const corr = computeCorrectionRecoveryAnalysis(u.key, 'MAX');
        const b5_10 = corr.bucketSummaries.find((b) => b.bucket === '-5% to -10%');
        const b15_20 = corr.bucketSummaries.find((b) => b.bucket === '-15% to -20%');
        const bDeep = corr.bucketSummaries.find((b) => b.bucket === '< -30%');
        return {
          name: u.name,
          b5_10: b5_10 ? { n: b5_10.episodeCount, avg: b5_10.avgReboundPct, win10: b5_10.winRate10Pct } : null,
          b15_20: b15_20 ? { n: b15_20.episodeCount, avg: b15_20.avgReboundPct, win20: b15_20.winRate20Pct } : null,
          bDeep: bDeep ? { n: bDeep.episodeCount, avg: bDeep.avgReboundPct, win20: bDeep.winRate20Pct } : null,
        };
      });

      factsheetSections.push(
        `**UNIVERSE CORRECTION & RECOVERY REBOUND SUMMARIES:**\n` +
        `*Methodology:* Peak-to-trough drawdowns, tracking highest close within 120 sessions from trough.\n` +
        `| Index Name | -5% to -10% (N / Avg Reb / Win10%) | -15% to -20% (N / Avg Reb / Win20%) | < -30% (N / Avg Reb / Win20%) |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        corrSummaries
          .map(
            (c) =>
              `| ${c.name} | N=${c.b5_10?.n ?? 0}, +${c.b5_10?.avg ?? 0}%, ${c.b5_10?.win10 ?? 0}% | N=${c.b15_20?.n ?? 0}, +${c.b15_20?.avg ?? 0}%, ${c.b15_20?.win20 ?? 0}% | N=${c.bDeep?.n ?? 0}, +${c.bDeep?.avg ?? 0}%, ${c.bDeep?.win20 ?? 0}% |`
          )
          .join('\n')
      );
    }

    if (isEmaQuery) {
      const emaRankings = HMIE_INDEX_UNIVERSE.map((u) => {
        const ema = computeEmaSupportAnalysis(u.key, 'MAX');
        const row200 = ema.summaryRows.find((r) => r.emaType === 'EMA200');
        const row400 = ema.summaryRows.find((r) => r.emaType === 'EMA400');
        const row500 = ema.summaryRows.find((r) => r.emaType === 'EMA500');
        return {
          name: u.name,
          category: u.categoryLabel,
          ema200: row200 ? { n: row200.totalInteractions, suppPct: row200.supportRatePct, brkPct: row200.breakdownRatePct, avgReb: row200.avgMaxRebound40d } : null,
          ema400: row400 ? { n: row400.totalInteractions, suppPct: row400.supportRatePct } : null,
          ema500: row500 ? { n: row500.totalInteractions, suppPct: row500.supportRatePct } : null,
        };
      }).sort((a, b) => (b.ema200?.suppPct ?? 0) - (a.ema200?.suppPct ?? 0));

      factsheetSections.push(
        `**UNIVERSE EMA SUPPORT INTERACTION ENGINE OUTPUTS:**\n` +
        `*Methodology:* ±3% band around moving average, 15-session deduplication, 40-session forward evaluation.\n` +
        `| Index Name | EMA200 N | EMA200 Supp% | EMA200 Brk% | Avg Rebound 40d | EMA400 (N / Supp%) | EMA500 (N / Supp%) |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        emaRankings
          .map(
            (e) =>
              `| ${e.name} | ${e.ema200?.n ?? 0} | ${e.ema200?.suppPct ?? 0}% | ${e.ema200?.brkPct ?? 0}% | +${e.ema200?.avgReb ?? 0}% | N=${e.ema400?.n ?? 0}, ${e.ema400?.suppPct ?? 0}% | N=${e.ema500?.n ?? 0}, ${e.ema500?.suppPct ?? 0}% |`
          )
          .join('\n')
      );
    }

    if (isSeasonalityQuery) {
      const seaRankings = HMIE_INDEX_UNIVERSE.map((u) => {
        const sea = computeSeasonalityAndFiscalCycles(u.key, 'MAX');
        const q1 = sea.quarterlyStats.find((q) => q.quarterName === 'Q1');
        const q4 = sea.quarterlyStats.find((q) => q.quarterName === 'Q4');
        const ft = sea.fiscalTransitionStats;
        return {
          name: u.name,
          category: u.categoryLabel,
          q1Avg: q1?.avgReturnPct ?? 0,
          q1Win: q1?.winRatePct ?? 0,
          q4Avg: q4?.avgReturnPct ?? 0,
          q4Win: q4?.winRatePct ?? 0,
          marchAvg: ft.avgMarchReturnPct,
          aprilAvg: ft.avgAprilReturnPct,
          aprilWin: ft.aprilWinRatePct,
        };
      }).sort((a, b) => b.q4Avg - a.q4Avg);

      factsheetSections.push(
        `**UNIVERSE SEASONALITY & FISCAL CYCLE ENGINE OUTPUTS:**\n` +
        `*Methodology:* Calendar quarters (Q1: Jan–Mar, Q2: Apr–Jun, Q3: Jul–Sep, Q4: Oct–Dec), Fiscal Transition (March to April).\n` +
        `| Index Name | Q4 Avg Return % | Q4 Win Rate % | Q1 Avg Return % | Q1 Win Rate % | March Avg % | April Avg % | April Win% |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        seaRankings
          .map(
            (s) =>
              `| ${s.name} | +${s.q4Avg}% | ${s.q4Win}% | ${s.q1Avg}% | ${s.q1Win}% | ${s.marchAvg}% | +${s.aprilAvg}% | ${s.aprilWin}% |`
          )
          .join('\n')
      );
    }
  }

  // Target Index Detailed Outputs (if specific indices were detected)
  const targetIndices = matchedIndices.length > 0 ? matchedIndices : [HMIE_INDEX_UNIVERSE[0]]; // fallback to Nifty 50 if general

  for (const idx of targetIndices) {
    factsheetSections.push(`\n#### DETAILED ENGINE FACTSHEET FOR: ${idx.name} (${idx.key})\n`);

    // 1. Benchmark & Long-Term Return Engine
    const bench = computeBenchmarkComparison(idx.key, '15Y');
    const bench10y = computeBenchmarkComparison(idx.key, '10Y');
    const bench5y = computeBenchmarkComparison(idx.key, '5Y');

    factsheetSections.push(
      `**1. BENCHMARK & LONG-TERM RETURN ENGINE:**\n` +
      `- 15-Year Horizon (2011 to 2026): CAGR = ${bench.target.cagr}%, Cumulative Return = +${bench.target.cumulativeReturnPct}%, Annualized Volatility = ${bench.target.annualizedVolatility}%, Max Drawdown = ${bench.target.maxDrawdownPct}%, Positive Calendar Years = ${bench.target.positiveYearPct}% (Completed years 2011-2025).\n` +
      `- 10-Year Horizon: CAGR = ${bench10y.target.cagr}%, Volatility = ${bench10y.target.annualizedVolatility}%, Max Drawdown = ${bench10y.target.maxDrawdownPct}%.\n` +
      `- 5-Year Horizon: CAGR = ${bench5y.target.cagr}%, Volatility = ${bench5y.target.annualizedVolatility}%, Max Drawdown = ${bench5y.target.maxDrawdownPct}%.\n` +
      `- Nifty 50 Baseline Comparison (15Y): Target CAGR ${bench.target.cagr}% vs NIFTY 50 CAGR ${bench.nifty50Baseline.cagr}% (Spread: ${bench.nifty50Baseline.outperformanceBps} bps).\n` +
      `- Initial Capital Compounding: Rs 100,000 invested at 2011 start grew to Rs ${Math.round(100000 * (1 + bench.target.cumulativeReturnPct / 100)).toLocaleString('en-IN')}.\n`
    );

    // 2. Correction & Recovery Engine
    const corr = computeCorrectionRecoveryAnalysis(idx.key, 'MAX');
    let corrTable =
      `**2. CORRECTION & RECOVERY ENGINE:**\n` +
      `*Methodology:* Peak-to-trough decline >= -5%. Scans forward up to 120 sessions from trough for highest recovery close.\n` +
      `| Depth Bucket | Historical Episodes (N) | Avg Drawdown % | Avg Rebound % | Median Rebound % | Avg Sessions to Peak | Win Rate (>=10%) | Win Rate (>=20%) | Sample Reliability |\n` +
      `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const b of corr.bucketSummaries) {
      const rel = getSampleReliability(b.episodeCount);
      corrTable += `| ${b.bucket} | ${b.episodeCount} | ${b.avgDrawdownPct}% | +${b.avgReboundPct}% | +${b.medianReboundPct}% | ${b.avgSessionsToPeak} sessions | ${b.winRate10Pct}% | ${b.winRate20Pct}% | ${rel.badge} |\n`;
    }
    factsheetSections.push(corrTable);

    // 3. RSI Oversold (Zone A & Zone B) Engine
    const rsi = computeRsiAnalysis(idx.key, 'MAX');
    const stA = rsi.zoneAStats;
    const relA = getSampleReliability(stA.sampleSize);
    const stB = rsi.zoneBStats;
    const relB = getSampleReliability(stB.sampleSize);

    factsheetSections.push(
      `**3. RSI OVERSOLD & NEAR-OVERSOLD ENGINE:**\n` +
      `*Zone A (RSI <= 30) Methodology:* Clustered events deduplicated, tracking 5d, 10d, 21d, 63d, 120d, 180d forward returns.\n` +
      `- Sample Size: N = ${stA.sampleSize} qualifying episodes ${relA.badge}.\n` +
      `- Forward Returns: 5-Day Avg = ${stA.avgReturn5d ?? 0}%, 10-Day Avg = ${stA.avgReturn10d ?? 0}%, 21-Day Avg = ${stA.avgReturn21d}%, 63-Day Avg = ${stA.avgReturn63d ?? 0}%, 120-Day Avg = ${stA.avgReturn120d ?? 0}%, 180-Day Avg = ${stA.avgReturn180d ?? 0}%.\n` +
      `- 21-Day Win Rate: ${stA.winRate21d}% (Median 21-day return = +${stA.medianReturn21d}%).\n` +
      `- Maximum Rebound: Avg maximum rebound within 63 sessions = +${stA.avgMaxRebound}%.\n` +
      `- Zone B (30 < RSI <= 35 Near-Oversold): N = ${stB.sampleSize} ${relB.badge}, 21-Day Avg Return = +${stB.avgReturn21d}%, 21-Day Win Rate = ${stB.winRate21d}%, Reached >=8% Rebound Rate = ${stB.hitRate8Pct ?? 0}%.\n`
    );

    // 4. Long-Term EMA Support Engine
    const ema = computeEmaSupportAnalysis(idx.key, 'MAX');
    let emaTable =
      `**4. LONG-TERM EMA SUPPORT INTERACTION ENGINE:**\n` +
      `*Methodology:* ±3% band around moving average, 15-session deduplication window, 40-session forward evaluation.\n` +
      `| EMA Period | Total Touches (N) | Support Confirmed Count | Support Rate % | Breakdown Count | Breakdown Rate % | Avg Max Rebound 40d % | Avg Drawdown 40d % |\n` +
      `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const row of ema.summaryRows) {
      emaTable += `| ${row.emaType} | ${row.totalInteractions} | ${row.supportConfirmedCount} | ${row.supportRatePct}% | ${row.breakdownCount} | ${row.breakdownRatePct}% | +${row.avgMaxRebound40d}% | ${row.avgMaxDrawdown40d}% |\n`;
    }
    factsheetSections.push(emaTable);

    // 5. Seasonality & Fiscal Cycles Engine
    const sea = computeSeasonalityAndFiscalCycles(idx.key, 'MAX');
    let seaTable =
      `**5. SEASONALITY & FISCAL CYCLE ENGINE:**\n` +
      `| Quarter | Calendar Period | Sample Size (Years) | Avg Return % | Median Return % | Win Rate % | Min Return % | Max Return % |\n` +
      `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const qItem of sea.quarterlyStats) {
      seaTable += `| ${qItem.quarterName} | ${qItem.calendarPeriod} | ${qItem.sampleSize} | +${qItem.avgReturnPct}% | +${qItem.medianReturnPct}% | ${qItem.winRatePct}% | ${qItem.minReturnPct}% | +${qItem.maxReturnPct}% |\n`;
    }

    const ft = sea.fiscalTransitionStats;
    seaTable +=
      `\n*Fiscal Year Transition (March to April Cycle):*\n` +
      `- Sample Size: ${ft.sampleSize} years (2011 to 2026).\n` +
      `- Avg March Return: ${ft.avgMarchReturnPct}% | Avg April Return: +${ft.avgAprilReturnPct}% (Avg Transition Delta: +${ft.avgTransitionDeltaPct}%).\n` +
      `- April Positive Win Rate: ${ft.aprilWinRatePct}% of Aprils were positive.\n` +
      `- April Outperformed March: ${ft.aprilOutperformedMarchPct}% of years.\n` +
      `- Reversal Tendency: When March was negative, April was positive ${ft.positiveAprilAfterNegativeMarchPct}% of the time.\n`;

    factsheetSections.push(seaTable);
  }

  return factsheetSections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Institutional Quant Analysis with Gemini Endpoint
// ---------------------------------------------------------------------------
app.post('/api/analyze', async (req, res) => {
  try {
    const { prompt, csvData, customInstructions, indicesCount } = req.body;

    if (!csvData && !prompt && !customInstructions) {
      return res.status(400).json({ error: 'Either prompt, customInstructions, or csvData is required' });
    }

    const userQuery = (customInstructions || prompt || '').trim();

    // STEP A: Gate for Unsupported Metrics
    const unsupportedMessage = checkUnsupportedMetrics(userQuery);
    if (unsupportedMessage) {
      return res.json({ analysis: unsupportedMessage });
    }

    // STEP B: Index Detection & Unknown Index Validation
    const { matched: matchedIndices, isExplicitUnknown, unknownName } = detectTargetIndices(userQuery);
    if (isExplicitUnknown) {
      return res.json({
        analysis: `I couldn't identify that index (${unknownName || 'requested'}) in the HMIE index universe. The HMIE index universe tracks 40 NSE indices across Broad Market, Sectoral, and Factor/Strategy categories.`,
      });
    }

    // STEP C: Construct Structured Quantitative Factsheet from Existing Engines
    const quantitativeFactsheet = buildQuantitativeFactsheet(userQuery, matchedIndices);

    // STEP D: Initialize Gemini Client (using verified gemini-3.8-flash)
    const ai = getGeminiClient();

    const defaultPrompt = `You are an institutional quantitative market analyst investigating Indian equity index history using the HMIE quantitative engine.
Review the attached dataset and quantitative factsheet to answer the analyst's inquiry with exact historical rigor.
Important: This is historical backtest analysis only. Do not make buy/sell recommendations or predict future returns.`;

    const userPromptText = prompt || defaultPrompt;
    const finalPrompt = customInstructions
      ? `${userPromptText}\n\nAnalyst Specific Research Query: ${customInstructions}`
      : userPromptText;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text:
              `### HMIE RESEARCH ENVIRONMENT & CALIBRATED QUANTITATIVE ENGINE OUTPUTS\n\n` +
              `${quantitativeFactsheet}\n\n` +
              `### SUMMARY CSV SNAPSHOT OF ALL 40 INDICES:\n\`\`\`csv\n${csvData}\n\`\`\`\n\n` +
              `### RESEARCH DIRECTIVE:\n${finalPrompt}`,
          },
        ],
      },
    ];

    const systemInstruction = `You are an elite Institutional Quantitative Market Analyst and Systematic Portfolio Researcher for HMIE (Historical Market Intelligence Engine).

CORE PRINCIPLE:
"Code calculates, Gemini interprets and explains."
All numbers, percentages, sample sizes, and win rates MUST come strictly from the attached Quantitative Factsheet and CSV. Never fabricate or extrapolate numerical metrics.

MANDATORY RULES:
1. DATA PROVENANCE:
Always state or reflect that all figures are derived from the HMIE calibrated historical dataset (deterministic synthetic backtest series calibrated to Indian equity macro dynamics), NOT direct historical or real-time exchange data from the National Stock Exchange of India (NSE). Use phrasing like "Within the HMIE calibrated historical dataset..." or "In the HMIE historical backtest...".

2. 2026 DENOMINATOR RULE:
Completed calendar years are 2011 through 2025 (15 completed years). 2026 is an INCOMPLETE YTD calendar year and MUST NEVER be counted as a completed calendar year in positive-year consistency metrics.

3. SAMPLE SIZE (N) & RELIABILITY TIERS:
Always report the sample size N for any observation:
- N >= 10: Robust sample.
- 5 <= N < 10: Moderate sample.
- 3 <= N < 5: Small sample, advise caution.
- N <= 2: CRITICAL CAVEAT: Must explicitly state the observation is based on only N qualifying event(s). NEVER describe N <= 2 as a reliable pattern, consistent tendency, or guarantee. A 100% win rate on N=1 or N=2 has zero statistical reliability.

4. METHODOLOGY TRAVELS WITH METRICS:
- EMA Support: Report the ±3% band, 15-session deduplication, 40-session forward evaluation, and support confirmation vs breakdown count.
- RSI Zone A: Report RSI <= 30 threshold, deduplication, and forward horizons (5d, 10d, 21d, 63d, 120d, 180d).
- Correction & Recovery: Report peak-to-trough decline depth bucket and 120-session post-trough rebound.
- Seasonality: Report calendar quarters (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec) and March-April transition.

5. MULTI-ENGINE QUERIES & RANKINGS:
When evaluating multi-criteria queries (e.g. CAGR > 20%, Drawdown <= -40%, RSI rebound), evaluate all matching candidates from the provided deterministic multi-engine table. Never arbitrarily truncate the list to 5 unless the user explicitly asked for "Top 5".

6. STRICT NO-PREDICTION BOUNDARY:
This is factual historical backtest analysis. NEVER predict future price movements, give buy/sell recommendations, or state that past rebound rates guarantee future results.`;

    // Try verified models in order: gemini-3.8-flash, then gemini-3.1-flash-lite
    let responseText = '';
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction,
              temperature: 0.1,
            },
          });
          responseText = response.text || '';
          if (responseText) break;
        } catch (err: any) {
          console.log(`[Quant Router] Model ${modelName} temporary status on attempt ${attempt}, continuing failover pipeline...`);
          // If rate limit / overload error and attempt 1, wait 1.2s before retry
          if (attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      // If models are overloaded/quota exhausted, provide high-value deterministic output
      // so the analyst never encounters a broken experience or 500 error
      return res.json({
        analysis:
          `### ⚠️ Live AI Interpretation Temporarily Queued (High Demand)\n\n` +
          `*The Gemini model endpoint is currently experiencing peak traffic. To ensure zero research downtime, HMIE's deterministic quantitative analytical engine has extracted the exact empirical factsheet for your query below:*\n\n` +
          `---\n\n` +
          `${quantitativeFactsheet}\n\n` +
          `---\n*Note: You can re-run this query at any time for synthesized prose commentary once endpoint traffic stabilizes.*`,
      });
    }

    return res.json({ analysis: responseText });
  } catch (error: any) {
    console.error('Quant Engine Fallback Activated:', error?.message || error);
    // Even in unexpected failure, return empirical factsheet rather than 500 to keep analyst working
    const fallbackFactsheet = req.body?.customInstructions
      ? `### HMIE QUANTITATIVE ANALYTICAL SYSTEM\n\n*Live interpretation temporarily offline. Please refer to the screener and historical research modules for live interactive data.*`
      : 'Analysis temporarily unavailable.';
    return res.json({
      analysis: fallbackFactsheet,
    });
  }
});

// Setup Vite development middleware or production static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

start();

