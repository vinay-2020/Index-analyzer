import React, { useState } from 'react';
import {
  QuarterlyStatsItem,
  FiscalYearTransitionStats,
} from '../../indexIntelligenceEngine';
import {
  Calendar,
  RotateCcw,
  TrendingUp,
  Percent,
  History,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SeasonalityCyclesViewProps {
  indexName: string;
  quarterlyStats: QuarterlyStatsItem[];
  fiscalTransitionStats: FiscalYearTransitionStats;
}

export const SeasonalityCyclesView: React.FC<SeasonalityCyclesViewProps> = ({
  indexName,
  quarterlyStats,
  fiscalTransitionStats,
}) => {
  const [activeCycleTab, setActiveCycleTab] = useState<'QUARTERLY' | 'FY_TRANSITION'>('QUARTERLY');

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Navigation */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Seasonality &amp; Fiscal-Year Regime Cycles
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Examines long-term calendar tendencies for {indexName}.
            Evaluates quarterly distributions (Q1&ndash;Q4) alongside the critical Indian capital markets transition from March (FY year-end liquidity/taxation) into April (FY Q1 budget allocation).
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg self-start md:self-center">
          <button
            onClick={() => setActiveCycleTab('QUARTERLY')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeCycleTab === 'QUARTERLY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Quarterly Cycles (Q1&ndash;Q4)
          </button>
          <button
            onClick={() => setActiveCycleTab('FY_TRANSITION')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeCycleTab === 'FY_TRANSITION'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            March &rarr; April FY Regime Transition
          </button>
        </div>
      </div>

      {/* VIEW A: QUARTERLY CYCLES */}
      {activeCycleTab === 'QUARTERLY' && (
        <div className="space-y-6">
          {/* 4 Quarterly Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quarterlyStats.map((q) => (
              <div key={q.quarterName} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-mono text-slate-900">
                      {q.quarterName}
                    </span>
                    <span className="text-[11px] font-sans text-slate-500">
                      ({q.calendarPeriod})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                    N = {q.sampleSize} yrs
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px] font-sans">Avg Return:</span>
                    <span className={`text-base font-black ${q.avgReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {q.avgReturnPct >= 0 ? `+${q.avgReturnPct}%` : `${q.avgReturnPct}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span className="text-slate-500 font-sans">Median Return:</span>
                    <span className="font-bold text-slate-800">
                      {q.medianReturnPct >= 0 ? `+${q.medianReturnPct}%` : `${q.medianReturnPct}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-sans">Win Rate (% Pos):</span>
                    <span className="font-bold text-emerald-700">{q.winRatePct}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-sans">Volatility (Std Dev):</span>
                    <span className="text-slate-700">{q.stdDevPct}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100 text-slate-500 font-sans">
                    <span>Range:</span>
                    <span className="font-mono text-[10px] text-slate-600">
                      {q.minReturnPct}% to +{q.maxReturnPct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quarterly Summary Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Quarterly Historical Cycle Comparison Table
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Historical Sample (2011 &mdash; 2026)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Quarter</th>
                    <th className="py-2.5 px-3">Months</th>
                    <th className="py-2.5 px-3 text-center">Observations</th>
                    <th className="py-2.5 px-3 text-right">Average Return</th>
                    <th className="py-2.5 px-3 text-right">Median Return</th>
                    <th className="py-2.5 px-3 text-right">Win Rate %</th>
                    <th className="py-2.5 px-3 text-right">Lose Rate %</th>
                    <th className="py-2.5 px-3 text-right">Std Deviation</th>
                    <th className="py-2.5 px-3 text-right">Best Quarter</th>
                    <th className="py-2.5 px-3 text-right">Worst Quarter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {quarterlyStats.map((q) => (
                    <tr key={q.quarterName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{q.quarterName}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">{q.calendarPeriod}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{q.sampleSize}</td>
                      <td className={`py-2.5 px-3 text-right font-black ${q.avgReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {q.avgReturnPct >= 0 ? `+${q.avgReturnPct}%` : `${q.avgReturnPct}%`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                        {q.medianReturnPct >= 0 ? `+${q.medianReturnPct}%` : `${q.medianReturnPct}%`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{q.winRatePct}%</td>
                      <td className="py-2.5 px-3 text-right text-rose-600">{q.loseRatePct}%</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{q.stdDevPct}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">+{q.maxReturnPct}%</td>
                      <td className="py-2.5 px-3 text-right text-rose-700 font-bold">{q.minReturnPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: MARCH TO APRIL FY REGIME TRANSITION */}
      {activeCycleTab === 'FY_TRANSITION' && (
        <div className="space-y-6">
          {/* FY Transition Narrative & Metric Cards */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>Fiscal Year Transition Phenomenon:</strong> Evaluates institutional liquidity flows moving out of FY year-end portfolio dressing and tax harvesting (March) into new FY asset reallocations (April).
              </span>
            </div>
            <span className="font-mono font-bold text-purple-800 bg-white px-2.5 py-1 rounded border border-purple-200 self-start md:self-center shrink-0">
              Avg Transition Delta: {fiscalTransitionStats.avgTransitionDeltaPct >= 0 ? `+${fiscalTransitionStats.avgTransitionDeltaPct}%` : `${fiscalTransitionStats.avgTransitionDeltaPct}%`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">April Positive Win Rate</span>
              <span className="text-2xl font-black font-mono text-emerald-700">
                {fiscalTransitionStats.aprilWinRatePct}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Historic frequency April ended green
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">April &gt; March Rate</span>
              <span className="text-2xl font-black font-mono text-indigo-700">
                {fiscalTransitionStats.aprilOutperformedMarchPct}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                April outperformed previous March
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Post-Negative March Bounce</span>
              <span className="text-2xl font-black font-mono text-emerald-700">
                {fiscalTransitionStats.positiveAprilAfterNegativeMarchPct}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                When March was red, April rebounded
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Compounded (Mar+Apr)</span>
              <span className={`text-2xl font-black font-mono ${
                fiscalTransitionStats.avgCompoundedTwoMonthPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {fiscalTransitionStats.avgCompoundedTwoMonthPct >= 0 ? `+${fiscalTransitionStats.avgCompoundedTwoMonthPct}%` : `${fiscalTransitionStats.avgCompoundedTwoMonthPct}%`}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                Mar Avg: {fiscalTransitionStats.avgMarchReturnPct}% | Apr Avg: +{fiscalTransitionStats.avgAprilReturnPct}%
              </span>
            </div>
          </div>

          {/* Chronological Year-by-Year Transition Log Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Chronological Year-by-Year March &rarr; April Transition Log
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {fiscalTransitionStats.sampleSize} Fiscal Transitions Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Calendar Year</th>
                    <th className="py-2.5 px-3 text-right">March Return</th>
                    <th className="py-2.5 px-3 text-right">April Return</th>
                    <th className="py-2.5 px-3 text-right bg-purple-50/50">Transition Delta (Apr - Mar)</th>
                    <th className="py-2.5 px-3 text-right">2-Month Compounded</th>
                    <th className="py-2.5 px-3 text-center">Regime Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {fiscalTransitionStats.observations.map((obs) => (
                    <tr key={obs.year} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{obs.year}</td>
                      <td className={`py-2.5 px-3 text-right font-medium ${obs.marchReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {obs.marchReturnPct >= 0 ? `+${obs.marchReturnPct}%` : `${obs.marchReturnPct}%`}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-black ${obs.aprilReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {obs.aprilReturnPct >= 0 ? `+${obs.aprilReturnPct}%` : `${obs.aprilReturnPct}%`}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-black ${
                        obs.transitionDeltaPct >= 0 ? 'text-purple-700 bg-purple-50/30' : 'text-slate-600 bg-purple-50/10'
                      }`}>
                        {obs.transitionDeltaPct >= 0 ? `+${obs.transitionDeltaPct}%` : `${obs.transitionDeltaPct}%`}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${obs.compoundedTwoMonthPct >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {obs.compoundedTwoMonthPct >= 0 ? `+${obs.compoundedTwoMonthPct}%` : `${obs.compoundedTwoMonthPct}%`}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {obs.direction === 'REVERSAL_TO_GREEN' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans">
                            Reversal to Green
                          </span>
                        )}
                        {obs.direction === 'CONTINUATION_GREEN' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-sans">
                            Continuation Green
                          </span>
                        )}
                        {obs.direction === 'EXPANSION' && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-sans">
                            Expansion
                          </span>
                        )}
                        {obs.direction === 'CONTRACTION' && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-sans">
                            Contraction
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
