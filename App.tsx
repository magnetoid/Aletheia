import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from './languageContext';
import { 
  Search, ShieldAlert, FileText, Share2, 
  Menu, X, Save, ArrowLeft, Globe, 
  ArrowUpRight, Link as LinkIcon, Download,
  LayoutDashboard, Users, Clock, Lightbulb,
  Building2, Bot, LogOut, Loader2, AlertCircle,
  TrendingUp, Scale, AlertTriangle, PieChart,
  CheckCircle, Printer, FileSignature,
  PanelLeftClose, PanelLeftOpen, Shield, Network,
  Activity
} from 'lucide-react';
import { 
    AnalysisResult, DataSource, SavedInvestigation, 
    AppState, TimelineEvent, Entity, Property, Connection
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
import LegalTools from './components/LegalTools';
import NetworkGraph from './components/NetworkGraph';
import ToastNotification, { ToastType } from './components/ToastNotification';

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  
  // Auth State
  const [user, setUser] = useState<{name: string, role: 'user' | 'admin'} | null>(null);
  
  // App Logic State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [loadingStep, setLoadingStep] = useState(0);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data State
  const [sources, setSources] = useState<DataSource[]>([
     { id: '1', name: 'KRIK', url: 'krik.rs', active: true },
     { id: '2', name: 'CINS', url: 'cins.rs', active: true },
     { id: '3', name: 'BIRN', url: 'birn.rs', active: true },
     { id: '4', name: 'APR', url: 'apr.gov.rs', active: true },
     { id: '5', name: 'Transparency Serbia', url: 'transparentnost.org.rs', active: true },
     { id: '6', name: 'Istinomer', url: 'istinomer.rs', active: true },
     { id: '7', name: 'Danas', url: 'danas.rs', active: true },
     { id: '8', name: 'Insajder', url: 'insajder.net', active: true },
     { id: '9', name: 'Radar Nova', url: 'radar.nova.rs', active: true },
     { id: '10', name: 'NIN', url: 'nin.rs', active: true },
     { id: '11', name: 'Nova.rs', url: 'nova.rs', active: true },
     { id: '12', name: 'N1 Srbija', url: 'n1info.rs', active: true },
     { id: '13', name: 'Balkan Insight', url: 'balkaninsight.com', active: true },
     { id: '14', name: 'VOICE', url: 'voice.org.rs', active: true },
     { id: '15', name: 'Raskrikavanje', url: 'raskrikavanje.rs', active: true },
     { id: '16', name: 'Autonomija', url: 'autonomija.info', active: true },
     { id: '17', name: 'Mašina', url: 'masina.rs', active: true },
     { id: '18', name: 'Južne Vesti', url: 'juznevesti.com', active: true },
     { id: '19', name: 'Bujanovačke', url: 'bujanovacke.co.rs', active: true },
     { id: '20', name: 'KRIK Imovina', url: 'krik.rs/imovina-politicara', active: true },
     { id: '21', name: 'Cenzolovka', url: 'cenzolovka.rs', active: true },
     { id: '22', name: 'CRTA', url: 'crta.rs', active: true },
  ]);
  const [savedCases, setSavedCases] = useState<SavedInvestigation[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [showSavedCases, setShowSavedCases] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: ToastType} | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analysis' | 'global_timeline' | 'people' | 'admin' | 'mindmap'>('dashboard');

  // --- Handlers ---

  const handleLogin = (role: 'user' | 'admin') => {
    setUser({
        name: role === 'admin' ? 'Ana Nikolić' : 'Marko Petrović',
        role
    });
    // Default to dashboard (Research page) for everyone upon login
    setCurrentView('dashboard');
  };

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAnalyze = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setAppState(AppState.ANALYZING);
    setLoadingStep(0);
    setCurrentView('analysis');
    setActiveTab('overview');
    
    try {
      const data = await analyzeTarget(searchQuery, sources, language);
      setResult(data);
      setAppState(AppState.COMPLETE);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      showToast("Analysis failed or Rate Limit exceeded. Please try again later.", "error");
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (appState === AppState.ANALYZING) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < 6 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [appState]);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Aggregation for Global Views (Memoized to prevent re-renders on clock tick)
  const peopleData = useMemo(() => {
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
  }, [savedCases]);

  const graphData = useMemo(() => {
      const entityMap = new Map<string, Entity>();
      const connectionSet = new Set<string>();
      const connections: Connection[] = [];

      savedCases.forEach(c => {
          // Entities
          c.result.report.entities.forEach(e => {
              if (!entityMap.has(e.name)) {
                  entityMap.set(e.name, e);
              }
          });
          // Connections
          c.result.report.connections.forEach(conn => {
              const key = `${conn.from}|${conn.to}|${conn.type}`;
              if (!connectionSet.has(key)) {
                  connectionSet.add(key);
                  connections.push(conn);
              }
          });
      });
      return { entities: Array.from(entityMap.values()), connections };
  }, [savedCases]);

  const timelineEvents = useMemo(() => {
      let events: (TimelineEvent & { caseRef: SavedInvestigation })[] = [];
      savedCases.forEach(c => {
          const caseEvents = c.result.report.timeline.map(e => ({ ...e, caseRef: c }));
          events = [...events, ...caseEvents];
      });
      return events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [savedCases]);

  // --- Render Helpers ---

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onCancel={() => {}} />;
  }

  const renderSidebar = () => (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div 
        className={`fixed inset-y-0 left-0 z-40 bg-[#0b1120] border-r border-slate-800 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none sidebar
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 
        ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
      >
          {/* Sidebar Header */}
          <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3 border-b border-slate-800 h-[73px]`}>
              <div className="flex items-center gap-3">
                  <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20 shrink-0">
                      <ShieldAlert className="text-sky-400 w-6 h-6" />
                  </div>
                  {!isSidebarCollapsed && (
                      <div className="min-w-0 animate-fade-in">
                          <h1 className="font-bold text-white tracking-tight text-lg truncate">ALETHEIA</h1>
                          <p className="text-xs text-slate-500 uppercase tracking-widest truncate">Intelligence</p>
                      </div>
                  )}
              </div>
              
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex text-slate-500 hover:text-white transition-colors"
                title={isSidebarCollapsed ? "Expand" : "Collapse"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>

              <button 
                className="md:hidden ml-auto text-slate-400 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={20} />
              </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
              {!isSidebarCollapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2 truncate animate-fade-in">{t.sidebar.platform}</div>}
              
              <button 
                  onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${currentView === 'dashboard' ? 'bg-sky-600/10 text-sky-400 border border-sky-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? t.sidebar.research : ""}
              >
                  <Search size={20} className="shrink-0" /> 
                  {!isSidebarCollapsed && <span className="animate-fade-in">{t.sidebar.research}</span>}
              </button>

              {user.role === 'admin' && (
                  <button 
                      onClick={() => { setCurrentView('admin'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${currentView === 'admin' ? 'bg-sky-600/10 text-sky-400 border border-sky-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      title={isSidebarCollapsed ? t.sidebar.admin : ""}
                  >
                      <Globe size={20} className="shrink-0" /> 
                      {!isSidebarCollapsed && <span className="animate-fade-in">{t.sidebar.admin}</span>}
                  </button>
              )}

              {!isSidebarCollapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6 truncate animate-fade-in">{t.sidebar.knowledge}</div>}
              
              <button 
                  onClick={() => { setCurrentView('people'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${currentView === 'people' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? t.sidebar.people : ""}
              >
                  <Users size={20} className="shrink-0" /> 
                  {!isSidebarCollapsed && <span className="animate-fade-in">{t.sidebar.people}</span>}
              </button>
              <button 
                  onClick={() => { setCurrentView('global_timeline'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${currentView === 'global_timeline' ? 'bg-orange-600/10 text-orange-400 border border-orange-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? t.sidebar.globalTimeline : ""}
              >
                  <Clock size={20} className="shrink-0" /> 
                  {!isSidebarCollapsed && <span className="animate-fade-in">{t.sidebar.globalTimeline}</span>}
              </button>
              <button 
                  onClick={() => { setCurrentView('mindmap'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${currentView === 'mindmap' ? 'bg-pink-600/10 text-pink-400 border border-pink-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? t.sidebar.mindMap : ""}
              >
                  <Network size={20} className="shrink-0" /> 
                  {!isSidebarCollapsed && <span className="animate-fade-in">{t.sidebar.mindMap}</span>}
              </button>

              {result && (
                  <>
                      {!isSidebarCollapsed && <div className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-2 px-3 mt-6 animate-pulse truncate animate-fade-in">{t.sidebar.activeCase}</div>}
                      <button 
                          onClick={() => { setCurrentView('analysis'); setIsSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${currentView === 'analysis' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                          title={isSidebarCollapsed ? result.report.target : ""}
                      >
                          <FileText size={20} className="shrink-0" /> 
                          {!isSidebarCollapsed && <span className="truncate animate-fade-in">{result.report.target}</span>}
                      </button>
                  </>
              )}
          </nav>

          <div className={`p-4 border-t border-slate-800 bg-slate-900/50 ${isSidebarCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
               <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'mb-4 px-2'}`}>
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0">
                      {user.name.charAt(0)}
                  </div>
                  {!isSidebarCollapsed && (
                      <div className="overflow-hidden animate-fade-in">
                          <p className="text-sm font-medium text-white truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                      </div>
                  )}
               </div>
               
               <button 
                  onClick={() => setUser(null)}
                  className={`flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 p-2.5 rounded border border-red-900/30 transition-colors w-full`}
                  title="Logout"
               >
                  <LogOut size={18} />
                  {!isSidebarCollapsed && <span className="text-xs font-medium">{t.sidebar.signOut}</span>}
               </button>
          </div>
      </div>
    </>
  );

  const renderAnalysisContent = () => {
    if (appState === AppState.ANALYZING) {
        const steps = [
            "Initializing Forensic Protocols...",
            "Querying Government Registries (APR, RGZ)...",
            "Scraping Media Archives (KRIK, BIRN, CINS, Danas, Insajder)...",
            "Cross-referencing Financial Statements...",
            "Analyzing Public Procurement Tenders...",
            "Mapping Entity Network & Conflicts...",
            "Generating Final Intelligence Report..."
        ];

        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in p-4 max-w-2xl mx-auto">
                <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-slate-800 border-t-sky-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldAlert className="text-sky-500 w-10 h-10 animate-pulse" />
                    </div>
                </div>

                <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
                    <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                        </div>
                        <span className="text-xs uppercase font-mono text-slate-500 ml-2">Aletheia_Core_Process.exe</span>
                        <div className="ml-auto text-xs text-sky-500 font-mono animate-pulse">RUNNING</div>
                    </div>
                    
                    <div className="p-6 space-y-4 font-mono text-sm">
                        {steps.map((step, idx) => {
                            const isActive = idx === loadingStep;
                            const isDone = idx < loadingStep;
                            const isPending = idx > loadingStep;

                            return (
                                <div key={idx} className={`flex items-center gap-3 transition-all duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                                    <div className="w-5 flex-shrink-0 flex items-center justify-center">
                                        {isDone && <CheckCircle size={16} className="text-emerald-500" />}
                                        {isActive && <Loader2 size={16} className="text-sky-500 animate-spin" />}
                                        {isPending && <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>}
                                    </div>
                                    <span className={`${isActive ? 'text-sky-400 font-bold' : isDone ? 'text-emerald-500/80' : 'text-slate-500'}`}>
                                        {step}
                                    </span>
                                    {isActive && (
                                        <span className="ml-auto text-xs text-sky-500/70 animate-pulse hidden sm:inline-block">Processing...</span>
                                    )}
                                    {isDone && (
                                        <span className="ml-auto text-xs text-emerald-500/50 hidden sm:inline-block">Done</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    
                    {/* Simulated Progress Bar */}
                    <div className="h-1 bg-slate-800 w-full">
                        <div 
                            className="h-full bg-sky-500 transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(((loadingStep + 1) / steps.length) * 100, 95)}%` }}
                        ></div>
                    </div>
                </div>
                
                <p className="mt-8 text-slate-500 text-xs animate-pulse text-center">
                    Establishing secure connection to analysis engine...<br/>
                    This usually takes 10-20 seconds depending on data volume.
                </p>
            </div>
        );
    }

    if (appState === AppState.ERROR || !result) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in p-4 text-center">
                <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20 mb-6 shadow-lg shadow-red-500/10">
                    <AlertCircle className="text-red-500 w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.error.title}</h2>
                <button 
                    onClick={() => { setAppState(AppState.IDLE); setCurrentView('dashboard'); }}
                    className="mt-6 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700 shadow-lg"
                >
                    {t.error.return}
                </button>
            </div>
        );
    }

    // --- Main Analysis View ---
    const { report } = result;
    
    return (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fade-in relative pb-20">
            
            {/* Watermark for Print/Export */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none transform -rotate-45 z-0 print-only">
               <ShieldAlert size={800} />
            </div>

            {/* Analysis Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6 bg-slate-800/50 p-4 sm:p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-xl no-break-inside">
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full xl:w-auto">
                     <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words leading-tight">{report.target}</h1>
                            {report.riskLevel === 'Critical' && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-[0_0_10px_red] animate-pulse whitespace-nowrap">
                                    CRITICAL THREAT
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-400 mt-2">
                             <span className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                                <Clock size={12} /> {new Date().toLocaleDateString()}
                             </span>
                             <span className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                                <Building2 size={12} /> Entities: {report.entities.length}
                             </span>
                        </div>
                     </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto no-print">
                    <button 
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium border border-slate-700 transition-colors text-sm"
                        title="Export Report to PDF"
                    >
                        <Printer size={16} /> Export
                    </button>
                    <button 
                        onClick={handleSaveCase}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium shadow-lg shadow-sky-900/20 transition-all hover:scale-105 active:scale-95 text-sm"
                    >
                        <Save size={16} /> {t.actions.save}
                    </button>
                    <button 
                        onClick={() => { setResult(null); setAppState(AppState.IDLE); setCurrentView('dashboard'); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium border border-slate-600 transition-all active:scale-95 text-sm"
                    >
                        <ArrowLeft size={16} /> Close
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-800 scrollbar-hide snap-x no-print">
                {[
                    { id: 'overview', icon: LayoutDashboard, label: t.tabs.overview },
                    { id: 'forensics', icon: Search, label: t.tabs.forensics },
                    { id: 'assets', icon: Building2, label: t.tabs.assets },
                    { id: 'network', icon: Share2, label: t.tabs.network },
                    { id: 'timeline', icon: Clock, label: t.tabs.timeline },
                    { id: 'advices', icon: Lightbulb, label: t.tabs.advices },
                    { id: 'legal', icon: FileSignature, label: t.tabs.legal },
                    { id: 'notes', icon: FileText, label: t.tabs.notes },
                    { id: 'assistant', icon: Bot, label: t.tabs.assistant }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`snap-start flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap relative flex-shrink-0 ${
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
                                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-500/10 transition-colors duration-700 no-print"></div>
                                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} /> {t.overview.summary}
                                </h3>
                                <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-light text-justify">{report.summary}</p>
                             </div>

                             {/* Findings & Legal */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl break-inside-avoid">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldAlert size={16} /> {t.overview.findings}
                                    </h3>
                                    <ul className="space-y-3">
                                        {report.keyFindings.map((finding, idx) => (
                                            <li key={idx} className="flex gap-3 text-slate-300 text-sm leading-snug">
                                                <span className="text-sky-500 font-bold mt-0.5">•</span>
                                                {finding}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl break-inside-avoid">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={16} /> {t.overview.legal}
                                    </h3>
                                    {report.legalAnalysis.length > 0 ? (
                                        <ul className="space-y-3">
                                            {report.legalAnalysis.map((law, idx) => (
                                                <li key={idx} className="flex gap-3 text-red-300 text-sm bg-red-900/10 p-2 rounded border border-red-900/20 leading-snug">
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
                            <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl break-inside-avoid">
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
                                                    className="flex flex-col p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800 transition-all group no-print-link"
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
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
                        {/* Typology Radar - Compact Width */}
                        <div className="xl:col-span-4 bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col items-center break-inside-avoid min-h-[350px]">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 w-full text-center">Corruption Typology Profile</h3>
                            <div className="h-full w-full min-h-[280px]">
                                <TypologyRadar typology={report.corruptionTypology} />
                            </div>
                        </div>

                        {/* Financial & Procurement - Expanded Width */}
                        <div className="xl:col-span-8 space-y-6">
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 break-inside-avoid">
                                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Building2 size={16} /> {t.forensics.financial}
                                </h3>
                                {/* Cards for Net Worth / Income - Improved for visibility */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <p className="text-slate-500 text-xs uppercase mb-1 tracking-wider">{t.forensics.estNetWorth}</p>
                                        <p className="text-white font-mono text-xl sm:text-2xl truncate" title={report.financialAnalysis.estimatedNetWorth}>
                                            {report.financialAnalysis.estimatedNetWorth}
                                        </p>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <p className="text-slate-500 text-xs uppercase mb-1 tracking-wider">{t.forensics.decIncome}</p>
                                        <p className="text-white font-mono text-xl sm:text-2xl truncate" title={report.financialAnalysis.declaredIncome}>
                                            {report.financialAnalysis.declaredIncome}
                                        </p>
                                    </div>
                                </div>
                                
                                <h4 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">{t.forensics.assets}</h4>
                                {report.financialAnalysis.assetDiscrepancies.length > 0 ? (
                                    <ul className="space-y-2 mb-4">
                                        {report.financialAnalysis.assetDiscrepancies.map((item, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 flex gap-2 leading-snug">
                                                <span className="text-red-500 flex-shrink-0 mt-0.5">⚠</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-500 text-sm italic mb-4">{t.forensics.noAssets}</p>}

                                <h4 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">{t.forensics.offshore}</h4>
                                {report.financialAnalysis.offshoreConnections.length > 0 ? (
                                    <ul className="space-y-2">
                                        {report.financialAnalysis.offshoreConnections.map((item, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 flex gap-2 leading-snug">
                                                <Globe size={14} className="text-sky-500 mt-0.5 flex-shrink-0" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-500 text-sm italic">{t.forensics.noOffshore}</p>}
                            </div>

                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 break-inside-avoid">
                                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} /> {t.forensics.procurement}
                                </h3>
                                <div className="flex gap-4 mb-4 text-sm flex-col sm:flex-row">
                                    <div className="flex-1">
                                        <span className="text-slate-500 block sm:inline font-bold">{t.forensics.totalContracts}:</span> 
                                        <span className="text-white sm:ml-2 font-mono text-base">{report.procurementAnalysis.totalContractValue}</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-slate-500 block sm:inline font-bold">{t.forensics.winRate}:</span> 
                                        <span className="text-white sm:ml-2 font-mono text-base">{report.procurementAnalysis.tenderWinRate}</span>
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

                {activeTab === 'legal' && <LegalTools result={result} />}
                
                {activeTab === 'notes' && (
                    <CaseNotes 
                        notes={savedCases.find(c => c.query === query)?.notes || []} 
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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-sky-500/30 selection:text-sky-200 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button 
           className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg border border-slate-700 shadow-lg no-print"
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
           {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar */}
        {renderSidebar()}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative overflow-y-auto">
            {currentView === 'dashboard' && (
                <UserDashboard 
                   user={user} 
                   savedCases={savedCases} 
                   activeSourcesCount={sources.filter(s => s.active).length}
                   onSearch={handleAnalyze} 
                   onLoadCase={handleLoadCase}
                />
            )}

            {currentView === 'admin' && (
                <AdminDashboard sources={sources} setSources={setSources} />
            )}

            {currentView === 'people' && (
                <PeopleDatabase 
                    people={peopleData} 
                    onLoadCase={handleLoadCase} 
                    onAnalyze={handleAnalyze} 
                />
            )}

            {currentView === 'global_timeline' && (
                <GlobalTimeline events={timelineEvents} onLoadCase={handleLoadCase} />
            )}

            {currentView === 'mindmap' && (
                <div className="w-full h-full p-6 animate-fade-in flex flex-col">
                     <div className="mb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Network className="text-pink-500" /> {t.sidebar.mindMap}
                        </h2>
                        <p className="text-slate-400 text-sm">{t.globalTimeline.subtitle}</p>
                     </div>
                     <div className="flex-1 border border-slate-700 rounded-xl overflow-hidden bg-slate-900/30 relative">
                        {savedCases.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <Network size={48} className="mb-4 opacity-20" />
                                <p>{t.savedCases.empty}</p>
                            </div>
                        ) : (
                            <NetworkGraph 
                                entities={graphData.entities} 
                                connections={graphData.connections}
                                mode="embedded"
                            />
                        )}
                     </div>
                </div>
            )}

            {currentView === 'analysis' && renderAnalysisContent()}

            {/* Sticky Footer */}
            <div className="mt-auto border-t border-slate-800 bg-slate-950/50 p-4 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 no-print">
                <div className="flex items-center gap-4">
                    <span>&copy; {new Date().getFullYear()} Aletheia AI</span>
                    <span className="hidden md:inline text-slate-700">|</span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                        by <a href="https://tehnokratija.org" target="_blank" rel="noopener noreferrer" className="text-sky-500 font-bold hover:underline cursor-pointer">tehnokratija.org</a>
                    </span>
                </div>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                    <button 
                        onClick={() => setLanguage(language === 'en' ? 'sr' : 'en')}
                        className="font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        {language === 'en' ? '🇺🇸 EN' : '🇷🇸 SRB'}
                    </button>
                    <span className="flex items-center gap-1.5 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        <Clock size={12} className="text-emerald-500" />
                        {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        <span className="text-slate-600 ml-1">{currentTime.toLocaleDateString()}</span>
                    </span>
                    {user.role === 'admin' && (
                        <button 
                            onClick={() => setCurrentView('admin')}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <Shield size={12} /> Admin
                        </button>
                    )}
                </div>
            </div>

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