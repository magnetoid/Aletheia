import React, { useState } from 'react';
import { Property } from '../types';
import { Building2, Plus, ExternalLink, MapPin, Search, Home, Briefcase, LandPlot, AlertCircle, X, Check } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface PropertyRegistryProps {
  properties: Property[];
  onAddProperty: (prop: Property) => void;
  onDeleteProperty: (index: number) => void;
}

const PropertyRegistry: React.FC<PropertyRegistryProps> = ({ properties, onAddProperty, onDeleteProperty }) => {
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [municipality, setMunicipality] = useState('');
  const [parcelNumber, setParcelNumber] = useState('');
  const [address, setAddress] = useState('');
  const [ownerRaw, setOwnerRaw] = useState('');
  const [type, setType] = useState<Property['type']>('land');
  const [area, setArea] = useState('');
  const [encumbrances, setEncumbrances] = useState('');
  const [notes, setNotes] = useState('');

  const KATASTAR_URL = "https://katastar.rgz.gov.rs/eKatastarPublic/publicaccess.aspx";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!municipality || !parcelNumber) return;

    onAddProperty({
      municipality,
      parcelNumber,
      address,
      ownerRaw,
      type,
      area,
      encumbrances,
      notes
    });

    // Reset
    setMunicipality('');
    setParcelNumber('');
    setAddress('');
    setOwnerRaw('');
    setType('land');
    setArea('');
    setEncumbrances('');
    setNotes('');
    setIsAdding(false);
  };

  const getIconByType = (type: Property['type']) => {
      switch(type) {
          case 'apartment': return <Home size={14} />;
          case 'house': return <Home size={14} />;
          case 'business': return <Briefcase size={14} />;
          case 'land': return <LandPlot size={14} />;
          default: return <MapPin size={14} />;
      }
  };

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Header / Actions */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div className="flex items-center gap-3">
                <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                    <Building2 className="text-orange-400 w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t.assets.title}</h3>
                    <p className="text-slate-400 text-sm">{t.assets.subtitle}</p>
                </div>
            </div>
            
            <div className="flex gap-2">
                <a 
                    href={KATASTAR_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600"
                >
                    <Search size={16} />
                    {t.assets.openKatastar}
                    <ExternalLink size={12} className="opacity-70" />
                </a>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isAdding 
                        ? 'bg-slate-800 text-white border border-slate-700' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
                    }`}
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                    {isAdding ? t.entities.cancel : t.assets.add}
                </button>
            </div>
        </div>
        
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-900/50 p-3 rounded border border-slate-800">
             <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
             <p>{t.assets.disclaimer}</p>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
          <form onSubmit={handleSubmit} className="bg-slate-900/80 p-6 rounded-xl border border-emerald-500/30 animate-fade-in-up">
            <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Plus size={12} /> {t.propertyRegistry.new}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">{t.assets.municipality}</label>
                    <input 
                        type="text" 
                        value={municipality}
                        onChange={e => setMunicipality(e.target.value)}
                        placeholder="e.g. KO Vračar"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">{t.assets.parcel}</label>
                    <input 
                        type="text" 
                        value={parcelNumber}
                        onChange={e => setParcelNumber(e.target.value)}
                        placeholder="e.g. 1234/1"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Address</label>
                    <input 
                        type="text" 
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">{t.assets.type}</label>
                    <select 
                        value={type}
                        onChange={e => setType(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        <option value="land">Land (Zemljište)</option>
                        <option value="apartment">Apartment (Stan)</option>
                        <option value="house">House (Kuća)</option>
                        <option value="business">Business (Poslovni prostor)</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Area (m2 / ha)</label>
                    <input 
                        type="text" 
                        value={area}
                        onChange={e => setArea(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">{t.assets.owner}</label>
                    <input 
                        type="text" 
                        value={ownerRaw}
                        onChange={e => setOwnerRaw(e.target.value)}
                        placeholder="e.g. Marko Marković 1/1"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">{t.assets.encumbrances}</label>
                    <input 
                        type="text" 
                        value={encumbrances}
                        onChange={e => setEncumbrances(e.target.value)}
                        placeholder="e.g. Hipoteka I reda"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-red-300 placeholder-red-900/50"
                    />
                </div>
                <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Notes</label>
                    <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    />
                </div>
            </div>
            <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
                {t.propertyRegistry.save}
            </button>
          </form>
      )}

      {/* Property Grid */}
      <div className="grid grid-cols-1 gap-4">
        {(!properties || properties.length === 0) ? (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
               <LandPlot size={48} className="mx-auto mb-4 opacity-20" />
               <p>{t.assets.noProperties}</p>
            </div>
        ) : (
            properties.map((prop, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 rounded-lg p-4 transition-all flex flex-col md:flex-row gap-4">
                    {/* Icon Column */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-800 rounded-lg min-w-[80px]">
                        <div className="text-slate-400 mb-2">{getIconByType(prop.type)}</div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">{prop.type}</span>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                        <div>
                             <p className="text-[10px] text-slate-500 uppercase font-bold">{t.assets.parcel}</p>
                             <p className="text-white font-mono text-lg">{prop.parcelNumber}</p>
                             <p className="text-xs text-slate-400">{prop.municipality}</p>
                        </div>
                        <div>
                             <p className="text-[10px] text-slate-500 uppercase font-bold">{t.assets.owner}</p>
                             <p className="text-slate-200 text-sm font-medium truncate">{prop.ownerRaw || "Unknown"}</p>
                             <p className="text-xs text-slate-400">{prop.address || "No address"}</p>
                        </div>
                        <div>
                             <p className="text-[10px] text-slate-500 uppercase font-bold">Area</p>
                             <p className="text-slate-200 text-sm">{prop.area || "N/A"}</p>
                        </div>
                         <div>
                             <p className="text-[10px] text-slate-500 uppercase font-bold">{t.assets.encumbrances}</p>
                             {prop.encumbrances ? (
                                 <span className="inline-flex items-center gap-1 text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded border border-red-900/30">
                                     <AlertCircle size={10} /> {prop.encumbrances}
                                 </span>
                             ) : (
                                 <span className="inline-flex items-center gap-1 text-xs text-emerald-400/70">
                                     <Check size={10} /> Clean
                                 </span>
                             )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center border-l border-slate-800 pl-4">
                        <button 
                            onClick={() => onDeleteProperty(idx)}
                            className="text-slate-600 hover:text-red-400 transition-colors p-2"
                            title="Remove Property"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default PropertyRegistry;