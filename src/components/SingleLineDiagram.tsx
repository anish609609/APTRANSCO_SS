/**
 * SAT-TWIN: Interactive Vector Single-Line Diagram (SLD)
 * Mobile & Touch Optimized
 * Conforms to IEC 60617 / IEEE standard electrical substation symbology.
 * Displays 400 kV and 220 kV busbars, bays, circuit breakers, isolators,
 * power transformers, and bus reactor with live telemetry overlays.
 */

import React, { useState, useRef, useEffect } from 'react';
import { TelemetryState } from '../services/telemetryEngine';
import { SubstationAsset } from '../types/substation';
import { ZoomIn, ZoomOut, RotateCcw, Info, Move } from 'lucide-react';

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
  const dragStart = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch tracking state for mobile pinch-to-zoom & pan
  const touchState = useRef({
    isTracking: false,
    isPinching: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    initialDistance: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    if (Math.hypot(newX - pan.x, newY - pan.y) > 4) {
      hasMovedRef.current = true;
    }
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 50);
  };

  // Mobile Touch Gestures: Pan & Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    const ts = touchState.current;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      ts.isTracking = true;
      ts.isPinching = false;
      ts.startX = t.clientX;
      ts.startY = t.clientY;
      ts.lastX = t.clientX;
      ts.lastY = t.clientY;
      ts.startTime = Date.now();
      ts.initialPan = { ...pan };
      hasMovedRef.current = false;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      ts.isTracking = false;
      ts.isPinching = true;
      ts.initialDistance = dist;
      ts.initialZoom = zoom;
      ts.initialPan = { ...pan };
      ts.lastX = (t1.clientX + t2.clientX) / 2;
      ts.lastY = (t1.clientY + t2.clientY) / 2;
      hasMovedRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const ts = touchState.current;
    if (!ts.isTracking && !ts.isPinching) return;

    if (e.touches.length === 1 && ts.isTracking) {
      const t = e.touches[0];
      const dx = t.clientX - ts.lastX;
      const dy = t.clientY - ts.lastY;
      const totalMoved = Math.hypot(t.clientX - ts.startX, t.clientY - ts.startY);

      if (totalMoved > 6) {
        hasMovedRef.current = true;
      }

      ts.lastX = t.clientX;
      ts.lastY = t.clientY;

      setPan((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    } else if (e.touches.length === 2 && ts.isPinching) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      hasMovedRef.current = true;

      // Update zoom
      if (ts.initialDistance > 0 && currentDist > 0) {
        const factor = currentDist / ts.initialDistance;
        const newZoom = Math.max(0.5, Math.min(2.5, ts.initialZoom * factor));
        setZoom(newZoom);
      }

      // Update pan with 2 fingers
      const panDx = midX - ts.lastX;
      const panDy = midY - ts.lastY;
      ts.lastX = midX;
      ts.lastY = midY;

      setPan((prev) => ({
        x: prev.x + panDx,
        y: prev.y + panDy,
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      touchState.current.isTracking = false;
      touchState.current.isPinching = false;
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 80);
    } else if (e.touches.length === 1) {
      // Switched from pinch to 1 finger
      const t = e.touches[0];
      touchState.current.isTracking = true;
      touchState.current.isPinching = false;
      touchState.current.lastX = t.clientX;
      touchState.current.lastY = t.clientY;
    }
  };

  const handleAssetClick = (assetId: string) => {
    if (hasMovedRef.current) return;
    onSelectAsset(assetId);
  };

  // Helper colors
  const COLOR_400KV = '#f97316'; // Orange for 400 kV
  const COLOR_220KV = '#06b6d4'; // Cyan for 220 kV
  const COLOR_33KV = '#a855f7';  // Purple for 33 kV tertiary
  const COLOR_DEENERGIZED = '#64748b';

  const getCbColor = (state: string) => {
    // Utility electrical convention: RED = CLOSED (Energized/Live), GREEN = OPEN (Isolated/Safe)
    if (state === 'CLOSED') return '#ef4444';
    if (state === 'OPEN') return '#10b981';
    return '#eab308';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden relative" style={{ touchAction: 'none' }}>
      {/* Top SLD Legend & Tooling */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-4 z-10 text-xs shadow-md">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <span className="font-semibold text-slate-200 text-xs sm:text-sm">Single-Line Diagram (SLD)</span>
          <div className="flex items-center gap-2.5 sm:gap-3 font-mono text-[10px] sm:text-[11px] overflow-x-auto py-0.5">
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2.5 sm:w-3 h-1 bg-[#f97316] rounded-sm"></span> 400 kV Bus
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2.5 sm:w-3 h-1 bg-[#06b6d4] rounded-sm"></span> 220 kV Bus
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#ef4444] border border-white/40"></span> Closed
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#10b981] border border-white/40"></span> Open
            </span>
          </div>
        </div>

        {/* Zoom & Pan Controls (Min 44x44px touch targets on mobile) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 flex items-center justify-center transition-colors"
            title="Zoom In"
            aria-label="Zoom in single line diagram"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 flex items-center justify-center transition-colors"
            title="Zoom Out"
            aria-label="Zoom out single line diagram"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 flex items-center justify-center transition-colors"
            title="Reset View"
            aria-label="Reset single line diagram view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Main SVG Canvas with touch & mouse pan/zoom */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden bg-radial from-slate-900 to-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-full origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            touchAction: 'none',
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

          {/* 400 kV Bus 1 with generous touch hit-line */}
          <g
            className="cursor-pointer group"
            onClick={() => handleAssetClick('BUS-400-1')}
          >
            {/* Invisible large touch target line */}
            <line x1="70" y1="85" x2="1140" y2="85" stroke="transparent" strokeWidth="32" pointerEvents="stroke" />
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

          {/* 400 kV Bus 2 with generous touch hit-line */}
          <g
            className="cursor-pointer group"
            onClick={() => handleAssetClick('BUS-400-2')}
          >
            {/* Invisible large touch target line */}
            <line x1="70" y1="120" x2="1140" y2="120" stroke="transparent" strokeWidth="32" pointerEvents="stroke" />
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
          <g className="cursor-pointer" onClick={() => handleAssetClick('CB-407')}>
            {/* Touch target padding */}
            <rect x="1080" y="80" width="50" height="50" fill="transparent" pointerEvents="all" />
            <line x1="1100" y1="85" x2="1100" y2="120" stroke={COLOR_400KV} strokeWidth="2.5" />
            <rect
              x="1092"
              y="97"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-407']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'CB-407' ? '2.5' : '1.5'}
            />
            <text x="1101" y="109" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              BC
            </text>
            <text x="1115" y="108" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              CB-407 (Coupler)
            </text>
          </g>

          {/* 125 MVAR Bus Reactor RE-401 */}
          <g
            className="cursor-pointer group"
            onClick={() => handleAssetClick('RE-401')}
          >
            {/* Generous touch target */}
            <rect x="110" y="80" width="60" height="180" fill="transparent" pointerEvents="all" />
            <line x1="140" y1="85" x2="140" y2="170" stroke={COLOR_400KV} strokeWidth="2.5" />
            {/* Reactor Breaker CB-406 */}
            <rect
              x="131"
              y="110"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-406']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'RE-401' || selectedAssetId === 'CB-406' ? '2.5' : '1.5'}
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
          <g className="cursor-pointer" onClick={() => handleAssetClick('CB-404')}>
            <rect x="850" y="10" width="60" height="80" fill="transparent" pointerEvents="all" />
            <line x1="880" y1="85" x2="880" y2="30" stroke={COLOR_400KV} strokeWidth="2.5" />
            <rect
              x="871"
              y="44"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-404']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'CB-404' ? '2.5' : '1.5'}
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
          <g className="cursor-pointer" onClick={() => handleAssetClick('CB-405')}>
            <rect x="970" y="10" width="60" height="80" fill="transparent" pointerEvents="all" />
            <line x1="1000" y1="85" x2="1000" y2="30" stroke={COLOR_400KV} strokeWidth="2.5" />
            <rect
              x="991"
              y="44"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-405']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'CB-405' ? '2.5' : '1.5'}
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

                {/* Isolator DS */}
                <circle cx={ict.x} cy="140" r="3" fill="#cbd5e1" />
                <line x1={ict.x - 4} y1="137" x2={ict.x + 6} y2="143" stroke="#cbd5e1" strokeWidth="2" />

                {/* 400 kV Breaker with generous touch hit-box */}
                <g className="cursor-pointer" onClick={() => handleAssetClick(ict.cbHv)}>
                  <rect
                    x={ict.x - 22}
                    y="152"
                    width="44"
                    height="44"
                    fill="transparent"
                    pointerEvents="all"
                  />
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
                  onClick={() => handleAssetClick(ict.id)}
                >
                  {/* Invisible expanded touch hit target around entire transformer */}
                  <rect
                    x={ict.x - 75}
                    y="240"
                    width="150"
                    height="125"
                    fill="transparent"
                    pointerEvents="all"
                  />

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

                {/* 220 kV Breaker with generous touch hit-box */}
                <g className="cursor-pointer" onClick={() => handleAssetClick(ict.cbLv)}>
                  <rect
                    x={ict.x - 22}
                    y="357"
                    width="44"
                    height="44"
                    fill="transparent"
                    pointerEvents="all"
                  />
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

          {/* 220 kV Bus 1 with generous touch hit-line */}
          <g
            className="cursor-pointer group"
            onClick={() => handleAssetClick('BUS-220-1')}
          >
            <line x1="70" y1="465" x2="1140" y2="465" stroke="transparent" strokeWidth="32" pointerEvents="stroke" />
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

          {/* 220 kV Bus 2 with generous touch hit-line */}
          <g
            className="cursor-pointer group"
            onClick={() => handleAssetClick('BUS-220-2')}
          >
            <line x1="70" y1="500" x2="1140" y2="500" stroke="transparent" strokeWidth="32" pointerEvents="stroke" />
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
          <g className="cursor-pointer" onClick={() => handleAssetClick('CB-207')}>
            <rect x="1080" y="460" width="50" height="50" fill="transparent" pointerEvents="all" />
            <line x1="1100" y1="465" x2="1100" y2="500" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="1092"
              y="477"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-207']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'CB-207' ? '2.5' : '1.5'}
            />
            <text x="1101" y="489" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              BC
            </text>
            <text x="1115" y="488" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              CB-207 (Coupler)
            </text>
          </g>

          {/* 220 kV Outgoing Feeder Bays */}
          {/* Feeder 1: Perecherla (Bay 204) */}
          <g className="cursor-pointer" onClick={() => handleAssetClick('CB-204')}>
            <rect x="850" y="490" width="60" height="105" fill="transparent" pointerEvents="all" />
            <line x1="880" y1="465" x2="880" y2="560" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="871"
              y="519"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-204']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'CB-204' ? '2.5' : '1.5'}
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
          <g className="cursor-pointer" onClick={() => handleAssetClick('CB-205')}>
            <rect x="970" y="490" width="60" height="105" fill="transparent" pointerEvents="all" />
            <line x1="1000" y1="465" x2="1000" y2="560" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="991"
              y="519"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-205']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'CB-205' ? '2.5' : '1.5'}
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
          <g className="cursor-pointer" onClick={() => handleAssetClick('CB-206')}>
            <rect x="110" y="490" width="60" height="105" fill="transparent" pointerEvents="all" />
            <line x1="140" y1="465" x2="140" y2="560" stroke={COLOR_220KV} strokeWidth="2.5" />
            <rect
              x="131"
              y="519"
              width="18"
              height="18"
              fill={getCbColor(telemetry.breakers['CB-206']?.state || 'CLOSED')}
              stroke="#fff"
              strokeWidth={selectedAssetId === 'CB-206' ? '2.5' : '1.5'}
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
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-slate-900/95 border border-slate-700/80 px-3 py-2 rounded-lg text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none shadow-xl max-w-md">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="hidden sm:inline">Click any Transformer, Breaker, or Busbar to open engineering inspector</span>
        <span className="sm:hidden">1-finger drag · 2-finger pinch zoom · Tap element to inspect</span>
      </div>
    </div>
  );
};
