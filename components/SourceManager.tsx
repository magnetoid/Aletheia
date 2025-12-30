import React, { useState } from 'react';
import { DataSource } from '../types';
import { Plus, Trash2, Database, X, Check, Globe, Pencil } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface SourceManagerProps {
  sources: DataSource[];
  setSources: (sources: DataSource[]) => void;
  onClose: () => void;
}

const SourceManager: React.FC<SourceManagerProps> = ({ sources, setSources, onClose }) => {
  const { t } = useLanguage();
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    // Basic URL cleanup
    let cleanUrl = newUrl.trim().toLowerCase();
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const newSource: DataSource = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      url: cleanUrl,
      active: true,
    };

    setSources([...sources, newSource]);
    setNewName('');
    setNewUrl('');
  };

  const toggleSource = (id: string) => {
    // Prevent toggling while editing that item to avoid confusion
    if (editingId === id) return;
    setSources(sources.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
    if (editingId === id) cancelEditing();
  };

  const startEditing = (source: DataSource) => {
    setEditingId(source.id);
    setEditName(source.name);
    setEditUrl(source.url);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditUrl('');
  };

  const saveEditing = () => {
    if (!editingId || !editName.trim() || !editUrl.trim()) return;

    let cleanUrl = editUrl.trim().toLowerCase();
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    setSources(sources.map(s => {
      if (s.id === editingId) {
        return { ...s, name: editName.trim(), url: cleanUrl };
      }
      return s;
    }));
    cancelEditing();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              <Database className="text-indigo-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.sources.title}</h2>
              <p className="text-slate-400 text-sm">{t.sources.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid gap-4 mb-8">
            {sources.map((source) => (
              <div 
                key={source.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  editingId === source.id ? 'bg-slate-800 border-sky-500/50' :
                  source.active 
                    ? 'bg-slate-800/50 border-slate-600' 
                    : 'bg-slate-900/30 border-slate-800 opacity-60'
                }`}
              >
                {editingId === source.id ? (
                  // Edit Mode
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 mr-4">
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                      placeholder={t.sources.placeholderName}
                      autoFocus
                    />
                    <input 
                      type="text" 
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                      placeholder={t.sources.placeholderUrl}
                    />
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center gap-4">
                     <div 
                        onClick={() => toggleSource(source.id)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                          source.active ? 'bg-sky-500 border-sky-600 text-white' : 'bg-transparent border-slate-600'
                        }`}
                     >
                       {source.active && <Check size={14} />}
                     </div>
                     <div>
                       <h4 className="text-white font-medium">{source.name}</h4>
                       <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                         <Globe size={10} />
                         {source.url}
                       </div>
                     </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingId === source.id ? (
                    <>
                      <button 
                        onClick={saveEditing}
                        className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                        title="Save Changes"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={cancelEditing}
                        className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => startEditing(source)}
                        className="p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                        title="Edit Source"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => removeSource(source.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Remove Source"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAdd} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">{t.sources.add}</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder={t.sources.placeholderName}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <input 
                type="text" 
                placeholder={t.sources.placeholderUrl}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <button 
                type="submit"
                disabled={!newName || !newUrl}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                {t.sources.btn}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SourceManager;