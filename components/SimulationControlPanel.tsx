'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  FastForward, 
  StepForward,
  Repeat, 
  Activity, 
  Clock, 
  Layers,
  Sparkles,
  Gauge
} from 'lucide-react';
import { SimulationScenario, SimulationTurn } from '@/lib/kvmem-data';
import { SimulationTooltip } from '@/components/SimulationTooltip';

interface SimulationControlPanelProps {
  scenario: SimulationScenario;
  currentTurnIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  isLooping?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep?: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectTurn: (turnIndex: number) => void;
  onSetSpeed: (speedMs: number) => void;
  onToggleLoop?: () => void;
}

export const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  scenario,
  currentTurnIndex,
  isPlaying,
  playbackSpeedMs,
  isLooping = true,
  onPlay,
  onPause,
  onReset,
  onStep,
  onNext,
  onPrev,
  onSelectTurn,
  onSetSpeed,
  onToggleLoop,
}) => {
  const currentTurn = scenario.turns[currentTurnIndex] || scenario.turns[0];
  const totalTurns = scenario.turns.length;
  const isAtStart = currentTurnIndex === 0;
  const isAtEnd = currentTurnIndex === totalTurns - 1;

  // Calculate playback speed multiplier relative to baseline 2000ms = 1.0x
  const speedMultiplier = Math.max(0.5, Math.min(4.0, Number((2000 / Math.max(200, playbackSpeedMs)).toFixed(1))));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 space-y-4 shadow-xl">
      {/* Top Header: Title & Playback State */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Simulation Control Panel
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border ${
                isPlaying 
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 animate-pulse'
                  : isAtEnd
                  ? 'bg-purple-950/90 text-purple-300 border-purple-700/80'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isPlaying ? '● Playing' : isAtEnd ? 'Completed' : '❚❚ Paused'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Control the temporal token cache allocation and GDN recurrence playback
            </p>
          </div>
        </div>

        {/* Current Turn & Token Metric */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 mr-1.5">Turn:</span>
            <span className="text-blue-400 font-bold">{currentTurnIndex + 1}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-slate-400">{totalTurns}</span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 mr-1.5">Tokens:</span>
            <span className="text-emerald-400 font-bold">{currentTurn?.cumulativeTokens?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Primary Control Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Core Controls: Play, Pause, Reset, Prev, Next */}
        <div className="flex items-center gap-2">
          {/* Play Button with Interactive Tooltip */}
          <SimulationTooltip
            title="Play Simulation"
            badge={isPlaying ? 'Active' : 'Auto-Run'}
            badgeColor="emerald"
            icon={<Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
            description="Sequences through multi-turn conversation steps automatically. Animates real-time token allocation across GPU VRAM, Host DRAM, and NVMe SSD tiers while computing DeltaNet associative recurrence."
            footer={`Advances every ${(playbackSpeedMs / 1000).toFixed(1)}s • Loop: ${isLooping ? 'On' : 'Off'}`}
            align="left"
            side="top"
          >
            <button
              id="sim-play-button"
              onClick={onPlay}
              disabled={isPlaying}
              aria-label="Start automated simulation playback"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20 active:scale-95'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isPlaying ? 'fill-emerald-400' : 'fill-white'}`} />
              <span>Play</span>
            </button>
          </SimulationTooltip>

          {/* Pause Button with Interactive Tooltip */}
          <SimulationTooltip
            title="Pause Playback"
            badge={!isPlaying ? 'Paused' : 'Playing'}
            badgeColor="amber"
            icon={<Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
            description="Freezes the simulation at the current turn. Locks the token hierarchy and force-directed graph in place for detailed node inspection, memory profiling, and salience evaluation."
            footer={`Freezes at Turn #${currentTurnIndex + 1} (${currentTurn?.cumulativeTokens?.toLocaleString() || 0} tokens)`}
            align="center"
            side="top"
          >
            <button
              id="sim-pause-button"
              onClick={onPause}
              disabled={!isPlaying}
              aria-label="Pause simulation playback"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                !isPlaying
                  ? 'bg-slate-800/90 border-slate-700 text-slate-300 ring-1 ring-slate-600'
                  : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20 active:scale-95'
              }`}
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          </SimulationTooltip>

          {/* Step Button with Interactive Tooltip */}
          <SimulationTooltip
            title="Single-Frame Step"
            badge="+1 Turn"
            badgeColor="blue"
            icon={<StepForward className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />}
            description="Advances the simulation forward by exactly one turn frame. Enables granular frame-by-frame analysis of token caching, causal attention edges, and tier migrations."
            footer={isAtEnd ? 'At final turn (wraps to Turn 1)' : `Steps to Turn #${currentTurnIndex + 2} of ${totalTurns}`}
            align="center"
            side="top"
          >
            <button
              id="sim-step-button"
              onClick={onStep || onNext}
              aria-label="Step frame-by-frame through token hierarchy"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              <StepForward className="w-3.5 h-3.5 fill-current" />
              <span>Step</span>
            </button>
          </SimulationTooltip>

          {/* Reset Button with Interactive Tooltip */}
          <SimulationTooltip
            title="Reset Simulation"
            badge="Rewind"
            badgeColor="purple"
            icon={<RotateCcw className="w-3.5 h-3.5 text-purple-400" />}
            description="Rewinds the playback to Turn 1 (system instructions & initial prompt prefix). Flushes transient DRAM/NVMe allocations, clears node focus, and restores initial cache layout."
            footer="Restores Turn #1 baseline"
            align="center"
            side="top"
          >
            <button
              id="sim-reset-button"
              onClick={onReset}
              aria-label="Reset simulation to Turn 1"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              <span>Reset</span>
            </button>
          </SimulationTooltip>

          <div className="h-6 w-[1px] bg-slate-800 mx-1" />

          {/* Step Back (Prev) */}
          <button
            id="sim-prev-button"
            onClick={onPrev}
            disabled={isAtStart}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Step backward one turn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Step Forward (Next) */}
          <button
            id="sim-next-button"
            onClick={onNext}
            disabled={isAtEnd}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Step forward one turn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Auxiliary Controls: Speed & Loop Toggle */}
        <div className="flex items-center gap-3">
          {/* Speed Adjustment Slider with Interactive Tooltip */}
          <SimulationTooltip
            title="Simulation Speed Control"
            badge={`${speedMultiplier.toFixed(1)}x Speed`}
            badgeColor="blue"
            icon={<Gauge className="w-3.5 h-3.5 text-blue-400" />}
            description="Adjust the simulation playback speed dynamically. Lower values (0.5x) slow down playback for detailed token cache frame inspection, while higher values (up to 4.0x) accelerate trajectory traversal."
            footer={`Duration: ${(playbackSpeedMs / 1000).toFixed(2)}s per turn`}
            align="right"
            side="top"
          >
            <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-inner">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Speed:</span>
                <span className="font-mono text-xs font-bold text-blue-400 min-w-[36px] text-right">
                  {speedMultiplier.toFixed(1)}x
                </span>
              </div>

              {/* Slider Input */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono">0.5x</span>
                <input
                  id="sim-speed-slider"
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => {
                    const mult = parseFloat(e.target.value);
                    if (!isNaN(mult) && mult > 0) {
                      onSetSpeed(Math.round(2000 / mult));
                    }
                  }}
                  className="w-20 sm:w-28 md:w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  aria-label="Playback speed slider"
                  title={`Speed: ${speedMultiplier.toFixed(1)}x (${(playbackSpeedMs / 1000).toFixed(2)}s/turn)`}
                />
                <span className="text-[10px] text-slate-500 font-mono">4.0x</span>
              </div>

              {/* Preset Snapping Buttons */}
              <div className="hidden lg:flex items-center gap-1 pl-1.5 border-l border-slate-800">
                {[0.5, 1.0, 2.0, 3.0].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => onSetSpeed(Math.round(2000 / preset))}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      Math.abs(speedMultiplier - preset) < 0.15
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800/80'
                    }`}
                    title={`Set speed to ${preset}x`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            </div>
          </SimulationTooltip>

          {/* Loop Toggle */}
          {onToggleLoop && (
            <button
              id="sim-loop-button"
              onClick={onToggleLoop}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                isLooping
                  ? 'bg-blue-950/80 border-blue-600 text-blue-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title={isLooping ? 'Auto-loop enabled: repeats after final turn' : 'Auto-loop disabled: stops at final turn'}
            >
              <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="hidden md:inline">Loop</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrubber Timeline & Turn Milestones */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] flex items-center gap-1 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Active Turn Context: <strong className="text-white ml-1">{currentTurn?.action || ''}</strong>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {currentTurn?.vramPages || 0} VRAM pgs • {currentTurn?.dramPages || 0} DRAM pgs • {currentTurn?.nvmePages || 0} NVMe pgs
          </span>
        </div>

        {/* Interactive Scrub Timeline */}
        <div className="relative">
          <input
            id="sim-scrubber-slider"
            type="range"
            min={0}
            max={totalTurns - 1}
            value={currentTurnIndex}
            onChange={(e) => onSelectTurn(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Turn step tick marks */}
          <div className="flex justify-between items-center px-1 pt-1.5">
            {scenario.turns.map((t, idx) => {
              const isActive = currentTurnIndex === idx;
              const isPast = idx < currentTurnIndex;

              return (
                <button
                  key={t.turnNumber}
                  onClick={() => onSelectTurn(idx)}
                  className={`group relative flex flex-col items-center cursor-pointer`}
                  title={`Turn ${t.turnNumber}: ${t.action}`}
                >
                  <div className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center font-bold transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-110 shadow-lg shadow-blue-500/30'
                      : isPast
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                  }`}>
                    {t.turnNumber}
                  </div>
                  <span className="hidden lg:block text-[9px] font-mono text-slate-500 mt-1 max-w-[70px] truncate text-center group-hover:text-slate-300">
                    {t.role === 'user' ? 'User' : t.role === 'agent_tool_exec' ? 'Tool' : 'Output'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
