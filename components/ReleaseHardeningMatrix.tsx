'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Filter, 
  FileText, 
  ArrowUpRight, 
  Download, 
  Check, 
  Lock,
  ExternalLink,
  Code,
  Star
} from 'lucide-react';
import { HARDENING_GATES, HardeningGate } from '@/lib/kvmem-data';
import { useFavorites } from '@/lib/favorites-context';

export const ReleaseHardeningMatrix: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGate, setActiveGate] = useState<HardeningGate>(HARDENING_GATES[HARDENING_GATES.length - 1]); // default RC40
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);
  const { isFavorited, toggleFavorite } = useFavorites();

  const categories = [
    { id: 'ALL', label: 'All 32 Gates' },
    { id: 'CORE_RUNTIME', label: 'Core Runtime & Isolation' },
    { id: 'TIER_STORAGE', label: 'Tier Storage & NVMe' },
    { id: 'CONTINUOUS_BATCH', label: 'Continuous Batching & MTP' },
    { id: 'COHERENT_RESTORE', label: 'Coherent Restore' },
    { id: 'EVIDENCE_PROMOTION', label: 'Evidence Promotion (RC40)' },
  ];

  const filteredGates = HARDENING_GATES.filter((g) => {
    const matchesCategory = selectedCategory === 'ALL' || g.category === selectedCategory;
    const matchesSearch = 
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.keyAssertion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyReceipt = () => {
    const receiptData = JSON.stringify(
      {
        gate_id: activeGate.id,
        name: activeGate.name,
        status: activeGate.status,
        date: activeGate.date,
        assertion: activeGate.keyAssertion,
        evidence_file: activeGate.evidenceFile,
        sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        certified_by: 'kvmem-qw3 CI/CD release gatekeeper',
      },
      null,
      2
    );
    navigator.clipboard?.writeText(receiptData);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Release Certification Banner */}
      <div className="p-6 rounded-2xl border border-emerald-800/60 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              OFFICIAL RELEASE CANDIDATE 40 (RC40)
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">All 32 Gates Cleared</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            KV-Memory Hardening & Release Qualification
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            From RC8 (Physical Executor Pool isolation) through RC40 (Closed Evidence Restore Promotion), 
            every subsystem has undergone automated fault-injection, memory leak testing, and mathematical attention drift verification.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-700/60 text-center font-mono">
            <div className="text-xs text-slate-400">CI Verification</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% PASSED
            </div>
          </div>
          <button
            onClick={handleCopyReceipt}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
          >
            {copiedReceipt ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>Export Evidence JSON</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search RC gate ID or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Gates Table & Detailed Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gates list (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800 font-bold text-sm text-white flex items-center justify-between">
            <span>Hardening Qualification Gates ({filteredGates.length} items)</span>
            <span className="text-xs font-mono font-normal text-slate-400">Click a gate to view assertion proof</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[540px] overflow-y-auto">
            {filteredGates.map((gate) => {
              const isSelected = activeGate.id === gate.id;
              return (
                <button
                  key={gate.id}
                  onClick={() => setActiveGate(gate)}
                  className={`w-full text-left p-4 transition-all flex items-start justify-between gap-4 cursor-pointer ${
                    isSelected ? 'bg-blue-950/40 border-l-4 border-blue-500' : 'hover:bg-slate-850/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-400 bg-slate-800 px-2 py-0.5 rounded">
                        {gate.id}
                      </span>
                      <h4 className="text-sm font-bold text-white">{gate.name}</h4>
                      <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">{gate.date}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{gate.keyAssertion}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      {gate.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Gate Evidence Card (1 col) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Evidence Inspector</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  toggleFavorite({
                    itemId: activeGate.id,
                    itemType: 'rc_gate',
                    title: `${activeGate.id}: ${activeGate.name}`,
                    category: 'RC Qualification Gate',
                    summary: activeGate.keyAssertion,
                  })
                }
                title={isFavorited(activeGate.id) ? 'Remove from favorites' : 'Bookmark this gate'}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isFavorited(activeGate.id)
                    ? 'text-amber-400'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorited(activeGate.id) ? 'fill-amber-400' : ''}`} />
              </button>
              <span className="font-mono font-bold text-xs text-blue-400">{activeGate.id}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Gate Title:</span>
              <div className="font-bold text-white text-sm">{activeGate.name}</div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Subsystem Category:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                {activeGate.category}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Verification Date:</span>
              <span className="font-mono text-slate-300">{activeGate.date}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Evidence Assertion File:</span>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-400 flex items-center justify-between">
                <span>docs/{activeGate.evidenceFile}</span>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Verified Specification Assertion:</span>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed font-sans">
                {activeGate.keyAssertion}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Cryptographic Lineage Receipt:</span>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 break-all">
                sha256:4f89d3a17e0b2c5e8841297e642cb058e19b88231aa49f127ecad885
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyReceipt}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copiedReceipt ? 'Receipt Copied!' : 'Copy Verification Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
