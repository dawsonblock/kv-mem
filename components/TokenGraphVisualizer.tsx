'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Maximize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Info, 
  Layers, 
  Cpu, 
  HardDrive, 
  Sparkles, 
  Filter, 
  Play, 
  Pause,
  Compass,
  ChevronLeft,
  ChevronRight,
  StepForward,
  Gauge
} from 'lucide-react';
import { SimulationTurn, SimulationScenario } from '@/lib/kvmem-data';
import { SimulationTooltip } from '@/components/SimulationTooltip';

export interface TokenGraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  tier: 'VRAM' | 'DRAM' | 'NVMe' | 'PREFIX';
  turn: number;
  salience: number; // 0.0 - 1.0
  tokensCount: number;
  role: string;
  isAnchor?: boolean;
  isRecent?: boolean;
}

export interface TokenGraphLink extends d3.SimulationLinkDatum<TokenGraphNode> {
  source: string | TokenGraphNode;
  target: string | TokenGraphNode;
  type: 'causal' | 'deltanet' | 'migration';
  weight: number; // 0.1 - 1.0
}

interface TokenGraphVisualizerProps {
  scenario: SimulationScenario;
  currentTurn: SimulationTurn;
  onSelectNode?: (node: TokenGraphNode) => void;
  selectedNodeId?: string | null;
  isPlaying?: boolean;
  playbackSpeedMs?: number;
  onSetSpeed?: (speedMs: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onStep?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentTurnIndex?: number;
  totalTurns?: number;
}

export const TokenGraphVisualizer: React.FC<TokenGraphVisualizerProps> = ({
  scenario,
  currentTurn,
  onSelectNode,
  selectedNodeId,
  isPlaying = false,
  playbackSpeedMs = 2000,
  onSetSpeed,
  onPlay,
  onPause,
  onReset,
  onStep,
  onNext,
  onPrev,
  currentTurnIndex = 0,
  totalTurns = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<TokenGraphNode, TokenGraphLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 520 });
  const [activeTierFilter, setActiveTierFilter] = useState<'ALL' | 'VRAM' | 'DRAM' | 'NVMe'>('ALL');
  const [showDeltaNetLinks, setShowDeltaNetLinks] = useState<boolean>(true);
  const [showCausalLinks, setShowCausalLinks] = useState<boolean>(true);
  const [isPhysicsActive, setIsPhysicsActive] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<TokenGraphNode | null>(null);

