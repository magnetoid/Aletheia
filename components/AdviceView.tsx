import React from 'react';
import { AnalysisReport } from '../types';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface AdviceViewProps {
  report: AnalysisReport;
}

const AdviceView: React.FC<AdviceViewProps> = ({ report }) => {
  const { t } = useLanguage();
  const { investigativeLeads } = report;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
         <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
               <Lightbulb className="text-indigo-400 w-6 h-6" />
            </div>
            <div>
               <h3 className="text-xl font-bold text-white">{t.advicesView.title}</h3>
               <p className="text-slate-400 text-sm">{t.advicesView.subtitle}</p>
            </div>
         </div>
      </div>

      {/* Investigative Leads */}
      {investigativeLeads && investigativeLeads.length > 0 ? (
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 mt-6">
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} /> Recommended Next Steps (Leads)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investigativeLeads.map((lead, idx) => (
                      <div key={idx} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex gap-3 items-start">
                          <span className="bg-indigo-500/20 text-indigo-400 font-mono text-xs px-2 py-0.5 rounded flex-shrink-0 mt-0.5">#{idx + 1}</span>
                          <p className="text-slate-300 text-sm">{lead}</p>
                      </div>
                  ))}
              </div>
          </div>
      ) : (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t.advicesView.noData}</p>
          </div>
      )}
    </div>
  );
};

export default AdviceView;