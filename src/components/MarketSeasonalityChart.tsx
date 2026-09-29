import React from 'react';
import { MarketMonthlySeasonality } from '../types';
import { MONTH_FULL_NAMES } from '../monthlyHeatmapData';
import { TrendingUp, TrendingDown, Percent, Calendar } from 'lucide-react';

interface MarketSeasonalityChartProps {
  seasonalityData: MarketMonthlySeasonality[];
  onSelectMonth?: (month: number) => void;
  selectedMonth?: number;
}

export const MarketSeasonalityChart: React.FC<MarketSeasonalityChartProps> = ({
  seasonalityData,
  onSelectMonth,
  selectedMonth,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Cross-Index Market Seasonality (12-Month Profile)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Equal-weighted average historical return and index breadth across the universe for each calendar month.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span className="text-slate-600">Historically Positive Month</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500"></div>
            <span className="text-slate-600">Historically Negative Month</span>
          </div>
        </div>
      </div>

      {/* 12-Month Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {seasonalityData.map((item) => {
          const isSelected = selectedMonth === item.month;
          const isPositive = item.avgReturn >= 0;
          const fullMonth = MONTH_FULL_NAMES[item.month - 1];

          return (
            <button
              key={item.month}
              type="button"
              onClick={() => onSelectMonth && onSelectMonth(item.month)}
              className={`text-left p-3.5 rounded-lg border transition-all relative ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                  {item.monthName}
                </span>
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                )}
              </div>

              <div className="mt-2">
                <div
                  className={`text-lg font-extrabold ${
                    isPositive ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isPositive ? `+${item.avgReturn.toFixed(2)}%` : `${item.avgReturn.toFixed(2)}%`}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Win Rate:</span>
                  <span className="font-semibold text-slate-700">{item.winRatePct.toFixed(1)}%</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {item.indicesPositiveCount} of {item.totalIndices} indices up
                </div>
              </div>

              {/* Relative mini bar indicator */}
              <div className="mt-2.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, item.winRatePct))}%` }}
                ></div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <span>Click any month above to filter rankings or see cross-universe distribution.</span>
        <span>Equal-weighted composite across active indices in selection.</span>
      </div>
    </div>
  );
};
