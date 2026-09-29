import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';

interface Props {
  csvContent: string;
  totalIndices: number;
  onRunAnalysis: (customPrompt?: string) => Promise<string>;
  analysisResult: string | null;
  isLoading: boolean;
}

export const GeminiAnalystPanel: React.FC<Props> = ({
  csvContent,
  totalIndices,
  onRunAnalysis,
  analysisResult,
  isLoading,
}) => {
  const [customDirective, setCustomDirective] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAnalyze = () => {
    onRunAnalysis(customDirective);
  };

  return (
    <div id="gemini-analyst-panel" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              Gemini Institutional Quant Analyst
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                FYERS_HIST_DATA 1D
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates market breadth across {totalIndices} indices, detects MACD crossovers &amp; 200 EMA / RSI healthy pullbacks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysisResult && (
            <button
              id="copy-gemini-output-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Output'}
            </button>
          )}

          <button
            id="run-gemini-analyst-btn"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Dataset...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Run Institutional Quant Prompt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Prompt Box & One-Click Institutional Directives */}
      <div className="mt-4 space-y-2.5">
        {/* One-click quick research prompts */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Research Questions:
          </span>
          <button
            type="button"
            onClick={() => {
              setCustomDirective('Identify which indices have historically delivered the strongest long-term returns based on 15Y and 10Y CAGR, and analyze their return consistency.');
              onRunAnalysis('Identify which indices have historically delivered the strongest long-term returns based on 15Y and 10Y CAGR, and analyze their return consistency.');
            }}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Highest 15Y CAGR Leaders
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomDirective('Evaluate factor and smart beta strategy indices (Alpha 50, Momentum 30, Quality 30, Low Vol 30) for potential long-term ETF allocation.');
              onRunAnalysis('Evaluate factor and smart beta strategy indices (Alpha 50, Momentum 30, Quality 30, Low Vol 30) for potential long-term ETF allocation.');
            }}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Factor Indices for ETF Allocation
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomDirective('Filter indices trading above 200 EMA with healthy RSI pullbacks (45-60) and fresh MACD bullish crossovers.');
              onRunAnalysis('Filter indices trading above 200 EMA with healthy RSI pullbacks (45-60) and fresh MACD bullish crossovers.');
            }}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            MACD Cross + 200 EMA Setup
          </button>
        </div>

        <div className="flex gap-2">
          <input
            id="custom-analyst-directive-input"
            type="text"
            placeholder="e.g. Compare 10Y CAGR of Nifty 50 vs Midcap 150, or assess downside drawdown resilience..."
            value={customDirective}
            onChange={(e) => setCustomDirective(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) handleAnalyze();
            }}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Analysis Output Section */}
      {analysisResult && (
        <div id="gemini-analysis-output" className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                Institutional Quant Report
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Model: gemini-2.5-flash</span>
          </div>

          <div className="prose prose-slate max-w-none text-xs leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-200 overflow-x-auto">
            <Markdown>{analysisResult}</Markdown>
          </div>
        </div>
      )}

      {/* Script Equivalent Preview Box (matches user python script) */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active Dataset: <strong>FYERS_HIST_DATA.csv</strong> ({totalIndices} index symbols loaded)</span>
        </div>
        <span className="font-mono">Prompt: MACD_CROSS == 'BULLISH' | RSI_14 in [45, 60]</span>
      </div>
    </div>
  );
};
