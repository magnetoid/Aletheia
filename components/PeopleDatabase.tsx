import React, { useState } from 'react';
import { SavedInvestigation, Entity } from '../types';
import { User, Building2, Search, FileText, ChevronRight, Users, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface AggregatedPerson {
    name: string;
    data: Entity;
    appearances: SavedInvestigation[];
}

interface PeopleDatabaseProps {
  people: AggregatedPerson[];
  onLoadCase: (c: SavedInvestigation) => void;
  onAnalyze: (name: string) => void;
}

const PeopleDatabase: React.FC<PeopleDatabaseProps> = React.memo(({ people, onLoadCase, onAnalyze }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<AggregatedPerson | null>(null);

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.data.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 animate-fade-in h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] flex gap-6 relative">
       {/* List / Grid */}
       <div className={`${selectedEntity ? 'hidden md:flex md:w-1/3' : 'w-full'} flex-col bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden shadow-lg shadow-black/20 backdrop-blur-sm h-full`}>
          <div className="p-4 border-b border-slate-700 bg-slate-800/30">
             <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="text-sky-400" /> {t.peopleDb.title}
             </h2>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder={t.peopleDb.search}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
             {filteredPeople.length === 0 ? (
                 <div className="text-center text-slate-500 py-10">{t.peopleDb.noResults}</div>
             ) : (
                filteredPeople.map((p, idx) => (
                    <div 
                    key={idx}
                    onClick={() => setSelectedEntity(p)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEntity?.name === p.name 
                        ? 'bg-sky-900/20 border-sky-500' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                    >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-full flex-shrink-0 ${p.data.metadata?.registrationNumber ? 'bg-indigo-900/30 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                            {p.data.metadata?.registrationNumber ? <Building2 size={16} /> : <User size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-white font-medium text-sm truncate">{p.name}</h4>
                            <p className="text-slate-500 text-xs truncate">{p.data.role}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-600 md:hidden" />
                    </div>
                    </div>
                ))
             )}
          </div>
       </div>

       {/* Detail View */}
       {selectedEntity && (
         <div className="w-full md:flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 overflow-y-auto shadow-lg shadow-black/20 backdrop-blur-sm custom-scrollbar h-full absolute md:relative inset-0 md:inset-auto z-20 md:z-auto">
             <div className="flex justify-between items-start mb-6 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                   <button 
                     onClick={() => setSelectedEntity(null)} 
                     className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                   >
                     <ArrowLeft size={20} />
                   </button>
                   <div className={`p-3 sm:p-4 rounded-full flex-shrink-0 ${selectedEntity.data.metadata?.registrationNumber ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700/50 text-slate-300'}`}>
                      {selectedEntity.data.metadata?.registrationNumber ? <Building2 size={24} className="sm:w-8 sm:h-8" /> : <User size={24} className="sm:w-8 sm:h-8" />}
                   </div>
                   <div className="min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-white break-words leading-tight">{selectedEntity.name}</h2>
                      <p className="text-sky-400 text-xs sm:text-sm break-words">{selectedEntity.data.role}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="hidden md:block text-slate-400 hover:text-white">
                  <span className="sr-only">Close</span>
                </button>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                 <div className="space-y-4">
                     <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.peopleDb.bio}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {selectedEntity.data.notes || "No specific notes available."}
                        </p>
                     </div>
                     
                     <div className="bg-gradient-to-r from-indigo-900/20 to-sky-900/20 border border-indigo-500/30 p-4 rounded-lg flex flex-col items-start gap-3">
                        <div>
                             <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-1">
                                 <Sparkles size={16} /> AI Deep Dive
                             </h3>
                             <p className="text-xs text-indigo-200">
                                 Generate a dedicated forensic investigation for {selectedEntity.name}.
                             </p>
                        </div>
                        <button 
                             onClick={() => onAnalyze(selectedEntity.name)}
                             className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                        >
                             {t.peopleDb.runAnalysis} <ArrowRight size={16} />
                        </button>
                     </div>
                 </div>
                 
                 <div className="space-y-4">
                    {selectedEntity.data.metadata && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.peopleDb.metadata}</h3>
                            <div className="space-y-2 text-sm">
                                {selectedEntity.data.metadata.registrationNumber && (
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">{t.peopleDb.reg}</span>
                                        <span className="text-white font-mono break-all">{selectedEntity.data.metadata.registrationNumber}</span>
                                    </div>
                                )}
                                {selectedEntity.data.metadata.foundingDate && (
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">{t.peopleDb.born}</span>
                                        <span className="text-white font-mono">{selectedEntity.data.metadata.foundingDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.peopleDb.linked}</h3>
                        <div className="space-y-2">
                           {selectedEntity.appearances.map((c, i) => (
                               <div 
                                 key={i} 
                                 onClick={() => onLoadCase(c)}
                                 className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer group transition-colors"
                                >
                                   <div className="flex items-center gap-2 min-w-0">
                                      <FileText size={14} className="text-slate-500 flex-shrink-0" />
                                      <span className="text-sm text-sky-400 truncate">{c.result.report.target}</span>
                                   </div>
                                   <ChevronRight size={14} className="text-slate-600 group-hover:text-white flex-shrink-0"/>
                               </div>
                           ))}
                        </div>
                    </div>
                 </div>
             </div>
         </div>
       )}
    </div>
  );
});

export default PeopleDatabase;