import React from 'react';
import { SavedInvestigation } from '../types';
import { X, Trash2, FileText, Calendar, ChevronRight, Clock } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface SavedCasesProps {
  cases: SavedInvestigation[];
  onLoad: (c: SavedInvestigation) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const SavedCases: React.FC<SavedCasesProps> = ({ cases, onLoad, onDelete, onClose }) => {
  const { t } = useLanguage();

  const getRiskLabel = (level: string) => {
    return t.enums[level.toLowerCase() as keyof typeof t.enums] || level;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <FileText className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.savedCases.title}</h2>
              <p className="text-slate-400 text-sm">{t.savedCases.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">{t.savedCases.empty}</p>
              <p className="text-sm">{t.savedCases.emptySub}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((savedCase) => (
                <div 
                  key={savedCase.id} 
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-sky-500/50 transition-all group flex items-center justify-between gap-4"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => onLoad(savedCase)}>
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
                         {savedCase.result.report.target}
                       </h3>
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          savedCase.result.report.riskLevel === 'Critical' ? 'bg-red-900/30 text-red-400' :
                          savedCase.result.report.riskLevel === 'High' ? 'bg-orange-900/30 text-orange-400' :
                          'bg-emerald-900/30 text-emerald-400'
                        }`}>
                          {getRiskLabel(savedCase.result.report.riskLevel)} {t.overview.risk}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(savedCase.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(savedCase.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs mt-2 line-clamp-1 italic">
                      {t.savedCases.query}: "{savedCase.query}"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                    <button 
                      onClick={() => onLoad(savedCase)}
                      className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                      title={t.actions.load}
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button 
                      onClick={() => onDelete(savedCase.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title={t.actions.delete}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedCases;