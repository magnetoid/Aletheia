import React, { useState } from 'react';
import { SavedInvestigation, Entity } from '../types';
import { User, Building2, Search, FileText, ChevronRight, Users } from 'lucide-react';

interface AggregatedPerson {
    name: string;
    data: Entity;
    appearances: SavedInvestigation[];
}

interface PeopleDatabaseProps {
  people: AggregatedPerson[];
  onLoadCase: (c: SavedInvestigation) => void;
}

const PeopleDatabase: React.FC<PeopleDatabaseProps> = React.memo(({ people, onLoadCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<AggregatedPerson | null>(null);

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.data.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in h-[calc(100vh-64px)] flex gap-6">
       {/* List / Grid */}
       <div className={`${selectedEntity ? 'w-1/3 hidden md:flex' : 'w-full'} flex-col bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden shadow-lg shadow-black/20 backdrop-blur-sm`}>
          <div className="p-4 border-b border-slate-700 bg-slate-800/30">
             <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="text-sky-400" /> People & Entities Database
             </h2>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search database..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
             {filteredPeople.length === 0 ? (
                 <div className="text-center text-slate-500 py-10">No entities found.</div>
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
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${p.data.metadata?.registrationNumber ? 'bg-indigo-900/30 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                            {p.data.metadata?.registrationNumber ? <Building2 size={16} /> : <User size={16} />}
                        </div>
                        <div>
                            <h4 className="text-white font-medium text-sm">{p.name}</h4>
                            <p className="text-slate-500 text-xs">{p.data.role}</p>
                        </div>
                    </div>
                    </div>
                ))
             )}
          </div>
       </div>

       {/* Detail View */}
       {selectedEntity && (
         <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-y-auto shadow-lg shadow-black/20 backdrop-blur-sm">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className={`p-4 rounded-full ${selectedEntity.data.metadata?.registrationNumber ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700/50 text-slate-300'}`}>
                      {selectedEntity.data.metadata?.registrationNumber ? <Building2 size={32} /> : <User size={32} />}
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-white">{selectedEntity.name}</h2>
                      <p className="text-sky-400 text-sm">{selectedEntity.data.role}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="md:hidden text-slate-400">Back</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Biography / Notes</h3>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedEntity.data.notes || "No specific notes available."}
                    </p>
                 </div>
                 
                 <div className="space-y-4">
                    {selectedEntity.data.metadata && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Metadata</h3>
                            <div className="space-y-2 text-sm">
                                {selectedEntity.data.metadata.registrationNumber && (
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Reg. Number</span>
                                        <span className="text-white font-mono">{selectedEntity.data.metadata.registrationNumber}</span>
                                    </div>
                                )}
                                {selectedEntity.data.metadata.foundingDate && (
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Founded/Born</span>
                                        <span className="text-white font-mono">{selectedEntity.data.metadata.foundingDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Linked Cases</h3>
                        <div className="space-y-2">
                           {selectedEntity.appearances.map((c, i) => (
                               <div 
                                 key={i} 
                                 onClick={() => onLoadCase(c)}
                                 className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer group transition-colors"
                                >
                                   <div className="flex items-center gap-2">
                                      <FileText size={14} className="text-slate-500" />
                                      <span className="text-sm text-sky-400">{c.result.report.target}</span>
                                   </div>
                                   <ChevronRight size={14} className="text-slate-600 group-hover:text-white"/>
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