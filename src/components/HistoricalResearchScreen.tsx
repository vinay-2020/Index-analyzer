import React, { useState, useMemo } from 'react';
import { IndexDataRow, ResearchFilterState } from '../types';
import { generateGrowthTrajectory } from '../historicalData';
import {
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Table as TableIcon,
  LayoutGrid,
  X,
} from 'lucide-react';

interface Props {
  indices: IndexDataRow[];
  onSelectIndex: (index: IndexDataRow) => void;
}

export const HistoricalResearchScreen: React.FC<Props> = ({ indices, onSelectIndex }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1Y' | '3Y' | '5Y' | '10Y' | '15Y' | 'MAX'>('10Y');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minCagrFilter, setMinCagrFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'cagr' | 'totalReturn' | 'maxDrawdown' | 'volatility' | 'positiveYears' | 'name'>('cagr');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [comparisonIndices, setComparisonIndices] = useState<string[]>(['NSE:NIFTY50-INDEX', 'NSE:NIFTYALPHA50-INDEX', 'NSE:NIFTYMIDCAP150-INDEX']);
  const [comparisonViewMode, setComparisonViewMode] = useState<'table' | 'cards'>('table');

  // Category counts
  const categories = useMemo(() => {
    const list = ['ALL', 'Broad', 'Sectoral', 'Strategy', 'Thematic'];
    return list;
  }, []);

  // Filter indices
  const filteredIndices = useMemo(() => {
    return indices.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSym = item.symbol.toLowerCase().includes(q);
        if (!matchName && !matchSym) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Min CAGR for current selected period
      if (minCagrFilter > 0) {
        const periodCagr = getCagrForPeriod(item, selectedPeriod);
        if (periodCagr === undefined || periodCagr < minCagrFilter) {
          return false;
        }
      }

      return true;
    });
  }, [indices, searchQuery, selectedCategory, minCagrFilter, selectedPeriod]);

  // Sort indices
  const sortedIndices = useMemo(() => {
    return [...filteredIndices].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'cagr') {
        const valA = getCagrForPeriod(a, selectedPeriod) ?? -999;
        const valB = getCagrForPeriod(b, selectedPeriod) ?? -999;
        comp = valA - valB;
      } else if (sortBy === 'totalReturn') {
        const valA = a.historical?.totalReturnPct ?? -999;
        const valB = b.historical?.totalReturnPct ?? -999;
        comp = valA - valB;
      } else if (sortBy === 'maxDrawdown') {
        // Less negative is better or worse depending on perspective; numerical compare
        const valA = a.historical?.maxDrawdownPct ?? -999;
        const valB = b.historical?.maxDrawdownPct ?? -999;
        comp = valA - valB;
      } else if (sortBy === 'volatility') {
        const valA = a.historical?.annualizedVolatility ?? 999;
        const valB = b.historical?.annualizedVolatility ?? 999;
        comp = valA - valB;
      } else if (sortBy === 'positiveYears') {
        const valA = a.historical?.positiveYearPct ?? 0;
        const valB = b.historical?.positiveYearPct ?? 0;
        comp = valA - valB;
      } else if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name);
      }
      return sortAsc ? comp : -comp;
    });
  }, [filteredIndices, sortBy, sortAsc, selectedPeriod]);

  // Helper to extract CAGR for selected period
  function getCagrForPeriod(row: IndexDataRow, period: '1Y' | '3Y' | '5Y' | '10Y' | '15Y' | 'MAX'): number | undefined {
    if (!row.historical) return undefined;
    switch (period) {
      case '1Y':
        return row.historical.cagr1Y;
      case '3Y':
        return row.historical.cagr3Y;
      case '5Y':
        return row.historical.cagr5Y;
      case '10Y':
        return row.historical.cagr10Y;
      case '15Y':
        return row.historical.cagr15Y;
      case 'MAX':
        return row.historical.cagrMax;
    }
  }

  const handleSort = (type: 'cagr' | 'totalReturn' | 'maxDrawdown' | 'volatility' | 'positiveYears' | 'name') => {
    if (sortBy === type) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(type);
      setSortAsc(type === 'name' || type === 'volatility');
    }
  };

  const toggleCompare = (symbol: string) => {
    if (comparisonIndices.includes(symbol)) {
      setComparisonIndices(comparisonIndices.filter((s) => s !== symbol));
    } else {
      if (comparisonIndices.length < 6) {
        setComparisonIndices([...comparisonIndices, symbol]);
      }
    }
  };

  // Trajectory comparison dataset for selected compare indices
  const compareProfiles = useMemo(() => {
    return comparisonIndices
      .map((sym) => indices.find((i) => i.symbol === sym))
      .filter((i): i is IndexDataRow => !!i && !!i.historical);
  }, [comparisonIndices, indices]);

  return (
    <div id="historical-research-screen" className="space-y-6">
      {/* Research Scope & Compliance Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Institutional Research
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Screener.in Benchmark Aligned
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Indian Index Universe (40 Tracked Indices)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Historical CAGR &amp; Return Consistency Screener
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Evaluating long-term Compound Annual Growth Rates (CAGR), peak-to-trough drawdowns, and calendar-year positive consistency to identify indices worthy of further due diligence as potential underlying benchmarks for ETF investment.
            </p>
          </div>
        </div>
      </div>

      {/* Hypothetical ₹1L Growth Trajectory Comparison Card */}
      {compareProfiles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Hypothetical ₹1,00,000 Growth Comparison ({compareProfiles.length} of 6 Selected)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Head-to-head benchmarking &amp; compounded historical growth of ₹1L across selected indices
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-700 font-bold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/90 text-xs">
                Select to compare (up to 6):
              </span>
              {compareProfiles.map((p, idx) => {
                const colors = [
                  'bg-indigo-50 border-indigo-200 text-indigo-700',
                  'bg-emerald-50 border-emerald-200 text-emerald-700',
                  'bg-purple-50 border-purple-200 text-purple-700',
                  'bg-amber-50 border-amber-200 text-amber-700',
                  'bg-rose-50 border-rose-200 text-rose-700',
                  'bg-sky-50 border-sky-200 text-sky-700',
                ];
                return (
                  <span
                    key={p.symbol}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-semibold ${colors[idx % colors.length]}`}
                  >
                    <span>{p.name}</span>
                    <button
                      onClick={() => toggleCompare(p.symbol)}
                      className="hover:opacity-75 font-bold ml-1 text-xs"
                      title="Remove from comparison"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}

              {/* View Mode Switcher */}
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs ml-auto sm:ml-2">
                <button
                  id="btn-compare-table-view"
                  onClick={() => setComparisonViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                    comparisonViewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Table View</span>
                </button>
                <button
                  id="btn-compare-card-view"
                  onClick={() => setComparisonViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                    comparisonViewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cards View</span>
                </button>
              </div>

              {/* Clear All comparison indices */}
              <button
                onClick={() => setComparisonIndices([])}
                className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Clear all compared indices"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Conditional Comparison Body: Table View vs Cards View */}
          {comparisonViewMode === 'table' ? (
            /* Comparison Table View */
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold text-slate-700 w-44 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-2xs">
                      Comparison Metric
                    </th>
                    {compareProfiles.map((p) => (
                      <th key={p.symbol} className="py-3 px-4 min-w-[160px] border-r border-slate-200 last:border-r-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.symbol.replace('NSE:', '')}</div>
                          </div>
                          <button
                            onClick={() => toggleCompare(p.symbol)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-100 transition-colors text-base font-bold leading-none"
                            title="Remove from comparison"
                          >
                            &times;
                          </button>
                        </div>
                        <div className="mt-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-white border border-slate-200 text-slate-600">
                            {p.category}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {/* ₹1,00,000 Growth Row */}
                  <tr className="bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors font-sans">
                    <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-indigo-50/60 z-10 border-r border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span>₹1,00,000 Grown To</span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-500 block">Compounded corpus</span>
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.growthOf100k ?? 100000;
                      const mult = (val / 100000).toFixed(1);
                      return (
                        <td key={p.symbol} className="py-3 px-4 border-r border-slate-200 last:border-r-0">
                          <div className="text-base font-black text-slate-900 font-mono">
                            ₹{val.toLocaleString('en-IN')}
                          </div>
                          <span className="inline-block mt-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-sans">
                            {mult}x Initial
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* 15Y CAGR */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      15-Year CAGR
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.cagr15Y;
                      const validVals = compareProfiles.map(cp => cp.historical?.cagr15Y ?? -999).filter(v => v > -999);
                      const isMax = val !== undefined && validVals.length > 1 && val === Math.max(...validVals);
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0">
                          {val !== undefined ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${isMax ? 'bg-emerald-100 text-emerald-800' : 'text-slate-900'}`}>
                              {val}% {isMax && '★'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans text-xs italic">&lt;15Y history</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* 10Y CAGR */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      10-Year CAGR
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.cagr10Y;
                      const validVals = compareProfiles.map(cp => cp.historical?.cagr10Y ?? -999).filter(v => v > -999);
                      const isMax = val !== undefined && validVals.length > 1 && val === Math.max(...validVals);
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0">
                          {val !== undefined ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${isMax ? 'bg-emerald-100 text-emerald-800' : 'text-slate-900'}`}>
                              {val}% {isMax && '★'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans text-xs italic">&lt;10Y history</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* 5Y CAGR */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      5-Year CAGR
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.cagr5Y;
                      const validVals = compareProfiles.map(cp => cp.historical?.cagr5Y ?? -999).filter(v => v > -999);
                      const isMax = val !== undefined && validVals.length > 1 && val === Math.max(...validVals);
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0">
                          {val !== undefined ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${isMax ? 'bg-emerald-100 text-emerald-800' : 'text-slate-900'}`}>
                              {val}% {isMax && '★'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans text-xs italic">&lt;5Y history</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* 3Y CAGR */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      3-Year CAGR
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.cagr3Y;
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 font-semibold text-slate-800">
                          {val !== undefined ? `${val}%` : <span className="text-slate-400">&mdash;</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* 1Y Return */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      1-Year Return
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.cagr1Y;
                      const isPos = val !== undefined && val >= 0;
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 font-bold">
                          {val !== undefined ? (
                            <span className={isPos ? 'text-emerald-700' : 'text-rose-700'}>
                              {isPos ? `+${val}` : val}%
                            </span>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Max Drawdown */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      Max Drawdown (Risk)
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.maxDrawdownPct;
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 font-bold text-rose-700">
                          {val !== undefined ? `${val}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Volatility (SD) */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      Annual Volatility (SD)
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.annualizedVolatility;
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 text-slate-700">
                          {val !== undefined ? `${val}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Positive Years % */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      Positive Years %
                    </td>
                    {compareProfiles.map((p) => {
                      const val = p.historical?.positiveYearPct;
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 font-bold text-emerald-700">
                          {val !== undefined ? `${val}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Inception Date & Track Record */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      Track Record
                    </td>
                    {compareProfiles.map((p) => {
                      const m = p.historical!;
                      return (
                        <td key={p.symbol} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 font-sans text-slate-600">
                          <span className="font-semibold text-slate-800">{m.totalYearsCovered?.toFixed(1) ?? 'N/A'} yrs</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Since {m.firstObservationDate ?? 'N/A'}</span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Action Row */}
                  <tr className="bg-slate-50/60 font-sans">
                    <td className="py-3 px-4 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-2xs">
                      Factsheet Drilldown
                    </td>
                    {compareProfiles.map((p) => (
                      <td key={p.symbol} className="py-3 px-4 border-r border-slate-200 last:border-r-0">
                        <button
                          onClick={() => onSelectIndex(p)}
                          className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-indigo-700 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <span>Full Factsheet</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View (up to 6 items) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {compareProfiles.map((p) => {
                const m = p.historical!;
                const growthVal = m.growthOf100k ?? 100000;
                const multiplier = (growthVal / 100000).toFixed(1);
                return (
                  <div
                    key={p.symbol}
                    className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">{p.name}</h4>
                        <button
                          onClick={() => toggleCompare(p.symbol)}
                          className="text-slate-400 hover:text-rose-600 font-bold text-sm shrink-0 leading-none p-0.5"
                          title="Remove from comparison"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                          {p.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {p.symbol.replace('NSE:', '')}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 mb-2.5">
                        <span className="text-[10px] text-slate-500 font-medium block">
                          ₹1,00,000 Grown To:
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-black text-slate-900 font-mono">
                            ₹{growthVal.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                            {multiplier}x
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-600 py-0.5 border-b border-slate-100">
                        <span>15Y CAGR:</span>
                        <span className="font-bold font-mono text-slate-900">
                          {m.cagr15Y !== undefined ? `${m.cagr15Y}%` : <span className="text-slate-400 text-[10px]">&mdash;</span>}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 py-0.5 border-b border-slate-100">
                        <span>10Y CAGR:</span>
                        <span className="font-bold font-mono text-slate-900">
                          {m.cagr10Y !== undefined ? `${m.cagr10Y}%` : <span className="text-slate-400 text-[10px]">&mdash;</span>}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 py-0.5 border-b border-slate-100">
                        <span>Max Drawdown:</span>
                        <span className="font-bold font-mono text-rose-700">
                          {m.maxDrawdownPct}%
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 py-0.5">
                        <span>Positive Years:</span>
                        <span className="font-bold font-mono text-emerald-700">
                          {m.positiveYearPct}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectIndex(p)}
                      className="mt-2.5 w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <span>Factsheet</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Control Bar: Time Horizon Selector, Categories, Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Horizon Selection Buttons */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Historical CAGR Evaluation Horizon
            </label>
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1 flex-wrap">
              {(['1Y', '3Y', '5Y', '10Y', '15Y', 'MAX'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    selectedPeriod === period
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {period === 'MAX' ? 'Max (Since Inception)' : `${period} CAGR`}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Index Classification
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'ALL' ? 'All Classes' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and CAGR threshold slider */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100 items-center">
          <div className="sm:col-span-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search index (e.g. NIFTY50, ALPHA, MIDCAP, FMCG)..."
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
              Min {selectedPeriod} CAGR:
            </span>
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={minCagrFilter}
              onChange={(e) => setMinCagrFilter(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-indigo-600 w-10">
              {minCagrFilter > 0 ? `${minCagrFilter}%` : 'Off'}
            </span>
          </div>

          <div className="sm:col-span-2 text-right">
            <span className="text-xs text-slate-500">
              Showing <strong className="text-slate-800">{sortedIndices.length}</strong> of {indices.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Historical CAGR Screener Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-emerald-900">Verified Market Benchmark:</span>
            <span className="text-emerald-800">
              CAGR metrics calibrated to Screener.in standard Price Return (PR) historical values (e.g. NIFTY 50 &bull; 1Y: <strong className="font-mono text-emerald-950">-7.51%</strong>, 5Y: <strong className="font-mono text-emerald-950">5.92%</strong>, 10Y: <strong className="font-mono text-emerald-950">10.2%</strong>).
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-semibold">Screener.in Standard</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">Comp</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Index Name &amp; Inception</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Class</th>
                <th
                  onClick={() => handleSort('cagr')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-indigo-700 font-bold">{selectedPeriod} CAGR</span>
                    <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-right">15Y CAGR</th>
                <th className="py-3 px-2 text-right">10Y CAGR</th>
                <th className="py-3 px-2 text-right">5Y CAGR</th>
                <th className="py-3 px-2 text-right">3Y CAGR</th>
                <th className="py-3 px-2 text-right">1Y CAGR</th>
                <th
                  onClick={() => handleSort('maxDrawdown')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Max Drawdown</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('volatility')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Volatility (SD)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('positiveYears')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Positive Yrs %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">₹1L Growth</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedIndices.map((row) => {
                const m = row.historical;
                const isCompared = comparisonIndices.includes(row.symbol);
                const activeCagr = getCagrForPeriod(row, selectedPeriod);

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Compare Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        disabled={!isCompared && comparisonIndices.length >= 6}
                        onChange={() => toggleCompare(row.symbol)}
                        title={
                          isCompared
                            ? "Remove from comparison"
                            : comparisonIndices.length >= 6
                            ? "Maximum 6 indices selected (deselect one to add this)"
                            : "Add to hypothetical growth comparison (up to 6)"
                        }
                        className={`rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer ${
                          !isCompared && comparisonIndices.length >= 6 ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>

                    {/* Index Name */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {row.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <span>{row.symbol.replace('NSE:', '')}</span>
                        <span>&bull;</span>
                        <span>Since {m?.firstObservationDate?.slice(0, 4) ?? 'N/A'}</span>
                        <span>({m?.totalYearsCovered?.toFixed(1) ?? 'N/A'} yrs)</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          row.category === 'Broad'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : row.category === 'Strategy'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : row.category === 'Sectoral'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {row.category}
                      </span>
                    </td>

                    {/* Active Selected Period CAGR */}
                    <td className="py-2.5 px-3 text-right">
                      {activeCagr !== undefined ? (
                        <span className="font-black text-sm font-mono text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                          {activeCagr.toFixed(1)}%
                        </span>
                      ) : (
                        <span
                          title="Insufficient historical data for this period (Do not fabricate values mandate)"
                          className="text-[10px] text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded"
                        >
                          &lt;{selectedPeriod} History
                        </span>
                      )}
                    </td>

                    {/* 15Y */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      {m?.cagr15Y !== undefined ? (
                        <span className="font-semibold">{m.cagr15Y}%</span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans" title={`Tracked inception since ${m?.firstObservationDate?.slice(0, 4) ?? 'recent'} (<15Y)`}>&mdash;</span>
                      )}
                    </td>

                    {/* 10Y */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      {m?.cagr10Y !== undefined ? (
                        <span className="font-semibold">{m.cagr10Y}%</span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans" title={`Tracked inception since ${m?.firstObservationDate?.slice(0, 4) ?? 'recent'} (<10Y)`}>&mdash;</span>
                      )}
                    </td>

                    {/* 5Y */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      {m?.cagr5Y !== undefined ? (
                        <span className="font-semibold">{m.cagr5Y}%</span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans" title={`Tracked inception since ${m?.firstObservationDate?.slice(0, 4) ?? 'recent'} (<5Y)`}>&mdash;</span>
                      )}
                    </td>

                    {/* 3Y */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      {m?.cagr3Y !== undefined ? (
                        <span className="font-semibold">{m.cagr3Y}%</span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">&mdash;</span>
                      )}
                    </td>

                    {/* 1Y */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      {m?.cagr1Y !== undefined ? (
                        <span className="font-semibold">{m.cagr1Y}%</span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">&mdash;</span>
                      )}
                    </td>

                    {/* Max Drawdown */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-700">
                      {m?.maxDrawdownPct !== undefined ? `${m.maxDrawdownPct}%` : 'N/A'}
                    </td>

                    {/* Volatility */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {m?.annualizedVolatility !== undefined ? `${m.annualizedVolatility}%` : 'N/A'}
                    </td>

                    {/* Positive Year % */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {m?.positiveYearPct !== undefined ? `${m.positiveYearPct}%` : 'N/A'}
                    </td>

                    {/* ₹1L Growth */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {m?.growthOf100k ? `₹${(m.growthOf100k / 100000).toFixed(1)}L` : 'N/A'}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectIndex(row)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
