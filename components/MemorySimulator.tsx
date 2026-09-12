'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Cpu, 
  Layers, 
  HardDrive, 
  Zap, 
  CheckCircle2, 
  FileText, 
  Clock, 
  ShieldCheck,
  Search,
  Plus,
  GitFork,
  LayoutGrid,
  Columns,
  Star,
  Sparkles
} from 'lucide-react';
import { SIMULATION_SCENARIOS, SimulationScenario, SimulationTurn, RUNTIME_PROFILES } from '@/lib/kvmem-data';
import { TokenGraphVisualizer, TokenGraphNode } from '@/components/TokenGraphVisualizer';
import { SimulationControlPanel } from '@/components/SimulationControlPanel';
import { useFavorites } from '@/lib/favorites-context';

interface MemorySimulatorProps {
  selectedProfile: string;
}

export const MemorySimulator: React.FC<MemorySimulatorProps> = ({ selectedProfile }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('deepswe_linux_kernel');
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(2500);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'split' | 'grid'>('split');
  const [selectedGraphNode, setSelectedGraphNode] = useState<TokenGraphNode | null>(null);
  const { isFavorited, toggleFavorite } = useFavorites();

  // Custom user session addition
  const [customActionText, setCustomActionText] = useState<string>('');
  const [customTokens, setCustomTokens] = useState<number>(120000);

  const scenario: SimulationScenario = 
    SIMULATION_SCENARIOS.find((s) => s.id === selectedScenarioId) || SIMULATION_SCENARIOS[0];

  const currentTurn: SimulationTurn = scenario.turns[currentTurnIndex] || scenario.turns[0];
  const prof = RUNTIME_PROFILES[selectedProfile] || RUNTIME_PROFILES['agent-safe'];

  // Auto-playback loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTurnIndex((prev) => {
          if (prev >= scenario.turns.length - 1) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return prev + 1;
        });
      }, playbackSpeedMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isLooping, playbackSpeedMs, scenario.turns.length]);

  const handleScenarioChange = (id: string) => {
    setIsPlaying(false);
    setSelectedScenarioId(id);
    setCurrentTurnIndex(0);
    setSelectedBlockIndex(null);
    setSelectedGraphNode(null);
  };

  const handlePlay = () => {
    if (currentTurnIndex >= scenario.turns.length - 1) {
      setCurrentTurnIndex(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTurnIndex(0);
    setSelectedBlockIndex(null);
    setSelectedGraphNode(null);
  };

  const handleStep = () => {
    setIsPlaying(false);
    setCurrentTurnIndex((prev) => {
      if (prev >= scenario.turns.length - 1) {
        return 0;
      }
      return prev + 1;
    });
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentTurnIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentTurnIndex((prev) => Math.min(scenario.turns.length - 1, prev + 1));
  };

  // Compute memory distribution for the visual block grid (96 blocks total)
  const totalBlocks = 96;
  const vramFraction = Math.min(1, currentTurn.vramPages / 512);
  const dramFraction = Math.min(1, currentTurn.dramPages / 2048);
  const nvmeFraction = Math.min(1, currentTurn.nvmePages / 16000);

  const vramBlockCount = Math.round(vramFraction * 28);
  const dramBlockCount = Math.round(dramFraction * 36);
  const nvmeBlockCount = Math.min(totalBlocks - vramBlockCount - dramBlockCount, Math.round(nvmeFraction * 32));
  const freeBlockCount = Math.max(0, totalBlocks - (vramBlockCount + dramBlockCount + nvmeBlockCount));

  // Generate simulated block details
  const blocks = Array.from({ length: totalBlocks }, (_, i) => {
    if (i < vramBlockCount) {
      return {
        id: i,
        tier: 'VRAM',
        color: 'bg-blue-500 border-blue-400 text-blue-200',
        label: `V-${i}`,
        salience: (0.85 + (i % 15) * 0.01).toFixed(3),
        affinity: 'GPU Hot (L1)',
        tokenOffset: i * 64,
      };
    } else if (i < vramBlockCount + dramBlockCount) {
      return {
        id: i,
        tier: 'DRAM',
        color: 'bg-emerald-600 border-emerald-500 text-emerald-100',
        label: `D-${i - vramBlockCount}`,
        salience: (0.60 + (i % 25) * 0.01).toFixed(3),
        affinity: 'Host Pinned (DMA)',
        tokenOffset: i * 64,
      };
    } else if (i < vramBlockCount + dramBlockCount + nvmeBlockCount) {
      return {
        id: i,
        tier: 'NVMe',
        color: 'bg-purple-600 border-purple-500 text-purple-100',
        label: `N-${i - (vramBlockCount + dramBlockCount)}`,
        salience: (0.25 + (i % 30) * 0.01).toFixed(3),
        affinity: 'Direct I/O Cold Store',
        tokenOffset: i * 64,
      };
    } else {
      return {
        id: i,
        tier: 'FREE',
        color: 'bg-slate-800/60 border-slate-700/60 text-slate-500',
        label: 'Empty',
        salience: '0.000',
        affinity: 'Unallocated Page Frame',
        tokenOffset: i * 64,
      };
    }
  });

  const activeInspectedBlock = selectedBlockIndex !== null ? blocks[selectedBlockIndex] : blocks[0];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header & Scenario Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Live Memory Simulator & Inspector</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
              qw3-inspect emulation
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Step through long-context agent turns and visualize tier migration across GPU HBM, Host RAM, and NVMe SSD.
          </p>
        </div>

        {/* Scenario dropdown and bookmark */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-300">Scenario:</label>
          <select
            value={selectedScenarioId}
            onChange={(e) => handleScenarioChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium cursor-pointer"
          >
            {SIMULATION_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              toggleFavorite({
                itemId: `scenario-${scenario.id}`,
                itemType: 'benchmark',
                title: `Simulation: ${scenario.title}`,
                category: 'Simulation',
                summary: `${scenario.description} (${scenario.turns.length} turns, up to ${scenario.turns[scenario.turns.length - 1]?.cumulativeTokens?.toLocaleString()} tokens)`
              });
            }}
            title="Bookmark this simulation scenario"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isFavorited(`scenario-${scenario.id}`)
                ? 'bg-amber-950/80 border-amber-600 text-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorited(`scenario-${scenario.id}`) ? 'fill-amber-400' : ''}`} />
            <span className="hidden sm:inline">{isFavorited(`scenario-${scenario.id}`) ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Control Panel with Play, Pause, Reset, Scrubber, and Speed controls */}
      <SimulationControlPanel
        scenario={scenario}
        currentTurnIndex={currentTurnIndex}
        isPlaying={isPlaying}
        playbackSpeedMs={playbackSpeedMs}
        isLooping={isLooping}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        onStep={handleStep}
        onNext={handleNext}
        onPrev={handlePrev}
        onSelectTurn={(turnIdx) => {
          setIsPlaying(false);
          setCurrentTurnIndex(turnIdx);
        }}
        onSetSpeed={setPlaybackSpeedMs}
        onToggleLoop={() => setIsLooping(!isLooping)}
      />

      {/* Current Turn Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Cumulative Tokens */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Cumulative Context</span>
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {currentTurn.cumulativeTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            +{currentTurn.turnTokens.toLocaleString()} tokens in Turn {currentTurn.turnNumber}
          </div>
          <div className="mt-2 text-[10px] font-mono text-blue-400">
            {currentTurn.cumulativeTokens >= 1000000 ? '1M+ Extreme Context Zone' : 'Standard Agent Window'}
          </div>
        </div>

        {/* Metric 2: Pre-Answer Latency */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Pre-Answer Latency</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {currentTurn.preAnswerLatencyMs} ms
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            vs ~{Math.round((currentTurn.cumulativeTokens / 25000) * 1200)}ms full dense prefill
          </div>
          <div className="mt-2 text-[10px] font-mono text-emerald-400">
            {Math.round((1 - currentTurn.preAnswerLatencyMs / Math.max(1, (currentTurn.cumulativeTokens / 25000) * 1200)) * 100)}% latency eliminated
          </div>
        </div>

        {/* Metric 3: Generation Speed */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Generation Speed</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {currentTurn.generationSpeedTps} <span className="text-xs font-normal text-slate-400">tok/s</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            FlashInfer vector decode
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400">
            Precision: {prof.quantization}
          </div>
        </div>

        {/* Metric 4: Cache Hit Status */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Retrieval State</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1">
            <span
              className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                currentTurn.cacheHitType === 'FULL_HIT'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : currentTurn.cacheHitType === 'PREFIX_HIT'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : currentTurn.cacheHitType === 'DELTANET_PAGED'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'bg-purple-950 text-purple-300 border border-purple-800'
              }`}
            >
              {currentTurn.cacheHitType}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate" title={currentTurn.receiptHash}>
            Receipt: {currentTurn.receiptHash.slice(0, 10)}...
          </div>
          <div className="mt-1 text-[10px] font-mono text-emerald-400">
            KL: 0.00084 (Coherent)
          </div>
        </div>
      </div>

      {/* Live Turn Execution Log */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">SESSION STEP:</span>
            <span className="text-white font-bold">Turn #{currentTurn.turnNumber} of {scenario.turns.length}</span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400 capitalize">{currentTurn.role.replace('_', ' ')}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Status: Transactionally Committed (RC40)
          </div>
        </div>

        <div className="space-y-1.5 text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-slate-500">&gt;</span>
            <p className="text-slate-200 font-sans">{currentTurn.action}</p>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-slate-400 pl-1">
          <GitFork className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200">Cache Hierarchy Visualization:</span>
          <span className="hidden md:inline text-slate-500">
            Real-time token linking & associative GDN recurrence across memory tiers
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-blue-300" />
            <span>D3 Force Graph</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-indigo-300" />
            <span>Dual Split View</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-300" />
            <span>Physical Paged Grid</span>
          </button>
        </div>
      </div>

      {/* Memory Allocation Tiers and Interactive Visualizers */}
      <div className="space-y-6">
        {/* Render D3 Force-Directed Graph when in 'graph' or 'split' view */}
        {(viewMode === 'graph' || viewMode === 'split') && (
          <TokenGraphVisualizer
            scenario={scenario}
            currentTurn={currentTurn}
            onSelectNode={(node) => {
              setSelectedGraphNode(node);
              setSelectedBlockIndex(null);
            }}
            selectedNodeId={selectedGraphNode?.id}
            isPlaying={isPlaying}
            playbackSpeedMs={playbackSpeedMs}
            onSetSpeed={setPlaybackSpeedMs}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onStep={handleStep}
            onNext={handleNext}
            onPrev={handlePrev}
            currentTurnIndex={currentTurnIndex}
            totalTurns={scenario.turns.length}
          />
        )}

        {/* 2-Column Section: Paged Grid (or when in 'graph' mode, just progress bars) + Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Physical Paged Grid & Progress Bars */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            {(viewMode === 'grid' || viewMode === 'split') && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Physical Paged Memory Block Grid (64 tokens/page)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click any memory block to inspect slot affinity, token range, and DeltaNet salience score
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      <span className="text-slate-300">GPU VRAM</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span className="text-slate-300">Host RAM</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                      <span className="text-slate-300">NVMe SSD</span>
                    </div>
                  </div>
                </div>

                {/* Grid of memory blocks */}
                <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  {blocks.map((b) => {
                    const isSelected = selectedBlockIndex === b.id && !selectedGraphNode;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBlockIndex(b.id);
                          setSelectedGraphNode(null);
                        }}
                        title={`Block #${b.id} [${b.tier}] - Salience: ${b.salience}`}
                        className={`h-7 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                          b.color
                        } ${
                          isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:opacity-80'
                        }`}
                      >
                        {b.tier === 'FREE' ? '' : b.id}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {viewMode === 'graph' && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Real-Time Tier Allocation & Buffer Saturation
                </h3>
                <p className="text-xs text-slate-400">
                  Dynamic memory tier capacity utilization for Turn #{currentTurn.turnNumber}
                </p>
              </div>
            )}

            {/* Memory Tier Progress Bars */}
            <div className="mt-5 space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    Tier 0: Active GPU VRAM (HBM)
                  </span>
                  <span className="font-mono text-blue-300">
                    {currentTurn.vramPages} pages ({currentTurn.vramPages * 64} tokens / {prof.vramBudget} max)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentTurn.vramPages / 512) * 100)}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Tier 1: Pinned Host Memory (DRAM)
                  </span>
                  <span className="font-mono text-emerald-300">
                    {currentTurn.dramPages} pages ({currentTurn.dramPages * 64} tokens staged)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentTurn.dramPages / 2048) * 100)}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    Tier 2: Slot-Scoped NVMe Storage
                  </span>
                  <span className="font-mono text-purple-300">
                    {currentTurn.nvmePages} pages ({currentTurn.nvmePages * 64} tokens persistent)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentTurn.nvmePages / 16000) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Inspected Entity Detail Card (Token Graph Node OR Paged Block) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            {selectedGraphNode ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    Token Node Inspector
                  </h4>
                  <button
                    onClick={() => setSelectedGraphNode(null)}
                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    View Page Blocks
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Token Entity:</span>
                    <span className="font-bold text-white font-sans text-sm mt-0.5 block">{selectedGraphNode.label}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Resident Tier:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      selectedGraphNode.tier === 'PREFIX' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      selectedGraphNode.tier === 'VRAM' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                      selectedGraphNode.tier === 'DRAM' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}>
                      {selectedGraphNode.tier}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">DeltaNet Salience:</span>
                    <span className="font-mono font-bold text-emerald-400">{(selectedGraphNode.salience * 100).toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Token Volume:</span>
                    <span className="font-mono text-slate-200">{selectedGraphNode.tokensCount.toLocaleString()} tokens</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Origination Turn:</span>
                    <span className="font-mono text-blue-300">Turn #{selectedGraphNode.turn}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Semantic Role:</span>
                    <span className="font-mono text-slate-300 capitalize">{selectedGraphNode.role.replace('_', ' ')}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-[11px] text-slate-300">
                    <span className="font-bold text-blue-300 block mb-1">Hierarchy Linking & Routing:</span>
                    {selectedGraphNode.tier === 'PREFIX' && (
                      <p>Root Anchor: Immutable system instructions and tool definitions pinned across all multi-turn subagents.</p>
                    )}
                    {selectedGraphNode.tier === 'VRAM' && (
                      <p>GPU Hot L1 Resident: Directly mapped into GPU High-Bandwidth Memory (HBM) for zero-overhead vector decode (~1.2ms TTFT).</p>
                    )}
                    {selectedGraphNode.tier === 'DRAM' && (
                      <p>Host Pinned DRAM (L2): Staged in host memory via DMA. Preemptively promoted back to VRAM when salience exceeds 0.70.</p>
                    )}
                    {selectedGraphNode.tier === 'NVMe' && (
                      <p>Cold Storage NVMe (L3): Slot-scoped persistent storage for ultra-long context history, retrieved without polluting VRAM.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    Page Block Inspector
                  </h4>
                  <span className="text-xs font-mono text-slate-400">Block #{activeInspectedBlock.id}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Resident Tier:</span>
                    <span className="font-bold text-white font-mono">{activeInspectedBlock.tier}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Affinity / Route:</span>
                    <span className="font-mono text-blue-300">{activeInspectedBlock.affinity}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">DeltaNet Salience:</span>
                    <span className="font-mono font-bold text-emerald-400">{activeInspectedBlock.salience}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Token Range:</span>
                    <span className="font-mono text-slate-200">
                      [{activeInspectedBlock.tokenOffset} .. {activeInspectedBlock.tokenOffset + 63}]
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Allocation Status:</span>
                    <span className="font-mono text-slate-200">
                      {activeInspectedBlock.tier === 'FREE' ? 'Free (Available)' : 'Active Slot #0'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-[11px] text-slate-300">
                    <span className="font-bold text-blue-300 block mb-1">DeltaNet Attention Weighting:</span>
                    Tokens in this page are scored via Gated Delta Net recurrence. When salience exceeds 0.70, 
                    the page is preemptively promoted into GPU VRAM before the next tool response.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
