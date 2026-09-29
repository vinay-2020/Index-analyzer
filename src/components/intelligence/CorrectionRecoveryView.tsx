import React, { useState } from 'react';
import {
  HistoricalCorrectionEpisode,
  CorrectionBucketSummary,
  DeepDrawdownEpisode,
} from '../../indexIntelligenceEngine';
import {
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  History,
  Timer,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface CorrectionRecoveryViewProps {
  indexName: string;
  episodes: HistoricalCorrectionEpisode[];
  bucketSummaries: CorrectionBucketSummary[];
  deepDrawdowns: DeepDrawdownEpisode[];
}

export const CorrectionRecoveryView: React.FC<CorrectionRecoveryViewProps> = ({
  indexName,
  episodes,
  bucketSummaries,
  deepDrawdowns,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'short_term_buckets' | 'deep_drawdown_rebounds'>('short_term_buckets');
  const [selectedBucketFilter, setSelectedBucketFilter] = useState<string>('ALL');

  const filteredEpisodes = episodes.filter((ep) => {
    if (selectedBucketFilter === 'ALL') return true;
    return ep.depthBucket === selectedBucketFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Navigation */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ArrowDownRight className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Historical Correction &amp; Recovery Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Strictly empirical study of how {indexName} historically behaved during market drawdowns.
            Evaluates 120-session post-trough recovery trajectories and subsequent multi-phase price action.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('short_term_buckets')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeSubTab === 'short_term_buckets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            A. 120-Session Rebound by Depth
          </button>
          <button
            onClick={() => setActiveSubTab('deep_drawdown_rebounds')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeSubTab === 'deep_drawdown_rebounds'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            B. Initial Rebound After ≥30% DD
          </button>
        </div>
      </div>

      {activeSubTab === 'short_term_buckets' && (
        <div className="space-y-6">
          {/* Methodology Banner */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Methodology:</strong> Previous Peak &rarr; Drawdown &rarr; Trough &rarr; Highest Close Within 120 Trading Sessions.
              </span>
            </div>
            <span className="font-mono font-bold text-[11px] text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
              Total Recorded Episodes: {episodes.length}
            </span>
          </div>

          {/* Depth Buckets Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {bucketSummaries.map((b) => (
              <div
                key={b.bucket}
                onClick={() => setSelectedBucketFilter(selectedBucketFilter === b.bucket ? 'ALL' : b.bucket)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedBucketFilter === b.bucket
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-800 font-mono">
                    {b.bucket}
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                    N = {b.episodeCount}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono mt-2">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Avg Drawdown:</span>
                    <span className="font-bold text-rose-700">{b.avgDrawdownPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Avg Rebound:</span>
                    <span className="font-bold text-emerald-700">+{b.avgReboundPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Median Rebound:</span>
                    <span className="font-bold text-slate-800">+{b.medianReboundPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Sessions to Peak:</span>
                    <span className="font-bold text-slate-700">{b.avgSessionsToPeak}d</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                    <span>Rebound &ge;10%:</span>
                    <span className="font-bold text-indigo-700">{b.winRate10Pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter badge if active */}
          {selectedBucketFilter !== 'ALL' && (
            <div className="flex items-center justify-between text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700">
              <span>Showing only <strong>{selectedBucketFilter}</strong> episodes ({filteredEpisodes.length})</span>
              <button
                onClick={() => setSelectedBucketFilter('ALL')}
                className="text-indigo-600 font-bold hover:underline"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Traceable Historical Episode Log Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                Traceable Historical Correction Episodes ({filteredEpisodes.length} Records)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Evaluated over 120 Trading Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Peak Date</th>
                    <th className="py-2.5 px-3">Trough Date</th>
                    <th className="py-2.5 px-3 text-right">Drawdown</th>
                    <th className="py-2.5 px-3">Bucket</th>
                    <th className="py-2.5 px-3 text-right">Recovery Peak (120d)</th>
                    <th className="py-2.5 px-3 text-right">Rebound %</th>
                    <th className="py-2.5 px-3 text-center">Sessions to Peak</th>
                    <th className="py-2.5 px-3 text-center">Thresholds Reached</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredEpisodes.length > 0 ? (
                    filteredEpisodes.map((ep) => (
                      <tr key={ep.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{ep.peakDate}</div>
                          <div className="text-[10px] text-slate-400">₹{ep.peakClose.toLocaleString()}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{ep.troughDate}</div>
                          <div className="text-[10px] text-slate-400">₹{ep.troughClose.toLocaleString()}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                          {ep.drawdownPct}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {ep.depthBucket}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          <div>{ep.recoveryPeakDate}</div>
                          <div className="text-[10px] text-slate-400">₹{ep.recoveryPeakClose.toLocaleString()}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          +{ep.recoveryPct}%
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700">
                          {ep.sessionsToPeak}d
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${ep.reachedThreshold5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>&ge;5%</span>
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${ep.reachedThreshold10 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>&ge;10%</span>
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${ep.reachedThreshold15 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>&ge;15%</span>
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${ep.reachedThreshold20 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>&ge;20%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                        No historical correction episodes found for this filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'deep_drawdown_rebounds' && (
        <div className="space-y-6">
          {/* Methodology Banner */}
          <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-lg text-xs text-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Framework:</strong> Peak &rarr; Drawdown &ge; 30% &rarr; Trough &rarr; First Rebound Peak &rarr; Subsequent &ge; 10% Decline.
              </span>
            </div>
            <span className="font-mono font-bold text-[11px] text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
              Episodes Identified: {deepDrawdowns.length}
            </span>
          </div>

          {/* Deep Drawdown Episodes Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Historical Major Bear Market Sequence Log
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Identifies False Dawn / Secondary Wave Formations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Peak Date</th>
                    <th className="py-2.5 px-3 text-right">Deep Drawdown</th>
                    <th className="py-2.5 px-3">Trough Date</th>
                    <th className="py-2.5 px-3">First Rebound Peak</th>
                    <th className="py-2.5 px-3 text-right">Rebound %</th>
                    <th className="py-2.5 px-3 text-center">Duration</th>
                    <th className="py-2.5 px-3 text-right">Subsequent Decline</th>
                    <th className="py-2.5 px-3">Subsequent Trough</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {deepDrawdowns.length > 0 ? (
                    deepDrawdowns.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{d.peakDate}</div>
                          <div className="text-[10px] text-slate-400">₹{d.peakClose.toLocaleString()}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-700">
                          {d.drawdownPct}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{d.troughDate}</div>
                          <div className="text-[10px] text-slate-400">₹{d.troughClose.toLocaleString()}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{d.firstReboundPeakDate}</div>
                          <div className="text-[10px] text-slate-400">₹{d.firstReboundPeakClose.toLocaleString()}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          +{d.reboundPct}%
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700">
                          {d.reboundDurationSessions}d
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {d.subsequentDeclinePct}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{d.subsequentDeclineTroughDate}</div>
                          <div className="text-[10px] text-slate-400">₹{d.subsequentDeclineTroughClose.toLocaleString()}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                        No &ge; 30% deep drawdown cycles with secondary declines found in this index history.
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
