'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ArchitectureOverview } from '@/components/ArchitectureOverview';
import { MemorySimulator } from '@/components/MemorySimulator';
import { ResearchBenchmarks } from '@/components/ResearchBenchmarks';
import { ReleaseHardeningMatrix } from '@/components/ReleaseHardeningMatrix';
import { WorkbenchCLI } from '@/components/WorkbenchCLI';
import { AIAssistant } from '@/components/AIAssistant';
import { FavoritesView } from '@/components/FavoritesView';
import { AuthModal } from '@/components/AuthModal';
import { 
  Layers, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  Zap,
  Github,
  BookOpen,
  Cpu
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('architecture');
  const [selectedProfile, setSelectedProfile] = useState<string>('agent-safe');
  const [selectedHardware, setSelectedHardware] = useState<string>('a100_sxm4');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top sticky navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedProfile={selectedProfile}
        setSelectedProfile={setSelectedProfile}
        selectedHardware={selectedHardware}
        setSelectedHardware={setSelectedHardware}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'architecture' && (
          <ArchitectureOverview
            selectedHardware={selectedHardware}
            selectedProfile={selectedProfile}
            onNavigateToSimulator={() => setActiveTab('simulator')}
            onNavigateToBenchmarks={() => setActiveTab('benchmarks')}
          />
        )}

        {activeTab === 'simulator' && (
          <MemorySimulator selectedProfile={selectedProfile} />
        )}

        {activeTab === 'benchmarks' && <ResearchBenchmarks />}

        {activeTab === 'qualification' && <ReleaseHardeningMatrix />}

        {activeTab === 'workbench' && (
          <WorkbenchCLI
            selectedProfile={selectedProfile}
            selectedHardware={selectedHardware}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            onNavigateTab={(tabId) => setActiveTab(tabId)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AIAssistant
            selectedHardware={selectedHardware}
            selectedProfile={selectedProfile}
          />
        )}
      </main>

      {/* User Sign-In / Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-semibold font-mono">KV-Memory (kvmem-qw3)</span>
            <span>•</span>
            <span className="font-mono">Release Candidate 40 (RC40) Hardening</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <span className="hidden md:inline">
              FlashInfer Prefill/Decode • Gated Delta Net (GDN) • NVMe Direct I/O
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('benchmarks')}
                className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Paper Specs</span>
              </button>
              <button
                onClick={() => setActiveTab('workbench')}
                className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>CLI & Kernels</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
