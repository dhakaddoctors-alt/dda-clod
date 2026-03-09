'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, PlusCircle, X, UserPlus, Trash2, Check, Loader2 } from 'lucide-react';
import {
  addCommittee,
  addCommitteeMember,
  removeCommitteeMember,
  deleteCommittee,
  saveCommitteeHierarchy,
  searchProfiles,
} from '@/app/actions/committeeActions';

interface MemberData {
  id: string;
  profileId: string;
  designation: string;
  rankOrder: number | null;
  name: string | null;
  avatarUrl: string | null;
}

interface CommitteeTier {
  id: string;
  level: string;
  locationName: string | null;
  members: MemberData[];
}

interface Props {
  initialTiers: CommitteeTier[];
}

export default function CommitteeBuilder({ initialTiers }: Props) {
  const router = useRouter();
  const [tiers, setTiers] = useState<CommitteeTier[]>(initialTiers);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Sync state if initialTiers changes
  useEffect(() => {
    setTiers(initialTiers);
  }, [initialTiers]);

  // Add Tier modal state
  const [addTierOpen, setAddTierOpen] = useState(false);
  const [newLevel, setNewLevel] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [addingTier, setAddingTier] = useState(false);

  // Add Member modal state
  const [addMemberTierId, setAddMemberTierId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; fullName: string | null; role: string | null }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; fullName: string | null } | null>(null);
  const [designation, setDesignation] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcIdx = tiers.findIndex(t => t.id === source.droppableId);
    const dstIdx = tiers.findIndex(t => t.id === destination.droppableId);
    const newTiers = [...tiers];
    const srcMembers = [...newTiers[srcIdx].members];
    const dstMembers = source.droppableId === destination.droppableId ? srcMembers : [...newTiers[dstIdx].members];
    const [moved] = srcMembers.splice(source.index, 1);
    dstMembers.splice(destination.index, 0, moved);
    newTiers[srcIdx].members = srcMembers;
    if (source.droppableId !== destination.droppableId) newTiers[dstIdx].members = dstMembers;
    setTiers(newTiers);
  };

  // ─── Save Hierarchy ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    const payload = tiers.map(tier => ({
      committeeId: tier.id,
      members: tier.members.map((m, i) => ({ memberId: m.id, rankOrder: i })),
    }));
    
    startTransition(async () => {
      await saveCommitteeHierarchy(payload);
      setSaving(false);
      setSaveMsg('Saved!');
      router.refresh();
      setTimeout(() => setSaveMsg(''), 2500);
    });
  };

  // ─── Add Tier ────────────────────────────────────────────────────────────────
  const handleAddTier = async () => {
    if (!newLevel.trim()) return;
    setAddingTier(true);
    startTransition(async () => {
      await addCommittee(newLevel.trim(), newLocation.trim());
      setAddingTier(false);
      setAddTierOpen(false);
      setNewLevel('');
      setNewLocation('');
      router.refresh();
    });
  };

  // ─── Delete Tier ─────────────────────────────────────────────────────────────
  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Delete this committee and all its members?')) return;
    startTransition(async () => {
      await deleteCommittee(tierId);
      setTiers(prev => prev.filter(t => t.id !== tierId));
      router.refresh();
    });
  };

  // ─── Member Search ───────────────────────────────────────────────────────────
  const handleMemberSearch = async (q: string) => {
    setMemberSearch(q);
    setSearchLoading(true);
    const results = await searchProfiles(q);
    setSearchResults(results as any);
    setSearchLoading(false);
  };

  // ─── Add Member ──────────────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!selectedProfile || !designation.trim() || !addMemberTierId) return;
    setAddingMember(true);
    const tier = tiers.find(t => t.id === addMemberTierId)!;
    
    startTransition(async () => {
      await addCommitteeMember(addMemberTierId, selectedProfile.id, designation.trim(), tier.members.length);
      setAddingMember(false);
      setAddMemberTierId(null);
      setSelectedProfile(null);
      setDesignation('');
      router.refresh();
    });
  };

  // ─── Remove Member ───────────────────────────────────────────────────────────
  const handleRemoveMember = async (memberId: string, tierId: string) => {
    startTransition(async () => {
      await removeCommitteeMember(memberId);
      setTiers(prev => prev.map(t =>
        t.id === tierId ? { ...t, members: t.members.filter(m => m.id !== memberId) } : t
      ));
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Committee Builder</h2>
          <p className="text-sm text-gray-500">Drag members to reorder. Add/remove tiers and members.</p>
        </div>
        <button
          onClick={() => setAddTierOpen(true)}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Add Tier
        </button>
      </div>

      {/* DnD Area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {tiers.map((tier) => (
            <div key={tier.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  {tier.level} {tier.locationName && <span className="text-gray-500 font-normal text-sm">({tier.locationName})</span>}
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{tier.members.length} Members</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setAddMemberTierId(tier.id); setSelectedProfile(null); setDesignation(''); setMemberSearch(''); setSearchResults([]); }}
                    className="flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
                  </button>
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete this tier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Droppable droppableId={tier.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[60px] rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 outline-dashed outline-2 outline-blue-300' : ''}`}
                  >
                    {tier.members.map((member, index) => (
                      <Draggable key={member.id} draggableId={member.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm mb-2 group ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 rotate-1' : 'hover:border-blue-200'}`}
                          >
                            <div {...provided.dragHandleProps} className="text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                              {member.name?.charAt(0) ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{member.name ?? 'Unknown'}</p>
                            </div>
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full shrink-0">
                              {member.designation}
                            </span>
                            <button
                              onClick={() => handleRemoveMember(member.id, tier.id)}
                              className="p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {tier.members.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center p-4 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                        Drag members here or click "Add Member"
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {tiers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium">No committees yet.</p>
          <p className="text-sm">Click "Add Tier" to create your first committee.</p>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end items-center gap-3">
        {saveMsg && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <Check className="w-4 h-4" /> {saveMsg}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-transform active:scale-95 disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Hierarchy Configuration
        </button>
      </div>

      {/* ── Add Tier Modal ─────────────────────────────────── */}
      {addTierOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Add New Committee Tier</h3>
              <button onClick={() => setAddTierOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Committee Level <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. National Committee, State Committee"
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan, Delhi, National"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setAddTierOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
              <button
                onClick={handleAddTier}
                disabled={!newLevel.trim() || addingTier}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
              >
                {addingTier && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Tier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ───────────────────────────────── */}
      {addMemberTierId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Add Member to Committee</h3>
              <button onClick={() => setAddMemberTierId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Member</label>
                <input
                  type="text"
                  placeholder="Type name to search..."
                  value={memberSearch}
                  onChange={e => handleMemberSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchLoading && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                {searchResults.length > 0 && !selectedProfile && (
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProfile(p); setMemberSearch(p.fullName ?? ''); setSearchResults([]); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {p.fullName?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{p.fullName}</p>
                          <p className="text-xs text-gray-500 capitalize">{p.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedProfile && (
                  <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-sm font-medium text-blue-800">{selectedProfile.fullName}</span>
                    <button onClick={() => { setSelectedProfile(null); setMemberSearch(''); }} className="ml-auto p-0.5 text-blue-400 hover:text-blue-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. President, Secretary, Member"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setAddMemberTierId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
              <button
                onClick={handleAddMember}
                disabled={!selectedProfile || !designation.trim() || addingMember}
                className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
              >
                {addingMember && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
