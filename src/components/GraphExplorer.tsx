'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, RefreshCw, AlertTriangle, Layers } from 'lucide-react';

// Force dynamic client rendering with ssr: false
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin" /> Initializing 2D Canvas...
    </div>
  ),
});

export default function GraphExplorer() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async (id?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = id ? `/api/graph?startId=${id}` : '/api/graph';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to retrieve graph data');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error loading graph data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchData(selectedEntity);
    }
  }, [mounted, selectedEntity]);

  const getNodeColor = (label: string) => {
    switch (label) {
      case 'User': return '#3b82f6';
      case 'Role': return '#eab308';
      case 'ComputeInstance': return '#8b5cf6';
      case 'S3Bucket': return '#ef4444';
      case 'Vulnerability': return '#f97316';
      default: return '#6b7280';
    }
  };

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400">
        Loading CloudSec Analyzer...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500 w-6 h-6" />
          <h1 className="text-lg font-bold">CloudSec Graph Blast-Radius Analyzer</h1>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Full Infrastructure Graph</option>
            <option value="CVE-2026-8812">Simulate Exploit: CVE-2026-8812</option>
            <option value="usr_1">Blast Radius: Alice Dev</option>
            <option value="usr_3">Blast Radius: Eve Intern</option>
          </select>
          <button
            onClick={() => fetchData(selectedEntity)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center bg-slate-950">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" /> Fetching multi-hop paths...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 bg-red-950/40 p-4 rounded border border-red-800">
              <AlertTriangle className="w-5 h-5" /> {error}
            </div>
          ) : (
            <ForceGraph2D
              graphData={data}
              nodeColor={(node: any) => getNodeColor(node.label)}
              nodeLabel={(node: any) => `${node.label}: ${node.name}`}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
            />
          )}
        </div>

        <aside className="w-80 border-l border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-300">
            <Layers className="w-4 h-4 text-blue-400" /> Legend
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> User</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> IAM Role</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Compute Instance</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Sensitive Target (S3)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Vulnerability</div>
          </div>
        </aside>
      </main>
    </div>
  );
}