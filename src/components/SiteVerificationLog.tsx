/**
 * SAT-TWIN: Provisional Site Verification Ledger
 * Tracks every assumption made in the digital image prototype vs real-world APTRANSCO site facts.
 * Fulfills Definition of Done section 11 requirements.
 */

import React, { useState } from 'react';
import { ProvisionalVerificationItem } from '../types/substation';
import { INITIAL_VERIFICATION_CHECKLIST } from '../config/siteData';
import { FileCheck2, AlertCircle, CheckCircle, Clock, Plus, Edit } from 'lucide-react';

export const SiteVerificationLog: React.FC = () => {
  const [items, setItems] = useState<ProvisionalVerificationItem[]>(INITIAL_VERIFICATION_CHECKLIST);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newAssumption, setNewAssumption] = useState('');
  const [newNeeded, setNewNeeded] = useState('');

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus =
            item.status === 'PENDING_SITE_VERIFICATION'
              ? 'CONFIRMED'
              : item.status === 'CONFIRMED'
              ? 'DISCREPANCY_FLAGGED'
              : 'PENDING_SITE_VERIFICATION';
          return { ...item, status: nextStatus, updatedAt: new Date().toISOString().split('T')[0] };
        }
        return item;
      })
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText) return;
    const newItem: ProvisionalVerificationItem = {
      id: `VER-00${items.length + 1}`,
      category: 'TOPOLOGY',
      item: newItemText,
      provisionalAssumption: newAssumption,
      fieldVerificationNeeded: newNeeded,
      status: 'PENDING_SITE_VERIFICATION',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setItems([...items, newItem]);
    setShowAddModal(false);
    setNewItemText('');
    setNewAssumption('');
    setNewNeeded('');
  };

  const getStatusBadge = (status: ProvisionalVerificationItem['status']) => {
    switch (status) {
      case 'PENDING_SITE_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/80 border border-amber-600 px-2 py-0.5 rounded text-[10px] font-mono">
            <Clock className="w-3 h-3 text-amber-400" /> PENDING SITE AUDIT
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/80 border border-emerald-600 px-2 py-0.5 rounded text-[10px] font-mono">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> CONFIRMED WITH UTILITY
          </span>
        );
      case 'DISCREPANCY_FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-950/80 border border-rose-600 px-2 py-0.5 rounded text-[10px] font-mono">
            <AlertCircle className="w-3 h-3 text-rose-400" /> DISCREPANCY IDENTIFIED
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-600/50 text-amber-400 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Sattenapalli 400/220 kV Site Verification Ledger
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Explicit record of provisional assumptions vs. verified engineering documentation from APTRANSCO.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow"
          >
            <Plus className="w-4 h-4" /> Add Verification Item
          </button>
        </div>
      </div>

      {/* Verification Ledger Table with touch-scrolling */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="w-full overflow-x-auto touch-scroll">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Ref ID</th>
                <th className="p-3">Substation Element / Parameter</th>
                <th className="p-3">Provisional Assumption in Prototype</th>
                <th className="p-3">Site Verification Required from APTRANSCO</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-mono text-cyan-400 font-bold">{item.id}</td>
                  <td className="p-3 font-semibold text-white max-w-xs">{item.item}</td>
                  <td className="p-3 text-slate-300 max-w-xs">{item.provisionalAssumption}</td>
                  <td className="p-3 text-slate-400 max-w-sm">{item.fieldVerificationNeeded}</td>
                  <td className="p-3 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className="min-h-[38px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      Toggle Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal (Mobile bottom-sheet) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-4 shadow-2xl overflow-y-auto touch-scroll text-xs">
            {/* Drag Handle Indicator */}
            <div className="sm:hidden -mt-2 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Add Site Verification Assumption</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-white rounded-lg flex items-center justify-center"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Substation Element / Specification:</label>
                <input
                  type="text"
                  required
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. 33 kV Tertiary Station Transformer arrangement"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Provisional Prototype Assumption:</label>
                <textarea
                  required
                  rows={2}
                  value={newAssumption}
                  onChange={(e) => setNewAssumption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Assumed two 5 MVA 33/0.415 kV station auxiliary transformers"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Verification Required from APTRANSCO Field:</label>
                <textarea
                  required
                  rows={2}
                  value={newNeeded}
                  onChange={(e) => setNewNeeded(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Inspect auxiliary switchgear room at Sattenapalli CRB"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow"
                >
                  Record Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
