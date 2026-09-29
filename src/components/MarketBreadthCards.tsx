import React from 'react';
import { MarketBreadthSummary } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  Sliders,
  Percent,
} from 'lucide-react';

interface Props {
  breadth: MarketBreadthSummary;
  activePreset: string;
  onSelectPreset: (preset: any) => void;
}

export const MarketBreadthCards: React.FC<Props> = ({
  breadth,
  activePreset,
  onSelectPreset,
}) => {
  const advancePercent = breadth.total > 0 ? Math.round((breadth.advances / breadth.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Total Breadth & Advances/Declines */}
      <div
        id="card-market-breadth"
        onClick={() => onSelectPreset('ALL')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activePreset === 'ALL'
            ? 'bg-slate-900 border-slate-700 text-white ring-2 ring-emerald-500/50 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-medium tracking-wide uppercase text-slate-400 mb-1.5">
          <span>Market Breadth (A/D)</span>
          <Activity className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">
            {breadth.advances}
            <span className="text-sm font-normal text-slate-400 mx-1">/</span>
            {breadth.declines}
          </span>
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              breadth.avgChange >= 0
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {breadth.avgChange >= 0 ? `+${breadth.avgChange}%` : `${breadth.avgChange}%`} avg
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{breadth.total} FYERS Indices</span>
          <span className="font-mono">{advancePercent}% advancing</span>
        </div>
      </div>

      {/* Fresh MACD Bullish Crossovers */}
      <div
        id="card-macd-bullish"
        onClick={() => onSelectPreset('MACD_BULLISH')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activePreset === 'MACD_BULLISH'
            ? 'bg-slate-900 border-slate-700 text-white ring-2 ring-emerald-500/50 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-medium tracking-wide uppercase text-slate-400 mb-1.5">
          <span>MACD Bullish Cross</span>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-600">
            {breadth.macdBullishCount}
          </span>
          <span className="text-xs text-slate-400">
            of {breadth.total} ({Math.round((breadth.macdBullishCount / (breadth.total || 1)) * 100)}%)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Momentum Buy Signal</span>
          <span className="font-mono text-rose-500">{breadth.macdBearishCount} Bearish</span>
        </div>
      </div>

      {/* Healthy Pullback Setup */}
      <div
        id="card-healthy-pullback"
        onClick={() => onSelectPreset('HEALTHY_PULLBACK')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activePreset === 'HEALTHY_PULLBACK'
            ? 'bg-slate-900 border-slate-700 text-white ring-2 ring-emerald-500/50 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-medium tracking-wide uppercase text-slate-400 mb-1.5">
          <span>Healthy Pullback</span>
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600">
            {breadth.healthyPullbackCount}
          </span>
          <span className="text-xs text-slate-400">Prime Dip Buys</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>&gt; 200 EMA + RSI 45-60</span>
          <span className="font-mono text-emerald-600">Quant filtered</span>
        </div>
      </div>

      {/* Structural Trend (> 200 EMA) */}
      <div
        id="card-above-200ema"
        onClick={() => onSelectPreset('ABOVE_200_EMA')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          activePreset === 'ABOVE_200_EMA'
            ? 'bg-slate-900 border-slate-700 text-white ring-2 ring-emerald-500/50 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-medium tracking-wide uppercase text-slate-400 mb-1.5">
          <span>Trend: &gt; 200 EMA</span>
          <Percent className="w-4 h-4 text-sky-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-sky-600">
            {breadth.aboveEma200Pct}%
          </span>
          <span className="text-xs text-slate-400">
            ({breadth.aboveEma200Count}/{breadth.total} above)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Market Health</span>
          <span className="font-mono text-slate-600">Avg RSI: {breadth.avgRsi}</span>
        </div>
      </div>
    </div>
  );
};
