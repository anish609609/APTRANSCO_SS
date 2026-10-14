/**
 * SAT-TWIN: Alarm Management & Audit Console
 * Handles SCADA/IEC alarm lifecycle: ACTIVE -> ACKNOWLEDGED -> CLEARED
 * Records verifiable audit trail of operator acknowledgements and fault injections.
 */

import React, { useState } from 'react';
import { SubstationAlarm, AlarmSeverity, AlarmStatus } from '../types/substation';
import { alarmManager, AlarmAuditEntry } from '../services/alarmManager';
import { telemetryService, FAULT_SCENARIOS } from '../services/telemetryEngine';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  User,
  History,
  FileCheck,
  Flame,
  Check,
  Filter,
} from 'lucide-react';

interface AlarmManagementProps {
  alarms: SubstationAlarm[];
  auditLog: AlarmAuditEntry[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
}

export const AlarmManagement: React.FC<AlarmManagementProps> = ({
  alarms,
  auditLog,
  activeScenarioId,
  onSelectScenario,
}) => {
  const [activeTab, setActiveTab] = useState<'ALARMS' | 'AUDIT'>('ALARMS');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredAlarms = alarms.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const getSeverityBadge = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="text-rose-400 bg-rose-950/80 border border-rose-600 px-2 py-0.5 rounded font-mono text-[10px] font-bold">CRITICAL</span>;
      case 'MAJOR':
        return <span className="text-orange-400 bg-orange-950/80 border border-orange-600 px-2 py-0.5 rounded font-mono text-[10px] font-bold">MAJOR</span>;
      case 'WARNING':
        return <span className="text-amber-400 bg-amber-950/80 border border-amber-600 px-2 py-0.5 rounded font-mono text-[10px] font-bold">WARNING</span>;
      case 'MINOR':
        return <span className="text-blue-400 bg-blue-950/80 border border-blue-600 px-2 py-0.5 rounded font-mono text-[10px] font-bold">MINOR</span>;
      case 'INFO':
        return <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">INFO</span>;
    }
  };

  const getStatusBadge = (status: AlarmStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="text-rose-400 font-mono text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> UNACKNOWLEDGED</span>;
      case 'ACKNOWLEDGED':
        return <span className="text-amber-400 font-mono text-xs flex items-center gap-1"><Check className="w-3.5 h-3.5" /> ACKNOWLEDGED</span>;
      case 'CLEARED':
        return <span className="text-emerald-400 font-mono text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> CLEARED</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* 1. Fault Scenario Injection Sandbox Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Simulation Sandbox & Fault Injection Triggers
            </h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400">DEMO MODE ACTIVE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          {FAULT_SCENARIOS.map((sc) => {
            const isActive = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className={`min-h-[48px] p-2.5 rounded-lg border text-left transition-all flex flex-col justify-center ${
                  isActive
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold leading-tight line-clamp-1">{sc.title}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{sc.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Alarm Tab / Audit Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap touch-scroll pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('ALARMS')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'ALARMS'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Alarms List ({alarms.filter((a) => a.status === 'ACTIVE').length} Active)
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'AUDIT'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Operator Audit Trail ({auditLog.length} Records)
          </button>
        </div>

        {activeTab === 'ALARMS' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => alarmManager.acknowledgeAll()}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Acknowledge All Active
            </button>
          </div>
        )}
      </div>

      {/* 3. Filter Strip */}
      {activeTab === 'ALARMS' && (
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-slate-400 font-medium shrink-0">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="min-h-[44px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="MAJOR">Major</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-slate-400 font-medium shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[44px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (Unacknowledged)</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="CLEARED">Cleared</option>
            </select>
          </div>
        </div>
      )}

      {/* 4. Table Views (Horizontally touch-scrollable) */}
      {activeTab === 'ALARMS' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="w-full overflow-x-auto touch-scroll">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3">Severity</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Asset & Bay</th>
                  <th className="p-3">Alarm Message</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredAlarms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                      No alarms match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredAlarms.map((alarm) => (
                    <tr key={alarm.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">{getSeverityBadge(alarm.severity)}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {new Date(alarm.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-white font-sans">{alarm.assetName}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{alarm.bayName}</div>
                      </td>
                      <td className="p-3 text-slate-200 font-sans max-w-md">{alarm.message}</td>
                      <td className="p-3 whitespace-nowrap">{getStatusBadge(alarm.status)}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {alarm.status === 'ACTIVE' && (
                          <button
                            onClick={() => alarmManager.acknowledgeAlarm(alarm.id)}
                            className="min-h-[38px] px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 active:bg-amber-600/70 border border-amber-500 text-amber-200 rounded-lg text-xs font-sans font-medium transition-colors mr-2"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alarm.status !== 'CLEARED' && (
                          <button
                            onClick={() => alarmManager.clearAlarm(alarm.id)}
                            className="min-h-[38px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded-lg text-xs font-sans font-medium transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* AUDIT TRAIL LOG */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="w-full overflow-x-auto touch-scroll">
            <table className="w-full text-left border-collapse text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Responsible Engineer</th>
                  <th className="p-3">Audit Notes & Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLog.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-cyan-400">{log.id}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                    </td>
                    <td className="p-3 font-bold text-white">{log.action}</td>
                    <td className="p-3 text-emerald-400 font-sans">{log.engineer}</td>
                    <td className="p-3 text-slate-300 font-sans">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
