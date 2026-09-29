import React from 'react';
import { MarketQuarterlySeasonality } from '../types';
import { QUARTER_FULL_LABELS } from '../quarterlyHeatmapData';
import { TrendingUp, TrendingDown, Calendar, PieChart, Sparkles } from 'lucide-react';

interface MarketQuarterlySeasonalityChartProps {
  seasonalityData: MarketQuarterlySeasonality[];
  onSelectQuarter?: (quarter: number) => void;
  selectedQuarter?: number;
}

const QUARTER_CYCLE_NOTES: Record<number, { theme: string; desc: string }> = {
  1: {
    theme: 'Union Budget & Fiscal Year-End',
    desc: 'Pre-budget speculation in Jan, Union Budget announcement in Feb, and NAV/tax-saving portfolio rebalancing in March.',
  },
  2: {
    theme: 'New FY Allocation & Monsoon Onset',
    desc: 'Fresh corporate and institutional capital allocations in April, Q4 earnings reactions, and early monsoon progress.',
  },
  3: {
    theme: 'Monsoon Progression & Festive Build-up',
    desc: 'Agricultural output cues, corporate supply chain buildup for peak festive season, and intermediate consolidation.',
  },
  4: {
    theme: 'Diwali Festive Demand & Year-End Rally',
    desc: 'Muhurat trading, robust festive retail consumption, corporate advance tax collections, and global institutional positioning.',
  },
};

export const MarketQuarterlySeasonalityChart: React.FC<MarketQuarterlySeasonalityChartProps> = ({
  seasonalityData,
  onSelectQuarter,
  selectedQuarter,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600" />
            Cross-Index Market Quarterly Seasonality Benchmark
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Equal-weighted average historical return and index breadth across the entire universe for each financial quarter.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span className="text-slate-600">Historically Positive Quarter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500"></div>
            <span className="text-slate-600">Historically Negative Quarter</span>
          </div>
        </div>
      </div>

      {/* 4-Quarter Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {seasonalityData.map((item) => {
          const isSelected = selectedQuarter === item.quarter;
          const isPositive = item.avgReturn >= 0;
          const fullQuarter = QUARTER_FULL_LABELS[item.quarter];
          const cycleNote = QUARTER_CYCLE_NOTES[item.quarter];

          return (
            <div
              key={item.quarter}
              onClick={() => onSelectQuarter && onSelectQuarter(item.quarter)}
              className={`p-4 rounded-xl border transition-all text-left relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-violet-600 bg-violet-50/40 ring-2 ring-violet-600/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 tracking-wide">
                    {fullQuarter}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      isPositive
                        ? 'text-emerald-800 bg-emerald-100/70'
                        : 'text-rose-800 bg-rose-100/70'
                    }`}
                  >
                    {isPositive ? `+${item.avgReturn.toFixed(2)}` : item.avgReturn.toFixed(2)}%
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
                    <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                      {isPositive ? `+${item.avgReturn.toFixed(2)}` : item.avgReturn.toFixed(2)}%
                    </span>
                    <span className="text-xs font-normal text-slate-500 font-mono">
                      (Med: {item.medianReturn >= 0 ? `+${item.medianReturn.toFixed(2)}` : item.medianReturn.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar representing win rate */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Index Win Rate</span>
                    <span className="font-bold text-slate-900">{item.winRatePct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.winRatePct >= 55 ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      style={{ width: `${Math.min(100, Math.max(5, item.winRatePct))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{item.indicesPositiveCount} of {item.totalIndices} indices positive</span>
                  </div>
                </div>
              </div>

              {/* Quarterly Cycle Insight */}
              {cycleNote && (
                <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px]">
                  <span className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                    <Sparkles className="w-3 h-3 text-violet-600" />
                    {cycleNote.theme}
                  </span>
                  <p className="text-slate-500 line-clamp-2">
                    {cycleNote.desc}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
