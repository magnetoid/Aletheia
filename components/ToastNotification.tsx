import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-emerald-400" />,
    error: <AlertCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-sky-400" />
  };

  const bgColors = {
    success: 'bg-slate-900 border-emerald-500/30 shadow-emerald-900/10',
    error: 'bg-slate-900 border-red-500/30 shadow-red-900/10',
    info: 'bg-slate-900 border-sky-500/30 shadow-sky-900/10'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md animate-fade-in-up ${bgColors[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium text-white">{message}</p>
      <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors ml-2 p-1">
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastNotification;