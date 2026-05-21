'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLiveOpsConfigs } from '@/lib/api';

interface LiveOpsConfig {
  id: string;
  key: string;
  value: string;
  type: string;
  environment: string;
  description?: string;
  isEnabled: boolean;
  updatedAt: string;
}

export default function LiveOpsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-liveops'],
    queryFn: () => fetchLiveOpsConfigs('production'),
  });

  const configs: LiveOpsConfig[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-panda-white">LiveOps & Feature Flags</h1>
        <button className="admin-btn bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20">
          + New Config
        </button>
      </div>

      <div className="glass-card border-dark-border overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8 text-panda-white/30 font-heading">Loading...</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">⚙️</div>
            <div className="font-heading text-panda-white/50">No LiveOps configs found</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                {['Key', 'Type', 'Value', 'Enabled', 'Updated', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-heading text-xs text-panda-white/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {configs.map((cfg) => (
                <tr key={cfg.id} className="border-b border-dark-border/30 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-heading font-bold text-neon-cyan/80 text-sm">{cfg.key}</td>
                  <td className="px-4 py-3 text-panda-white/40 text-xs font-heading uppercase">{cfg.type}</td>
                  <td className="px-4 py-3 font-mono text-panda-white/70 text-xs max-w-xs truncate">{cfg.value}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-heading font-bold border ${
                      cfg.isEnabled ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-dark-card text-panda-white/30 border-dark-border'
                    }`}>
                      {cfg.isEnabled ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-panda-white/30 text-xs font-heading">
                    {new Date(cfg.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button className="admin-btn bg-dark-card border border-dark-border text-panda-white/60 hover:border-neon-cyan/30 text-xs">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
