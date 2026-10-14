/**
 * SAT-TWIN: Interactive Vector Single-Line Diagram (SLD)
 * Conforms to IEC 60617 / IEEE standard electrical substation symbology.
 * Displays 400 kV and 220 kV busbars, bays, circuit breakers, isolators,
 * power transformers, and bus reactor with live telemetry overlays.
 */

import React, { useState } from 'react';
import { TelemetryState } from '../services/telemetryEngine';
import { SubstationAsset } from '../types/substation';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

interface SLDProps {
  telemetry: TelemetryState;
  onSelectAsset: (assetId: string) => void;
  selectedAssetId: string | null;
  assets: SubstationAsset[];
}

export const SingleLineDiagram: React.FC<SLDProps> = ({
  telemetry,
  onSelectAsset,
  selectedAssetId,
  assets,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Helper colors
  const COLOR_400KV = '#f97316'; // Orange / Red for 400 kV
  const COLOR_220KV = '#06b6d4'; // Cyan for 220 kV
  const COLOR_33KV = '#a855f7';  // Purple for 33 kV tertiary
  const COLOR_DEENERGIZED = '#64748b';

  const getCbColor = (state: string) => {
    // In utility electrical practice: RED = CLOSED (Energized/Live), GREEN = OPEN (Isolated/Safe)
    if (state === 'CLOSED') return '#ef4444'; // Red = Closed
    if (state === 'OPEN') return '#10b981'; // Green = Open
    return '#eab308'; // Amber = Intermediate/Unknown
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden relative">
      {/* Top SLD Legend & Tooling */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-4 z-10 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-200">Interactive Single-Line Diagram (SLD)</span>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#f97316] rounded-sm"></span> 400 kV Bus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#06b6d4] rounded-sm"></span> 220 kV Bus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#ef4444] border border-white/40"></span> CB Closed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#10b981] border border-white/40"></span> CB Open
            </span>
          </div>
        </div>

        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.0))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400">Scale {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div
        className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-slate-900 to-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-full origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            {/* Filter glow */}
            <filter id="glow-400" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="1200" height="600" fill="url(#grid)" />

          {/* ==================================================== */}
          {/* 400 kV SECTION                                       */}
          {/* ==================================================== */}
          <text x="50" y="55" fill="#f97316" fontSize="14" fontWeight="bold" fontFamily="monospace">
            400 kV MAIN SWITCHYARD (NOMINAL 400 kV)
          </text>

          {/* 400 kV Bus 1 */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectAsset('BUS-400-1')}
          >
            <line
              x1="70"
              y1="85"
              x2="1140"
              y2="85"
              stroke={COLOR_400KV}
              strokeWidth={selectedAssetId === 'BUS-400-1' ? '6' : '4'}
              filter="url(#glow-400)"
            />
            <text x="80" y="78" fill="#f97316" fontSize="11" fontFamily="monospace" fontWeight="bold">
              400 kV MAIN BUS 1: {telemetry.busbars['BUS-400-1']?.phaseVoltageR_KV.toFixed(1)} kV · {telemetry.gridFrequencyHz} Hz
            </text>
          </g>

          {/* 400 kV Bus 2 */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectAsset('BUS-400-2')}
          >
            <line
              x1="70"
              y1="120"
              x2="1140"
              y2="120"
              stroke={COLOR_400KV}
              strokeWidth={selectedAssetId === 'BUS-400-2' ? '6' : '4'}
              filter="url(#glow-400)"
            />
            <text x="80" y="137" fill="#f97316" fontSize="11" fontFamily="monospace" fontWeight="bold">
              400 kV MAIN BUS 2: {telemetry.busbars['BUS-400-2']?.phaseVoltageR_KV.toFixed(1)} kV
            </text>
          </g>

          {/* 400 kV Bus Coupler Bay 407 */}
          <g className="cursor-pointer" onClick={() => onSelectAsset('CB-407')}>
            <line x1="1100" y1="85" x2="1100" y2="120" stroke={COLOR_400KV} strokeWidth="2.5" />
            <rect
              x="1092"
              y="97"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-407']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <text x="1100" y="109" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              BC
            </text>
            <text x="1115" y="108" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              CB-407 (Coupler)
            </text>
          </g>

          {/* 125 MVAR Bus Reactor RE-401 */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectAsset('RE-401')}
          >
            <line x1="140" y1="85" x2="140" y2="170" stroke={COLOR_400KV} strokeWidth="2.5" />
            {/* Reactor Breaker CB-406 */}
            <rect
              x="132"
              y="110"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-406']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            {/* Reactor Coil Inductor Symbol */}
            <circle cx="140" cy="180" r="10" fill="none" stroke="#f97316" strokeWidth="2" />
            <circle cx="140" cy="195" r="10" fill="none" stroke="#f97316" strokeWidth="2" />
            <line x1="140" y1="205" x2="140" y2="218" stroke="#f97316" strokeWidth="2" />
            {/* Ground */}
            <line x1="130" y1="218" x2="150" y2="218" stroke="#94a3b8" strokeWidth="2" />
            <line x1="134" y1="222" x2="146" y2="222" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="137" y1="225" x2="143" y2="225" stroke="#94a3b8" strokeWidth="1" />
            <text x="140" y="240" fill="#f97316" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              RE-401 (125 MVAR)
            </text>
            <text x="140" y="253" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              {telemetry.reactors['RE-401']?.reactivePowerMVAR.toFixed(1)} MVAR
            </text>
          </g>

          {/* 400 kV Outgoing Feeders */}
          {/* Feeder 1: VTPS Line (Bay 404) */}
          <g className="cursor-pointer" onClick={() => onSelectAsset('CB-404')}>
            <line x1="880" y1="85" x2="880" y2="30" stroke={COLOR_400KV} strokeWidth="2.5" />
            <rect
              x="872"
              y="45"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-404']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            {/* Outgoing Arrow */}
            <polygon points="880,18 875,30 885,30" fill="#f97316" />
            <text x="880" y="12" fill="#fdba74" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              VTPS Feeder 1
            </text>
            <text x="880" y="75" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              CB-404 ({telemetry.breakers['CB-404']?.sf6PressureBar} bar)
            </text>
          </g>

          {/* Feeder 2: Tallapalli Line (Bay 405) */}
          <g className="cursor-pointer" onClick={() => onSelectAsset('CB-405')}>
            <line x1="1000" y1="85" x2="1000" y2="30" stroke={COLOR_400KV} strokeWidth="2.5" />
            <rect
              x="992"
              y="45"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-405']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            {/* Outgoing Arrow */}
            <polygon points="1000,18 995,30 1005,30" fill="#f97316" />
            <text x="1000" y="12" fill="#fdba74" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              Tallapalli Feeder 2
            </text>
            <text x="1000" y="75" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              CB-405
            </text>
          </g>

          {/* ==================================================== */}
          {/* 3 x 315 MVA POWER TRANSFORMERS (ICT-1, ICT-2, ICT-3) */}
          {/* ==================================================== */}
          {[
            { id: 'ICT-01', cbHv: 'CB-401', cbLv: 'CB-201', x: 300, label: '315 MVA ICT-1' },
            { id: 'ICT-02', cbHv: 'CB-402', cbLv: 'CB-202', x: 500, label: '315 MVA ICT-2' },
            { id: 'ICT-03', cbHv: 'CB-403', cbLv: 'CB-203', x: 700, label: '315 MVA ICT-3' },
          ].map((ict) => {
            const ictData = telemetry.transformers[ict.id];
            const cbHvData = telemetry.breakers[ict.cbHv];
            const cbLvData = telemetry.breakers[ict.cbLv];
            const isSelected = selectedAssetId === ict.id;
            const isTripped = cbHvData?.state === 'OPEN';

            return (
              <g key={ict.id}>
                {/* Connection from 400 kV Bus to HV Breaker */}
                <line
                  x1={ict.x}
                  y1="85"
                  x2={ict.x}
                  y2="175"
                  stroke={isTripped ? COLOR_DEENERGIZED : COLOR_400KV}
                  strokeWidth="2.5"
                />

                {/* Isolator DS-401A / DS-402A etc */}
                <circle cx={ict.x} cy="140" r="3" fill="#cbd5e1" />
                <line x1={ict.x - 4} y1="137" x2={ict.x + 6} y2="143" stroke="#cbd5e1" strokeWidth="2" />

                {/* 400 kV Breaker */}
                <g className="cursor-pointer" onClick={() => onSelectAsset(ict.cbHv)}>
                  <rect
                    x={ict.x - 9}
                    y="165"
                    width="18"
                    height="18"
                    fill={getCbColor(cbHvData?.state || 'CLOSED')}
                    stroke="#fff"
                    strokeWidth={selectedAssetId === ict.cbHv ? '2.5' : '1.5'}
                  />
                  <text
                    x={ict.x + 14}
                    y="178"
                    fill="#cbd5e1"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {ict.cbHv}
                  </text>
                </g>

                {/* Line from HV Breaker to Transformer */}
                <line
                  x1={ict.x}
                  y1="183"
                  x2={ict.x}
                  y2="245"
                  stroke={isTripped ? COLOR_DEENERGIZED : COLOR_400KV}
                  strokeWidth="2.5"
                />

                {/* Transformer 2-Winding / Auto-transformer Symbology */}
                <g
                  className="cursor-pointer group"
                  onClick={() => onSelectAsset(ict.id)}
                >
                  {/* Selection Highlight Ring */}
                  {isSelected && (
                    <circle cx={ict.x} cy="275" r="36" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2" />
                  )}

                  {/* Primary 400 kV Winding Circle */}
                  <circle
                    cx={ict.x}
                    cy="265"
                    r="20"
                    fill="#1e293b"
                    stroke={isTripped ? COLOR_DEENERGIZED : COLOR_400KV}
                    strokeWidth="3"
                  />
                  {/* Secondary 220 kV Winding Circle */}
                  <circle
                    cx={ict.x}
                    cy="285"
                    r="20"
                    fill="#1e293b"
                    stroke={isTripped ? COLOR_DEENERGIZED : COLOR_220KV}
                    strokeWidth="3"
                  />

                  {/* Rating & Identity Label */}
                  <rect
                    x={ict.x - 70}
                    y="312"
                    width="140"
                    height="45"
                    rx="4"
                    fill="#0f172a"
                    stroke={isSelected ? '#10b981' : '#334155'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={ict.x}
                    y="325"
                    fill="#fff"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {ict.label}
                  </text>
                  <text
                    x={ict.x}
                    y="338"
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {ictData ? `${ictData.activePowerMW} MW · ${ictData.apparentPowerMVA} MVA` : '0 MW'}
                  </text>
                  <text
                    x={ict.x}
                    y="350"
                    fill={ictData && ictData.windingHotSpotTempC > 95 ? '#f43f5e' : '#fbbf24'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {ictData ? `Wdg: ${ictData.windingHotSpotTempC}°C · Tap ${ictData.tapPosition}` : '--'}
                  </text>
                </g>

                {/* Line from Transformer to LV Breaker */}
                <line
                  x1={ict.x}
                  y1="305"
                  x2={ict.x}
                  y2="370"
                  stroke={isTripped ? COLOR_DEENERGIZED : COLOR_220KV}
                  strokeWidth="2.5"
                />

                {/* 220 kV Breaker */}
                <g className="cursor-pointer" onClick={() => onSelectAsset(ict.cbLv)}>
                  <rect
                    x={ict.x - 9}
                    y="370"
                    width="18"
                    height="18"
                    fill={getCbColor(cbLvData?.state || 'CLOSED')}
                    stroke="#fff"
                    strokeWidth={selectedAssetId === ict.cbLv ? '2.5' : '1.5'}
                  />
                  <text
                    x={ict.x + 14}
                    y="382"
                    fill="#cbd5e1"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {ict.cbLv}
                  </text>
                </g>

                {/* Line from LV Breaker to 220 kV Bus */}
                <line
                  x1={ict.x}
                  y1="388"
                  x2={ict.x}
                  y2="465"
                  stroke={isTripped ? COLOR_DEENERGIZED : COLOR_220KV}
                  strokeWidth="2.5"
                />
              </g>
            );
          })}

          {/* ==================================================== */}
          {/* 220 kV SECTION                                       */}
          {/* ==================================================== */}
          <text x="50" y="440" fill="#06b6d4" fontSize="14" fontWeight="bold" fontFamily="monospace">
            220 kV MAIN SWITCHYARD (NOMINAL 220 kV)
          </text>

          {/* 220 kV Bus 1 */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectAsset('BUS-220-1')}
          >
            <line
              x1="70"
              y1="465"
              x2="1140"
              y2="465"
              stroke={COLOR_220KV}
              strokeWidth={selectedAssetId === 'BUS-220-1' ? '6' : '4'}
              filter="url(#glow-400)"
            />
            <text x="80" y="458" fill="#06b6d4" fontSize="11" fontFamily="monospace" fontWeight="bold">
              220 kV MAIN BUS 1: {telemetry.busbars['BUS-220-1']?.phaseVoltageR_KV.toFixed(1)} kV
            </text>
          </g>

          {/* 220 kV Bus 2 */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectAsset('BUS-220-2')}
          >
            <line
              x1="70"
              y1="500"
              x2="1140"
              y2="500"
              stroke={COLOR_220KV}
              strokeWidth={selectedAssetId === 'BUS-220-2' ? '6' : '4'}
              filter="url(#glow-400)"
            />
            <text x="80" y="515" fill="#06b6d4" fontSize="11" fontFamily="monospace" fontWeight="bold">
              220 kV MAIN BUS 2: {telemetry.busbars['BUS-220-2']?.phaseVoltageR_KV.toFixed(1)} kV
            </text>
          </g>

          {/* 220 kV Bus Coupler Bay 207 */}
          <g className="cursor-pointer" onClick={() => onSelectAsset('CB-207')}>
            <line x1="1100" y1="465" x2="1100" y2="500" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="1092"
              y="477"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-207']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <text x="1100" y="489" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              BC
            </text>
            <text x="1115" y="488" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              CB-207 (Coupler)
            </text>
          </g>

          {/* 220 kV Outgoing Feeder Bays */}
          {/* Feeder 1: Perecherla (Bay 204) */}
          <g className="cursor-pointer" onClick={() => onSelectAsset('CB-204')}>
            <line x1="880" y1="465" x2="880" y2="560" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="872"
              y="520"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-204']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <polygon points="880,575 875,560 885,560" fill="#06b6d4" />
            <text x="880" y="590" fill="#a5f3fc" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              Perecherla 220 kV
            </text>
            <text x="880" y="510" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              CB-204 ({telemetry.breakers['CB-204']?.currentA.toFixed(0)} A)
            </text>
          </g>

          {/* Feeder 2: Chilakaluripet (Bay 205) */}
          <g className="cursor-pointer" onClick={() => onSelectAsset('CB-205')}>
            <line x1="1000" y1="465" x2="1000" y2="560" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="992"
              y="520"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-205']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <polygon points="1000,575 995,560 1005,560" fill="#06b6d4" />
            <text x="1000" y="590" fill="#a5f3fc" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              Chilakaluripet 220 kV
            </text>
            <text x="1000" y="510" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              CB-205
            </text>
          </g>

          {/* Feeder 3: Nadikudi (Bay 206) */}
          <g className="cursor-pointer" onClick={() => onSelectAsset('CB-206')}>
            <line x1="140" y1="465" x2="140" y2="560" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="132"
              y="520"
              width="16"
              height="16"
              fill={getCbColor(telemetry.breakers['CB-206']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <polygon points="140,575 135,560 145,560" fill="#06b6d4" />
            <text x="140" y="590" fill="#a5f3fc" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              Nadikudi 220 kV
            </text>
            <text x="140" y="510" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              CB-206
            </text>
          </g>
        </svg>
      </div>

      {/* Floating Instructions Bottom Pill */}
      <div className="absolute bottom-3 left-4 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded text-xs text-slate-300 flex items-center gap-2 pointer-events-none">
        <Info className="w-3.5 h-3.5 text-cyan-400" />
        <span>Click any Transformer, Breaker, or Busbar to open engineering telemetry & condition inspector</span>
      </div>
    </div>
  );
};