  // ResizeObserver for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      const calculatedHeight = Math.max(480, Math.min(620, Math.round(width * 0.55)));
      setDimensions({ width: Math.floor(width), height: calculatedHeight });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Generate dynamic Token Nodes and Link Relationships based on current turn
  const { nodes, links } = useMemo(() => {
    const rawNodes: TokenGraphNode[] = [];
    const rawLinks: TokenGraphLink[] = [];

    // 1. Root System Prompt Prefix (Persistent in VRAM)
    rawNodes.push({
      id: 'node-sys-prefix',
      label: 'System Prompt & Tool Declarations',
      tier: 'PREFIX',
      turn: 0,
      salience: 0.99,
      tokensCount: 4096,
      role: 'system',
      isAnchor: true,
    });

    // 2. Build nodes for turns up to currentTurn.turnNumber
    const visibleTurns = scenario.turns.filter((t) => t.turnNumber <= currentTurn.turnNumber);

    visibleTurns.forEach((t) => {
      const isLatestTurn = t.turnNumber === currentTurn.turnNumber;

      // Classify which tier this turn's tokens predominantly reside in
      // Recent turns reside in VRAM; middle in DRAM; older turns flushed to NVMe
      const turnAge = currentTurn.turnNumber - t.turnNumber;
      let primaryTier: 'VRAM' | 'DRAM' | 'NVMe' = 'VRAM';
      if (turnAge > 3) {
        primaryTier = 'NVMe';
      } else if (turnAge > 1) {
        primaryTier = 'DRAM';
      }

      // Action Node
      const actionNodeId = `node-turn-${t.turnNumber}-act`;
      rawNodes.push({
        id: actionNodeId,
        label: `T${t.turnNumber}: ${t.action.length > 28 ? t.action.slice(0, 25) + '...' : t.action}`,
        tier: primaryTier,
        turn: t.turnNumber,
        salience: isLatestTurn ? 0.95 : Math.max(0.35, 0.9 - turnAge * 0.12),
        tokensCount: Math.round(t.turnTokens * 0.4),
        role: t.role,
        isRecent: isLatestTurn,
      });

      // Context KV Page Block
      const pageNodeId = `node-turn-${t.turnNumber}-kv`;
      rawNodes.push({
        id: pageNodeId,
        label: `KV Block #S${t.turnNumber} [${t.turnTokens.toLocaleString()} tok]`,
        tier: primaryTier === 'VRAM' ? (t.turnTokens > 50000 ? 'DRAM' : 'VRAM') : primaryTier,
        turn: t.turnNumber,
        salience: Math.max(0.2, 0.85 - turnAge * 0.14),
        tokensCount: Math.round(t.turnTokens * 0.6),
        role: 'kv_cache',
        isRecent: isLatestTurn,
      });

      // Link between action and KV block
      rawLinks.push({
        source: actionNodeId,
        target: pageNodeId,
        type: 'causal',
        weight: 0.9,
      });

      // Link to System Prompt
      if (t.turnNumber === 1) {
        rawLinks.push({
          source: 'node-sys-prefix',
          target: actionNodeId,
          type: 'causal',
          weight: 0.8,
        });
      } else {
        // Causal link from previous turn
        const prevActionId = `node-turn-${t.turnNumber - 1}-act`;
        rawLinks.push({
          source: prevActionId,
          target: actionNodeId,
          type: 'causal',
          weight: 0.7,
        });
      }

      // DeltaNet associative shortcut links across non-adjacent turns if high salience
      if (t.turnNumber >= 3) {
        // Cross-linking back to earlier turns (GDN constant-time recurrence)
        const targetTurn = Math.max(1, t.turnNumber - 2);
        rawLinks.push({
          source: actionNodeId,
          target: `node-turn-${targetTurn}-act`,
          type: 'deltanet',
          weight: isLatestTurn ? 0.95 : 0.6,
        });
      }

      // If promoted/demoted across tiers, add migration link
      if (t.turnNumber > 2 && turnAge <= 2) {
        rawLinks.push({
          source: pageNodeId,
          target: 'node-sys-prefix',
          type: 'migration',
          weight: 0.4,
        });
      }
    });

    return { nodes: rawNodes, links: rawLinks };
  }, [scenario, currentTurn]);

  // D3 Force Simulation Setup & Update
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Define defs & gradient markers for links
    const defs = svg.append('defs');

