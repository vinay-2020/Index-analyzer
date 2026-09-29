import React from 'react';
import { IndexDataRow } from '../types';
import {
  TrendingUp,
  TrendingDown,
  X,
  Sliders,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';

interface Props {
  indexData: IndexDataRow | null;
  onClose: () => void;
}

export const IndexDetailModal: React.FC<Props> = ({ indexData, onClose }) => {
  if (!indexData) return null;

  const isPositive = indexData.changePercent >= 0;
  const rsi = indexData.rsi14 ?? 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{indexData.name}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {indexData.category}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{indexData.symbol}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Price Snapshot */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                Last Traded Price
              </span>
              <div className="text-xl font-bold font-mono text-slate-900">
                {indexData.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                Daily Return
              </span>
              <div
                className={`text-xl font-bold font-mono flex items-center justify-end gap-1 ${
                  isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? `+${indexData.changePercent}%` : `${indexData.changePercent}%`}
              </div>
            </div>
          </div>

          {/* Quant Technical Indicators */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-2 uppercase text-[10px] tracking-wider">
              Institutional Technical Profile
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-400 block mb-0.5">200 EMA Status</span>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  {indexData.aboveEma200 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Bullish (&gt; 200 EMA)
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Bearish (&lt; 200 EMA)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Level: {indexData.ema200 ? Math.round(indexData.ema200) : 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-400 block mb-0.5">RSI (14 Period)</span>
                <div className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                  <span className="font-mono">{rsi}</span>
                  {rsi >= 45 && rsi <= 60 ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Healthy Pullback
                    </span>
                  ) : rsi > 60 ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Bullish Momentum
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Weak
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">Target Range: 45 - 60</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-400 block mb-0.5">MACD Signal Crossover</span>
                <div className="font-semibold text-sm">
                  {indexData.macdCross === 'BULLISH' ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Fresh Bullish Cross
                    </span>
                  ) : indexData.macdCross === 'BEARISH' ? (
                    <span className="text-rose-700 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Bearish Cross
                    </span>
                  ) : (
                    <span className="text-slate-500">Neutral</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  MACD: {indexData.macd ?? 0} | Sig: {indexData.macdSignal ?? 0}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-400 block mb-0.5">20 / 50 EMA Trend</span>
                <div className="font-mono text-xs font-medium text-slate-700">
                  EMA 20: {indexData.ema20 ? Math.round(indexData.ema20) : 'N/A'}
                  <br />
                  EMA 50: {indexData.ema50 ? Math.round(indexData.ema50) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Historical Long-Term CAGR & Consistency Factsheet */}
          {indexData.historical && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
                  Historical CAGR &amp; Consistency Factsheet
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  {indexData.historical.totalYearsCovered?.toFixed(1)} yrs of data
                </span>
              </div>

              {/* CAGR Horizontal Bar Grid */}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-center">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">15Y CAGR</span>
                  <span className="text-sm font-black font-mono text-indigo-950">
                    {indexData.historical.cagr15Y !== undefined ? `${indexData.historical.cagr15Y}%` : <span className="text-slate-400 text-xs font-normal" title="Index history is less than 15 years">&lt;15Y Data</span>}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-center">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">10Y CAGR</span>
                  <span className="text-sm font-black font-mono text-indigo-950">
                    {indexData.historical.cagr10Y !== undefined ? `${indexData.historical.cagr10Y}%` : <span className="text-slate-400 text-xs font-normal" title="Index history is less than 10 years">&lt;10Y Data</span>}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-center">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">5Y CAGR</span>
                  <span className="text-sm font-black font-mono text-indigo-950">
                    {indexData.historical.cagr5Y !== undefined ? `${indexData.historical.cagr5Y}%` : <span className="text-slate-400 text-xs font-normal" title="Index history is less than 5 years">&lt;5Y Data</span>}
                  </span>
                </div>
              </div>

              {/* Consistency & Downside Risk */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block">Peak Drawdown</span>
                  <span className="font-mono font-bold text-rose-700 text-xs">
                    {indexData.historical.maxDrawdownPct}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Annualized Volatility</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">
                    {indexData.historical.annualizedVolatility}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Positive Calendar Yrs</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {indexData.historical.positiveYearPct}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Hypothetical ₹1L Growth</span>
                  <span className="font-mono font-bold text-indigo-700 text-xs">
                    ₹{indexData.historical.growthOf100k?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Intraday Range */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex justify-between">
            <div>
              <span className="text-slate-400">Open:</span>{' '}
              <strong className="font-mono">{indexData.open}</strong>
            </div>
            <div>
              <span className="text-slate-400">High:</span>{' '}
              <strong className="font-mono text-emerald-700">{indexData.high}</strong>
            </div>
            <div>
              <span className="text-slate-400">Low:</span>{' '}
              <strong className="font-mono text-rose-700">{indexData.low}</strong>
            </div>
            <div>
              <span className="text-slate-400">Prev Close:</span>{' '}
              <strong className="font-mono">{indexData.prevClose}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
