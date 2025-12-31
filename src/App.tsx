import React, { useState, useEffect } from 'react';
import { useLanguage } from './languageContext';
import { 
  Search, ShieldAlert, FileText, Share2, 
  Menu, X, Save, ArrowLeft, Globe, 
  ArrowUpRight, Link as LinkIcon, Download,
  LayoutDashboard, Users, Clock, Lightbulb,
  Building2, Bot, LogOut, Loader2, AlertCircle
} from 'lucide-react';
import { 
    AnalysisResult, DataSource, SavedInvestigation, 
    AppState, TimelineEvent, Entity, Property
} from './types';
import { analyzeTarget } from './services/geminiService';

// Components
import LoginScreen from './components/LoginScreen';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import RiskGauge from './components/RiskGauge';
import TimelineChart from './components/TimelineChart';
import TimelineView from './components/TimelineView';
import EntityList from './components/EntityList';
import TypologyRadar from './components/TypologyRadar';
import AiAssistant from './components/AiAssistant';
import SavedCases from './components/SavedCases';
import CaseNotes from './components/CaseNotes';
import PropertyRegistry from './components/PropertyRegistry';
import AdviceView from './components/AdviceView';
import GlobalTimeline from './components/GlobalTimeline';
import PeopleDatabase from './components/PeopleDatabase';
import ToastNotification, { ToastType } from './components/ToastNotification';

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  
  // Auth State
  const [user, setUser] = useState<{name: string, role: 'user' | 'admin'} | null>(null);
  
  // App Logic State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Data State
  const [sources, setSources] = useState<DataSource[]>([
     { id: '1', name: 'KRIK', url: 'krik.rs', active: true },
     { id: '2', name: 'CINS', url: 'cins.rs', active: true },
     { id: '3', name: 'BIRN', url: 'birn.rs', active: true },
     { id: '4', name: 'APR', url: 'apr.gov.rs', active: true },
     { id: '5', name: 'Transparency Serbia', url: 'transparentnost.org.rs', active: true },
     { id: '6', name: 'Istinomer', url: 'istinomer.rs', active: true },
  ]);
  const [savedCases, setSavedCases] = useState<SavedInvestigation[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [showSavedCases, setShowSavedCases] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: ToastType} | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analysis' | 'global_timeline' | 'people' | 'admin'>('dashboard');

  // --- Handlers ---

  const handleLogin = (role: 'user' | 'admin') => {
    setUser({
        name: role === 'admin' ? 'Ana Nikolić' : 'Marko Petrović',
        role
    });
    setCurrentView(role === 'admin' ? 'admin' : 'dashboard');
  };

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
  };

  const handleAnalyze = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setAppState(AppState.ANALYZING);
    setCurrentView('analysis');
    setActiveTab('overview');
    
    try {
      const data = await analyzeTarget(searchQuery, sources, language);
      setResult(data);
      setAppState(AppState.COMPLETE);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      showToast("Analysis failed. Please try again.", "error");
    }
  };

  const handleSaveCase = () => {
    if (!result || !query) return;
    
    const newCase: SavedInvestigation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      lastUpdated: Date.now(),
      query,
      result,
      notes: []
    };
    
    setSavedCases(prev => [newCase, ...prev]);
    showToast(t.actions.saved, "success");
  };

  const handleLoadCase = (savedCase: SavedInvestigation) => {
    setQuery(savedCase.query);
    setResult(savedCase.result);
    setAppState(AppState.COMPLETE);
    setCurrentView('analysis');
    setActiveTab('overview');
    setShowSavedCases(false);
    showToast("Case loaded successfully", "info");
  };

  const handleDeleteCase = (id: string) => {
    setSavedCases(prev => prev.filter(c => c.id !== id));
    showToast("Case deleted", "info");
  };

  // Aggregation for Global Views
  const getAllPeople = () => {
    const peopleMap = new Map();
    savedCases.forEach(c => {
        c.result.report.entities.forEach(e => {
            if (!peopleMap.has(e.name)) {
                peopleMap.set(e.name, {
                    name: e.name,
                    data: e,
                    appearances: []
                });
            }
            peopleMap.get(e.name).appearances.push(c);
        });
    });
    return Array.from(peopleMap.values());
  };

  const getAllTimelineEvents = () => {
      let events: (TimelineEvent & { caseRef: SavedInvestigation })[] = [];
      savedCases.forEach(c => {
          const caseEvents = c.result.report.timeline.map(e => ({ ...e, caseRef: c }));
          events = [...events, ...caseEvents];
      });
      return events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // --- Render Helpers ---

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onCancel={() => {}} />;
  }

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0b1120] border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                <ShieldAlert className="text-sky-400 w-6 h-6" />
            </div>
            <div>
                <h1 className="font-bold text-white tracking-tight">ALETHEIA</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Intelligence</p>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2">Platform</div>
            
            <button 
                onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-sky-600/10 text-sky-400 border border-sky-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <LayoutDashboard size={18} /> Dashboard
            </button>

            {user.role === 'admin' && (
                <button 
                    onClick={() => { setCurrentView('admin'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-sky-600/10 text-sky-400 border border-sky-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Globe size={18} /> Admin Console
                </button>
            )}

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Knowledge Base</div>
            
            <button 
                onClick={() => { setCurrentView('people'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'people' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Users size={18} /> People & Entities
            </button>
            <button 
                onClick={() => { setCurrentView('global_timeline'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'global_timeline' ? 'bg-orange-600/10 text-orange-400 border border-orange-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Clock size={18} /> Global Timeline
            </button>

            {result && (
                <>
                    <div className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-2 px-3 mt-6 animate-pulse">Active Investigation</div>
                    <button 
                        onClick={() => { setCurrentView('analysis'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'analysis' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <FileText size={18} /> {result.report.target}
                    </button>
                </>
            )}
        </nav>

        <div className="p-4 border-t border-slate-800">
             <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
             </div>
             
             <div className="flex gap-2">
                 <button 
                    onClick={() => setLanguage(language === 'en' ? 'sr' : 'en')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded border border-slate-700 transition-colors"
                 >
                    {language === 'en' ? '🇺🇸 EN' : '🇷🇸 SRB'}
                 </button>
                 <button 
                    onClick={() => setUser(null)}
                    className="flex-shrink-0 bg-red-900/20 hover:bg-red-900/40 text-red-400 p-2 rounded border border-red-900/30 transition-colors"
                 >
                    <LogOut size={16} />
                 </button>
             </div>
        </div>
    </div>
  );

  const renderAnalysisContent = () => {
    if (appState === AppState.ANALYZING) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in">
                <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-slate-700 border-t-sky-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldAlert className="text-sky-500 w-10 h-10 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.loading.title}</h2>
                <p className="text-slate-400 max-w-md text-center">{t.loading.subtitle}</p>
                <div className="mt-8 flex gap-2 text-xs text-slate-500 font-mono">
                    <span className="animate-pulse">Checking APR...</span>
                    <span className="animate-pulse delay-75">Scanning News...</span>
                    <span className="animate-pulse delay-150">Analyzing Tenders...</span>
                </div>
            </div>
        );
    }

    if (appState === AppState.ERROR || !result) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in">
                <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20 mb-6">
                    <AlertCircle className="text-red-500 w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.error.title}</h2>
                <button 
                    onClick={() => { setAppState(AppState.IDLE); setCurrentView('dashboard'); }}
                    className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                >
                    {t.error.return}
                </button>
            </div>
        );
    }

    // --- Main Analysis View ---
    const { report } = result;
    
    return (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
            {/* Analysis Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-xl">
                <div className="flex items-start gap-4">
                     {report.targetImage ? (
                        <img 
                            src={report.targetImage} 
                            alt={report.target} 
                            className="w-20 h-20 rounded-xl object-cover border-2 border-slate-600 shadow-lg"
                        />
                     ) : (
                        <div className="w-20 h-20 bg-slate-700 rounded-xl flex items-center justify-center border-2 border-slate-600 shadow-lg">
                            <Users className="text-slate-400 w-10 h-10" />
                        </div>
                     )}
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{report.target}</h1>
                            {report.riskLevel === 'Critical' && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-[0_0_10px_red] animate-pulse">
                                    CRITICAL THREAT
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                             <span className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                                <Clock size={14} /> Analysis Date: {new Date().toLocaleDateString()}
                             </span>
                             <span className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                                <Building2 size={14} /> Entities: {report.entities.length}
                             </span>
                        </div>
                     </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    <button 
                        onClick={handleSaveCase}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium shadow-lg shadow-sky-900/20 transition-all hover:scale-105"
                    >
                        <Save size={18} /> {t.actions.save}
                    </button>
                    <button 
                        onClick={() => { setResult(null); setAppState(AppState.IDLE); setCurrentView('dashboard'); }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium border border-slate-600 transition-colors"
                    >
                        <ArrowLeft size={18} /> Close
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 border-b border-slate-800 scrollbar-hide">
                {[
                    { id: 'overview', icon: LayoutDashboard, label: t.tabs.overview },
                    { id: 'forensics', icon: Search, label: t.tabs.forensics },
                    { id: 'assets', icon: Building2, label: t.tabs.assets },
                    { id: 'network', icon: Share2, label: t.tabs.network },
                    { id: 'timeline', icon: Clock, label: t.tabs.timeline },
                    { id: 'advices', icon: Lightbulb, label: t.tabs.advices },
                    { id: 'notes', icon: FileText, label: t.tabs.notes },
                    { id: 'assistant', icon: Bot, label: t.tabs.assistant }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap relative ${
                            activeTab === tab.id 
                            ? 'text-sky-400 bg-slate-800/50 border-b-2 border-sky-500' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        <div className="lg:col-span-2 space-y-6">
                             {/* Summary Card */}
                             <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-500/10 transition-colors duration-700"></div>
                                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} /> {t.overview.summary}
                                </h3>
                                <p className="text-lg text-slate-200 leading-relaxed font-light">{report.summary}</p>
                             </div>

                             {/* Findings & Legal */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldAlert size={16} /> {t.overview.findings}
                                    </h3>
                                    <ul className="space-y-3">
                                        {report.keyFindings.map((finding, idx) => (
                                            <li key={idx} className="flex gap-3 text-slate-300 text-sm">
                                                <span className="text-sky-500 font-bold">•</span>
                                                {finding}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={16} /> {t.overview.legal}
                                    </h3>
                                    {report.legalAnalysis.length > 0 ? (
                                        <ul className="space-y-3">
                                            {report.legalAnalysis.map((law, idx) => (
                                                <li key={idx} className="flex gap-3 text-red-300 text-sm bg-red-900/10 p-2 rounded border border-red-900/20">
                                                    <span className="text-red-500 font-bold">§</span>
                                                    {law}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-slate-500 text-sm italic">{t.overview.noLegal}</p>
                                    )}
                                </div>
                             </div>
                        </div>

                        <div className="space-y-6">
                            {/* Risk Gauge */}
                            <RiskGauge score={report.riskScore} level={report.riskLevel} />
                            
                            {/* Sources Compact */}
                            <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Globe size={14} /> {t.overview.sources}
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {result.groundingChunks
                                        .filter(c => c.web?.uri && !c.web.uri.includes('vertexsearch.cloud.google.com') && !c.web.uri.includes('google.com/search'))
                                        .map((chunk, idx) => {
                                            let hostname = "";
                                            try {
                                                hostname = new URL(chunk.web?.uri || "").hostname.replace('www.', '');
                                            } catch (e) {
                                                hostname = "External Source";
                                            }
                                            
                                            return (
                                                <a 
                                                    key={idx} 
                                                    href={chunk.web?.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex flex-col p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800 transition-all group"
                                                >
                                                    <div className="flex justify-between items-start gap-3 mb-1.5">
                                                        <h5 className="text-sky-100 text-xs font-bold leading-snug line-clamp-2 group-hover:text-sky-400 transition-colors break-words">
                                                            {chunk.web?.title || "No Title"}
                                                        </h5>
                                                        <ArrowUpRight size={12} className="text-slate-600 group-hover:text-sky-400 transition-colors flex-shrink-0 mt-0.5" />
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <div className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono flex items-center gap-1 group-hover:border-slate-600 transition-colors">
                                                            <LinkIcon size={8} />
                                                            <span className="truncate max-w-[200px]">{hostname}</span>
                                                        </div>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                        
                                        {result.groundingChunks.filter(c => c.web?.uri).length === 0 && (
                                            <div className="text-center py-4 text-slate-500 text-xs italic">
                                                No direct web sources returned by grounding.
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'forensics' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col items-center">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 w-full text-center">Corruption Typology Profile</h3>
                            <div className="h-64 w-full">
                                <TypologyRadar typology={report.corruptionTypology} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Building2 size={16} /> {t.forensics.financial}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                        <p className="text-slate-500 text-xs uppercase">{t.forensics.estNetWorth}</p>
                                        <p className="text-white font-mono text-lg">{report.financialAnalysis.estimatedNetWorth}</p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                        <p className="text-slate-500 text-xs uppercase">{t.forensics.decIncome}</p>
                                        <p className="text-white font-mono text-lg">{report.financialAnalysis.declaredIncome}</p>
                                    </div>
                                </div>
                                
                                <h4 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">{t.forensics.assets}</h4>
                                {report.financialAnalysis.assetDiscrepancies.length > 0 ? (
                                    <ul className="space-y-2 mb-4">
                                        {report.financialAnalysis.assetDiscrepancies.map((item, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 flex gap-2">
                                                <span className="text-red-500">⚠</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-500 text-sm italic mb-4">{t.forensics.noAssets}</p>}

                                <h4 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">{t.forensics.offshore}</h4>
                                {report.financialAnalysis.offshoreConnections.length > 0 ? (
                                    <ul className="space-y-2">
                                        {report.financialAnalysis.offshoreConnections.map((item, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 flex gap-2">
                                                <Globe size={14} className="text-sky-500 mt-0.5" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-500 text-sm italic">{t.forensics.noOffshore}</p>}
                            </div>

                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} /> {t.forensics.procurement}
                                </h3>
                                <div className="flex gap-4 mb-4 text-sm">
                                    <div className="flex-1">
                                        <span className="text-slate-500">{t.forensics.totalContracts}:</span> 
                                        <span className="text-white ml-2 font-mono">{report.procurementAnalysis.totalContractValue}</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-slate-500">{t.forensics.winRate}:</span> 
                                        <span className="text-white ml-2 font-mono">{report.procurementAnalysis.tenderWinRate}</span>
                                    </div>
                                </div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">{t.forensics.suspicious}</h4>
                                {report.procurementAnalysis.suspiciousTenders.length > 0 ? (
                                    <div className="space-y-3">
                                        {report.procurementAnalysis.suspiciousTenders.map((tender, idx) => (
                                            <div key={idx} className="bg-slate-900/50 p-3 rounded border border-slate-800">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">{tender.date}</span>
                                                    <span className="text-white font-mono">{tender.value}</span>
                                                </div>
                                                <p className="text-sm font-bold text-white mb-1">{tender.authority}</p>
                                                <p className="text-xs text-red-300 bg-red-900/10 px-2 py-1 rounded inline-block">
                                                    {tender.issue}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-slate-500 text-sm italic">{t.forensics.noTenders}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'network' && (
                    <EntityList 
                        entities={report.entities} 
                        connections={report.connections} 
                        onInvestigate={handleAnalyze}
                    />
                )}

                {activeTab === 'assets' && (
                    <PropertyRegistry 
                        properties={report.properties || []}
                        onAddProperty={(p) => {
                             const updatedResult = { ...result, report: { ...result.report, properties: [...(result.report.properties || []), p] } };
                             setResult(updatedResult);
                        }}
                        onDeleteProperty={(idx) => {
                             if (!result.report.properties) return;
                             const newProps = [...result.report.properties];
                             newProps.splice(idx, 1);
                             const updatedResult = { ...result, report: { ...result.report, properties: newProps } };
                             setResult(updatedResult);
                        }}
                    />
                )}

                {activeTab === 'timeline' && (
                    <TimelineView 
                        events={report.timeline} 
                        onAddEvent={(e) => {
                             const updatedResult = { ...result, report: { ...result.report, timeline: [...result.report.timeline, e] } };
                             setResult(updatedResult);
                        }}
                        onDeleteEvent={(idx) => {
                             const newEvents = [...result.report.timeline];
                             newEvents.splice(idx, 1);
                             const updatedResult = { ...result, report: { ...result.report, timeline: newEvents } };
                             setResult(updatedResult);
                        }}
                    />
                )}

                {activeTab === 'advices' && <AdviceView report={report} />}
                
                {activeTab === 'notes' && (
                    <CaseNotes 
                        notes={savedCases.find(c => c.query === query)?.notes || []} // This logic is simplified; real app would link ID
                        onAddNote={(content) => showToast("Note saving mocked for this session", "info")}
                        onDeleteNote={(id) => {}}
                    />
                )}
                
                {activeTab === 'assistant' && <AiAssistant report={result} />}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      <div className="flex min-h-screen">
        {/* Mobile sidebar toggle */}
        <button 
           className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg border border-slate-700 shadow-lg"
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
           {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar */}
        {renderSidebar()}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative">
            {currentView === 'dashboard' && (
                <UserDashboard 
                   user={user} 
                   savedCases={savedCases} 
                   activeSourcesCount={sources.filter(s => s.active).length}
                   onNewInvestigation={() => {
                        const input = prompt(t.search.placeholder);
                        if (input) handleAnalyze(input);
                   }}
                   onLoadCase={handleLoadCase}
                />
            )}

            {currentView === 'admin' && (
                <AdminDashboard sources={sources} setSources={setSources} />
            )}

            {currentView === 'people' && (
                <PeopleDatabase 
                    people={getAllPeople()} 
                    onLoadCase={handleLoadCase} 
                    onAnalyze={handleAnalyze} 
                />
            )}

            {currentView === 'global_timeline' && (
                <GlobalTimeline events={getAllTimelineEvents()} onLoadCase={handleLoadCase} />
            )}

            {currentView === 'analysis' && renderAnalysisContent()}

            {/* Saved Cases Modal */}
            {showSavedCases && (
                <SavedCases 
                    cases={savedCases} 
                    onLoad={handleLoadCase} 
                    onDelete={handleDeleteCase} 
                    onClose={() => setShowSavedCases(false)} 
                />
            )}

            {toast && (
                <ToastNotification 
                    message={toast.msg} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;