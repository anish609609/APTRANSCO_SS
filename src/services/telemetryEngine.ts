/**
 * SAT-TWIN: Real-time Telemetry Simulator & Physics Engine
 * Generates verified physical relationships for transformer thermal dynamics,
 * breaker states, SF6 gas pressures, electrical load dispatch, and fault injection.
 */

import {
  TransformerTelemetry,
  BreakerTelemetry,
  DisconnectorTelemetry,
  BusbarTelemetry,
  ReactorTelemetry,
  QualityState,
  DataProvenance,
  SimulationFaultScenario,
  SubstationAlarm,
  TelemetryHistoryRecord,
} from '../types/substation';

export interface TelemetryState {
  timestamp: string;
  gridFrequencyHz: number;
  totalThroughputMW: number;
  totalReactivePowerMVAR: number;
  ambientTempC: number;
  quality: QualityState;
  transformers: Record<string, TransformerTelemetry>;
  breakers: Record<string, BreakerTelemetry>;
  disconnectors: Record<string, DisconnectorTelemetry>;
  busbars: Record<string, BusbarTelemetry>;
  reactors: Record<string, ReactorTelemetry>;
  activeScenarioId: string;
}

export const FAULT_SCENARIOS: SimulationFaultScenario[] = [
  {
    id: 'NORMAL',
    title: 'Nominal Grid Operation',
    description: 'Balanced power flow across ICT-1, ICT-2, ICT-3 at ~65% load. Grid frequency at nominal 50.00 Hz.',
    category: 'NORMAL',
    active: true,
  },
  {
    id: 'HEATWAVE',
    title: 'Guntur Summer Peak Ambient (43°C)',
    description: 'High summer ambient temperature increases transformer oil temperature and hot-spot stress.',
    category: 'THERMAL',
    active: false,
  },
  {
    id: 'OVERLOAD_ICT1',
    title: 'ICT-1 Peak Overload (110% - 345 MVA)',
    description: 'Heavy 400/220 kV step-down transfer triggers ONAF-2 forced cooling fans and high hot-spot warning.',
    category: 'THERMAL',
    active: false,
  },
  {
    id: 'CB_TRIP_401',
    title: '400 kV Feeder Fault & CB-401 Trip',
    description: 'Trips ICT-1 HV breaker, forcing load redistribution to ICT-2 and ICT-3 with alarm generation.',
    category: 'ELECTRICAL',
    active: false,
  },
  {
    id: 'SF6_LEAK_404',
    title: 'CB-404 SF6 Gas Leakage Alarm',
    description: 'Simulates SF6 pressure decay below 5.5 bar threshold on 400 kV VTPS line breaker.',
    category: 'GAS_LEAK',
    active: false,
  },
  {
    id: 'COMM_FAILURE_220',
    title: '220 kV Bay SAS Gateway Comm Loss',
    description: 'Simulates network degradation, triggering STALE and COMM_FAIL quality states.',
    category: 'COMMUNICATION',
    active: false,
  },
];

class TelemetryEngine {
  private state: TelemetryState;
  private history: TelemetryHistoryRecord[] = [];
  private maxHistoryPerMetric = 60;
  private listeners: Array<(state: TelemetryState) => void> = [];
  private alarmListeners: Array<(alarm: SubstationAlarm) => void> = [];
  private timer: number | null = null;
  private simulationSpeed = 1; // 1x, 2x, 5x
  private isPaused = false;
  private simStep = 0;

  constructor() {
    this.state = this.getInitialNominalState();
    this.seedInitialHistory();
  }

