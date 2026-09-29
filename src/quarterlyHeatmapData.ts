import {
  HeatmapPeriod,
  IndexMonthlySeasonality,
  IndexQuarterlySeasonality,
  QuarterlyCellStats,
  QuarterlyReturnObservation,
  MarketQuarterlySeasonality,
  IndexPeriodSummary,
} from './types';
import { MONTH_SHORT_NAMES } from './monthlyHeatmapData';

export const QUARTER_NUMBERS = [1, 2, 3, 4] as const;
export const QUARTER_NAMES = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export const QUARTER_LABELS: Record<number, string> = {
  1: 'Jan - Mar',
  2: 'Apr - Jun',
  3: 'Jul - Sep',
  4: 'Oct - Dec',
};

export const QUARTER_FULL_LABELS: Record<number, string> = {
  1: 'Q1 (Jan - Mar)',
  2: 'Q2 (Apr - Jun)',
  3: 'Q3 (Jul - Sep)',
  4: 'Q4 (Oct - Dec)',
};

export const QUARTER_MONTHS: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

/**
 * Calculates authentic quarterly seasonality from an index's monthly seasonality profile.
 * Compounds each quarter's monthly returns: (1 + r1) * (1 + r2) * (1 + r3) - 1.
 */
export function computeIndexQuarterlySeasonality(
  monthlyProfile: IndexMonthlySeasonality
): IndexQuarterlySeasonality {
  const { symbol, name, category, inceptionDate, yearlyMatrix } = monthlyProfile;

  // Build Year-by-Year Quarterly Matrix
  const yearlyQuarterlyMatrix = yearlyMatrix.map((yr) => {
    const qReturns: Record<number, number | undefined> = {};

    for (const q of QUARTER_NUMBERS) {
      const monthsInQuarter = QUARTER_MONTHS[q];
      const monthVals = monthsInQuarter.map((m) => yr.returns[m]);

      // Check how many months exist
      const validMonthVals = monthVals.filter((v): v is number => v !== undefined && !isNaN(v));

      // For standard quarters, require all 3 months unless it is the latest year where months may be in progress
      const isCompleteQuarter = validMonthVals.length === 3;
      const isPartialAllowed = yr.year === 2026 && validMonthVals.length > 0;

      if (isCompleteQuarter || isPartialAllowed) {
        let compound = 1;
        for (const val of validMonthVals) {
          compound *= 1 + val / 100;
        }
        qReturns[q] = Number(((compound - 1) * 100).toFixed(2));
      } else {
        qReturns[q] = undefined;
      }
    }

    return {
      year: yr.year,
      quarters: qReturns,
      months: yr.returns,
      annualReturn: yr.annualReturn,
    };
  });

  // Calculate Quarter-by-Quarter Stats (Q1 to Q4)
  const quarterStatsMap: Record<number, QuarterlyCellStats> = {};
  const allQuarterReturnsList: number[] = [];

  for (const q of QUARTER_NUMBERS) {
    const qName = QUARTER_NAMES[q - 1];
    const periodLabel = QUARTER_LABELS[q];
    const observations: QuarterlyReturnObservation[] = [];

    for (const yrRow of yearlyQuarterlyMatrix) {
      const qVal = yrRow.quarters[q];
      if (qVal !== undefined && !isNaN(qVal)) {
        const monthDetails = QUARTER_MONTHS[q].map((m) => ({
          month: m,
          monthName: MONTH_SHORT_NAMES[m - 1],
          returnPct: yrRow.months[m],
        }));

        observations.push({
          year: yrRow.year,
          quarter: q,
          quarterName: qName,
          returnPct: qVal,
          months: monthDetails,
        });

        allQuarterReturnsList.push(qVal);
      }
    }

    const sampleSize = observations.length;
    if (sampleSize === 0) {
      quarterStatsMap[q] = {
        quarter: q,
        quarterName: qName,
        periodLabel,
        sampleSize: 0,
        avgReturn: 0,
        medianReturn: 0,
        winRatePct: 0,
        loseRatePct: 0,
        positiveCount: 0,
        negativeCount: 0,
        zeroCount: 0,
        bestYear: { year: 0, returnPct: 0 },
        worstYear: { year: 0, returnPct: 0 },
        stdDev: 0,
        insufficientHistory: true,
        observations: [],
      };
      continue;
    }

    const returns = observations.map((o) => o.returnPct);
    const sum = returns.reduce((acc, v) => acc + v, 0);
    const avgReturn = Number((sum / sampleSize).toFixed(2));

    // Median
    const sorted = [...returns].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianReturn =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

    // Counts
    const positiveCount = returns.filter((r) => r > 0).length;
    const negativeCount = returns.filter((r) => r < 0).length;
    const zeroCount = returns.filter((r) => r === 0).length;
    const winRatePct = Number(((positiveCount / sampleSize) * 100).toFixed(1));
    const loseRatePct = Number(((negativeCount / sampleSize) * 100).toFixed(1));

    // Best & Worst
    let best = observations[0];
    let worst = observations[0];
    for (const obs of observations) {
      if (obs.returnPct > best.returnPct) best = obs;
      if (obs.returnPct < worst.returnPct) worst = obs;
    }

    // Sample Standard Deviation
    let stdDev = 0;
    if (sampleSize > 1) {
      const variance =
        returns.reduce((acc, val) => acc + Math.pow(val - avgReturn, 2), 0) / (sampleSize - 1);
      stdDev = Number(Math.sqrt(variance).toFixed(2));
    }

    quarterStatsMap[q] = {
      quarter: q,
      quarterName: qName,
      periodLabel,
      sampleSize,
      avgReturn,
      medianReturn,
      winRatePct,
      loseRatePct,
      positiveCount,
      negativeCount,
      zeroCount,
      bestYear: { year: best.year, returnPct: best.returnPct },
      worstYear: { year: worst.year, returnPct: worst.returnPct },
      stdDev,
      insufficientHistory: sampleSize < 3,
      observations: observations.sort((a, b) => b.year - a.year), // Latest year first
    };
  }

  // Best & Worst Quarter
  let bestQuarter = {
    quarter: 1,
    quarterName: 'Q1',
    avgReturn: quarterStatsMap[1]?.avgReturn ?? 0,
  };
  let worstQuarter = {
    quarter: 1,
    quarterName: 'Q1',
    avgReturn: quarterStatsMap[1]?.avgReturn ?? 0,
  };

  for (const q of QUARTER_NUMBERS) {
    const st = quarterStatsMap[q];
    if (st && st.sampleSize > 0) {
      if (st.avgReturn > bestQuarter.avgReturn) {
        bestQuarter = { quarter: q, quarterName: st.quarterName, avgReturn: st.avgReturn };
      }
      if (st.avgReturn < worstQuarter.avgReturn) {
        worstQuarter = { quarter: q, quarterName: st.quarterName, avgReturn: st.avgReturn };
      }
    }
  }

  // Aggregate Period Summary across all quarters
  const totalObs = allQuarterReturnsList.length;
  let periodAvg = 0;
  let periodWin = 0;
  let periodLose = 0;
  let periodStd = 0;
  let periodMax = 0;
  let periodMin = 0;
  let posCount = 0;
  let negCount = 0;
  let zeroCount = 0;

  if (totalObs > 0) {
    const sum = allQuarterReturnsList.reduce((acc, v) => acc + v, 0);
    periodAvg = Number((sum / totalObs).toFixed(2));
    posCount = allQuarterReturnsList.filter((r) => r > 0).length;
    negCount = allQuarterReturnsList.filter((r) => r < 0).length;
    zeroCount = allQuarterReturnsList.filter((r) => r === 0).length;
    periodWin = Number(((posCount / totalObs) * 100).toFixed(1));
    periodLose = Number(((negCount / totalObs) * 100).toFixed(1));
    periodMax = Number(Math.max(...allQuarterReturnsList).toFixed(2));
    periodMin = Number(Math.min(...allQuarterReturnsList).toFixed(2));

    if (totalObs > 1) {
      const variance =
        allQuarterReturnsList.reduce((acc, v) => acc + Math.pow(v - periodAvg, 2), 0) /
        (totalObs - 1);
      periodStd = Number(Math.sqrt(variance).toFixed(2));
    }
  }

  const periodSummary: IndexPeriodSummary = {
    averageReturn: periodAvg,
    winRatePct: periodWin,
    loseRatePct: periodLose,
    positiveCount: posCount,
    negativeCount: negCount,
    zeroCount,
    maxReturn: periodMax,
    minReturn: periodMin,
    stdDev: periodStd,
    totalObservations: totalObs,
  };

  return {
    symbol,
    name,
    category,
    inceptionDate,
    totalObservations: totalObs,
    periodSummary,
    quarters: quarterStatsMap,
    bestQuarter,
    worstQuarter,
    overallWinRate: periodWin,
    yearlyQuarterlyMatrix,
    monthlyProfile,
  };
}

