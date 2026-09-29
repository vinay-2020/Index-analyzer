import React, { useState, useMemo } from 'react';
import { getProcessedInitialData, indicesToCsv } from './defaultData';
import { parseFyersCsv, computeBreadth } from './csvParser';
import { IndexDataRow, ScreenerFilterState } from './types';
import { MarketBreadthCards } from './components/MarketBreadthCards';
import { ScreenerFilters } from './components/ScreenerFilters';
import { ScreenerTable } from './components/ScreenerTable';
import { HistoricalResearchScreen } from './components/HistoricalResearchScreen';
import { MonthlyHeatmapScreen } from './components/MonthlyHeatmapScreen';
import { QuarterlyHeatmapScreen } from './components/QuarterlyHeatmapScreen';
import { IndexIntelligenceScreen } from './components/IndexIntelligenceScreen';
import { GeminiAnalystPanel } from './components/GeminiAnalystPanel';
import { DriveImportModal } from './components/DriveImportModal';
import { IndexDetailModal } from './components/IndexDetailModal';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import {
  BarChart3,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  FileCode2,
  TrendingUp,
  LineChart,
  CalendarRange,
  Compass,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'index_intelligence' | 'historical_research' | 'daily_screener' | 'monthly_heatmap' | 'quarterly_heatmap'>('index_intelligence');
  const [indices, setIndices] = useState<IndexDataRow[]>(getProcessedInitialData());
  const [currentDatasetName, setCurrentDatasetName] = useState('FYERS_HIST_DATA.csv (42 Indices)');
  const [selectedRow, setSelectedRow] = useState<IndexDataRow | null>(null);

  // Gemini state
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ScreenerFilterState>({
    search: '',
    category: 'ALL',
    preset: 'ALL',
    minRsi: 0,
    maxRsi: 100,
    minChange: -100,
    maxChange: 100,
    macdCrossFilter: 'ALL',
  });

  // Breadth summary calculation across ALL loaded indices
  const breadthSummary = useMemo(() => computeBreadth(indices), [indices]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    indices.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [indices]);

  // Filtered indices based on current user controls and presets
  const filteredIndices = useMemo(() => {
    return indices.filter((item) => {
      // Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSymbol = item.symbol.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchName && !matchSymbol && !matchCat) return false;
      }

      // Category
      if (filters.category !== 'ALL' && item.category !== filters.category) {
        return false;
      }

      // Preset rules
      if (filters.preset === 'MACD_BULLISH' && item.macdCross !== 'BULLISH') {
        return false;
      }
      if (filters.preset === 'HEALTHY_PULLBACK' && !item.healthyPullback) {
        return false;
      }
      if (filters.preset === 'ABOVE_200_EMA' && !item.aboveEma200) {
        return false;
      }
      if (filters.preset === 'BELOW_200_EMA' && item.aboveEma200) {
        return false;
      }

      // Explicit MACD Cross filter if set
      if (filters.macdCrossFilter !== 'ALL' && item.macdCross !== filters.macdCrossFilter) {
        return false;
      }

      return true;
    });
  }, [indices, filters]);

  // Load new CSV content (from Drive or local file upload)
  const handleLoadCsvContent = (content: string, filename: string) => {
    try {
      setErrorNotice(null);
      const parsed = parseFyersCsv(content);
      setIndices(parsed);
      setCurrentDatasetName(filename);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to parse CSV file.');
    }
  };

  // Reset to default FYERS 42 indices
  const handleResetToDefault = () => {
    setIndices(getProcessedInitialData());
    setCurrentDatasetName('FYERS_HIST_DATA.csv (42 Indices)');
    setErrorNotice(null);
  };

  // Call Gemini Quant Analyst API
  const handleRunGeminiAnalysis = async (customInstructions?: string): Promise<string> => {
    setIsAnalyzing(true);
    setErrorNotice(null);
    try {
      const csvString = indicesToCsv(indices);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvData: csvString,
          customInstructions,
          indicesCount: indices.length,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Gemini analysis failed (Status ${res.status})`);
      }

      const data = await res.json();
      setGeminiAnalysis(data.analysis);
      return data.analysis;
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to call Gemini API.');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export current table view as CSV
  const handleExportCsv = () => {
    const csv = indicesToCsv(filteredIndices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FYERS_SCREENED_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                  Quant Index Screener &amp; Analyzer
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  FYERS &bull; Indian Indices
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Long-term CAGR research, return consistency &bull; Technical breadth, MACD &amp; 200 EMA
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs in Navbar */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              id="tab-index-intelligence"
              onClick={() => setActiveTab('index_intelligence')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'index_intelligence'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Historical Intelligence</span>
            </button>
            <button
              id="tab-historical-research"
              onClick={() => setActiveTab('historical_research')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'historical_research'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Historical CAGR</span>
            </button>
            <button
              id="tab-daily-screener"
              onClick={() => setActiveTab('daily_screener')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'daily_screener'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daily Technical Screener</span>
            </button>
            <button
              id="tab-monthly-heatmap"
              onClick={() => setActiveTab('monthly_heatmap')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'monthly_heatmap'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 text-violet-600" />
              <span>Indices Monthly Heatmap</span>
            </button>
            <button
              id="tab-quarterly-heatmap"
              onClick={() => setActiveTab('quarterly_heatmap')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'quarterly_heatmap'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quarterly Monthly Heatmap</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <DriveImportModal
              onLoadCsvContent={handleLoadCsvContent}
              currentFilename={currentDatasetName}
            />

            <button
              id="export-csv-btn"
              onClick={handleExportCsv}
              title="Export filtered indices to CSV"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              id="reset-default-btn"
              onClick={handleResetToDefault}
              title="Reset to standard 42 indices"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Mobile view toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-around gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('index_intelligence')}
          className={`py-1.5 px-2.5 text-xs font-bold rounded-lg text-center whitespace-nowrap ${
            activeTab === 'index_intelligence'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Historical Intelligence
        </button>
        <button
          onClick={() => setActiveTab('historical_research')}
          className={`py-1.5 px-2.5 text-xs font-bold rounded-lg text-center whitespace-nowrap ${
            activeTab === 'historical_research'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Historical CAGR
        </button>
        <button
          onClick={() => setActiveTab('daily_screener')}
          className={`py-1.5 px-2.5 text-xs font-bold rounded-lg text-center whitespace-nowrap ${
            activeTab === 'daily_screener'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Daily Screener
        </button>
        <button
          onClick={() => setActiveTab('monthly_heatmap')}
          className={`py-1.5 px-2.5 text-xs font-bold rounded-lg text-center whitespace-nowrap ${
            activeTab === 'monthly_heatmap'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Monthly Heatmap
        </button>
        <button
          onClick={() => setActiveTab('quarterly_heatmap')}
          className={`py-1.5 px-2.5 text-xs font-bold rounded-lg text-center whitespace-nowrap ${
            activeTab === 'quarterly_heatmap'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Quarterly Heatmap
        </button>
      </div>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Error notification banner */}
        {errorNotice && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <span>{errorNotice}</span>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-500 hover:text-rose-700 font-bold px-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Gemini Quantitative Analyst Panel (Persistent across modes) */}
        <GeminiAnalystPanel
          csvContent={indicesToCsv(indices)}
          totalIndices={indices.length}
          onRunAnalysis={handleRunGeminiAnalysis}
          analysisResult={geminiAnalysis}
          isLoading={isAnalyzing}
        />

        {/* Dynamic View based on Active Mode (Five Independent Modules) */}
        {activeTab === 'index_intelligence' ? (
          <IndexIntelligenceScreen />
        ) : activeTab === 'historical_research' ? (
          <HistoricalResearchScreen
            indices={indices}
            onSelectIndex={(index) => setSelectedRow(index)}
          />
        ) : activeTab === 'monthly_heatmap' ? (
          <MonthlyHeatmapScreen indices={indices} />
        ) : activeTab === 'quarterly_heatmap' ? (
          <QuarterlyHeatmapScreen indices={indices} />
        ) : (
          <div className="space-y-6">
            {/* Market Breadth Header Summary Cards */}
            <MarketBreadthCards
              breadth={breadthSummary}
              activePreset={filters.preset}
              onSelectPreset={(p) => setFilters({ ...filters, preset: p })}
            />

            {/* Screener Interactive Filter Bar */}
            <ScreenerFilters
              filters={filters}
              onFilterChange={setFilters}
              categories={categories}
              totalIndices={indices.length}
              filteredCount={filteredIndices.length}
              onReset={() =>
                setFilters({
                  search: '',
                  category: 'ALL',
                  preset: 'ALL',
                  minRsi: 0,
                  maxRsi: 100,
                  minChange: -100,
                  maxChange: 100,
                  macdCrossFilter: 'ALL',
                })
              }
            />

            {/* Main Quantitative Screener Table */}
            <ScreenerTable
              indices={filteredIndices}
              onSelectIndex={(index) => setSelectedRow(index)}
            />
          </div>
        )}
      </main>

      {/* Detailed Inspection Modal */}
      <IndexDetailModal
        indexData={selectedRow}
        onClose={() => setSelectedRow(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FYERS Historical Index Screener &bull; Institutional Quant Engine</span>
          <span className="font-mono text-[11px]">
            Connected with Google Drive &bull; Powered by Gemini 2.5 Flash
          </span>
        </div>
      </footer>
    </div>
  );
}