  private getInitialNominalState(): TelemetryState {
    const now = new Date().toISOString();
    return {
      timestamp: now,
      gridFrequencyHz: 50.01,
      totalThroughputMW: 560,
      totalReactivePowerMVAR: 85,
      ambientTempC: 34.2,
      quality: 'GOOD',
      transformers: {
        'ICT-01': {
          hvVoltageKV: 402.1,
          lvVoltageKV: 221.8,
          tertiaryVoltageKV: 33.4,
          hvCurrentA: 272.5,
          lvCurrentA: 494.0,
          activePowerMW: 185.0,
          reactivePowerMVAR: 28.5,
          apparentPowerMVA: 187.2,
          powerFactor: 0.988,
          topOilTempC: 58.4,
          windingHotSpotTempC: 73.1,
          ambientTempC: 34.2,
          tapPosition: 9,
          maxTap: 17,
          coolingStage: 'ONAN',
          oilLevelPercent: 88,
          dga: {
            hydrogenH2: 32,
            methaneCH4: 18,
            acetyleneC2H2: 0.4,
            ethyleneC2H4: 22,
            ethaneC2H6: 15,
            carbonMonoxideCO: 240,
            carbonDioxideCO2: 1850,
            totalCombustibleGas: 327.4,
            duvalDiagnosis: 'Normal / Ageing',
          },
          healthIndexScore: 92,
        },
        'ICT-02': {
          hvVoltageKV: 402.1,
          lvVoltageKV: 221.8,
          tertiaryVoltageKV: 33.4,
          hvCurrentA: 278.0,
          lvCurrentA: 504.0,
          activePowerMW: 190.0,
          reactivePowerMVAR: 29.0,
          apparentPowerMVA: 192.2,
          powerFactor: 0.989,
          topOilTempC: 60.1,
          windingHotSpotTempC: 75.8,
          ambientTempC: 34.2,
          tapPosition: 9,
          maxTap: 17,
          coolingStage: 'ONAN',
          oilLevelPercent: 86,
          dga: {
            hydrogenH2: 41,
            methaneCH4: 22,
            acetyleneC2H2: 0.6,
            ethyleneC2H4: 28,
            ethaneC2H6: 18,
            carbonMonoxideCO: 270,
            carbonDioxideCO2: 1980,
            totalCombustibleGas: 379.6,
            duvalDiagnosis: 'Normal / Ageing',
          },
          healthIndexScore: 89,
        },
        'ICT-03': {
          hvVoltageKV: 402.1,
          lvVoltageKV: 221.8,
          tertiaryVoltageKV: 33.4,
          hvCurrentA: 271.0,
          lvCurrentA: 491.0,
          activePowerMW: 185.0,
          reactivePowerMVAR: 27.5,
          apparentPowerMVA: 187.0,
          powerFactor: 0.989,
          topOilTempC: 56.8,
          windingHotSpotTempC: 71.4,
          ambientTempC: 34.2,
          tapPosition: 9,
          maxTap: 17,
          coolingStage: 'ONAN',
          oilLevelPercent: 91,
          dga: {
            hydrogenH2: 19,
            methaneCH4: 12,
            acetyleneC2H2: 0.2,
            ethyleneC2H4: 14,
            ethaneC2H6: 9,
            carbonMonoxideCO: 190,
            carbonDioxideCO2: 1620,
            totalCombustibleGas: 244.2,
            duvalDiagnosis: 'Normal / Pristine',
          },
          healthIndexScore: 96,
        },
      },
      breakers: {
        'CB-401': {
          state: 'CLOSED',
          sf6PressureBar: 6.05,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 142,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 272.5,
          accumulatedDutyKA2s: 1840,
          closingTimeMs: 68,
          openingTimeMs: 24,
        },
        'CB-402': {
          state: 'CLOSED',
          sf6PressureBar: 5.98,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 119,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 278.0,
          accumulatedDutyKA2s: 1620,
          closingTimeMs: 66,
          openingTimeMs: 23,
        },
        'CB-403': {
          state: 'CLOSED',
          sf6PressureBar: 6.12,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 88,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 271.0,
          accumulatedDutyKA2s: 980,
          closingTimeMs: 67,
          openingTimeMs: 24,
        },
        'CB-404': {
          state: 'CLOSED',
          sf6PressureBar: 5.95,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 215,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 540.0,
          accumulatedDutyKA2s: 3120,
          closingTimeMs: 70,
          openingTimeMs: 25,
        },
        'CB-405': {
          state: 'CLOSED',
          sf6PressureBar: 6.02,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 178,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 480.0,
          accumulatedDutyKA2s: 2450,
          closingTimeMs: 69,
          openingTimeMs: 24,
        },
        'CB-406': {
          state: 'CLOSED',
          sf6PressureBar: 6.08,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 420,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 180.5,
          accumulatedDutyKA2s: 1210,
          closingTimeMs: 65,
          openingTimeMs: 22,
        },
        'CB-407': {
          state: 'CLOSED',
          sf6PressureBar: 6.01,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 64,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 95.0,
          accumulatedDutyKA2s: 820,
          closingTimeMs: 68,
          openingTimeMs: 24,
        },
        // 220 kV Breakers
        'CB-201': {
          state: 'CLOSED',
          sf6PressureBar: 6.02,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 184,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 494.0,
          accumulatedDutyKA2s: 2100,
          closingTimeMs: 64,
          openingTimeMs: 22,
        },
        'CB-202': {
          state: 'CLOSED',
          sf6PressureBar: 5.96,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 167,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 504.0,
          accumulatedDutyKA2s: 1980,
          closingTimeMs: 63,
          openingTimeMs: 22,
        },
        'CB-203': {
          state: 'CLOSED',
          sf6PressureBar: 6.07,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 95,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 491.0,
          accumulatedDutyKA2s: 1140,
          closingTimeMs: 65,
          openingTimeMs: 23,
        },
        'CB-204': {
          state: 'CLOSED',
          sf6PressureBar: 5.94,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 290,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 520.0,
          accumulatedDutyKA2s: 3400,
          closingTimeMs: 66,
          openingTimeMs: 24,
        },
        'CB-205': {
          state: 'CLOSED',
          sf6PressureBar: 6.03,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 245,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 485.0,
          accumulatedDutyKA2s: 2890,
          closingTimeMs: 65,
          openingTimeMs: 23,
        },
        'CB-206': {
          state: 'CLOSED',
          sf6PressureBar: 6.01,
          sf6PressureNominalBar: 6.0,
          operatingCounter: 220,
          springCharged: true,
          tripCoil1Healthy: true,
          tripCoil2Healthy: true,
          currentA: 484.0,
          accumulatedDutyKA2s: 2600,
          closingTimeMs: 64,
          openingTimeMs: 22,
        },
      },
      disconnectors: {
        'DS-401A': {
          state: 'CLOSED',
          interlockSatisfied: true,
          motorCurrentA: 0.0,
          auxiliarySwitchContactGood: true,
        },
        'DS-401B': {
          state: 'CLOSED',
          interlockSatisfied: true,
          motorCurrentA: 0.0,
          auxiliarySwitchContactGood: true,
        },
      },
      busbars: {
        'BUS-400-1': {
          phaseVoltageR_KV: 402.3,
          phaseVoltageY_KV: 401.9,
          phaseVoltageB_KV: 402.1,
          frequencyHz: 50.01,
          differentialCurrentA: 1.2,
          energized: true,
        },
        'BUS-400-2': {
          phaseVoltageR_KV: 402.0,
          phaseVoltageY_KV: 401.7,
          phaseVoltageB_KV: 401.9,
          frequencyHz: 50.01,
          differentialCurrentA: 0.9,
          energized: true,
        },
        'BUS-220-1': {
          phaseVoltageR_KV: 221.9,
          phaseVoltageY_KV: 221.7,
          phaseVoltageB_KV: 222.0,
          frequencyHz: 50.01,
          differentialCurrentA: 1.8,
          energized: true,
        },
        'BUS-220-2': {
          phaseVoltageR_KV: 221.7,
          phaseVoltageY_KV: 221.5,
          phaseVoltageB_KV: 221.8,
          frequencyHz: 50.01,
          differentialCurrentA: 1.4,
          energized: true,
        },
      },
      reactors: {
        'RE-401': {
          reactivePowerMVAR: -123.8,
          voltageKV: 402.1,
          currentA: 178.0,
          oilTempC: 52.4,
          vibrationMmS: 1.8,
        },
      },
      activeScenarioId: 'NORMAL',
    };
  }

