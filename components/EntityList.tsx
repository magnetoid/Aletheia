import React, { useState, useMemo, useEffect } from 'react';
import { Entity, Connection, EntityDocument, EntityType } from '../types';
import { AlertTriangle, User, Share2, Plus, Trash2, X, FileText, Calendar, Clock, Hash, ExternalLink, Building2, ShieldAlert, AlertOctagon, NotebookPen, Gavel, Link, Layers, ChevronDown, ChevronRight, Search, Landmark, Fingerprint, FileWarning, Flag, MapPin } from 'lucide-react';
import NetworkGraph from './NetworkGraph';
import { useLanguage } from '../languageContext';

interface EntityListProps {
  entities: Entity[];
  connections?: Connection[];
  onAddEntity?: (entity: Entity) => void;
  onDeleteEntity?: (name: string) => void;
  onUpdateEntity?: (entity: Entity) => void;
  onInvestigate?: (name: string) => void;
}

const EntityList: React.FC<EntityListProps> = React.memo(({ entities, connections = [], onAddEntity, onDeleteEntity, onUpdateEntity, onInvestigate }) => {
  const { t } = useLanguage();
  const [selectedEntityForGraph, setSelectedEntityForGraph] = useState<string | undefined>(undefined);
  const [showGraph, setShowGraph] = useState(false);
  const [viewingEntity, setViewingEntity] = useState<Entity | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Grouping State
  const [groupBy, setGroupBy] = useState<'none' | 'role' | 'suspicionLevel' | 'type'>('type');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // New Entity Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<EntityType>('person');
  const [newRole, setNewRole] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newInvestigatorNotes, setNewInvestigatorNotes] = useState('');
  const [newRelatedLaw, setNewRelatedLaw] = useState('');
  const [newLevel, setNewLevel] = useState<Entity['suspicionLevel']>('low');
  
  // New Entity Documents State
  const [newDocuments, setNewDocuments] = useState<EntityDocument[]>([]);
  const [tempDocTitle, setTempDocTitle] = useState('');
  const [tempDocUrl, setTempDocUrl] = useState('');
  const [tempDocType, setTempDocType] = useState<EntityDocument['type']>('other');

  const handleGraphClick = (e: React.MouseEvent, name?: string) => {
    e.stopPropagation();
    setSelectedEntityForGraph(name);
    setShowGraph(true);
    setViewingEntity(null);
  };

  const handleEntityClick = (entity: Entity) => {
    setViewingEntity(entity);
  };

  const handleAddDocument = () => {
    if (!tempDocTitle.trim()) return;
    const newDoc: EntityDocument = {
        title: tempDocTitle,
        url: tempDocUrl,
        type: tempDocType,
        date: new Date().toISOString().split('T')[0]
    };
    setNewDocuments([...newDocuments, newDoc]);
    setTempDocTitle('');
    setTempDocUrl('');
    setTempDocType('other');
  };

  const handleRemoveDocument = (index: number) => {
    setNewDocuments(newDocuments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onAddEntity) return;

    onAddEntity({
      name: newName,
      type: newType,
      role: newRole,
      notes: newNotes,
      investigatorNotes: newInvestigatorNotes,
      suspicionLevel: newLevel,
      relatedLaw: newRelatedLaw,
      documents: newDocuments,
      metadata: {
          foundingDate: new Date().toISOString().split('T')[0],
      }
    });

    // Reset form
    setNewName('');
    setNewType('person');
    setNewRole('');
    setNewNotes('');
    setNewInvestigatorNotes('');
    setNewLevel('low');
    setNewRelatedLaw('');
    setNewDocuments([]);
    setTempDocTitle('');
    setTempDocUrl('');
    setTempDocType('other');
    setIsAdding(false);
  };

  const handleUpdateNotes = (notes: string) => {
    if (viewingEntity && onUpdateEntity) {
        const updatedEntity = { ...viewingEntity, investigatorNotes: notes };
        setViewingEntity(updatedEntity);
        onUpdateEntity(updatedEntity);
    }
  };

  const handleUpdateRelatedLaw = (law: string) => {
    if (viewingEntity && onUpdateEntity) {
        const updatedEntity = { ...viewingEntity, relatedLaw: law };
        setViewingEntity(updatedEntity);
        onUpdateEntity(updatedEntity);
    }
  };

  const getRiskLabel = (level: string) => {
    return t.enums[level as keyof typeof t.enums] || level;
  };

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-950/40 text-red-400 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse';
      case 'high':
        return 'bg-orange-950/40 text-orange-400 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.1)]';
      case 'medium':
        return 'bg-yellow-950/30 text-yellow-400 border border-yellow-500/30';
      default:
        return 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/30';
    }
  };

  const getRiskIcon = (level: string, size: number = 14) => {
      switch (level) {
          case 'critical': return <AlertOctagon size={size} className="animate-bounce" />;
          case 'high': return <ShieldAlert size={size} />;
          case 'medium': return <AlertTriangle size={size} />;
          default: return <User size={size} />;
      }
  }

  const getEntityIcon = (type: EntityType | undefined, size: number = 16) => {
      switch(type) {
          case 'person': return <User size={size} />;
          case 'company': return <Building2 size={size} />;
          case 'organization': return <Landmark size={size} />;
          case 'event': return <Calendar size={size} />;
          case 'corruption_scheme': return <Fingerprint size={size} />;
          default: return <Share2 size={size} />;
      }
  };

  const getEntityIconBg = (type: EntityType | undefined) => {
      switch(type) {
          case 'company': return 'bg-indigo-900/30 text-indigo-400';
          case 'corruption_scheme': return 'bg-red-900/30 text-red-400';
          case 'event': return 'bg-amber-900/30 text-amber-400';
          case 'organization': return 'bg-sky-900/30 text-sky-400';
          default: return 'bg-slate-700 text-slate-300';
      }
  };

  // Grouping Logic
  const groupedEntities = useMemo(() => {
    if (groupBy === 'none') return null;

    return entities.reduce((acc, entity) => {
      const key = groupBy === 'role' ? (entity.role || 'Unspecified') 
                : groupBy === 'type' ? (entity.type || 'other')
                : entity.suspicionLevel;
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(entity);
      return acc;
    }, {} as Record<string, Entity[]>);
  }, [entities, groupBy]);

  useEffect(() => {
    if (groupedEntities) {
      const allExpanded = Object.keys(groupedEntities).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setExpandedGroups(allExpanded);
    }
  }, [groupedEntities]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderEntityCard = (entity: Entity, idx: number) => (
    <div 
      key={`${entity.name}-${idx}`} 
      className={`p-3 rounded-lg border transition-all group relative cursor-pointer ${
        entity.suspicionLevel === 'critical' ? 'bg-red-950/10 border-red-900/30 hover:bg-red-950/20' :
        entity.suspicionLevel === 'high' ? 'bg-slate-900/50 border-orange-900/20 hover:bg-slate-800/80' :
        'bg-slate-900/50 border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80'
      }`}
      onClick={() => handleEntityClick(entity)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full transition-colors ${getEntityIconBg(entity.type)}`}>
             {getEntityIcon(entity.type)}
          </div>
          <div>
            <h4 className={`font-medium text-sm transition-colors ${
                 entity.suspicionLevel === 'critical' ? 'text-red-200' :
                 entity.suspicionLevel === 'high' ? 'text-orange-200' :
                 'text-slate-200 group-hover:text-sky-400'
            }`}>{entity.name}</h4>
            <p className="text-slate-500 text-xs">{entity.role}</p>
          </div>
        </div>
        {entity.suspicionLevel === 'critical' || entity.suspicionLevel === 'high' ? (
           <AlertTriangle size={16} className={entity.suspicionLevel === 'critical' ? "text-red-500 animate-pulse" : "text-orange-500"} />
        ) : null}
      </div>
      <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-2">
        {entity.notes}
      </p>
      
      {entity.relatedLaw && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-300 bg-red-900/10 border border-red-900/30 px-2 py-1 rounded">
          <Gavel size={10} />
          <span className="truncate">{entity.relatedLaw}</span>
        </div>
      )}

      <div className="mt-2 flex justify-between items-center">
        <span 
          className="text-[10px] text-slate-600 cursor-pointer hover:text-sky-400 flex items-center gap-1" 
          onClick={(e) => handleGraphClick(e, entity.name)}
        >
          <Share2 size={10} />
          {t.entities.visualize}
        </span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${getRiskStyles(entity.suspicionLevel)}`}>
          {entity.suspicionLevel === 'critical' && <AlertOctagon size={10} />}
          {getRiskLabel(entity.suspicionLevel)} {t.entities.risk}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 h-full overflow-hidden flex flex-col relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-400 text-sm uppercase tracking-widest">{t.entities.title}</h3>
          
          <div className="flex gap-2">
             {/* Group By Control */}
             <div className="flex items-center gap-2 bg-slate-900/50 rounded px-2 border border-slate-700 h-[26px]">
                <Layers size={12} className="text-slate-500" />
                <select 
                    value={groupBy} 
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="bg-transparent text-[10px] font-medium text-slate-300 outline-none border-none py-0 w-16 cursor-pointer uppercase"
                >
                    <option value="none" className="bg-slate-800 text-slate-400">None</option>
                    <option value="type" className="bg-slate-800 text-slate-400">Type</option>
                    <option value="role" className="bg-slate-800 text-slate-400">Role</option>
                    <option value="suspicionLevel" className="bg-slate-800 text-slate-400">Risk</option>
                </select>
            </div>

            {onAddEntity && (
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                  isAdding 
                    ? 'bg-slate-700 text-white border-slate-600' 
                    : 'bg-emerald-900/20 text-emerald-400 border-emerald-800 hover:border-emerald-600'
                }`}
              >
                {isAdding ? <X size={12} /> : <Plus size={12} />}
                {isAdding ? t.entities.cancel : t.entities.add}
              </button>
            )}
            <button 
               onClick={(e) => handleGraphClick(e, undefined)}
               className="text-xs flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors bg-sky-900/20 px-2 py-1 rounded border border-sky-800 hover:border-sky-600"
            >
               <Share2 size={12} />
               {t.entities.graph}
            </button>
          </div>
        </div>
        
        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-4 bg-slate-900/80 p-3 rounded-lg border border-emerald-500/30 animate-fade-in max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder={t.entities.form.name}
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                autoFocus
              />
              <select 
                value={newType}
                onChange={e => setNewType(e.target.value as EntityType)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                  <option value="person">Person</option>
                  <option value="company">Company</option>
                  <option value="organization">Organization</option>
                  <option value="event">Event</option>
                  <option value="corruption_scheme">Corruption Scheme</option>
                  <option value="other">Other</option>
              </select>
              <input 
                type="text" 
                placeholder={t.entities.form.role}
                value={newRole} 
                onChange={e => setNewRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              />
              <select 
                value={newLevel} 
                onChange={e => setNewLevel(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                <option value="low">{t.enums.low} {t.entities.risk}</option>
                <option value="medium">{t.enums.medium} {t.entities.risk}</option>
                <option value="high">{t.enums.high} {t.entities.risk}</option>
                <option value="critical">{t.enums.critical} {t.entities.risk}</option>
              </select>
              <input 
                type="text" 
                placeholder="Related Law (e.g. Zakon o sprečavanju korupcije)"
                value={newRelatedLaw} 
                onChange={e => setNewRelatedLaw(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              />
              <textarea 
                placeholder={t.entities.form.notes} 
                value={newNotes} 
                onChange={e => setNewNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white resize-none"
                rows={2}
              />
              <textarea 
                placeholder="Investigator Notes..." 
                value={newInvestigatorNotes} 
                onChange={e => setNewInvestigatorNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white resize-none"
                rows={2}
              />

              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 rounded font-medium transition-colors mt-2"
              >
                {t.entities.save}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
          {groupedEntities ? (
             Object.entries(groupedEntities).map(([groupKey, groupEntities]: [string, Entity[]]) => (
                <div key={groupKey} className="mb-2">
                    <div 
                        onClick={() => toggleGroup(groupKey)}
                        className="flex items-center justify-between p-2 bg-slate-900/80 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors mb-2 sticky top-0 z-10"
                    >
                        <div className="flex items-center gap-2">
                            {expandedGroups[groupKey] ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                                {groupBy === 'type' ? groupKey.replace('_', ' ') : 
                                 groupBy === 'suspicionLevel' ? `${getRiskLabel(groupKey)} Risk` : groupKey}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700">{groupEntities.length}</span>
                        </div>
                    </div>
                    
                    {expandedGroups[groupKey] && (
                        <div className="space-y-3 pl-2 border-l-2 border-slate-800 ml-2.5 animate-fade-in-down">
                            {groupEntities.map((entity, idx) => renderEntityCard(entity, idx))}
                        </div>
                    )}
                </div>
             ))
          ) : (
             entities.map((entity, idx) => renderEntityCard(entity, idx))
          )}
        </div>
      </div>

      {/* Entity Details Modal */}
      {viewingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setViewingEntity(null)}>
            <div className={`bg-slate-900 border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh] ${
                viewingEntity.suspicionLevel === 'critical' ? 'border-red-900/50 shadow-red-900/20' :
                viewingEntity.suspicionLevel === 'high' ? 'border-orange-900/50 shadow-orange-900/20' :
                'border-slate-700'
            }`} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <div className={`p-1.5 rounded-md ${getEntityIconBg(viewingEntity.type)}`}>
                                {getEntityIcon(viewingEntity.type, 18)}
                             </div>
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {viewingEntity.type ? viewingEntity.type.replace('_', ' ') : 'Entity'}
                             </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">
                             {viewingEntity.name}
                        </h3>
                        <p className="text-slate-400 text-sm">{viewingEntity.role}</p>
                    </div>
                    <button onClick={() => setViewingEntity(null)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-full hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    
                    {/* Metadata Section - Adaptive based on type */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800 grid grid-cols-2 gap-3">
                         {/* Founding Date / DOB */}
                         {(viewingEntity.type === 'company' || viewingEntity.type === 'organization' || viewingEntity.type === 'person') && (
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                                    <Calendar size={10} /> 
                                    {viewingEntity.type === 'person' ? "Date of Birth / Public" : "Founded"}
                                </span>
                                <span className="text-sm text-slate-200 font-mono">
                                    {viewingEntity.metadata?.foundingDate || "N/A"}
                                </span>
                            </div>
                         )}

                         {/* Last Update */}
                         <div className="flex flex-col gap-1">
                             <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                                 <Clock size={10} /> {t.entities.modal.modified}
                             </span>
                             <span className="text-sm text-slate-200 font-mono">
                                 {viewingEntity.metadata?.lastRegistryUpdate || "Unknown"}
                             </span>
                         </div>

                         {/* Registration / ID */}
                         {(viewingEntity.type === 'company' || viewingEntity.type === 'organization') && (
                            <div className="flex flex-col gap-1 col-span-2 pt-2 border-t border-slate-700/50">
                                <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                                    <Hash size={10} /> {t.entities.modal.registryId}
                                </span>
                                <span className="text-sm text-white font-mono tracking-wider">
                                    {viewingEntity.metadata?.registrationNumber || "Not Listed"}
                                </span>
                            </div>
                         )}
                         
                         {/* Location for Events */}
                         {viewingEntity.type === 'event' && viewingEntity.metadata?.location && (
                             <div className="flex flex-col gap-1 col-span-2 pt-2 border-t border-slate-700/50">
                                <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                                    <MapPin size={10} /> Location
                                </span>
                                <span className="text-sm text-white">
                                    {viewingEntity.metadata.location}
                                </span>
                            </div>
                         )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.entities.modal.assessment}</label>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${getRiskStyles(viewingEntity.suspicionLevel)}`}>
                            {getRiskIcon(viewingEntity.suspicionLevel)}
                            {getRiskLabel(viewingEntity.suspicionLevel)} {t.entities.risk}
                        </span>
                    </div>

                    {/* Related Law Section (Dedicated & Editable) */}
                    <div className="bg-red-950/10 border border-red-900/20 rounded-lg p-3">
                         <label className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-2 flex items-center gap-2">
                             <Gavel size={14} />
                             Related Law (Zakon) / Violation
                         </label>
                         <div className="relative">
                             <input 
                                 type="text"
                                 className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-2.5 pl-3 text-slate-200 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none placeholder-slate-600 transition-all"
                                 placeholder="e.g. Krivični zakonik čl. 359 (Zloupotreba službenog položaja)"
                                 value={viewingEntity.relatedLaw || ''}
                                 onChange={(e) => handleUpdateRelatedLaw(e.target.value)}
                             />
                             {viewingEntity.relatedLaw && (
                                <div className="absolute right-3 top-2.5 text-red-500 animate-pulse">
                                    <AlertTriangle size={14} />
                                </div>
                             )}
                         </div>
                         <p className="text-[10px] text-slate-500 mt-1.5 ml-1">
                            Reference specific articles of Serbian Law (Zakon o javnim nabavkama, KZ, etc.)
                         </p>
                    </div>

                    <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.entities.modal.notes}</label>
                         <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {viewingEntity.notes || t.entities.modal.noNotes}
                         </div>
                    </div>
                    
                    {/* Investigator Notes (Editable) */}
                    <div>
                         <label className="text-xs font-bold text-sky-500 uppercase tracking-wider block mb-2 flex items-center gap-2">
                            <NotebookPen size={12}/> Investigator Notes (Editable)
                         </label>
                         <textarea 
                             className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none leading-relaxed"
                             rows={4}
                             placeholder="Add specific observations or intelligence notes for this entity..."
                             value={viewingEntity.investigatorNotes || ''}
                             onChange={(e) => handleUpdateNotes(e.target.value)}
                         />
                    </div>

                    {/* Documents & Links Section */}
                    {viewingEntity.documents && viewingEntity.documents.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.entities.modal.documents}</label>
                            <div className="space-y-2">
                                {viewingEntity.documents.map((doc, idx) => (
                                    <a 
                                        key={idx} 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-800 rounded-lg group transition-all"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="bg-slate-900 p-2 rounded text-slate-400 group-hover:text-sky-400 transition-colors">
                                                {doc.type === 'registry' ? <Building2 size={14}/> :
                                                 doc.type === 'news' ? <Share2 size={14}/> :
                                                 <FileText size={14}/>}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm text-slate-200 font-medium truncate">{doc.title}</span>
                                                <span className="text-[10px] text-slate-500 uppercase">{doc.type} {doc.date && `• ${doc.date}`}</span>
                                            </div>
                                        </div>
                                        {doc.url && <ExternalLink size={14} className="text-slate-500 group-hover:text-sky-400 flex-shrink-0" />}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-950/30">
                    <div className="flex gap-3">
                        {onInvestigate && (
                            <button
                                onClick={() => {
                                    onInvestigate(viewingEntity.name);
                                    setViewingEntity(null);
                                }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                            >
                                <Search size={16} />
                                Investigate Further
                            </button>
                        )}
                        <button 
                            onClick={(e) => handleGraphClick(e, viewingEntity.name)}
                            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20"
                        >
                            <Share2 size={16} />
                            {t.entities.modal.analyze}
                        </button>
                         {onDeleteEntity && (
                            <button 
                                onClick={() => {
                                    onDeleteEntity(viewingEntity.name);
                                    setViewingEntity(null);
                                }}
                                className="px-4 py-2 border border-red-900/50 text-red-400 hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                title="Remove Entity"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {showGraph && (
        <NetworkGraph 
          entities={entities} 
          connections={connections} 
          focusEntityName={selectedEntityForGraph}
          onClose={() => setShowGraph(false)}
        />
      )}
    </>
  );
});

export default EntityList;