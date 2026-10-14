/**
 * SAT-TWIN: Asset Telemetry Inspection & Condition Monitoring Panel
 * Provides in-depth engineering telemetry, DGA diagnostics (Duval Triangle),
 * breaker duty, SF6 monitoring, and maintenance logs for selected assets.
 */

import React, { useState } from 'react';
import { SubstationAsset, QualityState } from '../types/substation';
import { TelemetryState, telemetryService } from '../services/telemetryEngine';
import {
  X,
  Thermometer,
  Zap,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Sliders,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: SubstationAsset;
  telemetry: TelemetryState;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  telemetry,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'DGA' | 'CONDITION' | 'SPEC'>('TELEMETRY');

  const transformerData = asset.type === 'POWER_TRANSFORMER' ? telemetry.transformers[asset.id] : null;
  const breakerData = asset.type === 'CIRCUIT_BREAKER' ? telemetry.breakers[asset.id] : null;
  const busbarData = asset.type === 'BUSBAR' ? telemetry.busbars[asset.id] : null;
  const reactorData = asset.type === 'SHUNT_REACTOR' ? telemetry.reactors[asset.id] : null;

  const quality: QualityState = telemetry.quality;

  const handleManualTripSimulation = () => {
    if (asset.type === 'CIRCUIT_BREAKER') {
      telemetryService.setScenario('CB_TRIP_401');
    }
  };

  const handleResetNominal = () => {
    telemetryService.setScenario('NORMAL');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-xl w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Mobile Pull Handle Pill */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-950">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded bg-emerald-950/60 border border-emerald-600/50 text-emerald-400 font-mono font-bold text-xs sm:text-sm shrink-0">
              {asset.id}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{asset.name}</h2>
                {asset.isProvisional && (
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-amber-950/80 border border-amber-600 text-amber-300 px-1.5 py-0.2 rounded shrink-0">
                    PROVISIONAL
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 truncate">
                <span>{asset.bayName}</span>
                <span className="mx-1.5">·</span>
                <span>{asset.voltageLevel}</span>
                <span className="mx-1.5">·</span>
                <span className="font-mono text-cyan-400">Quality: {quality}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close asset detail modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip (Touch-scrollable on mobile) */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-3 sm:px-5 flex gap-2 sm:gap-4 text-xs font-medium overflow-x-auto scrollbar-none whitespace-nowrap touch-scroll">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`min-h-[44px] py-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'TELEMETRY'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Live Telemetry
          </button>

          {asset.type === 'POWER_TRANSFORMER' && (
            <button
              onClick={() => setActiveTab('DGA')}
              className={`min-h-[44px] py-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === 'DGA'
                  ? 'border-emerald-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> DGA & Oil Diagnostics
            </button>
          )}

          <button
            onClick={() => setActiveTab('CONDITION')}
            className={`min-h-[44px] py-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'CONDITION'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" /> Health & Condition
          </button>

          <button
            onClick={() => setActiveTab('SPEC')}
            className={`min-h-[44px] py-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'SPEC'
                ? 'border-emerald-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Nameplate & Specs
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 bg-slate-900/60 touch-scroll overscroll-contain">
          {/* TAB 1: LIVE TELEMETRY */}
          {activeTab === 'TELEMETRY' && (
            <div className="space-y-4">
              {/* TRANSFORMER TELEMETRY */}
              {transformerData && (
                <div>
                  {/* Electrical Power Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wide">Active Power</div>
                      <div className="text-xl font-mono font-bold text-white mt-1">
                        {transformerData.activePowerMW}{' '}
                        <span className="text-xs text-slate-400 font-normal">MW</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">MMXU1.TotW · Measured</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wide">Reactive Power</div>
                      <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                        {transformerData.reactivePowerMVAR}{' '}
                        <span className="text-xs text-slate-400 font-normal">MVAR</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">MMXU1.TotVAr · Measured</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wide">Apparent Power</div>
                      <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                        {transformerData.apparentPowerMVA}{' '}
                        <span className="text-xs text-slate-400 font-normal">MVA</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Rating: 315 MVA ({((transformerData.apparentPowerMVA / 315) * 100).toFixed(0)}% Load)</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wide">Power Factor</div>
                      <div className="text-xl font-mono font-bold text-white mt-1">
                        {transformerData.powerFactor.toFixed(3)}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">Lagging (Nominal)</div>
                    </div>
                  </div>

                  {/* Voltages & Currents */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-xs font-bold text-slate-200 mb-2">Primary & Secondary Voltages</div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">HV Voltage (Primary):</span>
                          <span className="text-white font-bold">{transformerData.hvVoltageKV} kV</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">LV Voltage (Secondary):</span>
                          <span className="text-cyan-400 font-bold">{transformerData.lvVoltageKV} kV</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tertiary Voltage:</span>
                          <span className="text-slate-300">{transformerData.tertiaryVoltageKV} kV</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-xs font-bold text-slate-200 mb-2">Phase Currents & Tap Changer</div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">HV Phase Current:</span>
                          <span className="text-white font-bold">{transformerData.hvCurrentA} A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">LV Phase Current:</span>
                          <span className="text-cyan-400 font-bold">{transformerData.lvCurrentA} A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">OLTC Tap Position:</span>
                          <span className="text-amber-400 font-bold">
                            Tap #{transformerData.tapPosition} of {transformerData.maxTap}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thermal Dynamics (IEEE C57.91) */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Transformer Thermal Model & Temperature Monitoring
                        </h4>
                      </div>
                      <span className="text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        Cooling: {transformerData.coolingStage}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Top Oil Temp (OTI)</div>
                        <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                          {transformerData.topOilTempC} °C
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Sensor RTD · Measured (Alarm: 85°C)</div>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Winding Hot-Spot (WTI)</div>
                        <div
                          className={`text-xl font-mono font-bold mt-1 ${
                            transformerData.windingHotSpotTempC > 95 ? 'text-rose-400' : 'text-amber-300'
                          }`}
                        >
                          {transformerData.windingHotSpotTempC} °C
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Derived Dynamic Thermal Model (Alarm: 98°C)</div>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Ambient Temperature</div>
                        <div className="text-xl font-mono font-bold text-slate-200 mt-1">
                          {transformerData.ambientTempC} °C
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Sattenapalli Substation Yard Weather</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CIRCUIT BREAKER TELEMETRY */}
              {breakerData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase">Operating State</div>
                      <div
                        className={`text-xl font-mono font-bold mt-1 ${
                          breakerData.state === 'CLOSED' ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {breakerData.state}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">XCBR1.Pos.stVal</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase">SF6 Gas Pressure</div>
                      <div
                        className={`text-xl font-mono font-bold mt-1 ${
                          breakerData.sf6PressureBar < 5.5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                        }`}
                      >
                        {breakerData.sf6PressureBar}{' '}
                        <span className="text-xs text-slate-400 font-normal">bar</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Rated: {breakerData.sf6PressureNominalBar} bar (Lockout: 5.2 bar)</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase">Operating Counter</div>
                      <div className="text-xl font-mono font-bold text-white mt-1">
                        {breakerData.operatingCounter}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Total trip / close cycles</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase">Spring Mechanism</div>
                      <div className="text-xl font-mono font-bold text-emerald-400 mt-1">CHARGED</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Ready for O-0.3s-CO cycle</div>
                    </div>
                  </div>

                  {/* Operational Controls & Duty */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="text-xs font-bold text-slate-200 mb-2">Trip Coil Supervision & Timing</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>Trip Coil 1: <span className="text-emerald-400">HEALTHY</span></div>
                      <div>Trip Coil 2: <span className="text-emerald-400">HEALTHY</span></div>
                      <div>Opening Time: <span className="text-white">{breakerData.openingTimeMs} ms</span></div>
                      <div>Closing Time: <span className="text-white">{breakerData.closingTimeMs} ms</span></div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        Accumulated Contact Duty: <span className="text-white font-mono">{breakerData.accumulatedDutyKA2s} kA²s</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {breakerData.state === 'CLOSED' ? (
                          <button
                            onClick={handleManualTripSimulation}
                            className="min-h-[44px] px-3.5 py-2 w-full sm:w-auto bg-rose-600/30 hover:bg-rose-600/50 active:bg-rose-600/70 border border-rose-500 text-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                          >
                            Simulate Protection Trip
                          </button>
                        ) : (
                          <button
                            onClick={handleResetNominal}
                            className="min-h-[44px] px-3.5 py-2 w-full sm:w-auto bg-emerald-600/30 hover:bg-emerald-600/50 active:bg-emerald-600/70 border border-emerald-500 text-emerald-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                          >
                            Reset & Close Breaker
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BUSBAR TELEMETRY */}
              {busbarData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Phase R Voltage</div>
                    <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                      {busbarData.phaseVoltageR_KV.toFixed(1)} kV
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Phase Y Voltage</div>
                    <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                      {busbarData.phaseVoltageY_KV.toFixed(1)} kV
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Phase B Voltage</div>
                    <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                      {busbarData.phaseVoltageB_KV.toFixed(1)} kV
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Bus Differential</div>
                    <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                      {busbarData.differentialCurrentA} A
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">87B Relay Restrained</div>
                  </div>
                </div>
              )}

              {/* REACTOR TELEMETRY */}
              {reactorData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Reactive Compensation</div>
                    <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                      {reactorData.reactivePowerMVAR} MVAR
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Absorbing inductive MVAR</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Operating Voltage</div>
                    <div className="text-xl font-mono font-bold text-white mt-1">
                      {reactorData.voltageKV} kV
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Oil Temperature</div>
                    <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                      {reactorData.oilTempC} °C
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase">Tank Vibration</div>
                    <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                      {reactorData.vibrationMmS} mm/s
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Core clamp nominal</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DGA DIAGNOSTICS */}
          {activeTab === 'DGA' && transformerData && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Dissolved Gas Analysis (IEEE C57.104 / IEC 60599 Standard)
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 rounded">
                    Diagnosis: {transformerData.dga.duvalDiagnosis}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Hydrogen (H₂)</div>
                    <div className="text-base font-bold text-white mt-0.5">{transformerData.dga.hydrogenH2} ppm</div>
                    <div className="text-[9px] text-slate-500">Limit: 100 ppm</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Methane (CH₄)</div>
                    <div className="text-base font-bold text-white mt-0.5">{transformerData.dga.methaneCH4} ppm</div>
                    <div className="text-[9px] text-slate-500">Limit: 120 ppm</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Acetylene (C₂H₂)</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">{transformerData.dga.acetyleneC2H2} ppm</div>
                    <div className="text-[9px] text-slate-500">Limit: 2 ppm (Arcing flag)</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Ethylene (C₂H₄)</div>
                    <div className="text-base font-bold text-white mt-0.5">{transformerData.dga.ethyleneC2H4} ppm</div>
                    <div className="text-[9px] text-slate-500">Limit: 50 ppm</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Ethane (C₂H₆)</div>
                    <div className="text-base font-bold text-white mt-0.5">{transformerData.dga.ethaneC2H6} ppm</div>
                    <div className="text-[9px] text-slate-500">Limit: 65 ppm</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Carbon Monoxide (CO)</div>
                    <div className="text-base font-bold text-white mt-0.5">{transformerData.dga.carbonMonoxideCO} ppm</div>
                    <div className="text-[9px] text-slate-500">Paper Degradation flag</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Carbon Dioxide (CO₂)</div>
                    <div className="text-base font-bold text-white mt-0.5">{transformerData.dga.carbonDioxideCO2} ppm</div>
                    <div className="text-[9px] text-slate-500">Normal aging by-product</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Total Combustible Gas (TCG)</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">{transformerData.dga.totalCombustibleGas} ppm</div>
                    <div className="text-[9px] text-slate-500">Condition: Condition 1 (Safe)</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900/60 rounded border border-slate-800 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200 mb-1">Duval Triangle 1 Coordinates:</div>
                  <div>%CH₄ = 28.5% · %C₂H₄ = 44.4% · %C₂H₂ = 0.6% → Falls solidly within Zone PD / Normal Thermal Degradation. No high-energy partial discharges detected.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH & CONDITION */}
          {activeTab === 'CONDITION' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Condition Based Monitoring (CBM) Health Index
                  </h4>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {transformerData?.healthIndexScore || 91} / 100 (GOOD)
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${transformerData?.healthIndexScore || 91}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Insulation Paper Condition (DP Est):</span>
                    <span className="text-slate-200 font-mono font-medium">Estimated DP ~ 750 (Healthy)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Moisture in Oil:</span>
                    <span className="text-slate-200 font-mono font-medium">12 ppm (Dielectric withstand: 68 kV)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Bushings Power Factor (Tan Delta):</span>
                    <span className="text-slate-200 font-mono font-medium">0.38% (Within IEEE limit &lt; 0.5%)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Next Scheduled Dissolved Gas Sampling:</span>
                    <span className="text-slate-200 font-mono font-medium">2026-11-15 (Quarterly O&M cycle)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NAMEPLATE & PROVISIONAL SPECS */}
          {activeTab === 'SPEC' && (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Rating Specification:</span>
                <span className="text-slate-200 font-medium text-right max-w-md">{asset.ratingSpecification}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Manufacturer (Provisional):</span>
                <span className="text-slate-200 font-medium">{asset.manufacturer || 'APTRANSCO Approved Vendor'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Commissioning Year:</span>
                <span className="text-slate-200 font-medium">{asset.commissioningYear || '2014'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Verification Status:</span>
                <span className="text-amber-400 font-mono font-medium">
                  {asset.isProvisional ? 'Provisional - Pending Site Audit' : 'Verified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Spatial Coordinates (3D switchyard):</span>
                <span className="text-slate-300 font-mono">[{asset.position3D.join(', ')}]</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="w-full sm:w-auto text-center sm:text-left">
            Source Timestamp: <span className="font-mono text-slate-300">{new Date(telemetry.timestamp).toLocaleTimeString()}</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
