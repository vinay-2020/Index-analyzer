import Papa from 'papaparse';
import { IndexDataRow, MarketBreadthSummary } from './types';
import { getHistoricalMetricsForSymbol } from './historicalData';

// Robust normalizer for CSV columns with varying casings or underscores
function cleanKey(k: string): string {
  return k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseFyersCsv(csvText: string): IndexDataRow[] {
  const result = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (!result.data || result.data.length === 0) {
    throw new Error('CSV file has no readable data rows.');
  }

  return result.data.map((row, index) => {
    // Map case-insensitive keys
    const lookup: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      lookup[cleanKey(key)] = value;
    }

    const symbol =
      lookup['symbol'] ||
      lookup['tradingsymbol'] ||
      lookup['ticker'] ||
      lookup['indexname'] ||
      `INDEX_${index + 1}`;

    const name =
      lookup['name'] ||
      lookup['indexname'] ||
      lookup['index'] ||
      symbol.replace('NSE:', '').replace('-INDEX', '');

    const category = categorizeIndex(name);
    const date = lookup['date'] || lookup['timestamp'] || lookup['datetime'] || 'Latest';
    const close = Number(lookup['close'] || lookup['last'] || lookup['ltp'] || lookup['price'] || 0);
    const open = Number(lookup['open'] || close);
    const high = Number(lookup['high'] || Math.max(open, close));
    const low = Number(lookup['low'] || Math.min(open, close));
    const prevClose = Number(lookup['prevclose'] || lookup['previousclose'] || lookup['prev_close'] || open);

    let changePercent = 0;
    if (lookup['changepct'] !== undefined || lookup['changepercent'] !== undefined || lookup['pctchange'] !== undefined) {
      changePercent = Number(lookup['changepct'] ?? lookup['changepercent'] ?? lookup['pctchange']);
    } else if (prevClose > 0) {
      changePercent = Number((((close - prevClose) / prevClose) * 100).toFixed(2));
    }

    const ema20 = lookup['ema20'] || lookup['ema_20'] || lookup['20ema'] ? Number(lookup['ema20'] || lookup['ema_20'] || lookup['20ema']) : undefined;
    const ema50 = lookup['ema50'] || lookup['ema_50'] || lookup['50ema'] ? Number(lookup['ema50'] || lookup['ema_50'] || lookup['50ema']) : undefined;
    const ema200 = lookup['ema200'] || lookup['ema_200'] || lookup['200ema'] ? Number(lookup['ema200'] || lookup['ema_200'] || lookup['200ema']) : undefined;
    const rsi14 = lookup['rsi14'] || lookup['rsi_14'] || lookup['rsi'] ? Number(lookup['rsi14'] || lookup['rsi_14'] || lookup['rsi']) : undefined;

    const macd = lookup['macd'] ? Number(lookup['macd']) : undefined;
    const macdSignal = lookup['macdsignal'] || lookup['macd_signal'] || lookup['signal'] ? Number(lookup['macdsignal'] || lookup['macd_signal'] || lookup['signal']) : undefined;
    const macdHist = lookup['macdhist'] || lookup['macd_hist'] || lookup['hist'] ? Number(lookup['macdhist'] || lookup['macd_hist'] || lookup['hist']) : undefined;

    // Detect MACD Cross
    let macdCross: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    const rawCross = String(lookup['macdcross'] || lookup['macd_cross'] || lookup['cross'] || '').toUpperCase();
    if (rawCross.includes('BULL') || (macd !== undefined && macdSignal !== undefined && macd > macdSignal && (macdHist ?? 1) > 0)) {
      macdCross = 'BULLISH';
    } else if (rawCross.includes('BEAR') || (macd !== undefined && macdSignal !== undefined && macd < macdSignal)) {
      macdCross = 'BEARISH';
    }

    const aboveEma200 = ema200 !== undefined ? close > ema200 : true;
    const rsiVal = rsi14 ?? 50;
    const healthyPullback = aboveEma200 && rsiVal >= 45 && rsiVal <= 60;
    const historical = getHistoricalMetricsForSymbol(String(symbol), String(name));

    return {
      id: `row-${index + 1}-${symbol}`,
      symbol: String(symbol),
      name: String(name),
      category,
      date: String(date),
      open,
      high,
      low,
      close,
      prevClose,
      changePercent: Number(changePercent.toFixed(2)),
      volume: lookup['volume'] ? Number(lookup['volume']) : undefined,
      ema20,
      ema50,
      ema200,
      rsi14: rsi14 !== undefined ? Number(rsi14.toFixed(1)) : undefined,
      macd: macd !== undefined ? Number(macd.toFixed(2)) : undefined,
      macdSignal: macdSignal !== undefined ? Number(macdSignal.toFixed(2)) : undefined,
      macdHist: macdHist !== undefined ? Number(macdHist.toFixed(2)) : undefined,
      macdCross,
      aboveEma200,
      healthyPullback,
      historical,
      rawRecord: row,
    };
  });
}

