'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

// TODO: Replace with real API data from game-engine GET /rtp-profiles
const INITIAL_PROFILES = [
  { id: 'rtp001', name: 'Standard Slots', gameType: 'SLOT', rtpValue: 0.96, volatility: 'MEDIUM', isActive: true },
  { id: 'rtp002', name: 'High Roller Slots', gameType: 'SLOT', rtpValue: 0.97, volatility: 'HIGH', isActive: true },
  { id: 'rtp003', name: 'Budget Slots', gameType: 'SLOT', rtpValue: 0.92, volatility: 'LOW', isActive: false },
  { id: 'rtp004', name: 'Crash Standard', gameType: 'CRASH', rtpValue: 0.94, volatility: 'HIGH', isActive: true },
  { id: 'rtp005', name: 'Dice Standard', gameType: 'DICE', rtpValue: 0.97, volatility: 'LOW', isActive: true },
  { id: 'rtp006', name: 'Jackpot Slots', gameType: 'SLOT', rtpValue: 0.88, volatility: 'MEDIUM', isActive: true },
];

const RTP_MIN = 0.80;
const RTP_MAX = 0.97;

interface RTPProfile {
  id: string;
  name: string;
  gameType: string;
  rtpValue: number;
  volatility: string;
  isActive: boolean;
}

export default function RTPProfilesPage() {
  const [profiles, setProfiles] = useState<RTPProfile[]>(INITIAL_PROFILES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRtp, setEditRtp] = useState('');
  const [editError, setEditError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', gameType: 'SLOT', rtpValue: '0.96', volatility: 'MEDIUM' });

  function startEdit(p: RTPProfile) {
    setEditingId(p.id);
    setEditRtp(String(p.rtpValue));
    setEditError('');
  }

  function saveEdit(id: string) {
    const val = parseFloat(editRtp);
    if (isNaN(val) || val < RTP_MIN || val > RTP_MAX) {
      setEditError(`RTP must be between ${RTP_MIN} and ${RTP_MAX}`);
      return;
    }
    // TODO: wire up to game-engine PATCH /rtp-profiles/:id
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, rtpValue: val } : p)));
    setEditingId(null);
  }

  function toggleActive(id: string) {
    // TODO: wire up to game-engine PATCH /rtp-profiles/:id
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  }

  function createProfile() {
    const val = parseFloat(newProfile.rtpValue);
    if (isNaN(val) || val < RTP_MIN || val > RTP_MAX) return;
    // TODO: wire up to game-engine POST /rtp-profiles
    const id = `rtp${Date.now()}`;
    setProfiles((prev) => [...prev, { ...newProfile, id, rtpValue: val, isActive: false }]);
    setShowCreate(false);
    setNewProfile({ name: '', gameType: 'SLOT', rtpValue: '0.96', volatility: 'MEDIUM' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-panda-white">RTP Profiles</h2>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-neon-orange text-deep-black text-sm font-semibold rounded-lg hover:bg-neon-orange/90 transition-colors">
          + New Profile
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-dark-border text-left">
              {['Name', 'Game Type', 'RTP Value', 'Volatility', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-dark-border/50 hover:bg-neon-orange/5 transition-colors">
                <td className="px-4 py-3 text-panda-white font-medium">{p.name}</td>
                <td className="px-4 py-3 text-neon-cyan">{p.gameType}</td>
                <td className="px-4 py-3">
                  {editingId === p.id ? (
                    <div>
                      <input
                        type="number" step="0.01" min={RTP_MIN} max={RTP_MAX}
                        value={editRtp}
                        onChange={(e) => { setEditRtp(e.target.value); setEditError(''); }}
                        className="w-24 bg-deep-black border border-neon-orange/40 rounded px-2 py-1 text-sm text-panda-white outline-none"
                      />
                      {editError && <div className="text-xs text-neon-red mt-1">{editError}</div>}
                    </div>
                  ) : (
                    <span className="text-neon-green font-mono">{(p.rtpValue * 100).toFixed(1)}%</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">{p.volatility}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p.id)}
                    className={clsx('px-2 py-0.5 rounded border text-xs font-medium transition-colors',
                      p.isActive ? 'bg-neon-green/10 text-neon-green border-neon-green/30' : 'bg-gray-700/30 text-gray-400 border-gray-600')}>
                    {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {editingId === p.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(p.id)} className="text-xs text-neon-green hover:underline">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(p)} className="text-xs text-neon-orange hover:underline">Edit RTP</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-neon-orange/30 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-heading text-lg font-bold text-neon-orange">New RTP Profile</h3>
            {(['name', 'gameType', 'rtpValue', 'volatility'] as const).map((field) => (
              <div key={field}>
                <label className="text-xs text-gray-400 block mb-1 capitalize">{field === 'rtpValue' ? `RTP Value (${RTP_MIN}–${RTP_MAX})` : field}</label>
                {field === 'gameType' ? (
                  <select value={newProfile.gameType} onChange={(e) => setNewProfile((p) => ({ ...p, gameType: e.target.value }))}
                    className="w-full bg-deep-black border border-dark-border rounded px-3 py-1.5 text-sm text-panda-white outline-none">
                    {['SLOT', 'CRASH', 'DICE', 'ROULETTE', 'BLACKJACK'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                ) : field === 'volatility' ? (
                  <select value={newProfile.volatility} onChange={(e) => setNewProfile((p) => ({ ...p, volatility: e.target.value }))}
                    className="w-full bg-deep-black border border-dark-border rounded px-3 py-1.5 text-sm text-panda-white outline-none">
                    {['LOW', 'MEDIUM', 'HIGH'].map((v) => <option key={v}>{v}</option>)}
                  </select>
                ) : (
                  <input type={field === 'rtpValue' ? 'number' : 'text'} step="0.01"
                    value={newProfile[field]}
                    onChange={(e) => setNewProfile((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full bg-deep-black border border-dark-border rounded px-3 py-1.5 text-sm text-panda-white outline-none focus:border-neon-orange/60" />
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={createProfile} className="flex-1 py-2 rounded bg-neon-orange text-deep-black text-sm font-semibold hover:bg-neon-orange/90 transition-colors">Create</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded border border-dark-border text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
