'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Sliders, 
  Copy, 
  Check, 
  FileCode2, 
  Download, 
  Play, 
  Settings2, 
  Cpu, 
  HardDrive,
  Layers,
  Sparkles,
  Star
} from 'lucide-react';
import { RUNTIME_PROFILES, HARDWARE_PRESETS } from '@/lib/kvmem-data';
import { useFavorites } from '@/lib/favorites-context';

interface WorkbenchCLIProps {
  selectedProfile: string;
  selectedHardware: string;
}

export const WorkbenchCLI: React.FC<WorkbenchCLIProps> = ({
  selectedProfile,
  selectedHardware,
}) => {
  const [vramTokens, setVramTokens] = useState<number>(65536);
  const [quantization, setQuantization] = useState<'nvfp4' | 'fp8' | 'bf16'>('fp8');
  const [deltaNetTopK, setDeltaNetTopK] = useState<number>(48);
  const [slotCount, setSlotCount] = useState<number>(1);
  const [asyncWriteback, setAsyncWriteback] = useState<boolean>(true);
  const [coherentValidation, setCoherentValidation] = useState<boolean>(true);
  const [activeCodeFile, setActiveCodeFile] = useState<string>('request_plan');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const { isFavorited, toggleFavorite } = useFavorites();

  const hw = HARDWARE_PRESETS.find((h) => h.id === selectedHardware) || HARDWARE_PRESETS[0];

  const generatedServerCmd = `qw3-server \\
  --model-path /models/Qwen2.5-Coder-32B-Instruct-GGUF \\
  --kvmem-vram-tokens ${vramTokens} \\
  --kvmem-quant ${quantization} \\
  --kvmem-gdn-topk ${deltaNetTopK} \\
  --kvmem-slots ${slotCount} \\
  --kvmem-async-writeback ${asyncWriteback ? 1 : 0} \\
  --kvmem-coherent-restore ${coherentValidation ? 1 : 0} \\
  --kvmem-nvme-path /mnt/fast-nvme/kvmem_cache \\
  --port 8000 --host 0.0.0.0`;

  const generatedInspectCmd = `qw3-inspect --slot-id 0 --watch-rate 500ms --dump-delta-receipts 1`;
  const generatedCliCmd = `qw3-cli --connect http://localhost:8000 --session-id sess_agent_trace_01 --max-tokens 4096`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const codeSnippets: Record<string, { title: string; filename: string; code: string; language: string }> = {
    request_plan: {
      title: 'KV-Memory Request Plan Header',
      filename: 'src/kvmem_request_plan.hpp',
      language: 'cpp',
      code: `// kvmem_request_plan.hpp - RC40 Slot Binding & Transactional Plan
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace qw3 {

struct KVMReqPlan {
    uint32_t slot_id{0};
    uint64_t active_working_vram_tokens{65536};
    uint32_t deltanet_topk_blocks{48};
    bool enable_proactive_writeback{true};
    bool require_coherent_evidence_receipt{true};
    
    // Checkpoint & Promotion
    uint64_t expected_lineage_hash{0};
    std::string nvme_slot_evidence_path;
    
    // Validation assertions
    bool validate_coherence(float max_kl_threshold = 0.0015f) const;
};

} // namespace qw3`,
    },
    gated_delta_net: {
      title: 'Gated Delta Net Kernel',
      filename: 'src/gated_delta_net.cu',
      language: 'cuda',
      code: `// gated_delta_net.cu - Fast Associative Memory Retrieval
#include <cuda_fp16.h>
#include "cuda_helpers.cuh"

__global__ void gdn_associative_step_kernel(
    const half* __restrict__ q_state,
    const half* __restrict__ k_recurrent,
    float* __restrict__ out_saliency,
    const int num_blocks,
    const int topk
) {
    int tid = blockIdx.x * blockDim.x + threadIdx.x;
    if (tid >= num_blocks) return;
    
    // Constant-time dot product reduction over DeltaNet associative states
    float score = 0.0f;
    #pragma unroll
    for (int d = 0; d < 128; ++d) {
        score += __half2float(q_state[d]) * __half2float(k_recurrent[tid * 128 + d]);
    }
    
    // Store score and initiate warp-level top-k ranking
    out_saliency[tid] = score;
}`,
    },
    kvmem_store: {
      title: '3-Tier Page Allocator & Store',
      filename: 'src/kvmem_store.cpp',
      language: 'cpp',
      code: `// kvmem_store.cpp - 3-Tier Asynchronous Paged Cache Manager
#include "qw3/kvmem_store.hpp"
#include <fcntl.h>
#include <unistd.h>

namespace qw3 {

bool KVMemStore::async_commit_page_to_nvme(uint32_t page_id, const void* page_data) {
    // Slot-scoped Direct I/O write (O_DIRECT | O_ASYNC)
    int fd = get_slot_nvme_fd(current_slot_);
    off_t offset = page_id * PAGE_SIZE_BYTES; // 64 tokens * dim
    
    io_uring_sqe* sqe = io_uring_get_sqe(&ring_);
    io_uring_prep_write(sqe, fd, page_data, PAGE_SIZE_BYTES, offset);
    io_uring_submit(&ring_);
    
    record_evidence_hash(page_id, compute_crc64(page_data, PAGE_SIZE_BYTES));
    return true;
}

} // namespace qw3`,
    },
    build_profile: {
      title: 'Build Profile Environment Config',
      filename: 'release/BUILD_PROFILE.env',
      language: 'bash',
      code: `# release/BUILD_PROFILE.env - RC40 Compilation Targets
export CXX=g++-13
export CXXFLAGS="-O3 -std=c++20 -march=native -fopenmp"
export CUDA_PATH=/usr/local/cuda-12.8
export NVCCFLAGS="-O3 -gencode arch=compute_80,code=sm_80 -gencode arch=compute_90,code=sm_90 -gencode arch=compute_120,code=sm_120"
export KVMEM_USE_FLASHINFER=1
export KVMEM_ENABLE_NVFP4=1
export KVMEM_ENABLE_DIRECT_IO=1
export KVMEM_HARDENING_LEVEL=RC40`,
    },
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Workbench Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/80">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            KV-Memory Configuration & CLI Workbench
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Tune hardware limits, memory slot fleets, DeltaNet salience parameters, and quantization modes. 
          Generates production launch commands for <code>qw3-server</code> and inspects actual C++20 and CUDA kernels.
        </p>
      </div>

      {/* Grid: Config Controls & CLI Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Parameters (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-blue-400" />
            Runtime Parameter Tuning
          </h3>

          {/* Slider 1: VRAM Token Working Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">GPU VRAM Working Set Budget:</span>
              <span className="font-mono font-bold text-blue-400">{vramTokens.toLocaleString()} tokens</span>
            </div>
            <input
              type="range"
              min="16384"
              max="131072"
              step="8192"
              value={vramTokens}
              onChange={(e) => setVramTokens(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>16K (Lite)</span>
              <span>64K (Default)</span>
              <span>128K (Server)</span>
            </div>
          </div>

          {/* Select: Quantization Mode */}
          <div className="space-y-1.5 text-xs">
            <label className="font-medium text-slate-300">Quantization Precision:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'nvfp4', label: 'NVFP4 (0.5 B/val)', sub: 'Fastest' },
                { id: 'fp8', label: 'FP8 (1.0 B/val)', sub: 'Standard' },
                { id: 'bf16', label: 'BF16 (2.0 B/val)', sub: 'Lossless' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => setQuantization(q.id as any)}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    quantization === q.id
                      ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{q.label}</div>
                  <div className="text-[10px] text-slate-500">{q.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Slider 2: DeltaNet Top-K Ranking Blocks */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">DeltaNet Top-K Paged Blocks:</span>
              <span className="font-mono font-bold text-emerald-400">{deltaNetTopK} blocks ({deltaNetTopK * 64} tokens)</span>
            </div>
            <input
              type="range"
              min="16"
              max="96"
              step="8"
              value={deltaNetTopK}
              onChange={(e) => setDeltaNetTopK(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>16 blocks</span>
              <span>48 (Balanced)</span>
              <span>96 blocks</span>
            </div>
          </div>

          {/* Slider 3: Concurrent Slot Count */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Concurrent Agent Slots:</span>
              <span className="font-mono font-bold text-purple-400">{slotCount} slot{slotCount > 1 ? 's' : ''}</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={slotCount}
              onChange={(e) => setSlotCount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Checkboxes: Async Writeback & Coherence */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={asyncWriteback}
                onChange={(e) => setAsyncWriteback(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>Async NVMe Proactive Writeback (Direct I/O)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={coherentValidation}
                onChange={(e) => setCoherentValidation(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>RC40 Evidence-Gated Coherent Restore Verification</span>
            </label>
          </div>
        </div>

        {/* Right Column: Live CLI Commands & Code Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* CLI Commands */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Generated Execution Command Line
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const presetId = `preset-${quantization}-${vramTokens}-${deltaNetTopK}`;
                    toggleFavorite({
                      itemId: presetId,
                      itemType: 'profile',
                      title: `CLI: ${quantization.toUpperCase()} ${vramTokens / 1024}K VRAM (${deltaNetTopK} blocks)`,
                      category: 'CLI Preset',
                      summary: `Server config targeting ${hw.name} with ${quantization} quantization and top-${deltaNetTopK} GDN associative recall.`,
                    });
                  }}
                  title="Bookmark this CLI preset"
                  className={`px-2 py-1 rounded text-xs font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                    isFavorited(`preset-${quantization}-${vramTokens}-${deltaNetTopK}`)
                      ? 'bg-amber-950/80 border-amber-600 text-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorited(`preset-${quantization}-${vramTokens}-${deltaNetTopK}`) ? 'fill-amber-400' : ''}`} />
                  <span className="hidden sm:inline">
                    {isFavorited(`preset-${quantization}-${vramTokens}-${deltaNetTopK}`) ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>

                <button
                  onClick={() => handleCopy(generatedServerCmd, 'server')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  {copiedCmd === 'server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd === 'server' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed">
              <pre className="whitespace-pre-wrap">{generatedServerCmd}</pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-slate-200">Inspect Monitor</span>
                  <button
                    onClick={() => handleCopy(generatedInspectCmd, 'inspect')}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {copiedCmd === 'inspect' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <code className="text-[11px] font-mono text-emerald-400 block truncate" title={generatedInspectCmd}>
                  {generatedInspectCmd}
                </code>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-slate-200">Interactive CLI</span>
                  <button
                    onClick={() => handleCopy(generatedCliCmd, 'cli')}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {copiedCmd === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <code className="text-[11px] font-mono text-amber-400 block truncate" title={generatedCliCmd}>
                  {generatedCliCmd}
                </code>
              </div>
            </div>
          </div>

          {/* Source Code Viewer */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                Repository Source Code Inspection
              </h3>
              <div className="flex items-center gap-1">
                {Object.entries(codeSnippets).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setActiveCodeFile(key)}
                    className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-all ${
                      activeCodeFile === key
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.filename.split('/').pop()}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto overflow-x-auto">
              <div className="text-slate-500 text-[10px] mb-1.5 flex justify-between">
                <span>{codeSnippets[activeCodeFile].filename}</span>
                <span className="uppercase">{codeSnippets[activeCodeFile].language}</span>
              </div>
              <pre className="whitespace-pre">{codeSnippets[activeCodeFile].code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
