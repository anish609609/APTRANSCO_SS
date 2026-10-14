/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { Switchyard3D } from './components/Switchyard3D';
import { SingleLineDiagram } from './components/SingleLineDiagram';
import { HistoricalTrends } from './components/HistoricalTrends';
import { AlarmManagement } from './components/AlarmManagement';
import { AssetInventory } from './components/AssetInventory';
import { IEC61850Workbench } from './components/IEC61850Workbench';
import { SiteVerificationLog } from './components/SiteVerificationLog';
import { AssetDetailModal } from './components/AssetDetailModal';

import { telemetryService, TelemetryState } from './services/telemetryEngine';
import { alarmManager } from './services/alarmManager';
import { INITIAL_ASSETS, INITIAL_BAYS } from './config/siteData';
import { SubstationAsset, SubstationAlarm } from './types/substation';

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryState>(telemetryService.getState());
  const [alarms, setAlarms] = useState<SubstationAlarm[]>(alarmManager.getAlarms());
  const [auditLog, setAuditLog] = useState(alarmManager.getAuditLog());
  const [assets, setAssets] = useState<SubstationAsset[]>(INITIAL_ASSETS);
  const [bays] = useState(INITIAL_BAYS);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(telemetryService.getPaused());
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  useEffect(() => {
    // Start telemetry physics loop
    telemetryService.start();

    const unsubTelemetry = telemetryService.subscribe((state) => {
      setTelemetry({ ...state });
    });

    const unsubAlarms = alarmManager.subscribe((updatedAlarms) => {
      setAlarms([...updatedAlarms]);
      setAuditLog([...alarmManager.getAuditLog()]);
    });

    return () => {
      telemetryService.stop();
      unsubTelemetry();
      unsubAlarms();
    };
  }, []);

  const handleTogglePause = () => {
    const paused = telemetryService.togglePause();
    setIsPaused(paused);
  };

  const handleSetSpeed = (speed: number) => {
    telemetryService.setSpeed(speed);
    setSimulationSpeed(speed);
  };

  const handleSelectScenario = (scenarioId: string) => {
    telemetryService.setScenario(scenarioId);
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
  };

  const handleUpdateAsset = (updated: SubstationAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleAddAsset = (newAsset: SubstationAsset) => {
    setAssets((prev) => [...prev, newAsset]);
  };

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;
  const activeAlarmCount = alarms.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-x-hidden overflow-y-hidden bg-slate-950 font-sans antialiased text-slate-100">
      {/* Global Control Header */}
      <Header
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        simulationSpeed={simulationSpeed}
        onSetSpeed={handleSetSpeed}
        onSelectScenario={handleSelectScenario}
        activeAlarmCount={activeAlarmCount}
      />

      {/* Main View Router */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'overview' && (
          <OverviewDashboard
            telemetry={telemetry}
            assets={assets}
            alarms={alarms}
            onSelectAsset={handleSelectAsset}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === '3d' && (
          <Switchyard3D
            telemetry={telemetry}
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={handleSelectAsset}
          />
        )}

        {activeTab === 'sld' && (
          <SingleLineDiagram
            telemetry={telemetry}
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={handleSelectAsset}
          />
        )}

        {activeTab === 'trends' && (
          <HistoricalTrends
            telemetry={telemetry}
            assets={assets}
          />
        )}

        {activeTab === 'alarms' && (
          <AlarmManagement
            alarms={alarms}
            auditLog={auditLog}
            activeScenarioId={telemetry.activeScenarioId}
            onSelectScenario={handleSelectScenario}
          />
        )}

        {activeTab === 'inventory' && (
          <AssetInventory
            assets={assets}
            bays={bays}
            onSelectAsset={handleSelectAsset}
            onUpdateAsset={handleUpdateAsset}
            onAddAsset={handleAddAsset}
          />
        )}

        {activeTab === 'iec61850' && <IEC61850Workbench />}

        {activeTab === 'verification' && <SiteVerificationLog />}
      </main>

      {/* Asset Detail & Condition Monitoring Inspector Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          telemetry={telemetry}
          onClose={() => setSelectedAssetId(null)}
        />
      )}
    </div>
  );
}
