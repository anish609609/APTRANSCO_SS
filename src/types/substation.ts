/**
 * SAT-TWIN: Domain Types for Sattenapalli 400/220 kV Substation (APTRANSCO)
 */

export type VoltageLevel = '400kV' | '220kV' | '33kV';

export type AssetType = 
  | 'POWER_TRANSFORMER'
  | 'CIRCUIT_BREAKER'
  | 'DISCONNECTOR'
  | 'EARTHING_SWITCH'
  | 'BUSBAR'
  | 'SHUNT_REACTOR'
  | 'CURRENT_TRANSFORMER'
  | 'VOLTAGE_TRANSFORMER'
  | 'SURGE_ARRESTER';

export type BreakerState = 'CLOSED' | 'OPEN' | 'INTERMEDIATE' | 'UNKNOWN';
export type DisconnectorState = 'CLOSED' | 'OPEN' | 'MOTOR_OPERATING';
export type EarthSwitchState = 'OPEN' | 'CLOSED';

export type QualityState = 'GOOD' | 'STALE' | 'SUSPECT' | 'COMM_FAIL' | 'ESTIMATED';
export type DataProvenance = 'SIMULATED_PHYSICS' | 'DERIVED_MODEL' | 'PROVISIONAL_DEFAULT' | 'SCADA_IMPORT_MOCK';

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INFO';
export type AlarmStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED';

export interface MeasurementReading {
  pointId: string;
  name: string;
  value: number;
  unit: string;
  quality: QualityState;
  provenance: DataProvenance;
  timestamp: string; // ISO string
  warningHigh?: number;
  criticalHigh?: number;
  warningLow?: number;
  criticalLow?: number;
}

export interface TransformerTelemetry {
  hvVoltageKV: number;
  lvVoltageKV: number;
  tertiaryVoltageKV: number;
  hvCurrentA: number;
  lvCurrentA: number;
  activePowerMW: number;
  reactivePowerMVAR: number;
  apparentPowerMVA: number;
  powerFactor: number;
  topOilTempC: number;
  windingHotSpotTempC: number;
  ambientTempC: number;
  tapPosition: number;
  maxTap: number;
  coolingStage: 'ONAN' | 'ONAF1' | 'ONAF2' | 'OFAF';
  oilLevelPercent: number;
  dga: {
    hydrogenH2: number;      // ppm
    methaneCH4: number;       // ppm
    acetyleneC2H2: number;    // ppm
    ethyleneC2H4: number;     // ppm
    ethaneC2H6: number;       // ppm
    carbonMonoxideCO: number; // ppm
    carbonDioxideCO2: number; // ppm
    totalCombustibleGas: number; // ppm
    duvalDiagnosis: string;
  };
  healthIndexScore: number; // 0-100
}

export interface BreakerTelemetry {
  state: BreakerState;
  sf6PressureBar: number;
  sf6PressureNominalBar: number;
  operatingCounter: number;
  springCharged: boolean;
  tripCoil1Healthy: boolean;
  tripCoil2Healthy: boolean;
  currentA: number;
  accumulatedDutyKA2s: number;
  closingTimeMs: number;
  openingTimeMs: number;
}

export interface DisconnectorTelemetry {
  state: DisconnectorState;
  interlockSatisfied: boolean;
  motorCurrentA: number;
  auxiliarySwitchContactGood: boolean;
}

export interface BusbarTelemetry {
  phaseVoltageR_KV: number;
  phaseVoltageY_KV: number;
  phaseVoltageB_KV: number;
  frequencyHz: number;
  differentialCurrentA: number;
  energized: boolean;
}

export interface ReactorTelemetry {
  reactivePowerMVAR: number;
  voltageKV: number;
  currentA: number;
  oilTempC: number;
  vibrationMmS: number;
}

export interface SubstationAsset {
  id: string; // e.g. "ICT-01", "CB-401", "DS-401A"
  name: string;
  bayId: string;
  bayName: string;
  voltageLevel: VoltageLevel;
  type: AssetType;
  isProvisional: boolean; // Flagged if unverified from field drawings
  manufacturer?: string;
  commissioningYear?: number;
  ratingSpecification: string;
  position3D: [number, number, number]; // [x, y, z] in switchyard 3D coordinate space
  rotation3D?: [number, number, number];
  sldCoordinates: { x: number; y: number }; // Relative position on Single-Line Diagram
  telemetryPoints: Record<string, MeasurementReading>;
}

export interface SubstationBay {
  id: string;
  name: string;
  voltageLevel: VoltageLevel;
  bayType: 'TRANSFORMER' | 'LINE' | 'BUS_COUPLER' | 'REACTOR' | 'BUS_SECTION';
  associatedLineOrUnit: string;
  assetIds: string[];
  isProvisional: boolean;
}

export interface SubstationAlarm {
  id: string;
  timestamp: string;
  assetId: string;
  assetName: string;
  bayName: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  message: string;
  readingValue?: number;
  readingUnit?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface TelemetryHistoryRecord {
  timestamp: string;
  assetId: string;
  metric: string;
  value: number;
  quality: QualityState;
}

export interface SimulationFaultScenario {
  id: string;
  title: string;
  description: string;
  category: 'THERMAL' | 'ELECTRICAL' | 'GAS_LEAK' | 'COMMUNICATION' | 'NORMAL';
  active: boolean;
}

export interface ProvisionalVerificationItem {
  id: string;
  category: 'EQUIPMENT_SPEC' | 'BAY_CONFIGURATION' | 'TOPOLOGY' | 'TELEMETRY_MAP' | 'SINGLE_LINE';
  item: string;
  provisionalAssumption: string;
  fieldVerificationNeeded: string;
  status: 'PENDING_SITE_VERIFICATION' | 'CONFIRMED' | 'DISCREPANCY_FLAGGED';
  updatedAt: string;
}
