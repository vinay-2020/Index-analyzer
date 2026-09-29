import React, { useState } from 'react';
import { IndexDataRow } from '../types';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  indices: IndexDataRow[];
  onSelectIndex?: (index: IndexDataRow) => void;
}

type SortField =
  | 'name'
  | 'close'
  | 'changePercent'
  | 'rsi14'
  | 'aboveEma200'
  | 'macdCross';

export const ScreenerTable: React.FC<Props> = ({ indices, onSelectIndex }) => {
  const [sortField, setSortField] = useState<SortField>('changePercent');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name');
    }
  };

  const sortedIndices = [...indices].sort((a, b) => {
    let comp = 0;
    if (sortField === 'name') {
      comp = a.name.localeCompare(b.name);
    } else if (sortField === 'close') {
      comp = a.close - b.close;
    } else if (sortField === 'changePercent') {
      comp = a.changePercent - b.changePercent;
    } else if (sortField === 'rsi14') {
      comp = (a.rsi14 ?? 0) - (b.rsi14 ?? 0);
    } else if (sortField === 'aboveEma200') {
      comp = (a.aboveEma200 ? 1 : 0) - (b.aboveEma200 ? 1 : 0);
    } else if (sortField === 'macdCross') {
      comp = a.macdCross.localeCompare(b.macdCross);
    }
    return sortAsc ? comp : -comp;
  });

  return (
    <div id="screener-table-container" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Index Name</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </th>
              <th className="py-3 px-3">Category</th>
              <th
                onClick={() => handleSort('close')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>LTP / Close</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('changePercent')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>% Change</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('aboveEma200')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>200 EMA</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('rsi14')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>RSI (14)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('macdCross')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>MACD Cross</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Quant Setup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedIndices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No index records match the active quant criteria.
                </td>
              </tr>
            ) : (
              sortedIndices.map((row) => {
                const isPositive = row.changePercent >= 0;
                const rsi = row.rsi14 ?? 50;

                return (
                  <tr
                    key={row.id}
                    id={`index-row-${row.symbol.replace(/[^a-zA-Z0-9]/g, '-')}`}
                    onClick={() => onSelectIndex?.(row)}
                    className="hover:bg-slate-50/75 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{row.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{row.symbol}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600">
                        {row.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {row.close.toLocaleString('en-IN', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {row.changePercent > 0 ? `+${row.changePercent}%` : `${row.changePercent}%`}
                      </span>
                    </td>

                    {/* 200 EMA Status */}
                    <td className="py-3 px-3 text-center font-mono text-xs">
                      {row.ema200 ? (
                        <div className="inline-flex items-center gap-1">
                          {row.aboveEma200 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Above
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Below
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            ({Math.round(row.ema200)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">N/A</span>
                      )}
                    </td>

                    {/* RSI (14) */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                            rsi >= 70
                              ? 'bg-rose-100 text-rose-800'
                              : rsi <= 30
                              ? 'bg-emerald-100 text-emerald-800'
                              : rsi >= 45 && rsi <= 60
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rsi}
                        </span>
                      </div>
                    </td>

                    {/* MACD Cross */}
                    <td className="py-3 px-3 text-center">
                      {row.macdCross === 'BULLISH' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          <TrendingUp className="w-3 h-3" /> Bullish
                        </span>
                      ) : row.macdCross === 'BEARISH' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">
                          <TrendingDown className="w-3 h-3" /> Bearish
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-500">
                          Neutral
                        </span>
                      )}
                    </td>

                    {/* Quant Setup Tag */}
                    <td className="py-3 px-4 text-center">
                      {row.healthyPullback ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                          Healthy Pullback
                        </span>
                      ) : row.aboveEma200 && row.macdCross === 'BULLISH' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                          Bullish Trend
                        </span>
                      ) : !row.aboveEma200 ? (
                        <span className="inline-block px-2 py-0.5 text-[11px] text-slate-400">
                          Below 200 EMA
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[11px] text-slate-400">
                          Consolidating
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
