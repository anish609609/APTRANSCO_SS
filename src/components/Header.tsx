/**
 * SAT-TWIN: Header & Operator Control Bar
 */

import React from 'react';
import {
  Activity,
  AlertTriangle,
  Play,
  Pause,
  FastForward,
  Wifi,
  WifiOff,
  Flame,
  Radio,
  Clock,
  Layers,
  Box,
  GitBranch,
  TrendingUp,
  FileCheck2,
  Database,
  Cpu,
} from 'lucide-react';
import { TelemetryState, FAULT_SCENARIOS } from '../services/telemetryEngine';
import { SUBSTATION_INFO } from '../config/siteData';

interface HeaderProps {
  telemetry: TelemetryState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  simulationSpeed: number;
  onSetSpeed: (speed: number) => void;
  onSelectScenario: (id: string) => void;
  activeAlarmCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  activeTab,
  setActiveTab,
  isPaused,
  onTogglePause,
  simulationSpeed,
  onSetSpeed,
  onSelectScenario,
  activeAlarmCount,
}) => {
  // Format IST time
  const istTimeStr = new Date(telemetry.timestamp).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getQualityBadge = () => {
    switch (telemetry.quality) {
      case 'GOOD':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" /> LINK HEALTHY
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> TELEMETRY STALE
          </span>
        );
      case 'COMM_FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-mono">
            <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> GATEWAY DROP
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      {/* 1. Mandatory Notice & Simulation Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
            SIMULATION / DIGITAL IMAGE MODE
          </span>
          <span className="text-amber-200/90 hidden sm:inline">
            APTRANSCO Sattenapalli Substation (ID 4012) · Telemetry is synthetic physics simulation · Read-Only Mode
          </span>
        </div>

        {/* Quick Scenario Injector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">Sim Scenario:</span>
          <select
            value={telemetry.activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-amber-300 text-xs rounded px-2 py-0.5 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {FAULT_SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Main Control Bar */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Substation Title & ID */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg shadow-inner">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                {SUBSTATION_INFO.name}
              </h1>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">
                ID {SUBSTATION_INFO.publicIdentifier}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{SUBSTATION_INFO.utility}</span>
              <span aria-hidden="true">·</span>
              <span>{SUBSTATION_INFO.region}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-400 font-mono">IST {istTimeStr}</span>
            </div>
          </div>
        </div>

        {/* Live Grid Metrics Bar */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5">
          {/* Frequency */}
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Grid Freq</div>
            <div className="text-sm font-mono font-bold text-cyan-400">
              {telemetry.gridFrequencyHz.toFixed(2)}{' '}
              <span className="text-[10px] text-slate-400 font-normal">Hz</span>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Active Power Throughput */}
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Throughput</div>
            <div className="text-sm font-mono font-bold text-emerald-400">
              {telemetry.totalThroughputMW.toFixed(0)}{' '}
              <span className="text-[10px] text-slate-400 font-normal">MW</span>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Ambient Temp */}
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Ambient</div>
            <div className="text-sm font-mono font-bold text-amber-400">
              {telemetry.ambientTempC.toFixed(1)}{' '}
              <span className="text-[10px] text-slate-400 font-normal">°C</span>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Comms & Heartbeat */}
          <div className="text-right">{getQualityBadge()}</div>
        </div>

        {/* Simulation Controls & Alarm Count */}
        <div className="flex items-center gap-2">
          {/* Pause / Play */}
          <button
            onClick={onTogglePause}
            className={`p-2 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${
              isPaused
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 hover:bg-amber-600/50'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onSetSpeed(speed)}
                className={`px-2 py-1 text-xs font-mono transition-colors ${
                  simulationSpeed === speed
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Active Alarms Notification Button */}
          <button
            onClick={() => setActiveTab('alarms')}
            className={`px-2.5 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeAlarmCount > 0
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 hover:bg-rose-900'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeAlarmCount > 0 ? 'text-rose-400 animate-pulse' : ''}`} />
            <span>{activeAlarmCount} Active</span>
          </button>
        </div>
      </div>

      {/* 3. Navigation Bar */}
      <nav className="px-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Overview
        </button>

        <button
          onClick={() => setActiveTab('3d')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === '3d'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" /> 3D Switchyard
        </button>

        <button
          onClick={() => setActiveTab('sld')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'sld'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" /> Single-Line Diagram
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'trends'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Historical Trends
        </button>

        <button
          onClick={() => setActiveTab('alarms')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'alarms'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Alarms & Audit Log
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'inventory'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Asset Inventory & Bays
        </button>

        <button
          onClick={() => setActiveTab('iec61850')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'iec61850'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" /> IEC 61850 & Integration
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'verification'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" /> Site Verification (Provisional)
        </button>
      </nav>
    </header>
  );
};
