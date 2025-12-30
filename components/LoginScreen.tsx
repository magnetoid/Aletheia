import React from 'react';
import { ShieldAlert, User, ShieldCheck, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: 'user' | 'admin') => void;
  onCancel: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fade-in">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <button 
        onClick={onCancel}
        className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-20"
      >
        <ArrowLeft size={20} />
        Back to Research
      </button>

      <div className="relative z-10 max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 mb-4 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <ShieldAlert className="text-sky-400 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-center">
            ALETHEIA <span className="text-sky-500">SRB</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-center">Anticorruption Intelligence Platform</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onLogin('user')}
            className="w-full group relative flex items-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500/50 rounded-xl transition-all duration-300"
          >
            <div className="bg-indigo-500/20 p-3 rounded-full mr-4 group-hover:bg-indigo-500/30 transition-colors">
              <User className="text-indigo-400 w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">Investigator Login</h3>
              <p className="text-slate-500 text-xs">Access cases, forensics & network tools</p>
            </div>
            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-sky-400">
              →
            </div>
          </button>

          <button
            onClick={() => onLogin('admin')}
            className="w-full group relative flex items-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-xl transition-all duration-300"
          >
            <div className="bg-emerald-500/20 p-3 rounded-full mr-4 group-hover:bg-emerald-500/30 transition-colors">
              <ShieldCheck className="text-emerald-400 w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">System Administrator</h3>
              <p className="text-slate-500 text-xs">Manage users, sources & system audits</p>
            </div>
            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">
              →
            </div>
          </button>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest">
          Restricted Access • Official Use Only
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;