function categorizeIndex(name: string): 'Broad' | 'Sectoral' | 'Thematic' | 'Strategy' | 'Other' {
  const upper = name.toUpperCase();
  if (upper.includes('VIX')) return 'Other';
  if (
    upper.includes('50') ||
    upper.includes('100') ||
    upper.includes('200') ||
    upper.includes('500') ||
    upper.includes('MIDCAP') ||
    upper.includes('SMALLCAP') ||
    upper.includes('MICROCAP')
  ) {
    if (upper.includes('VALUE') || upper.includes('ALPHA') || upper.includes('QUALITY') || upper.includes('BETA') || upper.includes('GROWTH') || upper.includes('VOLATILITY') || upper.includes('DIV')) {
      return 'Strategy';
    }
    return 'Broad';
  }
  if (
    upper.includes('BANK') ||
    upper.includes('IT') ||
    upper.includes('AUTO') ||
    upper.includes('PHARMA') ||
    upper.includes('FMCG') ||
    upper.includes('METAL') ||
    upper.includes('REALTY') ||
    upper.includes('ENERGY') ||
    upper.includes('INFRA') ||
    upper.includes('FIN') ||
    upper.includes('MEDIA') ||
    upper.includes('OIL') ||
    upper.includes('HEALTH') ||
    upper.includes('SERVICES') ||
    upper.includes('DURABLES')
  ) {
    return 'Sectoral';
  }
  if (upper.includes('CPSE') || upper.includes('PSE') || upper.includes('MNC') || upper.includes('COMMODITIES') || upper.includes('CONSUMPTION') || upper.includes('ESG')) {
    return 'Thematic';
  }
  return 'Other';
}

export function computeBreadth(data: IndexDataRow[]): MarketBreadthSummary {
  const total = data.length;
  if (total === 0) {
    return {
      total: 0,
      advances: 0,
      declines: 0,
      unchanged: 0,
      aboveEma200Count: 0,
      aboveEma200Pct: 0,
      macdBullishCount: 0,
      macdBearishCount: 0,
      healthyPullbackCount: 0,
      avgRsi: 0,
      avgChange: 0,
    };
  }

  let advances = 0;
  let declines = 0;
  let unchanged = 0;
  let aboveEma200Count = 0;
  let macdBullishCount = 0;
  let macdBearishCount = 0;
  let healthyPullbackCount = 0;
  let totalRsi = 0;
  let rsiCount = 0;
  let totalChange = 0;

  for (const row of data) {
    if (row.changePercent > 0.05) advances++;
    else if (row.changePercent < -0.05) declines++;
    else unchanged++;

    if (row.aboveEma200) aboveEma200Count++;
    if (row.macdCross === 'BULLISH') macdBullishCount++;
    if (row.macdCross === 'BEARISH') macdBearishCount++;
    if (row.healthyPullback) healthyPullbackCount++;

    if (row.rsi14 !== undefined) {
      totalRsi += row.rsi14;
      rsiCount++;
    }
    totalChange += row.changePercent;
  }

  return {
    total,
    advances,
    declines,
    unchanged,
    aboveEma200Count,
    aboveEma200Pct: Math.round((aboveEma200Count / total) * 100),
    macdBullishCount,
    macdBearishCount,
    healthyPullbackCount,
    avgRsi: rsiCount > 0 ? Number((totalRsi / rsiCount).toFixed(1)) : 50,
    avgChange: Number((totalChange / total).toFixed(2)),
  };
}
