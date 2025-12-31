import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { CorruptionTypology } from '../types';
import { useLanguage } from '../languageContext';

interface TypologyRadarProps {
  typology: CorruptionTypology;
}

const TypologyRadar: React.FC<TypologyRadarProps> = ({ typology }) => {
  const { t } = useLanguage();

  if (!typology) return null;

  // Transform the typology object into array format for Recharts
  const data = [
    { subject: 'Nepotism', A: typology.nepotism, fullMark: 10 },
    { subject: 'Procurement', A: typology.procurementFraud, fullMark: 10 },
    { subject: 'Embezzlement', A: typology.embezzlement, fullMark: 10 },
    { subject: 'Shell Cos.', A: typology.shellCompanies, fullMark: 10 },
    { subject: 'Pol. Influence', A: typology.politicalInfluence, fullMark: 10 },
  ];

  // Helper to determine color based on max value
  const getDominantColor = () => {
    const maxVal = Math.max(
        typology.nepotism, 
        typology.procurementFraud, 
        typology.embezzlement, 
        typology.shellCompanies, 
        typology.politicalInfluence
    );
    if (maxVal >= 8) return '#ef4444'; // Red
    if (maxVal >= 5) return '#f97316'; // Orange
    return '#10b981'; // Green
  };

  const radarColor = getDominantColor();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative">
      <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-1 absolute top-0 left-0">Corruption Profile</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="55%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="A"
            stroke={radarColor}
            strokeWidth={2}
            fill={radarColor}
            fillOpacity={0.4}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0', borderRadius: '0.5rem' }}
             itemStyle={{ color: radarColor }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TypologyRadar;