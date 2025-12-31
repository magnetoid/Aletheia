import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { generateLegalDocument } from '../services/geminiService';
import { useLanguage } from '../languageContext';
import { FileText, Download, Copy, Gavel, Scale, Shield, Loader2, Printer, Check } from 'lucide-react';

interface LegalToolsProps {
  result: AnalysisResult;
}

const LegalTools: React.FC<LegalToolsProps> = ({ result }) => {
  const { t, language } = useLanguage();
  const [activeDoc, setActiveDoc] = useState<'foi' | 'complaint' | 'preservation' | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (type: 'foi' | 'complaint' | 'preservation') => {
    setActiveDoc(type);
    setIsLoading(true);
    setGeneratedContent('');
    
    try {
        const content = await generateLegalDocument(result.report, type, language);
        setGeneratedContent(content);
    } catch (e) {
        setGeneratedContent("Error generating document. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${activeDoc}_${result.report.target.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 animate-fade-in">
        {/* Sidebar Controls */}
        <div className="w-full lg:w-1/3 space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        <Scale className="text-rose-400 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{t.legalTools.title}</h3>
                        <p className="text-slate-400 text-xs">{t.legalTools.subtitle}</p>
                    </div>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                    {t.legalTools.desc}
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleGenerate('foi')}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                            activeDoc === 'foi' 
                            ? 'bg-sky-600/20 border-sky-500 text-white' 
                            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                    >
                        <FileText size={20} className={activeDoc === 'foi' ? 'text-sky-400' : 'text-slate-500'} />
                        <div>
                            <span className="block font-bold text-sm">{t.legalTools.foi}</span>
                            <span className="block text-[10px] opacity-70">{t.legalTools.foiSub}</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleGenerate('complaint')}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                            activeDoc === 'complaint' 
                            ? 'bg-red-600/20 border-red-500 text-white' 
                            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                    >
                        <Gavel size={20} className={activeDoc === 'complaint' ? 'text-red-400' : 'text-slate-500'} />
                        <div>
                            <span className="block font-bold text-sm">{t.legalTools.complaint}</span>
                            <span className="block text-[10px] opacity-70">{t.legalTools.complaintSub}</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleGenerate('preservation')}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                            activeDoc === 'preservation' 
                            ? 'bg-amber-600/20 border-amber-500 text-white' 
                            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                    >
                        <Shield size={20} className={activeDoc === 'preservation' ? 'text-amber-400' : 'text-slate-500'} />
                        <div>
                            <span className="block font-bold text-sm">{t.legalTools.preservation}</span>
                            <span className="block text-[10px] opacity-70">{t.legalTools.preservationSub}</span>
                        </div>
                    </button>
                </div>
            </div>
            
            {/* Context Stats */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.legalTools.context}</h4>
                <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                        Target: {result.report.target}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                        Findings: {result.report.keyFindings.length}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                        Statutes: {result.report.legalAnalysis.length}
                    </span>
                </div>
            </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-700 bg-slate-950/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {activeDoc ? (
                        <>{t.legalTools.drafting}: <span className="text-white">{activeDoc.toUpperCase()}</span></>
                    ) : (
                        t.legalTools.preview
                    )}
                </span>
                
                {generatedContent && (
                    <div className="flex gap-2">
                        <button onClick={handleCopy} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Copy Text">
                            {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16} />}
                        </button>
                        <button onClick={handleDownload} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Download .txt">
                            <Download size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 relative bg-[#0f172a]">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Loader2 size={32} className="text-sky-500 animate-spin mb-4" />
                        <p className="text-slate-400 text-sm animate-pulse">{t.legalTools.loading}</p>
                    </div>
                ) : generatedContent ? (
                    <textarea 
                        className="w-full h-full bg-transparent p-8 text-slate-300 font-mono text-sm leading-relaxed outline-none resize-none"
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        spellCheck={false}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <FileText size={64} className="mb-4" />
                        <p className="text-sm">{t.legalTools.select}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default LegalTools;