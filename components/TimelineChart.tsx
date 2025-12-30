import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { TimelineEvent } from '../types';
import { Gavel } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface TimelineChartProps {
  events: TimelineEvent[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ events }) => {
  const { t } = useLanguage();
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimelineEvent;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl max-w-xs z-50">
          <p className="text-slate-300 text-xs mb-1">{data.date}</p>
          <p className="text-white font-bold text-sm mb-1">{data.title}</p>
          <p className="text-slate-400 text-xs mb-2">{data.description}</p>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
             <span className="text-sky-400 text-[10px] uppercase font-mono">{data.type}</span>
             {data.relatedLaw && (
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                    <Gavel size={10} />
                    {data.relatedLaw.substring(0, 15)}...
                </div>
             )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full bg-slate-800/50 rounded-xl border border-slate-700 p-4 mt-6">
       <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-400 text-sm uppercase tracking-widest">{t.timeline.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {t.timeline.critical}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {t.timeline.standard}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t.timeline.transaction}</span>
          </div>
       </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedEvents} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tick={{fontSize: 10}} 
            tickFormatter={(value) => value.substring(0, 4)} // Just show year/month roughly
          />
          <YAxis stroke="#94a3b8" hide />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.4}} />
          <Bar dataKey="impactLevel" radius={[4, 4, 0, 0]}>
            {sortedEvents.map((entry, index) => {
                let color = '#3b82f6'; // Blue
                if (entry.type === 'transaction') color = '#10b981'; // Green
                if (entry.type === 'meeting') color = '#f59e0b'; // Amber
                if (entry.type === 'legal_action') color = '#a855f7'; // Purple
                if (entry.impactLevel > 8) color = '#ef4444'; // Red
                return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineChart;