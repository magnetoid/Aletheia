import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../languageContext';

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

  let color = '#10b981'; // Green
  let glowClass = 'border-emerald-500/20'; // Default low risk border

  if (score > 80) {
    color = '#ef4444'; // Red
    glowClass = 'shadow-[0_0_20px_rgba(239,68,68,0.2)] border-red-500/40 bg-red-900/10';
  } else if (score > 60) {
    color = '#f97316'; // Orange
    glowClass = 'shadow-[0_0_15px_rgba(249,115,22,0.15)] border-orange-500/40 bg-orange-900/5';
  } else if (score > 30) {
    color = '#eab308'; // Yellow
    glowClass = 'border-yellow-500/30';
  }

  // Translate level if it matches enum keys, otherwise use raw
  const translatedLevel = t.enums[level.toLowerCase() as keyof typeof t.enums] || level;

  return (
    <div className={`relative h-64 w-full flex flex-col items-center justify-center rounded-xl border p-4 transition-all duration-500 ${glowClass} bg-slate-800/50`}>
      <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-2">{t.overview.riskScore}</h3>
      <div className="h-40 w-full relative">
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
              <Cell key="safe" fill="#334155" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
            <span className={`text-4xl font-bold font-mono transition-colors duration-300 ${score > 80 ? 'text-red-400 drop-shadow-md' : 'text-white'}`}>{score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-lg font-bold tracking-wider" style={{ color }}>{translatedLevel.toUpperCase()}</span>
      </div>
      
      {/* Decorative pulse for critical */}
      {score > 80 && (
         <div className="absolute inset-0 rounded-xl border border-red-500/20 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default RiskGauge;