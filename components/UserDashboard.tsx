import React, { useState } from 'react';
import { SavedInvestigation } from '../types';
import { Search, Clock, FileText, ChevronRight, Calendar } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface UserDashboardProps {
  user: { name: string; role: string };
  savedCases: SavedInvestigation[];
  activeSourcesCount?: number;
  onSearch: (query: string) => void;
  onLoadCase: (c: SavedInvestigation) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, savedCases, onSearch, onLoadCase }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSearch(input.trim());
  };

  const getRiskLabel = (level: string) => {
    return t.enums[level.toLowerCase() as keyof typeof t.enums] || level;
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in pb-20">
      {/* Search Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[75vh] relative">
         {/* Background Decoration */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

         <div className="relative z-10 w-full max-w-3xl text-center space-y-8">
            <div className="space-y-4">
                <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight">
                  Aletheia <span className="text-sky-500">{t.userDashboard.titleSuffix}</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {t.userDashboard.subtitle}
                </p>
            </div>

            <form onSubmit={handleSearch} className="w-full relative max-w-2xl mx-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="text-slate-500 w-6 h-6 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.search.placeholder}
                        className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-700 hover:border-slate-600 focus:border-sky-500 rounded-2xl pl-16 pr-32 py-6 text-lg text-white placeholder-slate-600 shadow-2xl focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="absolute right-3 top-3 bottom-3 bg-sky-600 hover:bg-sky-500 text-white px-6 rounded-xl font-bold shadow-lg shadow-sky-900/20 transition-all hover:scale-105 active:scale-95 text-sm sm:text-base"
                    >
                        {t.search.button}
                    </button>
                </div>
            </form>
         </div>
      </div>

      {/* Recent Investigations List */}
      <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-slate-500 text-xs sm:text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                  <Clock size={16} /> {t.userDashboard.recent}
              </span>
              <div className="h-px bg-slate-800 flex-1"></div>
          </div>
          
          <div className="space-y-3">
            {savedCases.length === 0 ? (
               <div className="p-8 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                  <p>{t.userDashboard.empty}</p>
               </div>
            ) : (
              savedCases.sort((a,b) => b.lastUpdated - a.lastUpdated).map((c) => (
                <div 
                  key={c.id} 
                  className="bg-slate-900/40 border border-slate-800 hover:border-sky-500/30 p-4 rounded-xl transition-all group cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-800/60"
                  onClick={() => onLoadCase(c)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                        c.result.report.riskLevel === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_red]' : 
                        c.result.report.riskLevel === 'High' ? 'bg-orange-500' : 'bg-emerald-500'
                    }`} />
                    <div>
                      <h3 className="text-base font-bold text-slate-200 group-hover:text-sky-400 transition-colors">{c.result.report.target}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 max-w-md truncate">"{c.query}"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <span className="text-xs text-slate-600 flex items-center gap-1.5"><Calendar size={12} /> {new Date(c.timestamp).toLocaleDateString()}</span>
                     <ChevronRight size={18} className="text-slate-700 group-hover:text-sky-500 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
};

export default UserDashboard;