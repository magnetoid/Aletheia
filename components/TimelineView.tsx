import React, { useState } from 'react';
import { TimelineEvent } from '../types';
import TimelineChart from './TimelineChart';
import { Plus, X, Trash2, Calendar, Gavel, AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface TimelineViewProps {
  events: TimelineEvent[];
  onAddEvent: (event: TimelineEvent) => void;
  onDeleteEvent: (index: number) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ events, onAddEvent, onDeleteEvent }) => {
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TimelineEvent['type']>('other');
  const [impactLevel, setImpactLevel] = useState<number>(5);
  const [relatedLaw, setRelatedLaw] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title) return;

    onAddEvent({
      date,
      title,
      description,
      type,
      impactLevel,
      relatedLaw: relatedLaw.trim() || undefined
    });

    // Reset
    setDate('');
    setTitle('');
    setDescription('');
    setType('other');
    setImpactLevel(5);
    setRelatedLaw('');
    setIsAdding(false);
  };

  const getImpactColor = (level: number) => {
      if (level >= 8) return 'bg-red-500';
      if (level >= 5) return 'bg-orange-500';
      return 'bg-emerald-500';
  };

  const getTypeLabel = (type: string) => {
      // Simple mapping or translation lookups could go here
      return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <TimelineChart events={events} />

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                <Clock className="text-indigo-400 w-5 h-5" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-white">{t.timeline.title}</h3>
                <p className="text-slate-400 text-sm">Chronological record of events</p>
             </div>
          </div>
          
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isAdding 
                ? 'bg-slate-700 text-white hover:bg-slate-600' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
            }`}
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? t.entities.cancel : "Add Event"}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 bg-slate-900/80 p-4 rounded-xl border border-emerald-500/30 animate-fade-in-up">
            <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Plus size={12} /> New Timeline Entry
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Date (YYYY-MM-DD)</label>
                    <input 
                        type="date" 
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Event Title</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Contract Signed"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Type</label>
                    <select 
                        value={type}
                        onChange={e => setType(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        <option value="transaction">Transaction</option>
                        <option value="meeting">Meeting</option>
                        <option value="legislation">Legislation</option>
                        <option value="legal_action">Legal Action</option>
                        <option value="news">News</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Impact (1-10): {impactLevel}</label>
                    <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={impactLevel}
                        onChange={e => setImpactLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
                <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Related Law (Optional)</label>
                    <div className="flex items-center gap-2">
                         <div className="bg-slate-800 p-2.5 rounded-l border-y border-l border-slate-700 text-slate-400">
                             <Gavel size={14} />
                         </div>
                         <input 
                            type="text" 
                            value={relatedLaw}
                            onChange={e => setRelatedLaw(e.target.value)}
                            placeholder="e.g. Zakon o javnim nabavkama čl. 12"
                            className="w-full bg-slate-800 border border-slate-700 rounded-r px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Description</label>
                    <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Details about the event..."
                        rows={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    />
                </div>
            </div>
            <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
                Save Timeline Event
            </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {events.length === 0 ? (
                 <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                    <p>No events recorded.</p>
                 </div>
            ) : (
                events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, i) => (
                    <div key={i} className={`bg-slate-900/50 border p-4 rounded-lg flex gap-4 group transition-all hover:border-slate-600 ${event.relatedLaw ? 'border-red-900/30 bg-red-900/5' : 'border-slate-800'}`}>
                        <div className="flex flex-col items-center min-w-[60px] pt-1 gap-2">
                            <span className="text-slate-400 font-mono text-xs text-center leading-tight">
                                {event.date}
                            </span>
                            <div className={`w-1.5 h-1.5 rounded-full ${getImpactColor(event.impactLevel)}`} title={`Impact: ${event.impactLevel}/10`}></div>
                        </div>
                        
                        <div className="flex-1 border-l border-slate-800 pl-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-white font-bold text-sm">{event.title}</h4>
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 uppercase">
                                            {getTypeLabel(event.type)}
                                        </span>
                                    </div>
                                    {event.relatedLaw && (
                                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-950/30 text-red-300 border border-red-900/30 px-2 py-0.5 rounded mb-2">
                                            <Gavel size={10} />
                                            VIOLATION: {event.relatedLaw}
                                        </span>
                                    )}
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        {event.description}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => onDeleteEvent(i)}
                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Delete Event"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;