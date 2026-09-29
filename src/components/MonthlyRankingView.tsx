import React, { useState } from 'react';
import { IndexMonthlySeasonality, MonthlyCellStats, HeatmapPeriod } from '../types';
import { MONTH_SHORT_NAMES, MONTH_FULL_NAMES, rankIndicesForMonth } from '../monthlyHeatmapData';
import { Search, Trophy, TrendingUp, TrendingDown, ArrowUpDown, Info } from 'lucide-react';

interface MonthlyRankingViewProps {
  profiles: IndexMonthlySeasonality[];
  selectedPeriod: HeatmapPeriod;
  onSelectCell: (profile: IndexMonthlySeasonality, stats: MonthlyCellStats) => void;
}

export const MonthlyRankingView: React.FC<MonthlyRankingViewProps> = ({
  profiles,
  selectedPeriod,
  onSelectCell,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // Default to April (historically interesting)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const rankedItems = rankIndicesForMonth(profiles, selectedMonth);

  const filteredItems = rankedItems.filter((item) => {
    const matchesSearch =
      item.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.profile.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'ALL' || item.profile.category.toUpperCase() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Month Selector Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Index Seasonality Rankings for {MONTH_FULL_NAMES[selectedMonth - 1]}
            </h3>
            <p className="text-xs text-slate-500">
              Ranking all 42 indices by historical average return in {MONTH_FULL_NAMES[selectedMonth - 1]} ({selectedPeriod} Period).
            </p>
          </div>

          {/* Month quick buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {MONTH_SHORT_NAMES.map((mName, idx) => {
              const mNum = idx + 1;
              const isActive = selectedMonth === mNum;
              return (
                <button
                  key={mName}
                  onClick={() => setSelectedMonth(mNum)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search index name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['ALL', 'BROAD', 'SECTORAL', 'STRATEGY', 'THEMATIC'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
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

      {/* Ranked Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4">Index Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Avg Return %</th>
                <th className="py-3 px-3 text-right">Median %</th>
                <th className="py-3 px-3 text-right">Win Rate %</th>
                <th className="py-3 px-3 text-right">Best Year</th>
                <th className="py-3 px-3 text-right">Worst Year</th>
                <th className="py-3 px-3 text-right">Std Dev</th>
                <th className="py-3 px-4 text-center">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No matching indices found for the current search/category filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isPos = item.stats.avgReturn >= 0;
                  const isInsufficient = item.stats.insufficientHistory;

                  return (
                    <tr
                      key={item.profile.symbol}
                      onClick={() => onSelectCell(item.profile, item.stats)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4 text-center font-bold text-slate-500">
                        {item.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px]">
                            1
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px]">
                            2
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-[11px]">
                            3
                          </span>
                        ) : (
                          item.rank
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{item.profile.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.profile.symbol}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {item.profile.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                            isPos
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isPos ? `+${item.stats.avgReturn.toFixed(2)}%` : `${item.stats.avgReturn.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        {item.stats.medianReturn >= 0 ? `+${item.stats.medianReturn.toFixed(2)}%` : `${item.stats.medianReturn.toFixed(2)}%`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        {item.stats.winRatePct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">
                        +{item.stats.bestYear.returnPct.toFixed(1)}% ({item.stats.bestYear.year})
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-700">
                        {item.stats.worstYear.returnPct.toFixed(1)}% ({item.stats.worstYear.year})
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {item.stats.stdDev.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            isInsufficient
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          N = {item.stats.sampleSize}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Click any row to open the complete historical drill-down breakdown.</span>
          <span>Showing {filteredItems.length} of {profiles.length} indices</span>
        </div>
      </div>
    </div>
  );
};
