import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../languageContext';
import { AlertOctagon, Flame } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
  level: string;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level }) => {
  const { t } = useLanguage();
  const data = [
    { name: t.overview.risk, value: score },
    { name: t.overview.safety, value: 100 - score },
  ];

  let color = '#10b981'; // Green (default)
  let glowClass = 'border-emerald-500/20 bg-emerald-900/5'; // Default low risk border

  if (score > 85) {
    // Critical
    color = '#ef4444'; // Red-500
    glowClass = 'shadow-[0_0_30px_rgba(239,68,68,0.3)] border-red-500/60 bg-red-950/20';
  } else if (score > 60) {
    // High
    color = '#f97316'; // Orange-500
    glowClass = 'shadow-[0_0_15px_rgba(249,115,22,0.15)] border-orange-500/40 bg-orange-900/5';
  } else if (score > 30) {
    // Medium
    color = '#eab308'; // Yellow-500
    glowClass = 'border-yellow-500/30 bg-yellow-900/5';
  }

  // Translate level if it matches enum keys, otherwise use raw
  const translatedLevel = t.enums[level.toLowerCase() as keyof typeof t.enums] || level;

  return (
    <div className={`relative h-64 w-full flex flex-col items-center justify-center rounded-xl border p-4 transition-all duration-500 ${glowClass}`}>
      <div className="absolute top-4 left-4 flex items-center gap-2">
         {score > 85 && <Flame size={16} className="text-red-500 animate-pulse" />}
         <h3 className="text-slate-400 text-sm uppercase tracking-widest">{t.overview.riskScore}</h3>
      </div>
      
      <div className="h-40 w-full relative mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              <Cell key="risk" fill={color} />
              <Cell key="safe" fill="#1e293b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
            <span className={`text-4xl font-bold font-mono transition-colors duration-300 ${score > 85 ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-white'}`}>{score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      <div className="mt-2 text-center flex items-center gap-2">
         {score > 85 && <AlertOctagon size={20} className="text-red-500 animate-pulse" />}
         <span className="text-xl font-bold tracking-wider uppercase drop-shadow-md" style={{ color }}>{translatedLevel}</span>
      </div>
      
      {/* Decorative pulse for critical */}
      {score > 85 && (
         <div className="absolute inset-0 rounded-xl border-2 border-red-500/30 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default RiskGauge;