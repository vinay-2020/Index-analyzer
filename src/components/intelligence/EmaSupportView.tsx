import React, { useState } from 'react';
import { EmaSummaryRow, EmaInteractionEpisode, EmaType } from '../../indexIntelligenceEngine';
import {
  TrendingUp,
  ShieldCheck,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

interface EmaSupportViewProps {
  indexName: string;
  summaryRows: EmaSummaryRow[];
  episodesByEma: Record<EmaType, EmaInteractionEpisode[]>;
}

export const EmaSupportView: React.FC<EmaSupportViewProps> = ({
  indexName,
  summaryRows,
  episodesByEma,
}) => {
  const [selectedEma, setSelectedEma] = useState<EmaType>('EMA200');
  const activeEpisodes = episodesByEma[selectedEma] || [];

  return (
    <div className="space-y-6">
      {/* Header and Methodology */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Long-Term EMA Support Behaviour (EMA20 &mdash; EMA500)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Measures institutional price interaction efficiency across standard moving averages within a strict <strong>&plusmn;3.0% proximity zone</strong>.
            Tracks 40-session forward Maximum Favorable Excursion (MFE) vs Maximum Adverse Excursion (MAE).
          </p>
        </div>

        {/* Selected EMA Quick Switch */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg self-start md:self-center">
          {(['EMA20', 'EMA50', 'EMA100', 'EMA200', 'EMA400', 'EMA500'] as EmaType[]).map((ema) => (
            <button
              key={ema}
              onClick={() => setSelectedEma(ema)}
              className={`px-2.5 py-1 text-xs font-semibold rounded font-mono transition-colors ${
                selectedEma === ema
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {ema}
            </button>
          ))}
        </div>
      </div>

      {/* Comparative Cross-EMA Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Comprehensive EMA Support Hierarchy Matrix (&plusmn;3% Interaction Zone)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Forward Observation Window: 40 Trading Sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
              <tr>
                <th className="py-2.5 px-3">Moving Average</th>
                <th className="py-2.5 px-3 text-center">Interactions</th>
                <th className="py-2.5 px-3 text-right">Support Rate %</th>
                <th className="py-2.5 px-3 text-right">Breakdown Rate %</th>
                <th className="py-2.5 px-3 text-right">Avg Rebound (40d MFE)</th>
                <th className="py-2.5 px-3 text-right">Avg Drawdown (40d MAE)</th>
                <th className="py-2.5 px-3 text-right">20d Return</th>
                <th className="py-2.5 px-3 text-right">40d Return</th>
                <th className="py-2.5 px-3 text-right">Current Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {summaryRows.map((row) => {
                const isSelected = row.emaType === selectedEma;
                return (
                  <tr
                    key={row.emaType}
                    onClick={() => setSelectedEma(row.emaType)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-indigo-600 ring-2 ring-indigo-200' : 'bg-slate-300'
                        }`} />
                        <span className="font-bold text-slate-900">{row.emaType}</span>
                        <span className="text-[10px] text-slate-400 font-sans">({row.period}d)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700">
                      {row.totalInteractions}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                      {row.supportRatePct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600">
                      {row.breakdownRatePct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      +{row.avgMaxRebound40d}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                      {row.avgMaxDrawdown40d}%
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${row.avgReturn20d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {row.avgReturn20d >= 0 ? `+${row.avgReturn20d}%` : `${row.avgReturn20d}%`}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${row.avgReturn40d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {row.avgReturn40d >= 0 ? `+${row.avgReturn40d}%` : `${row.avgReturn40d}%`}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      Math.abs(row.currentDistancePct) <= 3 ? 'text-blue-700 bg-blue-50/50' : 'text-slate-600'
                    }`}>
                      {row.currentDistancePct >= 0 ? `+${row.currentDistancePct}%` : `${row.currentDistancePct}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected EMA Detailed Historical Interaction Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {selectedEma} Historical Touch Events &amp; Reaction Trajectories ({activeEpisodes.length} Records)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Criterion: Price within &plusmn;3% of {selectedEma}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Close Price</th>
                <th className="py-2.5 px-3 text-right">{selectedEma} Value</th>
                <th className="py-2.5 px-3 text-right">Distance at Touch</th>
                <th className="py-2.5 px-3 text-right bg-emerald-50/50">40d Max Rebound (MFE)</th>
                <th className="py-2.5 px-3 text-right bg-rose-50/50">40d Max Drawdown (MAE)</th>
                <th className="py-2.5 px-3 text-right">20d Return</th>
                <th className="py-2.5 px-3 text-right">40d Return</th>
                <th className="py-2.5 px-3 text-center">Outcome Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {activeEpisodes.length > 0 ? (
                activeEpisodes.map((ep) => (
                  <tr key={ep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {ep.date}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      ₹{ep.close.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      ₹{ep.emaValue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                      {ep.distancePct >= 0 ? `+${ep.distancePct}%` : `${ep.distancePct}%`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700 bg-emerald-50/20">
                      +{ep.maxFavorableExcursion40d}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700 bg-rose-50/20">
                      {ep.maxAdverseExcursion40d}%
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${ep.return20d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {ep.return20d >= 0 ? `+${ep.return20d}%` : `${ep.return20d}%`}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${ep.return40d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {ep.return40d >= 0 ? `+${ep.return40d}%` : `${ep.return40d}%`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {ep.classification === 'SUPPORT_CONFIRMED' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 inline-block font-sans">
                          Support Confirmed (&ge;+3%)
                        </span>
                      )}
                      {ep.classification === 'BREAKDOWN' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 inline-block font-sans">
                          Breakdown (&le;-3%)
                        </span>
                      )}
                      {ep.classification === 'NEUTRAL_CONSOLIDATION' && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 inline-block font-sans">
                          Consolidation
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No historical &plusmn;3% interaction episodes recorded for {selectedEma}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
