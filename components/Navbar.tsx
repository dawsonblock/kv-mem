'use client';

import React from 'react';
import { 
  Layers, 
  Cpu, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  Zap,
  HardDrive,
  Star,
  User,
  LogOut,
  Lock
} from 'lucide-react';
import { RUNTIME_PROFILES, HARDWARE_PRESETS } from '@/lib/kvmem-data';
import { useAuth } from '@/lib/auth-context';
import { useFavorites } from '@/lib/favorites-context';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProfile: string;
  setSelectedProfile: (profile: string) => void;
  selectedHardware: string;
  setSelectedHardware: (hardware: string) => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedProfile,
  setSelectedProfile,
  selectedHardware,
  setSelectedHardware,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const { count: favoritesCount } = useFavorites();

  const tabs = [
    { id: 'architecture', label: '3-Tier Architecture', icon: Layers },
    { id: 'simulator', label: 'Memory Simulator', icon: Activity },
    { id: 'benchmarks', label: 'Paper & Benchmarks', icon: BarChart3 },
    { id: 'qualification', label: 'RC40 Hardening Matrix', icon: ShieldCheck },
    { id: 'workbench', label: 'CLI & Config Workbench', icon: Terminal },
    { id: 'favorites', label: 'Favorites', icon: Star, badge: favoritesCount },
    { id: 'ai-assistant', label: 'AI Architect', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Banner with release tag, hardware selector, profile selector, and auth status */}
      <div className="border-b border-slate-800/60 bg-slate-900/50 px-4 py-1.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">KV-Memory (kvmem-qw3)</span>
          <span className="text-slate-600">•</span>
          <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400 border border-emerald-800/60">
            RELEASE RC40 HARDENED
          </span>
          <span className="hidden sm:inline text-slate-500">
            Coherent DeltaNet Session Checkpointing
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Target GPU:</span>
            <select
              value={selectedHardware}
              onChange={(e) => setSelectedHardware(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            >
              {HARDWARE_PRESETS.map((hw) => (
                <option key={hw.id} value={hw.id}>
                  {hw.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Profile:</span>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-amber-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            >
              {Object.values(RUNTIME_PROFILES).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.replace(' Profile', '')}
                </option>
              ))}
            </select>
          </div>

          {/* User Auth Info in Top Bar */}
          <div className="pl-2 border-l border-slate-800 flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-slate-300 font-mono text-[11px] hidden lg:inline truncate max-w-[120px]">
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1 rounded text-slate-400 hover:text-red-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20">
            KV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                KV-Memory
                <span className="text-xs font-mono font-normal text-blue-400">qw3-rc40</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Hierarchical Tiered NVMe/RAM/VRAM & DeltaNet Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] leading-tight">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
