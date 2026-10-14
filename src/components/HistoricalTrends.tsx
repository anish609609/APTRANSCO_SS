/**
 * SAT-TWIN: Historical Trends & Telemetry Time-Series Visualizer
 * Renders time-series trends for transformer temperatures, active loading,
 * grid frequency, and SF6 pressures with exportable data logs.
 */

import React, { useState } from 'react';
import { TelemetryState, telemetryService } from '../services/telemetryEngine';
import { SubstationAsset } from '../types/substation';
import { Download, RefreshCw, TrendingUp, Calendar, Filter } from 'lucide-react';

interface HistoricalTrendsProps {
  telemetry: TelemetryState;
  assets: SubstationAsset[];
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({
  telemetry,
  assets,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ICT-01');
  const [selectedMetric, setSelectedMetric] = useState<string>('windingHotSpotTempC');

  const history = telemetryService.getHistory(selectedAssetId, selectedMetric);

  const getMetricOptions = (assetId: string) => {
    if (assetId.startsWith('ICT')) {
      return [
        { key: 'windingHotSpotTempC', label: 'Winding Hot-Spot Temp (°C)', unit: '°C' },
        { key: 'topOilTempC', label: 'Top Oil Temperature (°C)', unit: '°C' },
        { key: 'activePowerMW', label: 'Active Power (MW)', unit: 'MW' },
      ];
    }
    return [{ key: 'frequencyHz', label: 'Grid Frequency (Hz)', unit: 'Hz' }];
  };

  const metricOptions = getMetricOptions(selectedAssetId);
  const currentMetricDef = metricOptions.find((m) => m.key === selectedMetric) || metricOptions[0];

  const values = history.map((h) => h.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 100;
  const avgVal = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  // Chart Dimensions
  const width = 800;
  const height = 300;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const yRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;
  const yMinPadded = minVal - yRange * 0.15;
  const yMaxPadded = maxVal + yRange * 0.15;
  const yTotal = yMaxPadded - yMinPadded;

  const points = history.map((item, idx) => {
    const x = padLeft + (idx / Math.max(history.length - 1, 1)) * chartW;
    const y = padTop + chartH - ((item.value - yMinPadded) / yTotal) * chartH;
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  const exportCSV = () => {
    if (history.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,AssetID,Metric,Value,Quality', ...history.map((h) => `${h.timestamp},${h.assetId},${h.metric},${h.value},${h.quality}`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SAT-TWIN_${selectedAssetId}_${selectedMetric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Asset:</span>
            <select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                const opts = getMetricOptions(e.target.value);
                setSelectedMetric(opts[0].key);
              }}
              className="bg-slate-950 border border-slate-700 text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="ICT-01">ICT-01 (315 MVA Transformer 1)</option>
              <option value="ICT-02">ICT-02 (315 MVA Transformer 2)</option>
              <option value="ICT-03">ICT-03 (315 MVA Transformer 3)</option>
              <option value="BUS-400-1">BUS-400-1 (400 kV Main Bus 1)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Telemetry Metric:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {metricOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export Time-Series CSV
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase">Latest Value</div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {values.length > 0 ? values[values.length - 1].toFixed(2) : '--'}{' '}
            <span className="text-xs text-slate-400 font-normal">{currentMetricDef?.unit}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase">Minimum</div>
          <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
            {values.length > 0 ? minVal.toFixed(2) : '--'}{' '}
            <span className="text-xs text-slate-400 font-normal">{currentMetricDef?.unit}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase">Maximum</div>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">
            {values.length > 0 ? maxVal.toFixed(2) : '--'}{' '}
            <span className="text-xs text-slate-400 font-normal">{currentMetricDef?.unit}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase">Average Mean</div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {values.length > 0 ? avgVal.toFixed(2) : '--'}{' '}
            <span className="text-xs text-slate-400 font-normal">{currentMetricDef?.unit}</span>
          </div>
        </div>
      </div>

      {/* Vector Line Graph Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {selectedAssetId} · {currentMetricDef?.label}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Ring Buffer: {history.length} samples</span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] select-none">
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const yVal = yMinPadded + ratio * yTotal;
              const yPos = padTop + chartH - ratio * chartH;
              return (
                <g key={ratio}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={width - padRight}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padLeft - 8}
                    y={yPos + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {yVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Time ticks */}
            {history.length > 1 && (
              <>
                <text
                  x={padLeft}
                  y={height - 15}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {new Date(history[0].timestamp).toLocaleTimeString()}
                </text>
                <text
                  x={width - padRight}
                  y={height - 15}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {new Date(history[history.length - 1].timestamp).toLocaleTimeString()}
                </text>
              </>
            )}

            {/* Area Fill */}
            {points.length > 0 && (
              <polygon
                points={`${padLeft},${padTop + chartH} ${points.join(' ')} ${width - padRight},${padTop + chartH}`}
                fill="url(#grad)"
                opacity="0.25"
              />
            )}

            {/* Trend Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Dots */}
            {history.map((h, idx) => {
              const x = padLeft + (idx / Math.max(history.length - 1, 1)) * chartW;
              const y = padTop + chartH - ((h.value - yMinPadded) / yTotal) * chartH;
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#10b981"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                >
                  <title>{`${new Date(h.timestamp).toLocaleTimeString()}: ${h.value.toFixed(2)} ${currentMetricDef?.unit}`}</title>
                </circle>
              );
            })}

            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};
