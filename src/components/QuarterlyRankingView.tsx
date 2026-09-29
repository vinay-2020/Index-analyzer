import React, { useState, useMemo } from 'react';
import { IndexQuarterlySeasonality, QuarterlyCellStats, HeatmapPeriod } from '../types';
import {
  QUARTER_NUMBERS,
  QUARTER_NAMES,
  QUARTER_FULL_LABELS,
  QUARTER_MONTHS,
} from '../quarterlyHeatmapData';
import { MONTH_SHORT_NAMES } from '../monthlyHeatmapData';
import { Search, Trophy, TrendingUp, TrendingDown, ArrowUpDown, Info } from 'lucide-react';

interface QuarterlyRankingViewProps {
  profiles: IndexQuarterlySeasonality[];
  selectedPeriod: HeatmapPeriod;
  onSelectCell: (profile: IndexQuarterlySeasonality, stats: QuarterlyCellStats) => void;
}

export const QuarterlyRankingView: React.FC<QuarterlyRankingViewProps> = ({
  profiles,
  selectedPeriod,
  onSelectCell,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<number>(4); // Default to Q4 (historically strong Diwali/Festive rally)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const rankedItems = useMemo(() => {
    return profiles
      .map((p) => {
        const stats = p.quarters[selectedQuarter];
        return {
          profile: p,
          stats,
          avgReturn: stats ? stats.avgReturn : -999,
          winRate: stats ? stats.winRatePct : 0,
        };
      })
      .sort((a, b) => b.avgReturn - a.avgReturn);
  }, [profiles, selectedQuarter]);

  const filteredItems = useMemo(() => {
    return rankedItems.filter((item) => {
      const matchesSearch =
        item.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.profile.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'ALL' || item.profile.category.toUpperCase() === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [rankedItems, searchTerm, categoryFilter]);

  const topPerformer = filteredItems[0];
  const worstPerformer = filteredItems[filteredItems.length - 1];

  return (
    <div className="space-y-4">
      {/* Quarter Selector & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Index Seasonality Rankings for {QUARTER_FULL_LABELS[selectedQuarter]}
            </h3>
            <p className="text-xs text-slate-500">
              Ranking indices by historical compounded average return in {QUARTER_FULL_LABELS[selectedQuarter]} ({selectedPeriod} Period).
            </p>
          </div>

          {/* Quarter selector buttons */}
          <div className="flex items-center gap-1.5">
            {QUARTER_NUMBERS.map((q) => {
              const isActive = selectedQuarter === q;
              return (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                    isActive
                      ? 'bg-violet-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {QUARTER_FULL_LABELS[q]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ranked index name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['ALL', 'BROAD', 'SECTORAL', 'THEMATIC', 'STRATEGY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top / Bottom Leaders Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topPerformer && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                #1 Outperformer ({QUARTER_NAMES[selectedQuarter - 1]})
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {topPerformer.profile.name}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Win Rate: {topPerformer.stats.winRatePct.toFixed(1)}% ({topPerformer.stats.sampleSize} yrs)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-700 font-mono">
                +{topPerformer.stats.avgReturn.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400 block">Quarterly Avg</span>
            </div>
          </div>
        )}

        {worstPerformer && (
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Underperformer ({QUARTER_NAMES[selectedQuarter - 1]})
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {worstPerformer.profile.name}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Win Rate: {worstPerformer.stats.winRatePct.toFixed(1)}% ({worstPerformer.stats.sampleSize} yrs)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-rose-700 font-mono">
                {worstPerformer.stats.avgReturn.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400 block">Quarterly Avg</span>
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Rank</th>
              <th className="py-2.5 px-3">Index Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Avg Return</th>
              <th className="py-2.5 px-3 text-right">Median</th>
              <th className="py-2.5 px-3 text-right">Win Rate</th>
              <th className="py-2.5 px-3 text-right">Std Dev (σ)</th>
              <th className="py-2.5 px-3 text-center">Best Year</th>
              <th className="py-2.5 px-3 text-center">Worst Year</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredItems.map((item, idx) => {
              const { profile, stats } = item;
              const isPositive = stats.avgReturn >= 0;

              return (
                <tr key={profile.symbol} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-center font-sans font-bold text-slate-500">
                    #{idx + 1}
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <div className="font-bold text-slate-900">{profile.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{profile.symbol}</div>
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {profile.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded ${
                        isPositive ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'
                      }`}
                    >
                      {isPositive ? `+${stats.avgReturn.toFixed(2)}` : stats.avgReturn.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {stats.medianReturn >= 0 ? `+${stats.medianReturn.toFixed(2)}` : stats.medianReturn.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {stats.winRatePct.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {stats.stdDev.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-center text-[11px] text-emerald-700">
                    +{stats.bestYear.returnPct.toFixed(1)}% ({stats.bestYear.year})
                  </td>
                  <td className="py-2 px-3 text-center text-[11px] text-rose-700">
                    {stats.worstYear.returnPct.toFixed(1)}% ({stats.worstYear.year})
                  </td>
                  <td className="py-2 px-3 text-center font-sans">
                    <button
                      onClick={() => onSelectCell(profile, stats)}
                      className="px-2 py-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900 hover:bg-violet-50 rounded transition-colors"
                    >
                      Drilldown
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