/**
 * Computes market-wide quarterly seasonality benchmark across active profiles.
 */
export function computeMarketQuarterlySeasonality(
  profiles: IndexQuarterlySeasonality[]
): MarketQuarterlySeasonality[] {
  if (!profiles || profiles.length === 0) return [];

  return QUARTER_NUMBERS.map((q) => {
    const validStats = profiles
      .map((p) => p.quarters[q])
      .filter((st): st is QuarterlyCellStats => !!st && st.sampleSize > 0);

    if (validStats.length === 0) {
      return {
        quarter: q,
        quarterName: QUARTER_NAMES[q - 1],
        periodLabel: QUARTER_LABELS[q],
        avgReturn: 0,
        medianReturn: 0,
        winRatePct: 0,
        indicesPositiveCount: 0,
        totalIndices: 0,
      };
    }

    const avgReturns = validStats.map((st) => st.avgReturn);
    const sumAvg = avgReturns.reduce((acc, val) => acc + val, 0);
    const meanAvgReturn = Number((sumAvg / validStats.length).toFixed(2));

    const sortedAvg = [...avgReturns].sort((a, b) => a - b);
    const mid = Math.floor(sortedAvg.length / 2);
    const medianReturn =
      sortedAvg.length % 2 !== 0
        ? sortedAvg[mid]
        : Number(((sortedAvg[mid - 1] + sortedAvg[mid]) / 2).toFixed(2));

    const sumWinRates = validStats.reduce((acc, st) => acc + st.winRatePct, 0);
    const meanWinRate = Number((sumWinRates / validStats.length).toFixed(1));

    const positiveIndices = validStats.filter((st) => st.avgReturn > 0).length;

    return {
      quarter: q,
      quarterName: QUARTER_NAMES[q - 1],
      periodLabel: QUARTER_LABELS[q],
      avgReturn: meanAvgReturn,
      medianReturn,
      winRatePct: meanWinRate,
      indicesPositiveCount: positiveIndices,
      totalIndices: validStats.length,
    };
  });
}
