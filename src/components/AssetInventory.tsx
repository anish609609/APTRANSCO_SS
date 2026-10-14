/**
 * SAT-TWIN: Configurable Asset Inventory & Bay Registry
 * Allows engineers to inspect, search, filter, and dynamically add/edit substation assets and ratings.
 */

import React, { useState } from 'react';
import { SubstationAsset, SubstationBay, AssetType } from '../types/substation';
import { Layers, Plus, Search, Filter, Edit, Check, X, ShieldAlert } from 'lucide-react';

interface AssetInventoryProps {
  assets: SubstationAsset[];
  bays: SubstationBay[];
  onSelectAsset: (assetId: string) => void;
  onUpdateAsset: (updated: SubstationAsset) => void;
  onAddAsset: (newAsset: SubstationAsset) => void;
}

export const AssetInventory: React.FC<AssetInventoryProps> = ({
  assets,
  bays,
  onSelectAsset,
  onUpdateAsset,
  onAddAsset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [voltageFilter, setVoltageFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New asset form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newBayId, setNewBayId] = useState(bays[0]?.id || 'BAY-401');
  const [newType, setNewType] = useState<AssetType>('CIRCUIT_BREAKER');
  const [newVoltage, setNewVoltage] = useState<'400kV' | '220kV'>('400kV');
  const [newRating, setNewRating] = useState('');

  const filteredAssets = assets.filter((a) => {
    if (voltageFilter !== 'ALL' && a.voltageLevel !== voltageFilter) return false;
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (
      searchTerm &&
      !a.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !a.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !a.bayName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleStartEdit = (asset: SubstationAsset) => {
    setEditingAssetId(asset.id);
    setEditRating(asset.ratingSpecification);
  };

  const handleSaveEdit = (asset: SubstationAsset) => {
    onUpdateAsset({
      ...asset,
      ratingSpecification: editRating,
      isProvisional: false, // Marked as verified by user edit
    });
    setEditingAssetId(null);
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;
    const bay = bays.find((b) => b.id === newBayId);
    const asset: SubstationAsset = {
      id: newId,
      name: newName,
      bayId: newBayId,
      bayName: bay ? bay.name : 'Custom Bay',
      voltageLevel: newVoltage,
      type: newType,
      isProvisional: true,
      ratingSpecification: newRating || 'Configured via SAT-TWIN registry',
      position3D: [0, 0, 0],
      sldCoordinates: { x: 500, y: 300 },
      telemetryPoints: {},
    };
    onAddAsset(asset);
    setShowAddModal(false);
    setNewId('');
    setNewName('');
    setNewRating('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Top Controls & Add Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search by ID, name, bay..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-[44px] bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full"
            />
          </div>

          {/* Voltage Level */}
          <select
            value={voltageFilter}
            onChange={(e) => setVoltageFilter(e.target.value)}
            className="min-h-[44px] bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Voltage Levels</option>
            <option value="400kV">400 kV (EHV)</option>
            <option value="220kV">220 kV (HV)</option>
          </select>

          {/* Asset Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-h-[44px] bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Asset Types</option>
            <option value="POWER_TRANSFORMER">Power Transformers</option>
            <option value="CIRCUIT_BREAKER">Circuit Breakers</option>
            <option value="DISCONNECTOR">Disconnectors / Isolators</option>
            <option value="BUSBAR">Busbars</option>
            <option value="SHUNT_REACTOR">Shunt Reactors</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Asset / Bay Point
        </button>
      </div>

      {/* Asset Table with touch horizontal scrolling */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="w-full overflow-x-auto touch-scroll">
          <table className="w-full text-left border-collapse text-xs min-w-[750px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Asset ID</th>
                <th className="p-3">Asset Name</th>
                <th className="p-3">Bay Location</th>
                <th className="p-3">Voltage Class</th>
                <th className="p-3">Specification / Rating Plate</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAssets.map((asset) => {
                const isEditing = editingAssetId === asset.id;
                return (
                  <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-bold text-emerald-400">{asset.id}</td>
                    <td className="p-3 font-sans text-white font-semibold">{asset.name}</td>
                    <td className="p-3 font-sans text-slate-300">{asset.bayName}</td>
                    <td className="p-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          asset.voltageLevel === '400kV'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {asset.voltageLevel}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-300 max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editRating}
                          onChange={(e) => setEditRating(e.target.value)}
                          className="min-h-[38px] bg-slate-950 border border-emerald-500 rounded px-2 py-1 text-xs text-white w-full"
                        />
                      ) : (
                        asset.ratingSpecification
                      )}
                    </td>
                    <td className="p-3">
                      {asset.isProvisional ? (
                        <span className="text-[10px] font-sans uppercase bg-amber-950/70 border border-amber-700 text-amber-300 px-1.5 py-0.5 rounded">
                          Provisional
                        </span>
                      ) : (
                        <span className="text-[10px] font-sans uppercase bg-emerald-950/70 border border-emerald-700 text-emerald-300 px-1.5 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex justify-end gap-1.5 font-sans">
                          <button
                            onClick={() => handleSaveEdit(asset)}
                            className="min-h-[38px] min-w-[38px] p-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg text-white flex items-center justify-center transition-colors"
                            title="Save"
                            aria-label="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingAssetId(null)}
                            className="min-h-[38px] min-w-[38px] p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-300 flex items-center justify-center transition-colors"
                            title="Cancel"
                            aria-label="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-1.5 font-sans">
                          <button
                            onClick={() => onSelectAsset(asset.id)}
                            className="min-h-[38px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleStartEdit(asset)}
                            className="min-h-[38px] min-w-[38px] p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
                            title="Edit Rating Plate"
                            aria-label="Edit rating specification"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal (Bottom-sheet on mobile) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-4 shadow-2xl overflow-y-auto touch-scroll">
            {/* Drag Handle Indicator */}
            <div className="sm:hidden -mt-2 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Add New Substation Equipment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-white rounded-lg flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Equipment Identifier (e.g. CB-408, TR-AUX):</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="CB-408"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Equipment Full Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="CB 408 (400 kV Future Tie Breaker)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Substation Bay:</label>
                  <select
                    value={newBayId}
                    onChange={(e) => setNewBayId(e.target.value)}
                    className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {bays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Voltage Level:</label>
                  <select
                    value={newVoltage}
                    onChange={(e) => setNewVoltage(e.target.value as any)}
                    className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="400kV">400 kV</option>
                    <option value="220kV">220 kV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Rating Specifications:</label>
                <input
                  type="text"
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                  className="min-h-[44px] w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="420 kV, 3150 A, 50 kA, SF6 Live Tank"
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
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
