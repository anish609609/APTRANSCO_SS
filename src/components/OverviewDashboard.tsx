/**
 * SAT-TWIN: Substation Overview Dashboard
 * High-level control room overview of 400/220 kV Sattenapalli Substation (ID 4012).
 */

import React from 'react';
import { TelemetryState } from '../services/telemetryEngine';
import { SubstationAsset, SubstationAlarm } from '../types/substation';
import {
  Activity,
  Zap,
  Thermometer,
  ShieldAlert,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Clock,
  Radio,
  Box,
} from 'lucide-react';

interface OverviewDashboardProps {
  telemetry: TelemetryState;
  assets: SubstationAsset[];
  alarms: SubstationAlarm[];
  onSelectAsset: (assetId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  telemetry,
  assets,
  alarms,
  onSelectAsset,
  onNavigateTab,
}) => {
  const activeAlarms = alarms.filter((a) => a.status === 'ACTIVE');
  const ict1 = telemetry.transformers['ICT-01'];
  const ict2 = telemetry.transformers['ICT-02'];
  const ict3 = telemetry.transformers['ICT-03'];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* 1. Top High-Level Operational Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Power */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase tracking-wider font-semibold">Total Load Throughput</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold text-white">
            {telemetry.totalThroughputMW.toFixed(0)}{' '}
            <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Reactive: <span className="text-cyan-400 font-mono">{telemetry.totalReactivePowerMVAR.toFixed(0)} MVAR</span>
          </div>
        </div>

        {/* 400 kV Grid Bus Voltage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase tracking-wider font-semibold">400 kV Main Bus 1</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold text-amber-400">
            {telemetry.busbars['BUS-400-1']?.phaseVoltageR_KV.toFixed(1)}{' '}
            <span className="text-sm font-normal text-slate-400">kV</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Nominal: 400 kV (Operating: +0.5%)
          </div>
        </div>

        {/* 220 kV Grid Bus Voltage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase tracking-wider font-semibold">220 kV Main Bus 1</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold text-cyan-400">
            {telemetry.busbars['BUS-220-1']?.phaseVoltageR_KV.toFixed(1)}{' '}
            <span className="text-sm font-normal text-slate-400">kV</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Nominal: 220 kV (Step-down healthy)
          </div>
        </div>

        {/* Grid Frequency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase tracking-wider font-semibold">Indian Grid Freq</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
            {telemetry.gridFrequencyHz.toFixed(2)}{' '}
            <span className="text-sm font-normal text-slate-400">Hz</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Target Band: 49.90 - 50.05 Hz
          </div>
        </div>
      </div>

      {/* 2. 3 x 315 MVA Interconnecting Transformers (ICTs) Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Interconnecting Transformers (400/220/33 kV)
          </h3>
          <button
            onClick={() => onNavigateTab('3d')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>View 3D Switchyard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'ICT-01', data: ict1, name: '315 MVA ICT-1', mfg: 'BHEL (Provisional)' },
            { id: 'ICT-02', data: ict2, name: '315 MVA ICT-2', mfg: 'CG Power (Provisional)' },
            { id: 'ICT-03', data: ict3, name: '315 MVA ICT-3', mfg: 'T&R (Provisional)' },
          ].map((item) => {
            const loadPercent = item.data ? Math.round((item.data.apparentPowerMVA / 315) * 100) : 0;
            const isHot = item.data && item.data.windingHotSpotTempC > 95;
            const isTripped = item.data && item.data.apparentPowerMVA === 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectAsset(item.id)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-sm">{item.id}</span>
                    <span className="text-xs text-slate-400 font-mono">({item.mfg})</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      isTripped
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : loadPercent > 100
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {isTripped ? 'TRIPPED / OFFLINE' : loadPercent > 100 ? 'OVERLOAD' : 'NORMAL'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">Loading: {item.data?.apparentPowerMVA || 0} MVA</span>
                    <span className="text-white font-bold">{loadPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isTripped ? 'bg-slate-600' : loadPercent > 100 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(loadPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry specs grid */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ACTIVE / REAC</span>
                    <span className="text-slate-200">
                      {item.data?.activePowerMW || 0} MW / {item.data?.reactivePowerMVAR || 0} MVAR
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">WINDING HOT-SPOT</span>
                    <span className={isHot ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                      {item.data?.windingHotSpotTempC || 0} °C
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TOP OIL TEMP</span>
                    <span className="text-slate-200">{item.data?.topOilTempC || 0} °C</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">COOLING / TAP</span>
                    <span className="text-cyan-400">
                      {item.data?.coolingStage} · Tap #{item.data?.tapPosition}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Voltage Yards & Bay Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 400 kV Yard Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span>
              400 kV EHV Switchyard Bays
            </h4>
            <span className="text-xs font-mono text-slate-400">One-and-a-half / Double Bus Scheme</span>
          </div>

          <div className="space-y-2 text-xs">
            <div
              onClick={() => onSelectAsset('CB-404')}
              className="p-2.5 bg-slate-950/80 rounded border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white">400 kV VTPS Feeder-1 (Bay 404)</div>
                <div className="text-[11px] text-slate-400">Line from Dr. NTTPS / VTPS Thermal Station</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-400">CB-404: CLOSED</div>
                <div className="text-[11px] text-slate-400">SF6: {telemetry.breakers['CB-404']?.sf6PressureBar} bar</div>
              </div>
            </div>

            <div
              onClick={() => onSelectAsset('CB-405')}
              className="p-2.5 bg-slate-950/80 rounded border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white">400 kV Tallapalli Feeder-2 (Bay 405)</div>
                <div className="text-[11px] text-slate-400">Inter-regional transmission tie</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-400">CB-405: CLOSED</div>
                <div className="text-[11px] text-slate-400">480 A · Good</div>
              </div>
            </div>

            <div
              onClick={() => onSelectAsset('RE-401')}
              className="p-2.5 bg-slate-950/80 rounded border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white">125 MVAR Shunt Bus Reactor (Bay 406)</div>
                <div className="text-[11px] text-slate-400">Ferranti voltage regulation & reactive absorption</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-cyan-400">{telemetry.reactors['RE-401']?.reactivePowerMVAR} MVAR</div>
                <div className="text-[11px] text-slate-400">Oil: {telemetry.reactors['RE-401']?.oilTempC} °C</div>
              </div>
            </div>
          </div>
        </div>

        {/* 220 kV Yard Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-cyan-500 rounded-sm"></span>
              220 kV Switchyard Outgoing Feeders
            </h4>
            <span className="text-xs font-mono text-slate-400">Double Bus with Coupler</span>
          </div>

          <div className="space-y-2 text-xs">
            <div
              onClick={() => onSelectAsset('CB-204')}
              className="p-2.5 bg-slate-950/80 rounded border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white">220 kV Perecherla Feeder (Bay 204)</div>
                <div className="text-[11px] text-slate-400">Supply to Perecherla / Guntur regional load center</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-400">CB-204: CLOSED</div>
                <div className="text-[11px] text-slate-400">{telemetry.breakers['CB-204']?.currentA.toFixed(0)} A</div>
              </div>
            </div>

            <div
              onClick={() => onSelectAsset('CB-205')}
              className="p-2.5 bg-slate-950/80 rounded border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white">220 kV Chilakaluripet Feeder (Bay 205)</div>
                <div className="text-[11px] text-slate-400">Downstream 132/33 kV distribution network feed</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-400">CB-205: CLOSED</div>
                <div className="text-[11px] text-slate-400">{telemetry.breakers['CB-205']?.currentA.toFixed(0)} A</div>
              </div>
            </div>

            <div
              onClick={() => onSelectAsset('CB-206')}
              className="p-2.5 bg-slate-950/80 rounded border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white">220 kV Nadikudi Feeder (Bay 206)</div>
                <div className="text-[11px] text-slate-400">Palnadu industrial & cement corridor transmission</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-400">CB-206: CLOSED</div>
                <div className="text-[11px] text-slate-400">{telemetry.breakers['CB-206']?.currentA.toFixed(0)} A</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Alarms Strip */}
      {activeAlarms.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Active Alarms ({activeAlarms.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('alarms')}
              className="text-xs text-rose-300 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Go to Alarm Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {activeAlarms.slice(0, 3).map((alarm) => (
              <div
                key={alarm.id}
                className="bg-slate-900/90 p-2.5 rounded border border-rose-900/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-rose-400 font-mono mr-2">[{alarm.severity}]</span>
                  <span className="text-slate-200">{alarm.message}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(alarm.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
