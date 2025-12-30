import React from 'react';
import { SavedInvestigation, TimelineEvent } from '../types';
import { Clock, Calendar } from 'lucide-react';

interface GlobalTimelineProps {
  events: (TimelineEvent & { caseRef: SavedInvestigation })[];
  onLoadCase: (c: SavedInvestigation) => void;
}

const GlobalTimeline: React.FC<GlobalTimelineProps> = React.memo(({ events, onLoadCase }) => {
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 shadow-lg shadow-orange-900/10">
                <Clock className="text-orange-400 w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-white">Global Event Timeline</h1>
                <p className="text-slate-400">Master chronological record across all investigations</p>
            </div>
        </div>

        <div className="relative border-l-2 border-slate-800 ml-4 space-y-8">
            {events.length === 0 ? (
                 <div className="pl-8 text-slate-500 italic">No timeline events recorded in saved cases.</div>
            ) : (
                events.map((event, idx) => (
                    <div key={idx} className="relative pl-8 group">
                        {/* Dot */}
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-orange-500 group-hover:bg-orange-500 transition-colors shadow-[0_0_10px_rgba(249,115,22,0.3)]"></div>
                        
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-orange-500/30 transition-all hover:bg-slate-800 shadow-md shadow-black/10 backdrop-blur-sm max-w-4xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                <span className="text-orange-400 font-mono text-sm font-bold flex items-center gap-2">
                                    <Calendar size={14} /> {event.date}
                                </span>
                                <span 
                                    onClick={() => onLoadCase(event.caseRef)}
                                    className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-800 cursor-pointer hover:text-white hover:border-slate-600 transition-colors"
                                >
                                    Case: {event.caseRef.result.report.target}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">{event.description}</p>
                            {event.relatedLaw && (
                                <div className="mt-3 text-xs bg-red-900/20 text-red-300 border border-red-900/30 px-3 py-1.5 rounded inline-block">
                                    VIOLATION: {event.relatedLaw}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
});

export default GlobalTimeline;