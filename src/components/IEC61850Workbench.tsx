/**
 * SAT-TWIN: IEC 61850 & Utility Integration Workbench
 * Documents engineering interfaces for future integration with APTRANSCO SCADA/SAS.
 * Includes:
 * - MMS, GOOSE, and Sampled Values protocol profiles
 * - Logical Node Point Mapping (IEC 61850-7-4)
 * - Network Segmentation & Cybersecurity boundary (IEC 62351)
 * - Substation Configuration Language (SCL / SCD) generator
 */

import React, { useState } from 'react';
import {
  IEC61850_POINT_MAPPINGS,
  CONNECTOR_SPECS,
  generateSattenapalliSCL,
} from '../services/iec61850Adapter';
import { Cpu, ShieldCheck, FileCode, CheckCircle2, Copy, Download, Network } from 'lucide-react';

export const IEC61850Workbench: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POINT_MAP' | 'CONNECTORS' | 'SCL_VIEW' | 'CYBERSECURITY'>('POINT_MAP');
  const [copied, setCopied] = useState(false);
  const sclXml = generateSattenapalliSCL();

  const handleCopyScl = () => {
    navigator.clipboard.writeText(sclXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScl = () => {
    const element = document.createElement('a');
    const file = new Blob([sclXml], { type: 'application/xml' });
    element.href = URL.createObjectURL(file);
    element.download = 'APTRANSCO_SAT4012_Provisional.scd';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/50 text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              IEC 61850 Substation Automation System (SAS) Integration Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocol mapping, logical nodes, and cybersecurity boundaries for live SCADA integration with Sattenapalli 400/220 kV Substation (ID 4012).
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('POINT_MAP')}
          className={`py-2 border-b-2 transition-colors ${
            activeTab === 'POINT_MAP'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Logical Node Point Mapping ({IEC61850_POINT_MAPPINGS.length} Points)
        </button>

        <button
          onClick={() => setActiveTab('CONNECTORS')}
          className={`py-2 border-b-2 transition-colors ${
            activeTab === 'CONNECTORS'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Protocol Connectors (MMS / GOOSE / SV)
        </button>

        <button
          onClick={() => setActiveTab('CYBERSECURITY')}
          className={`py-2 border-b-2 transition-colors ${
            activeTab === 'CYBERSECURITY'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Network Segmentation & IEC 62351 Security
        </button>

        <button
          onClick={() => setActiveTab('SCL_VIEW')}
          className={`py-2 border-b-2 transition-colors ${
            activeTab === 'SCL_VIEW'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          SCL / SCD XML Generator
        </button>
      </div>

      {/* 1. Point Mapping Table */}
      {activeTab === 'POINT_MAP' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Logical Device / IED</th>
                <th className="p-3">Logical Node</th>
                <th className="p-3">Data Object / Attrib</th>
                <th className="p-3">Description</th>
                <th className="p-3">Image Asset</th>
                <th className="p-3">Protocol Profile</th>
                <th className="p-3">Quality Bit Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {IEC61850_POINT_MAPPINGS.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-cyan-400">{p.logicalDevice}</td>
                  <td className="p-3 text-amber-300 font-bold">{p.logicalNode}</td>
                  <td className="p-3 text-emerald-400">{`${p.dataObject}.${p.dataAttribute}`}</td>
                  <td className="p-3 font-sans text-slate-300">{p.iecDescription}</td>
                  <td className="p-3 text-white font-bold">{p.digitalImageAssetId}</td>
                  <td className="p-3">
                    <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-300">
                      {p.protocolProfile}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-sans text-[11px]">{p.qualityMapping}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Protocol Connectors Specs */}
      {activeTab === 'CONNECTORS' && (
        <div className="space-y-4">
          {CONNECTOR_SPECS.map((spec, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-400" />
                  {spec.protocolName}
                </h4>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                  {spec.networkSegment}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Source Device / Gateway:</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                    {spec.sourceDevice}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Standard Profile:</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 font-mono">
                    {spec.profileStandard}
                  </div>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-slate-400 block font-semibold mb-1">Cybersecurity Controls (IEC 62351):</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
                  {spec.securityControls.map((sec, sIdx) => (
                    <li key={sIdx}>{sec}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Failure & Recovery Behavior:</span>
                  <div className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800">
                    {spec.failureBehavior}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Site Acceptance Test (SAT) Criteria:</span>
                  <div className="text-emerald-300 bg-slate-950 p-2.5 rounded border border-slate-800">
                    {spec.acceptanceTestCriteria}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Cybersecurity & Network Segmentation */}
      {activeTab === 'CYBERSECURITY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Utility Security Perimeter & Network Segmentation Policy
          </div>

          <p>
            In accordance with CEA (Central Electricity Authority) Cybersecurity Guidelines for Power Sector and APTRANSCO IT/OT security mandates, the SAT-TWIN Digital Image platform is strictly partitioned from live protection and tripping circuits:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-rose-400 uppercase text-[11px]">ZONE 1: Protection & Control</div>
              <p className="text-[11px] text-slate-400">
                Direct bay protection relays (Distance, Differential, Breaker Failure). Air-gapped from digital image. Digital image cannot issue controls, trip commands, or modify protection settings.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-amber-400 uppercase text-[11px]">ZONE 2: Substation SAS Gateway</div>
              <p className="text-[11px] text-slate-400">
                Station bus MMS server. Unidirectional Data Diode / Optical Tap sends telemetry stream to Digital Image DMZ ingestion node. No incoming TCP packets accepted from external networks.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400 uppercase text-[11px]">ZONE 3: Digital Image Server</div>
              <p className="text-[11px] text-slate-400">
                Hosts state estimation, thermal physics model, 3D visualization, and alarm audit logs. Protected by TLS 1.3, strict RBAC, and immutable audit trailing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. SCL View */}
      {activeTab === 'SCL_VIEW' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Provisional Substation Configuration Description (SCL XML)
              </h4>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyScl}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied XML!' : 'Copy SCL'}
              </button>
              <button
                onClick={handleDownloadScl}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs flex items-center gap-1.5 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5" /> Download .SCD File
              </button>
            </div>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-96">
            {sclXml}
          </pre>
        </div>
      )}
    </div>
  );
};