    // Arrow markers for causal links
    defs.append('marker')
      .attr('id', 'arrow-causal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    defs.append('marker')
      .attr('id', 'arrow-deltanet')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f59e0b');

    // Radial gradient for background glow
    const radialGrad = defs.append('radialGradient')
      .attr('id', 'bg-glow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    radialGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1e293b').attr('stop-opacity', 0.5);
    radialGrad.append('stop').attr('offset', '100%').attr('stop-color', '#020617').attr('stop-opacity', 1);

    // Root background rect
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#bg-glow)');

    // Zoom container
    const g = svg.append('g').attr('class', 'main-graph-group');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Filter nodes and links according to active filters
    const filteredNodes = nodes.filter((n) => {
      if (activeTierFilter === 'ALL') return true;
      if (n.tier === 'PREFIX') return true;
      return n.tier === activeTierFilter;
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = links.filter((l) => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return false;
      if (l.type === 'causal' && !showCausalLinks) return false;
      if (l.type === 'deltanet' && !showDeltaNetLinks) return false;
      return true;
    });

    // Tier target radii for natural concentric layout (VRAM center -> DRAM ring -> NVMe outer ring)
    const tierRadius = {
      PREFIX: 40,
      VRAM: 110,
      DRAM: 200,
      NVMe: 290,
    };

    // Deep-clone nodes and links for D3 simulation
    const simNodes: TokenGraphNode[] = filteredNodes.map((d) => ({ ...d }));
    const simLinks: TokenGraphLink[] = filteredLinks.map((d) => ({ ...d }));

    // Force simulation
    const simulation = d3.forceSimulation<TokenGraphNode, TokenGraphLink>(simNodes)
      .force('link', d3.forceLink<TokenGraphNode, TokenGraphLink>(simLinks)
        .id((d) => d.id)
        .distance((d) => (d.type === 'causal' ? 70 : d.type === 'deltanet' ? 120 : 160))
        .strength((d) => (d.type === 'causal' ? 0.8 : d.type === 'deltanet' ? 0.5 : 0.2))
      )
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<TokenGraphNode>().radius((d) => (d.isAnchor ? 28 : 22)).strength(0.8))
      .force('radial', d3.forceRadial<TokenGraphNode>(
        (d) => tierRadius[d.tier] || 150,
        width / 2,
        height / 2
      ).strength(0.35));

    simulationRef.current = simulation;

    // Draw Tier Ring Guides in background
    const ringsGroup = g.append('g').attr('class', 'tier-rings').attr('opacity', 0.25);
    [
      { r: tierRadius.VRAM, label: 'Tier 0: HBM / VRAM' },
      { r: tierRadius.DRAM, label: 'Tier 1: Host DRAM' },
      { r: tierRadius.NVMe, label: 'Tier 2: NVMe SSD' },
    ].forEach((tier) => {
      ringsGroup.append('circle')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', tier.r)
        .attr('fill', 'none')
        .attr('stroke', '#64748b')
        .attr('stroke-dasharray', '3 4')
        .attr('stroke-width', 1);

      ringsGroup.append('text')
        .attr('x', width / 2 + 8)
        .attr('y', height / 2 - tier.r + 12)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(tier.label);
    });

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.type === 'deltanet') return '#f59e0b';
        if (d.type === 'migration') return '#a855f7';
        return '#475569';
      })
      .attr('stroke-width', (d) => (d.type === 'deltanet' ? 2 : d.type === 'causal' ? 1.5 : 1))
      .attr('stroke-dasharray', (d) => (d.type === 'deltanet' ? '4 3' : d.type === 'migration' ? '2 2' : 'none'))
      .attr('stroke-opacity', (d) => (d.type === 'deltanet' ? 0.85 : 0.5))
      .attr('marker-end', (d) => (d.type === 'deltanet' ? 'url(#arrow-deltanet)' : 'url(#arrow-causal)'));

    // Draw Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, TokenGraphNode>()
          .on('start', (event, d) => {
            if (!event.active && isPhysicsActive) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active && isPhysicsActive) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node Outer Pulse for Recent / Active nodes
    node.filter((d) => !!d.isRecent)
      .append('circle')
      .attr('r', 20)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('class', 'animate-ping')
      .style('transform-origin', 'center');

    // Node Circle
    node.append('circle')
      .attr('r', (d) => (d.isAnchor ? 18 : d.isRecent ? 14 : 11))
      .attr('fill', (d) => {
        if (d.tier === 'PREFIX') return '#f59e0b';
        if (d.tier === 'VRAM') return '#0284c7';
        if (d.tier === 'DRAM') return '#059669';
        return '#7c3aed';
      })
      .attr('stroke', (d) => {
        if (selectedNodeId === d.id) return '#ffffff';
        if (d.tier === 'PREFIX') return '#fbbf24';
        if (d.tier === 'VRAM') return '#38bdf8';
        if (d.tier === 'DRAM') return '#34d399';
        return '#c084fc';
      })
      .attr('stroke-width', (d) => (selectedNodeId === d.id ? 3 : 1.5))
      .attr('filter', (d) => (d.tier === 'PREFIX' || d.isRecent ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))' : 'none'));

    // Node Inner Glyphs/Icons
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => (d.isAnchor ? '10px' : '9px'))
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text((d) => {
        if (d.tier === 'PREFIX') return 'SYS';
        if (d.tier === 'VRAM') return 'V0';
        if (d.tier === 'DRAM') return 'D1';
        return 'N2';
      });

    // Node Labels
    node.append('text')
      .attr('dx', 16)
      .attr('dy', 4)
      .attr('fill', '#cbd5e1')
      .attr('font-size', '10px')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2.5)
      .text((d) => d.label);

    // Node Interactions
    node
      .on('mouseover', (_event, d) => {
        setHoveredNode(d);
        // Highlight incident links
        link
          .attr('stroke-opacity', (l) => {
            const sId = typeof l.source === 'string' ? l.source : l.source.id;
            const tId = typeof l.target === 'string' ? l.target : l.target.id;
            return sId === d.id || tId === d.id ? 1 : 0.15;
          })
          .attr('stroke-width', (l) => {
            const sId = typeof l.source === 'string' ? l.source : l.source.id;
            const tId = typeof l.target === 'string' ? l.target : l.target.id;
            return sId === d.id || tId === d.id ? 2.5 : 1;
          });
      })
      .on('mouseout', () => {
        setHoveredNode(null);
        link
          .attr('stroke-opacity', (l) => (l.type === 'deltanet' ? 0.85 : 0.5))
          .attr('stroke-width', (l) => (l.type === 'deltanet' ? 2 : 1.5));
      })
      .on('click', (_event, d) => {
        if (onSelectNode) {
          onSelectNode(d);
        }
      });

    // Simulation Tick handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as TokenGraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as TokenGraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as TokenGraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as TokenGraphNode).y ?? 0);

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [
    nodes,
    links,
    dimensions,
    activeTierFilter,
    showDeltaNetLinks,
    showCausalLinks,
    isPhysicsActive,
    selectedNodeId,
    onSelectNode,
  ]);

  // Handle Zoom controls
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetView = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(350).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const togglePhysics = () => {
    if (!simulationRef.current) return;
    if (isPhysicsActive) {
      simulationRef.current.stop();
      setIsPhysicsActive(false);
    } else {
      simulationRef.current.alpha(0.3).restart();
      setIsPhysicsActive(true);
    }
  };

  return (
    <div ref={containerRef} className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
      {/* Visualizer Top Bar & Controls */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white">D3 Real-Time KV Cache Token Force Graph</span>
            <span className="hidden sm:inline text-slate-400 ml-2">
              (Turn {currentTurn.turnNumber}: {nodes.length} token blocks, {links.length} attention & recurrence links)
            </span>
          </div>
        </div>

        {/* Filters and Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Simulation Playback Controls (Play, Pause, Reset, Step) */}
          {onPlay && onPause && onReset && (
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <SimulationTooltip
                title="Play Graph Simulation"
                badge={isPlaying ? 'Active' : 'Auto-Run'}
                badgeColor="emerald"
                icon={<Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
                description="Continuously animates force-directed token hierarchy expansion and memory tier allocations across conversation turns."
                side="bottom"
                align="left"
              >
                <button
                  id="graph-play-button"
                  onClick={onPlay}
                  disabled={isPlaying}
                  aria-label="Play token hierarchy visualization"
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 ring-1 ring-emerald-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </button>
              </SimulationTooltip>

              <SimulationTooltip
                title="Pause Graph Simulation"
                badge={!isPlaying ? 'Paused' : 'Playing'}
                badgeColor="amber"
                icon={<Pause className="w-3 h-3 text-amber-400 fill-amber-400" />}
                description="Freezes physics simulation forces and node positions, allowing full pan, zoom, drag, and node attribute inspection."
                side="bottom"
                align="center"
              >
                <button
                  id="graph-pause-button"
                  onClick={onPause}
                  disabled={!isPlaying}
                  aria-label="Pause token hierarchy visualization"
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    !isPlaying
                      ? 'bg-slate-800/90 border border-slate-700 text-slate-400'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                  }`}
                >
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause</span>
                </button>
              </SimulationTooltip>

              <SimulationTooltip
                title="Step Single Frame"
                badge="+1 Turn"
                badgeColor="blue"
                icon={<StepForward className="w-3 h-3 text-blue-400 fill-blue-400" />}
                description="Steps forward by exactly one turn frame to observe incremental node creation and DeltaNet recurrence link propagation."
                side="bottom"
                align="center"
              >
                <button
                  id="graph-step-button"
                  onClick={onStep || onNext}
                  aria-label="Step forward one frame in token hierarchy"
                  className="px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 transition-all cursor-pointer"
                >
                  <StepForward className="w-3 h-3 text-blue-400 fill-current" />
                  <span>Step</span>
                </button>
              </SimulationTooltip>

              <SimulationTooltip
                title="Reset Graph"
                badge="Rewind"
                badgeColor="purple"
                icon={<RotateCcw className="w-3 h-3 text-purple-400" />}
                description="Rewinds visualization back to Turn 1, restoring initial root prefix anchor and clearing transient memory tier nodes."
                side="bottom"
                align="center"
              >
                <button
                  id="graph-reset-button"
                  onClick={onReset}
                  aria-label="Reset visualization to Turn 1"
                  className="px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset</span>
                </button>
              </SimulationTooltip>

              {onPrev && onNext && (
                <div className="flex items-center gap-0.5 ml-1 border-l border-slate-800 pl-1">
                  <button
                    onClick={onPrev}
                    disabled={currentTurnIndex === 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700 cursor-pointer"
                    title="Previous turn"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onNext}
                    disabled={currentTurnIndex >= totalTurns - 1}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700 cursor-pointer"
                    title="Next turn"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {onSetSpeed && (
                <SimulationTooltip
                  title="Graph Playback Speed"
                  badge={`${(2000 / Math.max(200, playbackSpeedMs)).toFixed(1)}x`}
                  badgeColor="blue"
                  icon={<Gauge className="w-3 h-3 text-blue-400" />}
                  description="Increase or decrease graph animation playback speed (0.5x to 4.0x)."
                  footer={`${(playbackSpeedMs / 1000).toFixed(1)}s per turn`}
                  side="bottom"
                  align="center"
                >
                  <div className="flex items-center gap-1.5 ml-1 border-l border-slate-800 pl-1.5">
                    <Gauge className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-mono text-blue-400 font-bold min-w-[24px]">
                      {(2000 / Math.max(200, playbackSpeedMs)).toFixed(1)}x
                    </span>
                    <input
                      id="graph-speed-slider"
                      type="range"
                      min="0.5"
                      max="4.0"
                      step="0.1"
                      value={Math.max(0.5, Math.min(4.0, Number((2000 / Math.max(200, playbackSpeedMs)).toFixed(1))))}
                      onChange={(e) => {
                        const mult = parseFloat(e.target.value);
                        if (!isNaN(mult) && mult > 0) {
                          onSetSpeed(Math.round(2000 / mult));
                        }
                      }}
                      className="w-14 sm:w-20 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                      aria-label="Graph playback speed slider"
                      title={`Speed: ${(2000 / Math.max(200, playbackSpeedMs)).toFixed(1)}x (${(playbackSpeedMs / 1000).toFixed(1)}s/turn)`}
                    />
                  </div>
                </SimulationTooltip>
              )}
            </div>
          )}

          {/* Tier Filter */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80">
            {(['ALL', 'VRAM', 'DRAM', 'NVMe'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTierFilter(tier)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  activeTierFilter === tier
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Link Type Toggles */}
          <button
            onClick={() => setShowDeltaNetLinks(!showDeltaNetLinks)}
            title="Toggle DeltaNet associative recurrence links"
            className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
              showDeltaNetLinks
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">DeltaNet Links</span>
          </button>

          <button
            onClick={() => setShowCausalLinks(!showCausalLinks)}
            title="Toggle causal attention sequence links"
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
              showCausalLinks
                ? 'bg-blue-950/80 border-blue-600 text-blue-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            <span className="hidden md:inline">Causal Flow</span>
          </button>

          {/* Physics Play/Pause */}
          <button
            onClick={togglePhysics}
            title={isPhysicsActive ? 'Freeze physics' : 'Resume force simulation'}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
          >
            {isPhysicsActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Reset zoom & center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full flex-1 min-h-[480px]">
        <svg
          ref={svgRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
          style={{ height: `${dimensions.height}px` }}
        />

        {/* Floating Legend */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-lg p-2.5 space-y-1.5 text-[11px] shadow-xl pointer-events-none">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Hierarchy Tiers</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">Prefix Anchor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-slate-300">GPU VRAM (HBM)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Host DRAM (DMA)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-300">NVMe Cold Block</span>
          </div>
          <div className="border-t border-slate-800 pt-1 mt-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Links</div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-slate-500" />
            <span className="text-slate-400">Causal Attention</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-amber-400 border-b border-dashed border-amber-400" />
            <span className="text-amber-300">DeltaNet Association</span>
          </div>
        </div>

        {/* Hovered Node Tooltip Card */}
        {hoveredNode && (
          <div className="absolute bottom-3 right-3 max-w-xs bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 shadow-2xl space-y-1.5 animate-in fade-in duration-150 pointer-events-none">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white truncate">{hoveredNode.label}</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                hoveredNode.tier === 'PREFIX' ? 'bg-amber-950 text-amber-300' :
                hoveredNode.tier === 'VRAM' ? 'bg-blue-950 text-blue-300' :
                hoveredNode.tier === 'DRAM' ? 'bg-emerald-950 text-emerald-300' :
                'bg-purple-950 text-purple-300'
              }`}>
                {hoveredNode.tier}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block">Salience Score:</span>
                <span className="font-mono text-emerald-400 font-bold">{(hoveredNode.salience * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Token Volume:</span>
                <span className="font-mono text-slate-300">{hoveredNode.tokensCount.toLocaleString()} tok</span>
              </div>
              <div>
                <span className="text-slate-500 block">Session Turn:</span>
                <span className="font-mono text-blue-300">Turn #{hoveredNode.turn}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Attention State:</span>
                <span className="font-mono text-slate-300 capitalize">{hoveredNode.role.replace('_', ' ')}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              Drag node to perturb graph. Click to pin in inspector.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
