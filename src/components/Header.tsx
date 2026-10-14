/**
 * SAT-TWIN: Header & Operator Control Bar
 * Mobile & Touch Optimized
 */

import React, { useState } from 'react';
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
  Menu,
  X,
  ChevronRight,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> <span className="hidden sm:inline">LINK</span> HEALTHY
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" /> STALE
          </span>
        );
      case 'COMM_FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-mono">
            <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" /> COMM DROP
          </span>
        );
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity, desc: 'Substation KPIs & bus status' },
    { id: '3d', label: '3D Switchyard', icon: Box, desc: 'Interactive 3D yard & assets' },
    { id: 'sld', label: 'Single-Line Diagram', icon: GitBranch, desc: 'Vector electrical schematic' },
    { id: 'trends', label: 'Historical Trends', icon: TrendingUp, desc: 'Multi-metric telemetry charts' },
    { id: 'alarms', label: 'Alarms & Audit', icon: AlertTriangle, desc: 'SCADA alarm lifecycle & logs', badge: activeAlarmCount },
    { id: 'inventory', label: 'Asset Inventory', icon: Layers, desc: 'Bay registry & rating specs' },
    { id: 'iec61850', label: 'IEC 61850', icon: Cpu, desc: 'Logical nodes & SCL mapping' },
    { id: 'verification', label: 'Site Verification', icon: FileCheck2, desc: 'Provisional assumption ledger' },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50 overflow-x-hidden">
      {/* 1. Mandatory Notice & Simulation Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase shrink-0">
            SIMULATION / DIGITAL IMAGE MODE
          </span>
          <span className="text-amber-200/90 text-[11px] leading-tight">
            APTRANSCO Sattenapalli Substation (ID 4012) · Read-Only Mode
          </span>
        </div>

        {/* Quick Scenario Injector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-slate-400 text-[11px] shrink-0">Scenario:</span>
          <select
            value={telemetry.activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-amber-300 text-xs rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:border-amber-400 cursor-pointer max-w-[240px] sm:max-w-xs truncate"
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
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Left: Mobile Menu Toggle + Substation Title & ID */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-base sm:text-lg shadow-inner shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                {SUBSTATION_INFO.name}
              </h1>
              <span className="text-[10px] sm:text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                4012
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 leading-tight mt-0.5">
              <span className="hidden md:inline">{SUBSTATION_INFO.utility} ·</span>
              <span className="text-cyan-400 font-mono">IST {istTimeStr}</span>
              <span className="hidden sm:inline">· {getQualityBadge()}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Grid Metrics Bar (Compact on mobile, expanded on desktop) */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs">
          {/* Frequency */}
          <div className="text-right">
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">Freq</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-cyan-400">
              {telemetry.gridFrequencyHz.toFixed(2)}{' '}
              <span className="text-[9px] text-slate-400 font-normal">Hz</span>
            </div>
          </div>

          <div className="w-px h-5 sm:h-6 bg-slate-800" />

          {/* Active Power Throughput */}
          <div className="text-right">
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400">Load</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
              {telemetry.totalThroughputMW.toFixed(0)}{' '}
              <span className="text-[9px] text-slate-400 font-normal">MW</span>
            </div>
          </div>

          <div className="w-px h-5 sm:h-6 bg-slate-800 hidden md:block" />

          {/* Ambient Temp */}
          <div className="text-right hidden md:block">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Ambient</div>
            <div className="text-sm font-mono font-bold text-amber-400">
              {telemetry.ambientTempC.toFixed(1)}{' '}
              <span className="text-[10px] text-slate-400 font-normal">°C</span>
            </div>
          </div>
        </div>

        {/* Right: Simulation Controls & Alarm Count */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pause / Play */}
          <button
            onClick={onTogglePause}
            className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
              isPaused
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 hover:bg-amber-600/50'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
            aria-label={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            <span className="hidden xl:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden min-h-[44px]">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onSetSpeed(speed)}
                className={`min-w-[38px] sm:min-w-[44px] h-full min-h-[44px] px-2.5 py-2 text-xs font-mono transition-colors flex items-center justify-center ${
                  simulationSpeed === speed
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label={`Simulation speed ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Active Alarms Notification Button */}
          <button
            onClick={() => handleSelectTab('alarms')}
            className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeAlarmCount > 0
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 hover:bg-rose-900'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            aria-label={`${activeAlarmCount} active alarms`}
          >
            <AlertTriangle className={`w-4 h-4 shrink-0 ${activeAlarmCount > 0 ? 'text-rose-400 animate-pulse' : ''}`} />
            <span className="font-mono">{activeAlarmCount}</span>
            <span className="hidden sm:inline">Active</span>
          </button>
        </div>
      </div>

      {/* 3. Collapsible Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/98 border-t border-slate-800 px-3 py-3 space-y-1.5 animate-in slide-in-from-top-3 duration-200 shadow-2xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Substation Views & Workbenches
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-lg text-left flex items-center justify-between gap-3 transition-colors ${
                    isActive
                      ? 'bg-emerald-950/80 border border-emerald-500/80 text-white shadow'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-md ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.desc}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] font-mono bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Desktop Navigation Bar (Also touch-scrollable on tablets & mobile) */}
      <nav className="px-3 sm:px-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center gap-1 overflow-x-auto scrollbar-none min-h-[44px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`min-h-[44px] px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'border-emerald-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[9px] font-mono bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
