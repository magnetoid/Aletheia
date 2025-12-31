import React, { useState } from 'react';
import { Activity, Users, Database, Server, ShieldCheck, Settings, Download, Globe } from 'lucide-react';
import { DataSource } from '../types';
import SourceManager from './SourceManager';
import { useLanguage } from '../languageContext';

interface AdminDashboardProps {
  sources: DataSource[];
  setSources: (sources: DataSource[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ sources, setSources }) => {
  const { t } = useLanguage();
  const [showSourceManager, setShowSourceManager] = useState(false);

  // Mock Data for Admin View
  const systemUsers = [
    { id: 1, name: 'Marko Petrović', role: 'Investigator', status: 'Active', lastActive: '2 mins ago' },
    { id: 2, name: 'Jelena Jovanović', role: 'Investigator', status: 'Active', lastActive: '15 mins ago' },
    { id: 3, name: 'Nikola Stojanović', role: 'Analyst', status: 'Offline', lastActive: '2 days ago' },
    { id: 4, name: 'Ana Nikolić', role: 'Admin', status: 'Active', lastActive: 'Just now' },
  ];

  const logs = [
    { id: 1, type: 'search', user: 'Marko P.', detail: 'Query: "EPS Tender 2023"', time: '10:42 AM' },
    { id: 2, type: 'export', user: 'Jelena J.', detail: 'Exported Case #8821 PDF', time: '10:30 AM' },
    { id: 3, type: 'alert', user: 'System', detail: 'High latency on APR API', time: '09:15 AM' },
    { id: 4, type: 'login', user: 'Nikola S.', detail: 'Failed login attempt', time: 'Yesterday' },
  ];

  const activeSourcesCount = sources.filter(s => s.active).length;

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t.admin.title}</h1>
          <p className="text-slate-400 text-sm">{t.admin.subtitle}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors">
                <Download size={16} /> <span className="hidden sm:inline">{t.admin.audit}</span>
            </button>
            <button className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <Settings size={16} /> {t.admin.config}
            </button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl shadow-md shadow-black/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">{t.admin.status}</span>
            <Activity className="text-emerald-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{t.admin.operational}</p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 w-full h-full"></div>
          </div>
        </div>

        {/* Data Sources Management Card */}
        <div 
            onClick={() => setShowSourceManager(true)}
            className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl cursor-pointer hover:border-sky-500/50 hover:bg-slate-800 transition-all group shadow-md shadow-black/10"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sky-200 text-xs uppercase font-bold">{t.admin.intelligence}</span>
            <Database className="text-sky-400 group-hover:text-sky-300 transition-colors" size={18} />
          </div>
          <div className="flex items-end gap-2 mb-1">
             <p className="text-2xl font-bold text-white">{activeSourcesCount}</p>
             <span className="text-sm text-slate-400 mb-1">{t.admin.activeSources}</span>
          </div>
          <p className="text-xs text-sky-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t.admin.manage} <Settings size={10} />
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl shadow-md shadow-black/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">{t.admin.quota}</span>
            <Server className="text-orange-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white mb-1">84%</p>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
             <div className="bg-orange-500 w-[84%] h-full"></div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl shadow-md shadow-black/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">{t.admin.threats}</span>
            <ShieldCheck className="text-red-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-white mb-1">1,204</p>
          <p className="text-xs text-slate-500">+12% this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-slate-400"/> {t.admin.users}
            </h3>
            <button className="text-xs text-sky-400 hover:text-sky-300">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
              <thead className="bg-slate-950/50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">{t.admin.role}</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">{t.admin.lastActive}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {systemUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.status === 'Active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
           <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Globe size={18} className="text-slate-400"/> {t.admin.activity}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {logs.map(log => (
              <div key={log.id} className="flex gap-3 items-start">
                 <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                   log.type === 'alert' ? 'bg-red-500 animate-pulse' : 
                   log.type === 'login' ? 'bg-orange-500' : 'bg-sky-500'
                 }`} />
                 <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 break-words">
                      <span className="font-bold text-slate-400">{log.user}:</span> {log.detail}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{log.time}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSourceManager && (
        <SourceManager 
            sources={sources} 
            setSources={setSources} 
            onClose={() => setShowSourceManager(false)} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;