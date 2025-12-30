import React from 'react';
import { SavedInvestigation } from '../types';
import { Search, Clock, FileText, ChevronRight, BarChart3, Target, Plus, Briefcase, Calendar, Database } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface UserDashboardProps {
  user: { name: string; role: string };
  savedCases: SavedInvestigation[];
  activeSourcesCount?: number;
  onNewInvestigation: () => void;
  onLoadCase: (c: SavedInvestigation) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, savedCases, activeSourcesCount = 12, onNewInvestigation, onLoadCase }) => {
  const { t } = useLanguage();

  // Mock Stats
  const totalCases = savedCases.length;
  const highRiskCases = savedCases.filter(c => c.result.report.riskLevel === 'High' || c.result.report.riskLevel === 'Critical').length;
  const totalEntities = savedCases.reduce((acc, curr) => acc + curr.result.report.entities.length, 0);

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Investigator.</h1>
          <p className="text-slate-400">Here is the overview of your current intelligence activities.</p>
        </div>
        <button
          onClick={onNewInvestigation}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-sky-900/20 transition-all hover:scale-105"
        >
          <Plus size={20} />
          {t.search.button}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="bg-indigo-500/20 p-3 rounded-lg text-indigo-400">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Total Investigations</p>
            <p className="text-2xl font-bold text-white">{totalCases}</p>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="bg-red-500/20 p-3 rounded-lg text-red-400">
            <Target size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">High Risk Targets</p>
            <p className="text-2xl font-bold text-white">{highRiskCases}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="bg-emerald-500/20 p-3 rounded-lg text-emerald-400">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Entities Tracked</p>
            <p className="text-2xl font-bold text-white">{totalEntities}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="bg-sky-500/20 p-3 rounded-lg text-sky-400">
            <Database size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Active Intel Sources</p>
            <p className="text-2xl font-bold text-white">{activeSourcesCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Cases Section */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={20} className="text-slate-400" />
            Recent Investigations
          </h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            {savedCases.length} Archived
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {savedCases.length === 0 ? (
             <div className="p-12 text-center text-slate-500">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>No investigations found. Start a new one to build your case files.</p>
             </div>
          ) : (
            savedCases.sort((a,b) => b.lastUpdated - a.lastUpdated).map((c) => (
              <div 
                key={c.id} 
                className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group cursor-pointer"
                onClick={() => onLoadCase(c)}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full ${
                      c.result.report.riskLevel === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_red]' : 
                      c.result.report.riskLevel === 'High' ? 'bg-orange-500' : 'bg-emerald-500'
                  }`} />
                  <div>
                    <h3 className="text-white font-medium group-hover:text-sky-400 transition-colors">{c.result.report.target}</h3>
                    <p className="text-sm text-slate-400">"{c.query}"</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(c.timestamp).toLocaleDateString()}</span>
                      <span className="bg-slate-800 px-1.5 rounded border border-slate-700">{c.result.report.riskLevel} Risk</span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-600 group-hover:text-sky-400 transition-colors">
                  <ChevronRight size={20} />
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