import React from 'react';
import { BenchmarkComparisonStats, IntelligencePeriod } from '../../indexIntelligenceEngine';
import {
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Percent,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface BenchmarkAnalysisViewProps {
  stats: BenchmarkComparisonStats;
  selectedPeriod: IntelligencePeriod;
  onPeriodChange: (p: IntelligencePeriod) => void;
}

export const BenchmarkAnalysisView: React.FC<BenchmarkAnalysisViewProps> = ({
  stats,
  selectedPeriod,
  onPeriodChange,
}) => {
  const { target, parentBenchmark, nifty50Baseline, isHistorySufficient, yearsCovered, startDate, endDate } = stats;

  return (
    <div className="space-y-6">
      {/* Section Header & Methodology */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Index vs Parent/Broad-Market Benchmark vs NIFTY 50
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Historically evaluates whether this index demonstrated structural alpha, differential volatility,
            or distinct drawdown behaviour relative to its designated parent benchmark and the broad NIFTY 50 baseline.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg self-start md:self-center">
          {(['MAX', '15Y', '10Y', '5Y', '3Y'] as IntelligencePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                selectedPeriod === p
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Insufficient History Warning if applicable */}
      {!isHistorySufficient && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Insufficient History:</strong> This index inception does not encompass the full {selectedPeriod} window.
            Displaying all {yearsCovered} available years ({startDate} to {endDate}) without synthetic extrapolation.
          </span>
        </div>
      )}

      {/* Triad Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Target Index Card */}
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/60 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Target Index
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {yearsCovered}Y History
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 truncate" title={target.name}>
            {target.name}
          </h4>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            {target.symbol}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">CAGR</span>
              <span className={`text-lg font-black font-mono ${target.cagr >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {target.cagr > 0 ? `+${target.cagr}%` : `${target.cagr}%`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Cumulative</span>
              <span className="text-lg font-black font-mono text-slate-900">
                +{target.cumulativeReturnPct}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Max Drawdown</span>
              <span className="text-xs font-bold font-mono text-rose-700">
                {target.maxDrawdownPct}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Volatility (SD)</span>
              <span className="text-xs font-bold font-mono text-slate-800">
                {target.annualizedVolatility}%
              </span>
            </div>
          </div>
        </div>

        {/* Parent Benchmark Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Parent Benchmark
            </span>
            {parentBenchmark?.available && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                parentBenchmark.outperformanceBps >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {parentBenchmark.outperformanceBps >= 0 ? `+${parentBenchmark.outperformanceBps} bps` : `${parentBenchmark.outperformanceBps} bps`}
              </span>
            )}
          </div>

          {parentBenchmark?.available ? (
            <>
              <h4 className="text-base font-bold text-slate-900 truncate" title={parentBenchmark.name}>
                {parentBenchmark.name}
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                {parentBenchmark.symbol}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">CAGR</span>
                  <span className="text-lg font-black font-mono text-slate-900">
                    {parentBenchmark.cagr}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Relative Return</span>
                  <span className={`text-lg font-black font-mono ${
                    parentBenchmark.relativeReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {parentBenchmark.relativeReturnPct >= 0 ? `+${parentBenchmark.relativeReturnPct}%` : `${parentBenchmark.relativeReturnPct}%`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Max Drawdown</span>
                  <span className="text-xs font-bold font-mono text-rose-700">
                    {parentBenchmark.maxDrawdownPct}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Volatility (SD)</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {parentBenchmark.annualizedVolatility}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <p className="text-xs font-medium text-slate-500">Benchmark mapping unavailable</p>
              <p className="text-[11px] text-slate-400 mt-1">No parent universe formal mapping defined for this index</p>
            </div>
          )}
        </div>

        {/* NIFTY 50 Baseline Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Baseline (NIFTY 50)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
              nifty50Baseline.outperformanceBps >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {nifty50Baseline.outperformanceBps >= 0 ? `+${nifty50Baseline.outperformanceBps} bps` : `${nifty50Baseline.outperformanceBps} bps`} vs Nifty
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900 truncate">
            {nifty50Baseline.name}
          </h4>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            {nifty50Baseline.symbol}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">CAGR</span>
              <span className="text-lg font-black font-mono text-slate-900">
                {nifty50Baseline.cagr}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Relative Return</span>
              <span className={`text-lg font-black font-mono ${
                nifty50Baseline.relativeReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {nifty50Baseline.relativeReturnPct >= 0 ? `+${nifty50Baseline.relativeReturnPct}%` : `${nifty50Baseline.relativeReturnPct}%`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Max Drawdown</span>
              <span className="text-xs font-bold font-mono text-rose-700">
                {nifty50Baseline.maxDrawdownPct}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Volatility (SD)</span>
              <span className="text-xs font-bold font-mono text-slate-800">
                {nifty50Baseline.annualizedVolatility}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Performance Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Head-to-Head Benchmark Factor Comparison ({selectedPeriod})
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {startDate} &mdash; {endDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Analytical Metric</th>
                <th className="py-2.5 px-3 text-indigo-700 font-bold bg-indigo-50/50">{target.name} (Target)</th>
                <th className="py-2.5 px-3">{parentBenchmark?.available ? parentBenchmark.name : 'Parent Benchmark'}</th>
                <th className="py-2.5 px-3">NIFTY 50 (Baseline)</th>
                <th className="py-2.5 px-3 text-right">Relative vs Nifty 50</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-700">Cumulative Return</td>
                <td className="py-2.5 px-3 font-bold text-slate-900 bg-indigo-50/30">+{target.cumulativeReturnPct}%</td>
                <td className="py-2.5 px-3 text-slate-600">{parentBenchmark?.available ? `+${parentBenchmark.cumulativeReturnPct}%` : 'Unavailable'}</td>
                <td className="py-2.5 px-3 text-slate-600">+{nifty50Baseline.cumulativeReturnPct}%</td>
                <td className={`py-2.5 px-3 text-right font-bold ${nifty50Baseline.relativeReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {nifty50Baseline.relativeReturnPct >= 0 ? `+${nifty50Baseline.relativeReturnPct}%` : `${nifty50Baseline.relativeReturnPct}%`}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-700">Compounded Annual Growth (CAGR)</td>
                <td className="py-2.5 px-3 font-bold text-slate-900 bg-indigo-50/30">{target.cagr}%</td>
                <td className="py-2.5 px-3 text-slate-600">{parentBenchmark?.available ? `${parentBenchmark.cagr}%` : 'Unavailable'}</td>
                <td className="py-2.5 px-3 text-slate-600">{nifty50Baseline.cagr}%</td>
                <td className={`py-2.5 px-3 text-right font-bold ${nifty50Baseline.outperformanceBps >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {nifty50Baseline.outperformanceBps >= 0 ? `+${nifty50Baseline.outperformanceBps} bps` : `${nifty50Baseline.outperformanceBps} bps`}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-700">Annualized Volatility (Std Dev)</td>
                <td className="py-2.5 px-3 font-bold text-slate-900 bg-indigo-50/30">{target.annualizedVolatility}%</td>
                <td className="py-2.5 px-3 text-slate-600">{parentBenchmark?.available ? `${parentBenchmark.annualizedVolatility}%` : 'Unavailable'}</td>
                <td className="py-2.5 px-3 text-slate-600">{nifty50Baseline.annualizedVolatility}%</td>
                <td className="py-2.5 px-3 text-right text-slate-500">
                  {Number((target.annualizedVolatility - nifty50Baseline.annualizedVolatility).toFixed(1)) > 0 ? `+${Number((target.annualizedVolatility - nifty50Baseline.annualizedVolatility).toFixed(1))}%` : `${Number((target.annualizedVolatility - nifty50Baseline.annualizedVolatility).toFixed(1))}%`}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-700">Peak-to-Trough Max Drawdown</td>
                <td className="py-2.5 px-3 font-bold text-rose-700 bg-indigo-50/30">{target.maxDrawdownPct}%</td>
                <td className="py-2.5 px-3 text-slate-600">{parentBenchmark?.available ? `${parentBenchmark.maxDrawdownPct}%` : 'Unavailable'}</td>
                <td className="py-2.5 px-3 text-slate-600">{nifty50Baseline.maxDrawdownPct}%</td>
                <td className="py-2.5 px-3 text-right text-slate-500">
                  {Number((target.maxDrawdownPct - nifty50Baseline.maxDrawdownPct).toFixed(1))}%
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-700">Positive Calendar Years Rate</td>
                <td className="py-2.5 px-3 font-bold text-emerald-700 bg-indigo-50/30">{target.positiveYearPct}%</td>
                <td className="py-2.5 px-3 text-slate-600">{parentBenchmark?.available ? `${parentBenchmark.positiveYearPct}%` : 'Unavailable'}</td>
                <td className="py-2.5 px-3 text-slate-600">{nifty50Baseline.positiveYearPct}%</td>
                <td className="py-2.5 px-3 text-right text-slate-500">
                  {Number((target.positiveYearPct - nifty50Baseline.positiveYearPct).toFixed(1))}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
