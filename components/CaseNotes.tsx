import React, { useState } from 'react';
import { UserNote } from '../types';
import { Plus, Trash2, Clock, FileText } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface CaseNotesProps {
  notes: UserNote[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
}

const CaseNotes: React.FC<CaseNotesProps> = ({ notes, onAddNote, onDeleteNote }) => {
  const { t } = useLanguage();
  const [newNote, setNewNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote);
    setNewNote('');
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
          <FileText className="text-indigo-400 w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{t.notes.title}</h3>
          <p className="text-slate-400 text-sm">{t.notes.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            <p>{t.notes.empty}</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg group hover:border-slate-600 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} />
                  {new Date(note.timestamp).toLocaleString()}
                </div>
                <button 
                  onClick={() => onDeleteNote(note.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t.notes.placeholder}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
};

export default CaseNotes;