import React, { useState } from 'react';
import { RsiZoneAEvent, RsiZoneBEvent, RsiZoneStats } from '../../indexIntelligenceEngine';
import {
  Activity,
  Zap,
  Target,
  History,
  TrendingUp,
  Percent,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface RsiReboundViewProps {
  indexName: string;
  zoneAEvents: RsiZoneAEvent[];
  zoneAStats: RsiZoneStats;
  zoneBEvents: RsiZoneBEvent[];
  zoneBStats: RsiZoneStats;
}

export const RsiReboundView: React.FC<RsiReboundViewProps> = ({
  indexName,
  zoneAEvents,
  zoneAStats,
  zoneBEvents,
  zoneBStats,
}) => {
  const [activeZone, setActiveZone] = useState<'ZONE_A' | 'ZONE_B'>('ZONE_A');

  return (
    <div className="space-y-6">
      {/* Header with Zone Switcher */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Historical RSI Oversold &amp; Near-Oversold Rebound Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Examines the forward price performance of {indexName} following extreme oversold conditions.
            Maintains strictly decoupled empirical populations between deep oversold and near-oversold regimes.
          </p>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg self-start md:self-center">
          <button
            onClick={() => setActiveZone('ZONE_A')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
              activeZone === 'ZONE_A'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Zone A: RSI &le; 30 (Deep Oversold)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeZone === 'ZONE_A' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {zoneAEvents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveZone('ZONE_B')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
              activeZone === 'ZONE_B'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Zone B: 30 &lt; RSI &le; 35 (Near-Oversold)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeZone === 'ZONE_B' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {zoneBEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* ZONE A VIEW */}
      {activeZone === 'ZONE_A' && (
        <div className="space-y-6">
          {/* Zone A Aggregate Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Events</span>
              <span className="text-xl font-black font-mono text-slate-900">
                {zoneAStats.sampleSize}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Min RSI: {zoneAStats.minRsiObserved?.toFixed(1) ?? 'N/A'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Win Rate (21d)</span>
              <span className="text-xl font-black font-mono text-emerald-700">
                {zoneAStats.winRate21d}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Positive forward return
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg 120d Return</span>
              <span className={`text-xl font-black font-mono ${
                (zoneAStats.avgReturn120d ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {(zoneAStats.avgReturn120d ?? 0) >= 0 ? `+${zoneAStats.avgReturn120d}%` : `${zoneAStats.avgReturn120d}%`}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                6-Month trajectory
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg 21d Return</span>
              <span className={`text-xl font-black font-mono ${
                zoneAStats.avgReturn21d >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {zoneAStats.avgReturn21d >= 0 ? `+${zoneAStats.avgReturn21d}%` : `${zoneAStats.avgReturn21d}%`}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Median: +{zoneAStats.medianReturn21d}%
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg 63d Return</span>
              <span className={`text-xl font-black font-mono ${
                (zoneAStats.avgReturn63d ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {(zoneAStats.avgReturn63d ?? 0) >= 0 ? `+${zoneAStats.avgReturn63d}%` : `${zoneAStats.avgReturn63d}%`}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Quarterly trajectory
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm bg-emerald-50/20">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Avg Max Rebound</span>
              <span className="text-xl font-black font-mono text-emerald-700">
                +{zoneAStats.avgMaxRebound}%
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">
                Peak within 63 sessions
              </span>
            </div>
          </div>

          {/* Traceable Zone A Historical Event Log Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                Zone A Historical Oversold Episodes (RSI &le; 30) &mdash; {zoneAEvents.length} Events Recorded
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Forward Horizons: 10d, 21d, 63d, 120d, 180d
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Oversold Date</th>
                    <th className="py-2.5 px-3 text-right">Oversold Price</th>
                    <th className="py-2.5 px-3 text-center">Min RSI</th>
                    <th className="py-2.5 px-3 text-right">10d Return</th>
                    <th className="py-2.5 px-3 text-right">21d Return</th>
                    <th className="py-2.5 px-3 text-right">63d Return</th>
                    <th className="py-2.5 px-3 text-right">120d Return</th>
                    <th className="py-2.5 px-3 text-right">180d Return</th>
                    <th className="py-2.5 px-3 text-right bg-emerald-50/50">Max Rebound (63d)</th>
                    <th className="py-2.5 px-3 text-center">RSI Recovered &gt;50</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {zoneAEvents.length > 0 ? (
                    zoneAEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {ev.oversoldDate}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          ₹{ev.oversoldPrice.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-700">
                          {ev.minRsi}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${ev.return10d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {ev.return10d >= 0 ? `+${ev.return10d}%` : `${ev.return10d}%`}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-black ${ev.return21d >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {ev.return21d >= 0 ? `+${ev.return21d}%` : `${ev.return21d}%`}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${ev.return63d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {ev.return63d >= 0 ? `+${ev.return63d}%` : `${ev.return63d}%`}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${ev.return120d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {ev.return120d >= 0 ? `+${ev.return120d}%` : `${ev.return120d}%`}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${ev.return180d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {ev.return180d >= 0 ? `+${ev.return180d}%` : `${ev.return180d}%`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700 bg-emerald-50/30">
                          +{ev.maxRebound63d}%
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {ev.recoveryDateAbove50 ? (
                            <span className="text-[11px]">
                              {ev.recoveryDateAbove50} ({ev.sessionsToRecoveryAbove50}d)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">&gt; 63 sessions</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                        No historical RSI &le; 30 oversold episodes identified in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ZONE B VIEW */}
      {activeZone === 'ZONE_B' && (
        <div className="space-y-6">
          {/* Zone B Methodology & 8% Rule Highlight */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Zone B (30 &lt; RSI &le; 35) Methodology:</strong> Preserves the canonical <strong>21-session rebound &ge; 8.00%</strong> rule.
                Strictly separated from Zone A to measure pure near-oversold bounce reliability without double-counting.
              </span>
            </div>
            <span className="font-mono font-bold text-amber-800 bg-white px-2.5 py-1 rounded border border-amber-200 self-start md:self-center shrink-0">
              8% Hit Rate: {zoneBStats.hitRate8Pct ?? 0}%
            </span>
          </div>

          {/* Zone B Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Near-Oversold Events</span>
              <span className="text-2xl font-black font-mono text-slate-900">
                {zoneBStats.sampleSize}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                30 &lt; RSI &le; 35 clean cycle touches
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rebound &ge; 8.00% Hit Rate</span>
              <span className="text-2xl font-black font-mono text-emerald-700">
                {zoneBStats.hitRate8Pct ?? 0}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Reached &ge; 8% within 21 sessions
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg 21-Session Return</span>
              <span className={`text-2xl font-black font-mono ${
                zoneBStats.avgReturn21d >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {zoneBStats.avgReturn21d >= 0 ? `+${zoneBStats.avgReturn21d}%` : `${zoneBStats.avgReturn21d}%`}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                Median: +{zoneBStats.medianReturn21d}%
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Max 21d Rebound</span>
              <span className="text-2xl font-black font-mono text-emerald-700">
                +{zoneBStats.avgMaxRebound}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Highest point inside 21 sessions
              </span>
            </div>
          </div>

          {/* Traceable Zone B Historical Event Log Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                Zone B Historical Near-Oversold Log (30 &lt; RSI &le; 35) &mdash; {zoneBEvents.length} Events
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Criteria: 21-Session Rebound &ge; 8.00%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Event Date</th>
                    <th className="py-2.5 px-3 text-right">Price at Touch</th>
                    <th className="py-2.5 px-3 text-center">RSI Level</th>
                    <th className="py-2.5 px-3 text-right">21-Day Return</th>
                    <th className="py-2.5 px-3 text-right">Max Rebound (21d)</th>
                    <th className="py-2.5 px-3 text-center">Sessions to Peak</th>
                    <th className="py-2.5 px-3 text-center">Reached &ge; 8.00%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {zoneBEvents.length > 0 ? (
                    zoneBEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {ev.eventDate}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          ₹{ev.price.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                          {ev.rsi}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${ev.return21d >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {ev.return21d >= 0 ? `+${ev.return21d}%` : `${ev.return21d}%`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                          +{ev.maxRebound21d}%
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700">
                          {ev.sessionsToPeak21d}d
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {ev.reached8Pct ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              YES (&ge;8%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              NO ({ev.maxRebound21d}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        No pure near-oversold episodes (30 &lt; RSI &le; 35) recorded in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
