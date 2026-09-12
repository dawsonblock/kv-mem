'use client';

import React, { useState } from 'react';
import { 
  Star, 
  Trash2, 
  ExternalLink, 
  Filter, 
  Search, 
  Download, 
  CloudCheck, 
  CloudOff, 
  Sparkles,
  Layers,
  BarChart3,
  ShieldCheck,
  Terminal,
  Bookmark,
  Check
} from 'lucide-react';
import { useFavorites } from '@/lib/favorites-context';
import { useAuth } from '@/lib/auth-context';
import { FavoriteItem } from '@/lib/favorites';

interface FavoritesViewProps {
  onNavigateTab: (tabId: string) => void;
  onOpenAuth: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onNavigateTab,
  onOpenAuth,
}) => {
  const { favorites, removeFavorite, count } = useFavorites();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exported, setExported] = useState<boolean>(false);

  const filterTypes = [
    { id: 'ALL', label: 'All Favorites' },
    { id: 'subsystem', label: 'Subsystems' },
    { id: 'benchmark', label: 'Benchmarks' },
    { id: 'rc_gate', label: 'RC Hardening Gates' },
    { id: 'profile', label: 'Runtime Profiles' },
    { id: 'code_snippet', label: 'Code & Kernels' },
  ];

  const filteredFavorites = favorites.filter((fav) => {
    const matchesType = selectedType === 'ALL' || fav.itemType === selectedType;
    const matchesSearch = 
      fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleExport = () => {
    const dataStr = JSON.stringify(favorites, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kvmem_favorites_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subsystem':
        return <Layers className="w-3.5 h-3.5 text-blue-400" />;
      case 'benchmark':
        return <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'rc_gate':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'code_snippet':
      case 'profile':
        return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Bookmark className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getDestinationTab = (type: string) => {
    switch (type) {
      case 'subsystem':
        return 'architecture';
      case 'benchmark':
        return 'benchmarks';
      case 'rc_gate':
        return 'qualification';
      case 'code_snippet':
      case 'profile':
        return 'workbench';
      default:
        return 'architecture';
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Curated Research Collection
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-300">{count} Item{count === 1 ? '' : 's'} Bookmarked</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Favorited Subsystems & Hardening Artifacts
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Quickly reference your pinned memory tiers, associative retrieval kernels, empirical benchmark comparisons, 
            and verified RC40 release qualification gates.
          </p>
        </div>

        {/* Sync & Auth Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {user ? (
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-800/60 text-xs font-mono flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Synced ({user.email?.split('@')[0]})</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-amber-700/60 text-xs font-mono flex items-center gap-2 text-amber-300 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Local Storage (Sign in to sync cloud)</span>
            </button>
          )}

          {count > 0 && (
            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {exported ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{exported ? 'Exported' : 'Export JSON'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {filterTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                selectedType === t.id
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredFavorites.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
            <Star className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No favorited items found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery || selectedType !== 'ALL'
                ? 'No items match your active filters. Try clearing search or resetting category filters.'
                : 'Click the star icon anywhere across Architecture, Benchmarks, RC Hardening Gates, or Workbench to bookmark items here.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onNavigateTab('architecture')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-blue-300 font-medium cursor-pointer"
            >
              Explore Architecture
            </button>
            <button
              onClick={() => onNavigateTab('benchmarks')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-emerald-300 font-medium cursor-pointer"
            >
              Explore Benchmarks
            </button>
            <button
              onClick={() => onNavigateTab('qualification')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-purple-300 font-medium cursor-pointer"
            >
              Explore RC Gates
            </button>
          </div>
        </div>
      )}

      {/* Favorites Grid */}
      {filteredFavorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.map((fav) => {
            const destTab = getDestinationTab(fav.itemType);
            return (
              <div
                key={fav.itemId}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getTypeIcon(fav.itemType)}
                      <span className="text-[11px] font-mono text-slate-400 uppercase">
                        {fav.category}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFavorite(fav.itemId)}
                      title="Remove from favorites"
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                    {fav.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {fav.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {fav.itemId}
                  </span>

                  <button
                    onClick={() => onNavigateTab(destTab)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View in {destTab}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