  private seedInitialHistory() {
    const now = Date.now();
    for (let i = 40; i >= 0; i--) {
      const time = new Date(now - i * 15000).toISOString();
      const variance = Math.sin(i * 0.3) * 2;
      this.history.push({
        timestamp: time,
        assetId: 'ICT-01',
        metric: 'windingHotSpotTempC',
        value: 71.0 + variance,
        quality: 'GOOD',
      });
      this.history.push({
        timestamp: time,
        assetId: 'ICT-01',
        metric: 'topOilTempC',
        value: 57.0 + variance * 0.6,
        quality: 'GOOD',
      });
      this.history.push({
        timestamp: time,
        assetId: 'ICT-01',
        metric: 'activePowerMW',
        value: 182.0 + Math.cos(i * 0.4) * 8,
        quality: 'GOOD',
      });
      this.history.push({
        timestamp: time,
        assetId: 'BUS-400-1',
        metric: 'frequencyHz',
        value: 50.0 + Math.sin(i * 0.5) * 0.03,
        quality: 'GOOD',
      });
    }
  }

  public start() {
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      if (!this.isPaused) {
        this.stepSimulation();
      }
    }, 1000 / this.simulationSpeed);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public setSpeed(speed: number) {
    this.simulationSpeed = speed;
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public setScenario(scenarioId: string) {
    this.state.activeScenarioId = scenarioId;
    FAULT_SCENARIOS.forEach((sc) => {
      sc.active = sc.id === scenarioId;
    });

    // Immediate scenario effect injection
    if (scenarioId === 'CB_TRIP_401') {
      const cb401 = this.state.breakers['CB-401'];
      if (cb401) {
        cb401.state = 'OPEN';
        cb401.operatingCounter += 1;
        cb401.currentA = 0;
      }
      const ict1 = this.state.transformers['ICT-01'];
      if (ict1) {
        ict1.activePowerMW = 0;
        ict1.apparentPowerMVA = 0;
        ict1.hvCurrentA = 0;
        ict1.lvCurrentA = 0;
      }
      // Redistribute load to ICT-2 and ICT-3
      if (this.state.transformers['ICT-02']) {
        this.state.transformers['ICT-02'].activePowerMW = 278;
        this.state.transformers['ICT-02'].apparentPowerMVA = 281;
      }
      if (this.state.transformers['ICT-03']) {
        this.state.transformers['ICT-03'].activePowerMW = 275;
        this.state.transformers['ICT-03'].apparentPowerMVA = 278;
      }

      this.emitAlarm({
        id: `ALM-${Date.now()}-401`,
        timestamp: new Date().toISOString(),
        assetId: 'CB-401',
        assetName: 'CB 401 (ICT-1 HV Breaker)',
        bayName: '400 kV ICT-1 Bay',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        message: 'PROTECTION TRIP: Distance Zone-1 / Overcurrent Relay 86 Operated. CB-401 Tripped Open.',
      });
    } else if (scenarioId === 'NORMAL') {
      const cb401 = this.state.breakers['CB-401'];
      if (cb401) cb401.state = 'CLOSED';
      const cb404 = this.state.breakers['CB-404'];
      if (cb404) cb404.sf6PressureBar = 6.0;
      this.state.quality = 'GOOD';
      this.state.ambientTempC = 34.2;
    } else if (scenarioId === 'SF6_LEAK_404') {
      this.emitAlarm({
        id: `ALM-${Date.now()}-SF6`,
        timestamp: new Date().toISOString(),
        assetId: 'CB-404',
        assetName: 'CB 404 (400 kV VTPS Feeder-1)',
        bayName: '400 kV VTPS Feeder-1 Bay',
        severity: 'MAJOR',
        status: 'ACTIVE',
        message: 'SF6 GAS LOW PRESSURE STAGE-1 WARNING: Current pressure 5.42 bar (Alarm threshold 5.50 bar).',
      });
    }

    this.notify();
  }

  private stepSimulation() {
    this.simStep++;
    const now = new Date().toISOString();
    this.state.timestamp = now;

    // Small stochastic drift on frequency (Indian Grid 50 Hz tight band)
    const freqNoise = (Math.random() - 0.5) * 0.015;
    this.state.gridFrequencyHz = Number((50.0 + Math.sin(this.simStep * 0.1) * 0.02 + freqNoise).toFixed(3));

    // Handle Ambient Temperature
    if (this.state.activeScenarioId === 'HEATWAVE') {
      this.state.ambientTempC = 43.5 + Math.sin(this.simStep * 0.05) * 1.0;
    } else {
      this.state.ambientTempC = 34.0 + Math.sin(this.simStep * 0.05) * 0.5;
    }

    // Handle Comm failure scenario
    if (this.state.activeScenarioId === 'COMM_FAILURE_220') {
      this.state.quality = this.simStep % 4 === 0 ? 'COMM_FAIL' : 'STALE';
    } else {
      this.state.quality = 'GOOD';
    }

    // Update Transformers
    Object.entries(this.state.transformers).forEach(([ictId, ict]) => {
      ict.ambientTempC = this.state.ambientTempC;

      // Check if breaker is open (e.g. CB-401 trip)
      const isTripped = (ictId === 'ICT-01' && this.state.breakers['CB-401']?.state === 'OPEN');

      if (isTripped) {
        ict.activePowerMW = 0;
        ict.apparentPowerMVA = 0;
        ict.hvCurrentA = 0;
        ict.lvCurrentA = 0;
        // Cool down slowly
        ict.topOilTempC = Math.max(ict.ambientTempC + 2, ict.topOilTempC - 0.05);
        ict.windingHotSpotTempC = Math.max(ict.ambientTempC + 4, ict.windingHotSpotTempC - 0.15);
        ict.coolingStage = 'ONAN';
      } else {
        // Load modulation
        let targetLoadMW = 185 + Math.sin(this.simStep * 0.08 + (ictId === 'ICT-02' ? 1 : 2)) * 6;

        if (this.state.activeScenarioId === 'OVERLOAD_ICT1' && ictId === 'ICT-01') {
          targetLoadMW = 338; // ~107% of 315 MVA rating
        } else if (this.state.breakers['CB-401']?.state === 'OPEN' && ictId !== 'ICT-01') {
          targetLoadMW = 275 + Math.sin(this.simStep * 0.05) * 4;
        }

        ict.activePowerMW = Number(targetLoadMW.toFixed(1));
        ict.reactivePowerMVAR = Number((targetLoadMW * 0.16).toFixed(1));
        ict.apparentPowerMVA = Number(Math.sqrt(ict.activePowerMW ** 2 + ict.reactivePowerMVAR ** 2).toFixed(1));
        ict.hvCurrentA = Number(((ict.apparentPowerMVA * 1000) / (Math.sqrt(3) * 402)).toFixed(1));
        ict.lvCurrentA = Number(((ict.apparentPowerMVA * 1000) / (Math.sqrt(3) * 221.8)).toFixed(1));

        // Thermal calculation based on load ratio L = S / S_rated
        const loadRatio = ict.apparentPowerMVA / 315;
        // Target Top Oil = Ambient + 38 * (loadRatio)^0.8
        const targetTopOil = ict.ambientTempC + 38 * Math.pow(loadRatio, 0.8);
        // First order lag
        ict.topOilTempC = Number((ict.topOilTempC + (targetTopOil - ict.topOilTempC) * 0.02).toFixed(1));

        // Winding Hot-spot = Top Oil + 22 * (loadRatio)^1.6
        const targetHotSpot = ict.topOilTempC + 22 * Math.pow(loadRatio, 1.6);
        ict.windingHotSpotTempC = Number((ict.windingHotSpotTempC + (targetHotSpot - ict.windingHotSpotTempC) * 0.05).toFixed(1));

        // Automated cooling fan stage control
        if (ict.topOilTempC > 74 || ict.windingHotSpotTempC > 95) {
          ict.coolingStage = 'ONAF2';
        } else if (ict.topOilTempC > 64 || ict.windingHotSpotTempC > 82) {
          ict.coolingStage = 'ONAF1';
        } else {
          ict.coolingStage = 'ONAN';
        }

        // Trigger alarm if hot spot exceeds 100°C
        if (ict.windingHotSpotTempC > 100 && this.simStep % 30 === 0) {
          this.emitAlarm({
            id: `ALM-TH-${Date.now()}-${ictId}`,
            timestamp: now,
            assetId: ictId,
            assetName: `315 MVA ${ictId}`,
            bayName: `400 kV ${ictId} Bay`,
            severity: 'MAJOR',
            status: 'ACTIVE',
            message: `HIGH WINDING TEMPERATURE: ${ict.windingHotSpotTempC}°C exceeds 98°C alarm threshold. ONAF fans active.`,
            readingValue: ict.windingHotSpotTempC,
            readingUnit: '°C',
          });
        }
      }

      // Record in history buffer
      this.recordHistory(now, ictId, 'windingHotSpotTempC', ict.windingHotSpotTempC);
      this.recordHistory(now, ictId, 'topOilTempC', ict.topOilTempC);
      this.recordHistory(now, ictId, 'activePowerMW', ict.activePowerMW);
    });

    // Update SF6 leakage scenario
    if (this.state.activeScenarioId === 'SF6_LEAK_404') {
      const cb404 = this.state.breakers['CB-404'];
      if (cb404 && cb404.sf6PressureBar > 5.15) {
        cb404.sf6PressureBar = Number((cb404.sf6PressureBar - 0.02).toFixed(2));
      }
    }

    // Update total throughput
    const activeMW = Object.values(this.state.transformers).reduce((sum, t) => sum + t.activePowerMW, 0);
    const reactiveMVAR = Object.values(this.state.transformers).reduce((sum, t) => sum + t.reactivePowerMVAR, 0);
    this.state.totalThroughputMW = Number(activeMW.toFixed(1));
    this.state.totalReactivePowerMVAR = Number(reactiveMVAR.toFixed(1));

    // Record bus frequency in history
    this.recordHistory(now, 'BUS-400-1', 'frequencyHz', this.state.gridFrequencyHz);

    this.notify();
  }

  private recordHistory(timestamp: string, assetId: string, metric: string, value: number) {
    this.history.push({
      timestamp,
      assetId,
      metric,
      value,
      quality: this.state.quality,
    });

    // Trim ring buffer
    const filteredCount = this.history.filter((h) => h.assetId === assetId && h.metric === metric).length;
    if (filteredCount > this.maxHistoryPerMetric) {
      const firstIdx = this.history.findIndex((h) => h.assetId === assetId && h.metric === metric);
      if (firstIdx !== -1) {
        this.history.splice(firstIdx, 1);
      }
    }
  }

  public getHistory(assetId?: string, metric?: string): TelemetryHistoryRecord[] {
    return this.history.filter((h) => {
      if (assetId && h.assetId !== assetId) return false;
      if (metric && h.metric !== metric) return false;
      return true;
    });
  }

  public getState(): TelemetryState {
    return this.state;
  }

  public subscribe(fn: (state: TelemetryState) => void): () => void {
    this.listeners.push(fn);
    fn(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public onAlarm(fn: (alarm: SubstationAlarm) => void): () => void {
    this.alarmListeners.push(fn);
    return () => {
      this.alarmListeners = this.alarmListeners.filter((l) => l !== fn);
    };
  }

  private emitAlarm(alarm: SubstationAlarm) {
    this.alarmListeners.forEach((fn) => fn(alarm));
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const telemetryService = new TelemetryEngine();
