/**
 * SAT-TWIN: Alarm Lifecycle & Audit Manager
 * Handles IEC/SCADA standard alarm states:
 * Generated -> Unacknowledged Active -> Acknowledged Active -> Cleared
 * With full engineer audit trail.
 */

import { SubstationAlarm, AlarmSeverity, AlarmStatus } from '../types/substation';
import { telemetryService } from './telemetryEngine';

export interface AlarmAuditEntry {
  id: string;
  timestamp: string;
  alarmId: string;
  action: 'ACKNOWLEDGE' | 'CLEAR' | 'MANUAL_INJECT';
  engineer: string;
  notes: string;
}

class AlarmManager {
  private alarms: SubstationAlarm[] = [];
  private auditLog: AlarmAuditEntry[] = [];
  private listeners: Array<(alarms: SubstationAlarm[]) => void> = [];

  constructor() {
    this.seedInitialAlarms();
    // Listen to telemetry engine alarms
    telemetryService.onAlarm((alarm) => {
      this.addAlarm(alarm);
    });
  }

  private seedInitialAlarms() {
    const now = Date.now();
    this.alarms = [
      {
        id: 'ALM-INIT-001',
        timestamp: new Date(now - 1000 * 60 * 12).toISOString(),
        assetId: 'ICT-02',
        assetName: '315 MVA ICT-2 (400/220/33 kV)',
        bayName: '400 kV ICT-2 Bay',
        severity: 'INFO',
        status: 'ACKNOWLEDGED',
        message: 'OLTC TAP CHANGE INITIATED: Tap moved from Pos 8 to Pos 9 via AVR automatic regulation.',
        acknowledgedBy: 'Duty SE (Shift-1)',
        acknowledgedAt: new Date(now - 1000 * 60 * 10).toISOString(),
      },
      {
        id: 'ALM-INIT-002',
        timestamp: new Date(now - 1000 * 60 * 35).toISOString(),
        assetId: 'RE-401',
        assetName: '125 MVAR 400 kV Bus Reactor',
        bayName: '400 kV Bus Reactor Bay',
        severity: 'INFO',
        status: 'CLEARED',
        message: 'REACTIVE POWER ABSORPTION NOMINAL: 124 MVAR compensation active for VTPS-Sattenapalli line Ferranti voltage clamp.',
        acknowledgedBy: 'Station Shift In-Charge',
        acknowledgedAt: new Date(now - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'ALM-INIT-003',
        timestamp: new Date(now - 1000 * 60 * 5).toISOString(),
        assetId: 'CB-405',
        assetName: 'CB 405 (400 kV Tallapalli Feeder-2)',
        bayName: '400 kV Tallapalli Feeder-2 Bay',
        severity: 'WARNING',
        status: 'ACTIVE',
        message: 'TELEMETRY SCAN JITTER: Remote terminal unit RTU-405 packet delay 1.4s exceeding 800ms threshold.',
        readingValue: 1.4,
        readingUnit: 's',
      },
    ];

    this.auditLog = [
      {
        id: 'AUD-001',
        timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
        alarmId: 'ALM-INIT-001',
        action: 'ACKNOWLEDGE',
        engineer: 'Duty SE (Shift-1)',
        notes: 'Verified bus secondary voltage returned to 221.8 kV after OLTC tap stepping.',
      },
      {
        id: 'AUD-002',
        timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
        alarmId: 'ALM-INIT-002',
        action: 'CLEAR',
        engineer: 'Station Shift In-Charge',
        notes: 'Routine evening line charging absorption confirmed.',
      },
    ];
  }

  public getAlarms(): SubstationAlarm[] {
    return [...this.alarms];
  }

  public getAuditLog(): AlarmAuditEntry[] {
    return [...this.auditLog];
  }

  public addAlarm(alarm: SubstationAlarm) {
    // Avoid duplicate flood of same active alarm
    const existing = this.alarms.find(
      (a) => a.assetId === alarm.assetId && a.message === alarm.message && a.status === 'ACTIVE'
    );
    if (existing) return;

    this.alarms.unshift(alarm);
    this.notify();
  }

  public acknowledgeAlarm(alarmId: string, engineer = 'Shift Engineer (APTRANSCO)', notes = 'Acknowledged in digital image console') {
    const alarm = this.alarms.find((a) => a.id === alarmId);
    if (!alarm || alarm.status !== 'ACTIVE') return;

    alarm.status = 'ACKNOWLEDGED';
    alarm.acknowledgedBy = engineer;
    alarm.acknowledgedAt = new Date().toISOString();

    this.auditLog.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      alarmId,
      action: 'ACKNOWLEDGE',
      engineer,
      notes,
    });

    this.notify();
  }

  public clearAlarm(alarmId: string, engineer = 'Shift Engineer (APTRANSCO)', notes = 'Operator cleared') {
    const alarm = this.alarms.find((a) => a.id === alarmId);
    if (!alarm) return;

    alarm.status = 'CLEARED';

    this.auditLog.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      alarmId,
      action: 'CLEAR',
      engineer,
      notes,
    });

    this.notify();
  }

  public acknowledgeAll(engineer = 'Shift Engineer (APTRANSCO)') {
    const actives = this.alarms.filter((a) => a.status === 'ACTIVE');
    const now = new Date().toISOString();
    actives.forEach((alarm) => {
      alarm.status = 'ACKNOWLEDGED';
      alarm.acknowledgedBy = engineer;
      alarm.acknowledgedAt = now;
      this.auditLog.unshift({
        id: `AUD-${Date.now()}-${alarm.id}`,
        timestamp: now,
        alarmId: alarm.id,
        action: 'ACKNOWLEDGE',
        engineer,
        notes: 'Batch acknowledge all active alarms',
      });
    });
    this.notify();
  }

  public subscribe(fn: (alarms: SubstationAlarm[]) => void): () => void {
    this.listeners.push(fn);
    fn(this.alarms);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.alarms));
  }
}

export const alarmManager = new AlarmManager();
