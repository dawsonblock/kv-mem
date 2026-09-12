'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  HardDrive, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Database,
  BarChart,
  FileCode2,
  Sliders,
  Star
} from 'lucide-react';
import { MEMORY_TIERS, HARDWARE_PRESETS, RUNTIME_PROFILES } from '@/lib/kvmem-data';
import { useFavorites } from '@/lib/favorites-context';

interface ArchitectureOverviewProps {
  selectedHardware: string;
  selectedProfile: string;
  onNavigateToSimulator: () => void;
  onNavigateToBenchmarks: () => void;
}

export const ArchitectureOverview: React.FC<ArchitectureOverviewProps> = ({
  selectedHardware,
  selectedProfile,
  onNavigateToSimulator,
  onNavigateToBenchmarks,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('deltanet');
  const { isFavorited, toggleFavorite } = useFavorites();

  const hw = HARDWARE_PRESETS.find((h) => h.id === selectedHardware) || HARDWARE_PRESETS[0];
  const prof = RUNTIME_PROFILES[selectedProfile] || RUNTIME_PROFILES['agent-safe'];

  const pipelineSteps = [
    {
      step: 1,
      title: 'Prompt Ingestion & Chunking',
      tag: 'FlashInfer Prefill',
      desc: 'Incoming user prompt or agent tool output is chunked into 64-token aligned memory blocks. Fast prefix cache checks match existing sub-trees.',
      tier: 'GPU VRAM / Host RAM',
    },
    {
      step: 2,
      title: 'DeltaNet Associative Retrieval',
      tag: 'GDN SM120 Kernel',
      desc: 'Gated Delta Net linear recurrent states scan 1M+ historical tokens in sub-millisecond time, ranking and selecting top-k salient memory blocks.',
      tier: 'Host Pinned RAM',
    },
    {
      step: 3,
      title: 'Page Eviction & Working Set Paging',
      tag: 'Slot Local Cache',
      desc: 'High-affinity blocks are DMA-staged into the active GPU VRAM working set. Cold blocks are seamlessly demoted to Host DRAM.',
      tier: 'PCIe 5.0 / NVLink DMA',
    },
    {
      step: 4,
      title: 'Decoding & Attention Computation',
      tag: 'FlashInfer Decode',
      desc: 'FlashInfer vector decode and NVFP4/FP8 scaled tensor cores compute exact attention across the active working set with near-zero latency overhead.',
      tier: 'GPU Tensor Cores',
    },
    {
      step: 5,
      title: 'Proactive Async NVMe Writeback',
      tag: 'Direct I/O Store',
      desc: 'Newly generated and evicted KV pages are asynchronously committed to slot-scoped NVMe blocks, fully masked behind token decoding time.',
      tier: 'NVMe Gen5 SSD',
    },
    {
      step: 6,
      title: 'Evidence-Gated Session Promotion',
      tag: 'RC40 Transactional',
      desc: 'Cryptographic hash receipts and checkpoint lineage states are validated, ensuring zero memory degradation (KL < 0.0015) upon session resume.',
      tier: 'Lineage State Registry',
    },
  ];

  return (
    <div className="space-y-8 text-slate-100">
      {/* Hero Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/80 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Research Paper Architecture • Hardening Release Candidate 40</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Hierarchical Tiered Memory & Coherent DeltaNet Retrieval for Long-Horizon Agents
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-3xl">
            <strong className="text-white">KV-Memory (kvmem-qw3)</strong> eliminates the VRAM memory wall 
            that restricts modern reasoning agents. By orchestrating a mathematically coherent three-tier hierarchy 
            (<strong>GPU HBM</strong>, <strong>Pinned Host DRAM</strong>, and <strong>Direct NVMe</strong>) coupled 
            with <strong>Gated Delta Net (GDN)</strong> associative retrieval, it enables 1M to 2M+ token reasoning 
            sessions on a <em>single GPU</em> with <strong>91.7% lower pre-answer latency</strong> and zero accuracy loss.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-blue-400">91.7%</div>
              <div className="text-xs text-slate-400 font-medium">Pre-Answer Latency Drop</div>
              <div className="text-[11px] text-slate-500">41.2s → 3.4s at 1M tokens</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-emerald-400">12.6x</div>
              <div className="text-xs text-slate-400 font-medium">VRAM Footprint Savings</div>
              <div className="text-[11px] text-slate-500">230 GB → 18.2 GB (1M tokens)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-amber-400">98.4%</div>
              <div className="text-xs text-slate-400 font-medium">Gold Block Retrieval</div>
              <div className="text-[11px] text-slate-500">AgentLongBench 50 Tasks</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-purple-400">&lt; 0.0015</div>
              <div className="text-xs text-slate-400 font-medium">Attention KL Drift</div>
              <div className="text-[11px] text-slate-500">Zero degradation guarantee</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToSimulator}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Launch Memory Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToBenchmarks}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Explore Paper Benchmarks</span>
              <BarChart className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier Hardware Hierarchy Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              The Three-Tier Memory Hierarchy
            </h3>
            <p className="text-xs text-slate-400">
              Optimized for {hw.name} under {prof.name}
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Bandwidth: HBM (3.3 TB/s) → PCIe5 (64 GB/s) → NVMe (10 GB/s)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MEMORY_TIERS.map((tier) => {
            const isVRAM = tier.id === 'tier0_vram';
            const isDRAM = tier.id === 'tier1_dram';
            const isNVMe = tier.id === 'tier2_nvme';

            return (
              <div
                key={tier.id}
                className={`rounded-xl border p-5 transition-all relative ${
                  isVRAM
                    ? 'border-blue-700/60 bg-blue-950/20 shadow-lg shadow-blue-950/30'
                    : isDRAM
                    ? 'border-emerald-700/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
                    : 'border-purple-700/60 bg-purple-950/20 shadow-lg shadow-purple-950/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        isVRAM
                          ? 'bg-blue-500/20 text-blue-400'
                          : isDRAM
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {isVRAM && <Cpu className="w-5 h-5" />}
                      {isDRAM && <Layers className="w-5 h-5" />}
                      {isNVMe && <HardDrive className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{tier.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{tier.technology}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {tier.costPerGB}
                    </span>
                    <button
                      onClick={() =>
                        toggleFavorite({
                          itemId: tier.id,
                          itemType: 'subsystem',
                          title: tier.name,
                          category: 'Memory Tier',
                          summary: tier.role,
                        })
                      }
                      title={isFavorited(tier.id) ? 'Remove from favorites' : 'Bookmark tier'}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        isFavorited(tier.id) ? 'text-amber-400' : 'text-slate-500 hover:text-amber-300'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorited(tier.id) ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed min-h-[48px]">
                  {tier.role}
                </p>

                <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Config:</span>
                    <span className="font-mono text-slate-200">
                      {isVRAM ? hw.vram : isDRAM ? hw.hostRam : hw.nvme}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Throughput:</span>
                    <span className="font-mono text-slate-200">{tier.bandwidth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Access Latency:</span>
                    <span className="font-mono text-slate-200">{tier.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Working Budget:</span>
                    <span className="font-mono font-semibold text-blue-300">
                      {isVRAM
                        ? `${prof.vramBudget.toLocaleString()} tokens (${prof.quantization})`
                        : isDRAM
                        ? '1,000,000 tokens staging'
                        : 'Unlimited (Disk Direct I/O)'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Execution Pipeline Flow */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Interactive KV-Memory Pipeline Execution Flow
            </h3>
            <p className="text-xs text-slate-400">
              Click each step to examine how KV-Memory processes long prompts and multi-turn turns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Step {activeStep} of 6</span>
          </div>
        </div>

        {/* Step indicator bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
          {pipelineSteps.map((s) => {
            const isCurrent = s.step === activeStep;
            const isPast = s.step < activeStep;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-950/40 shadow-sm shadow-blue-500/20'
                    : isPast
                    ? 'border-emerald-800/60 bg-emerald-950/10 text-slate-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.step}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{s.tag}</span>
                </div>
                <div className="text-xs font-semibold truncate text-white">{s.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep-Dive Card */}
        {(() => {
          const current = pipelineSteps.find((s) => s.step === activeStep)!;
          return (
            <div className="p-5 rounded-xl border border-blue-800/50 bg-gradient-to-r from-blue-950/30 to-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                    Phase {current.step}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono text-emerald-400">{current.tier}</span>
                </div>
                <h4 className="text-base font-bold text-white">{current.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{current.desc}</p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  disabled={activeStep === 1}
                  onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={activeStep === 6}
                  onClick={() => setActiveStep((prev) => Math.min(6, prev + 1))}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-semibold text-white shadow-sm cursor-pointer"
                >
                  Next Step
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Deep-Dive Subsystem Tabs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-400" />
            Core Engineering Subsystems in kvmem-qw3
          </h3>

          <button
            onClick={() => {
              const subMeta: Record<string, { title: string; desc: string }> = {
                deltanet: { title: 'Gated Delta Net (GDN) Retrieval', desc: 'Constant-time associative memory and recurrent state ranking for million-token contexts.' },
                paged: { title: 'Slot-Isolated Paged Memory Allocation', desc: '64 tokens/block non-contiguous physical pages with lock-free atomic allocation.' },
                flashinfer: { title: 'FlashInfer Adapters & NVFP4 Quantization', desc: '4-bit floating point scaled KV cache and fused prefill/decode attention kernels.' },
                coherence: { title: 'RC40 Transactional Coherence & Evidence Promotion', desc: 'Cryptographic hash receipts and prefill divergence rollback prevention.' },
                mtp: { title: 'Multi-Token Prediction (MTP) Speculative Decoding', desc: 'Interleaved 3-4 draft tokens per cycle overlapping NVMe stage-in.' },
              };
              const item = subMeta[selectedSubsystem] || { title: selectedSubsystem, desc: '' };
              toggleFavorite({
                itemId: `subsystem-${selectedSubsystem}`,
                itemType: 'subsystem',
                title: item.title,
                category: 'Subsystem',
                summary: item.desc,
              });
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer self-start sm:self-auto ${
              isFavorited(`subsystem-${selectedSubsystem}`)
                ? 'bg-amber-950/80 border-amber-600/80 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorited(`subsystem-${selectedSubsystem}`) ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isFavorited(`subsystem-${selectedSubsystem}`) ? 'Favorited' : 'Favorite Subsystem'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-5">
          {[
            { id: 'deltanet', label: 'DeltaNet (GDN) Retrieval' },
            { id: 'paged', label: 'Paged KV Allocation & Eviction' },
            { id: 'flashinfer', label: 'FlashInfer & Quantized Adapters' },
            { id: 'coherence', label: 'RC40 Transactional Coherence' },
            { id: 'mtp', label: 'MTP Speculative Decoding' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSubsystem(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedSubsystem === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedSubsystem === 'deltanet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Gated Delta Net (GDN) Associative Memory Engine
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standard transformer attention computes full <em>O(N²)</em> dot-product matrix operations over every previous token. 
                KV-Memory incorporates a specialized <strong>Gated Delta Net</strong> recurrent kernel (`gated_delta_net.cu` and `gdn_sm120_aot_adapter.cu`) 
                that continuously updates a compact linear associative state vector.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Constant-Time Scanning:</strong> Evaluates relevance of millions of historical tokens in microseconds.</li>
                <li><strong className="text-white">Top-K Block Candidate Ranking:</strong> Directs page eviction and stage-in with 99.4% needle retention.</li>
                <li><strong className="text-white">Hardware AOT Support:</strong> Native SM120 tensor core instructions on NVIDIA B200 / Hopper.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <div className="text-slate-500 mb-1">{'// gated_delta_net.cu snippet'}</div>
              <div className="text-purple-400">__global__ void</div>
              <div className="text-blue-300">gdn_associate_retrieve_kernel(</div>
              <div className="pl-4 text-slate-300">const half* __restrict__ query_state,</div>
              <div className="pl-4 text-slate-300">const half* __restrict__ block_recurrent_weights,</div>
              <div className="pl-4 text-slate-300">float* __restrict__ saliency_scores,</div>
              <div className="pl-4 text-slate-300">const int num_blocks, const int topk) &#123;</div>
              <div className="pl-4 text-slate-400">{'// Parallel associative dot-product reduction'}</div>
              <div className="pl-4 text-emerald-400">float score = gdn_dot_product(query_state, block_recurrent_weights);</div>
              <div className="pl-4 text-emerald-400">warp_topk_filter(score, saliency_scores, topk);</div>
              <div>&#125;</div>
            </div>
          </div>
        )}

        {selectedSubsystem === 'paged' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Slot-Isolated Paged Memory Allocation (64 Tokens/Block)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                KV cache is partitioned into non-contiguous physical pages of exactly 64 tokens each. 
                The <code>kvmem_store.cpp</code> subsystem allocates pages dynamically without contiguous virtual memory fragmentation.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Slot Isolation (RC10):</strong> Memory is strictly partition-bound per agent slot with zero cross-tenant bleed.</li>
                <li><strong className="text-white">Lock-Free Free List:</strong> Atomic CAS operations allow sub-microsecond allocation and release.</li>
                <li><strong className="text-white">Prefix Reuse Cache (RC18):</strong> Shared system prompts and base tool definitions are zero-copied across sessions.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300">
              <div className="text-slate-500 mb-2">{'// Memory Page Map Representation'}</div>
              <div className="grid grid-cols-6 gap-1 text-[11px] text-center">
                <span className="p-1 rounded bg-blue-900/60 border border-blue-700 text-blue-300">PG-0 (GPU)</span>
                <span className="p-1 rounded bg-blue-900/60 border border-blue-700 text-blue-300">PG-1 (GPU)</span>
                <span className="p-1 rounded bg-emerald-900/60 border border-emerald-700 text-emerald-300">PG-2 (RAM)</span>
                <span className="p-1 rounded bg-emerald-900/60 border border-emerald-700 text-emerald-300">PG-3 (RAM)</span>
                <span className="p-1 rounded bg-purple-900/60 border border-purple-700 text-purple-300">PG-4 (SSD)</span>
                <span className="p-1 rounded bg-purple-900/60 border border-purple-700 text-purple-300">PG-5 (SSD)</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 flex justify-between">
                <span>Page Size: 64 Tokens</span>
                <span>Active Slot: Slot #0</span>
                <span>Affinity: GPU Hot</span>
              </div>
            </div>
          </div>
        )}

        {selectedSubsystem === 'flashinfer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                FlashInfer Adapters & NVFP4 Scaled Quantization
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                KV-Memory bypasses standard cuBLAS overhead by integrating native FlashInfer decode adapters 
                (`flashinfer_decode_adapter.cu`) and scaled FP8/NVFP4 matrix multipliers.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">NVFP4 Precision:</strong> Cuts KV cache bytes from 2.0 bytes/token (FP16) to 0.5 bytes/token.</li>
                <li><strong className="text-white">Fused Prefill/Decode:</strong> Seamlessly transitions between multi-token prompt ingestion and single-token decode.</li>
                <li><strong className="text-white">Vector Attention:</strong> Vectorized load instructions saturate memory bus up to 94.2% theoretical peak.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300">
              <div className="text-slate-500 mb-1">{'// Benchmark: Token Size in KV Cache'}</div>
              <div className="space-y-2 mt-2">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>FP16 Standard (Uncompressed)</span>
                    <span>2.00 bytes / value</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full w-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>FP8 E4M3 Scaled (kvmem-qw3)</span>
                    <span>1.00 bytes / value (50% reduction)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-1/2" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>NVFP4 SM120 Mode (kvmem-qw3)</span>
                    <span>0.50 bytes / value (75% reduction)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-1/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSubsystem === 'coherence' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Transactional Coherent Restore & Evidence Promotion (RC40)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The defining milestone of Release Candidate 40 is cryptographic checkpoint integrity. 
                When an agent pauses or restores from NVMe, the system verifies hash receipts (`RC39` / `RC40`) 
                and rolls back atomically (`RC12`) if any prefill divergence is detected.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Zero Silent Corruptions:</strong> 100% verified across 1,000 fault-injected synthetic restore tests (`RC38`).</li>
                <li><strong className="text-white">Instant Restore:</strong> Rehydrates a 1M-token session in under 400 milliseconds.</li>
                <li><strong className="text-white">Attention KL Bound:</strong> Maximum attention deviation bounded strictly under 0.0015 across all layers.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300">
              <div className="text-slate-500 mb-2">{'// RC40 Evidence Promotion Receipt'}</div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                <div className="text-emerald-400 font-bold">STATUS: PROMOTED_TO_ACTIVE_DECODE</div>
                <div className="text-slate-400">session_id: &quot;sess_deepswe_linux_patch_0x4f&quot;</div>
                <div className="text-slate-400">checkpoint_receipt: &quot;sha256:7f3a9e...e41c&quot;</div>
                <div className="text-slate-400">token_count: 1,140,000 (17,812 pages)</div>
                <div className="text-slate-400">kl_divergence_max: 0.00084 &lt; 0.0015 threshold</div>
                <div className="text-blue-400">restoration_time: 382.4 ms</div>
              </div>
            </div>
          </div>
        )}

        {selectedSubsystem === 'mtp' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Multi-Token Prediction (MTP) Speculative Interleaving
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                In multi-tenant server mode (`server-throughput`), KV-Memory leverages Qwen 3&apos;s Multi-Token Prediction (MTP) 
                heads to speculate 3–4 draft tokens per cycle, overlapping page stage-ins with verification steps.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Delayed Admission:</strong> Defers memory allocation until speculative drafts are verified.</li>
                <li><strong className="text-white">Continuous Batching:</strong> Dynamically interleaves prefill bursts without stalling decode slots.</li>
                <li><strong className="text-white">2.4x Throughput Gain:</strong> Achieves 148 tokens/sec aggregate server output.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300">
              <div className="text-slate-500 mb-2">{'// MTP Speculative Step Timeline'}</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Draft Step 1-4</span>
                  <span className="text-blue-400">Compute Head Speculation</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Parallel IO Step</span>
                  <span className="text-emerald-400">PCIe DMA Stage-In (Async)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-300">Verification</span>
                  <span className="text-purple-400">Single FlashDecode Forward Pass</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
