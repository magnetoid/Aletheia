import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, ShieldAlert, FileText, Link as LinkIcon, AlertTriangle, Bookmark, Save, LayoutGrid, Users, History, Gavel, Scale, Briefcase, Landmark, TrendingUp, DollarSign, Globe, Sparkles, Crosshair, LogOut, LayoutDashboard, Lock, Clock, Lightbulb, Building2, User as UserIcon } from 'lucide-react';
import { analyzeTarget } from './services/geminiService';
import { AnalysisResult, AppState, DataSource, SavedInvestigation, UserNote, Entity, TimelineEvent, Property } from './types';
import RiskGauge from './components/RiskGauge';
import TypologyRadar from './components/TypologyRadar';
import TimelineView from './components/TimelineView';
import EntityList from './components/EntityList';
import SavedCases from './components/SavedCases';
import AiAssistant from './components/AiAssistant';
import LoginScreen from './components/LoginScreen';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import PeopleDatabase from './components/PeopleDatabase';
import GlobalTimeline from './components/GlobalTimeline';
import AdviceView from './components/AdviceView';
import PropertyRegistry from './components/PropertyRegistry';
import { useLanguage } from './languageContext';

const DEFAULT_SOURCES: DataSource[] = [
  { id: '1', name: 'BIRN (Balkan Investigative Reporting Network)', url: 'birn.rs', active: true },
  { id: '2', name: 'KRIK (Crime and Corruption Reporting Network)', url: 'krik.rs', active: true },
  { id: '3', name: 'CINS (Center for Investigative Journalism of Serbia)', url: 'cins.rs', active: true },
  { id: '4', name: 'Transparency Serbia', url: 'transparentnost.org.rs', active: true },
  { id: '5', name: 'Apr.gov.rs (Business Registry)', url: 'apr.gov.rs', active: true },
  { id: '6', name: 'Open Data Portal Serbia', url: 'data.gov.rs', active: true },
  { id: '7', name: 'Istinomer (Truth-o-meter)', url: 'istinomer.rs', active: true },
  { id: '8', name: 'BIRODI (Bureau for Social Research)', url: 'birodi.rs', active: true },
  { id: '9', name: 'Wikipedia', url: 'wikipedia.org', active: true },
  { id: '10', name: 'Južne Vesti', url: 'juznevesti.com', active: true },
  { id: '11', name: 'N1 Info Serbia', url: 'n1info.rs', active: true },
  { id: '12', name: 'OzonPress', url: 'ozonpress.net', active: true },
  { id: '13', name: 'Radar Nova', url: 'radar.nova.rs', active: true },
  { id: '14', name: 'Forbes Serbia', url: 'forbes.n1info.rs', active: true },
  { id: '15', name: 'Katastar RGZ', url: 'katastar.rgz.gov.rs', active: true },
];

type Tab = 'overview' | 'forensics' | 'assets' | 'network' | 'timeline' | 'assistant' | 'advices';
type ViewState = 'dashboard' | 'workspace' | 'people' | 'global_timeline';
type UserRole = 'admin' | 'user';

interface User {
  name: string;
  role: UserRole;
}

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('workspace'); // Default to workspace (Research Page)
  const [showLogin, setShowLogin] = useState(false);

  // Workspace State
  const [query, setQuery] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentNotes, setCurrentNotes] = useState<UserNote[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Data Sources State
  const [sources, setSources] = useState<DataSource[]>(DEFAULT_SOURCES);

  // Saved Investigations State
  const [savedCases, setSavedCases] = useState<SavedInvestigation[]>(() => {
    const saved = localStorage.getItem('aletheia_cases');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSavedCases, setShowSavedCases] = useState(false);

  // Persistence effect
  useEffect(() => {
    localStorage.setItem('aletheia_cases', JSON.stringify(savedCases));
  }, [savedCases]);

  // Derived Data for People Database - Memoized to prevent heavy recalc on every render
  const aggregatedPeople = useMemo(() => {
    const map = new Map<string, { entity: Entity, appearances: SavedInvestigation[] }>();
    savedCases.forEach(c => {
      c.result.report.entities.forEach(e => {
        if (!map.has(e.name)) {
          map.set(e.name, { entity: e, appearances: [] });
        }
        const entry = map.get(e.name);
        if (entry && !entry.appearances.some(existing => existing.id === c.id)) {
             entry.appearances.push(c);
        }
      });
    });
    return Array.from(map.values()).map(v => ({
        name: v.entity.name,
        data: v.entity,
        appearances: v.appearances
    }));
  }, [savedCases]);

  // Derived Data for Global Timeline - Memoized
  const aggregatedTimeline = useMemo(() => {
    let events: (TimelineEvent & { caseRef: SavedInvestigation })[] = [];
    savedCases.forEach(c => {
        c.result.report.timeline.forEach(t => {
            events.push({
                ...t,
                caseRef: c
            });
        });
    });
    return events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [savedCases]);

  const handleLogin = (role: UserRole) => {
    setUser({
      name: role === 'admin' ? 'Admin User' : 'Investigator',
      role: role
    });
    setView('dashboard');
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    setView('workspace'); // Return to public research page on logout
    setResult(null);
    setAppState(AppState.IDLE);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg('');
    setResult(null);
    setCurrentNotes([]);
    setCurrentCaseId(null);
    setActiveTab('overview');
    setView('workspace'); // Ensure we are in workspace when searching

    try {
      // Pass the current language preference to the service
      const data = await analyzeTarget(query, sources, language);
      setResult(data);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("Investigation failed. Please try again later or refine your query.");
    }
  };

  const handleInvestigateEntity = async (name: string) => {
    setQuery(name);
    setAppState(AppState.ANALYZING);
    setErrorMsg('');
    setResult(null);
    setCurrentNotes([]);
    setCurrentCaseId(null);
    setActiveTab('overview');
    setView('workspace');

    try {
      const data = await analyzeTarget(name, sources, language);
      setResult(data);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("Investigation failed. Please try again later or refine your query.");
    }
  };

  // --- Data Manipulation Handlers ---

  const saveToStorage = (updatedResult: AnalysisResult, notes: UserNote[], id?: string) => {
    // If this is a saved case, update it in the savedCases list
    if (id) {
       setSavedCases(prev => prev.map(c => {
         if (c.id === id) {
           return {
             ...c,
             result: updatedResult,
             notes: notes,
             lastUpdated: Date.now()
           };
         }
         return c;
       }));
    }
  };

  const handleAddEntity = (entity: Entity) => {
    if (!result) return;
    const updatedResult = {
      ...result,
      report: {
        ...result.report,
        entities: [entity, ...result.report.entities]
      }
    };
    setResult(updatedResult);
    if (currentCaseId) saveToStorage(updatedResult, currentNotes, currentCaseId);
  };

  const handleDeleteEntity = (name: string) => {
    if (!result) return;
    const updatedResult = {
      ...result,
      report: {
        ...result.report,
        entities: result.report.entities.filter(e => e.name !== name),
        connections: result.report.connections.filter(c => c.from !== name && c.to !== name)
      }
    };
    setResult(updatedResult);
    if (currentCaseId) saveToStorage(updatedResult, currentNotes, currentCaseId);
  };

  const handleUpdateEntity = (updatedEntity: Entity) => {
    if (!result) return;
    const newEntities = result.report.entities.map(e =>
      e.name === updatedEntity.name ? updatedEntity : e
    );
    const updatedResult = {
      ...result,
      report: {
        ...result.report,
        entities: newEntities
      }
    };
    setResult(updatedResult);
    if (currentCaseId) saveToStorage(updatedResult, currentNotes, currentCaseId);
  };

  const handleAddTimelineEvent = (event: TimelineEvent) => {
    if (!result) return;
    const updatedResult = {
      ...result,
      report: {
        ...result.report,
        timeline: [...result.report.timeline, event]
      }
    };
    setResult(updatedResult);
    if (currentCaseId) saveToStorage(updatedResult, currentNotes, currentCaseId);
  };

  const handleDeleteTimelineEvent = (idx: number) => {
    if (!result) return;
    const sortedEvents = [...result.report.timeline].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const eventToDelete = sortedEvents[idx];
    
    const updatedTimeline = result.report.timeline.filter(e => e !== eventToDelete);
    
    const updatedResult = {
      ...result,
      report: {
        ...result.report,
        timeline: updatedTimeline
      }
    };
    setResult(updatedResult);
    if (currentCaseId) saveToStorage(updatedResult, currentNotes, currentCaseId);
  };

  const handleAddProperty = (prop: Property) => {
    if (!result) return;
    const currentProps = result.report.properties || [];
    const updatedResult = {
      ...result,
      report: {
        ...result.report,
        properties: [...currentProps, prop]
      }
    };
    setResult(updatedResult);
    if (currentCaseId) saveToStorage(updatedResult, currentNotes, currentCaseId);
  };

  const handleDeleteProperty = (idx: number) => {
    if (!result || !result.report.properties) return;
    const updatedProps = result.report.properties.filter((_, i) => i !== idx);
    const updatedResult = {
      ...result,
      report: {
        ...result.report,
        properties: updatedProps
      }
    };
    setResult(updatedResult);
    if (currentCaseId) saveToStorage(updatedResult, currentNotes, currentCaseId);
  };

  // --- Case Management Handlers ---

  const handleSaveCase = () => {
    if (!result) return;
    
    // If already saved, just update (handled by saveToStorage usually, but this is for explicit save button on new search)
    if (currentCaseId) {
       saveToStorage(result, currentNotes, currentCaseId);
       return;
    }

    const newId = crypto.randomUUID();
    const newCase: SavedInvestigation = {
      id: newId,
      timestamp: Date.now(),
      lastUpdated: Date.now(),
      query: query,
      result: result,
      notes: currentNotes
    };
    
    setSavedCases([newCase, ...savedCases]);
    setCurrentCaseId(newId);
  };

  const handleDeleteCase = (id: string) => {
    setSavedCases(savedCases.filter(c => c.id !== id));
    if (currentCaseId === id) {
      setAppState(AppState.IDLE);
      setResult(null);
      setCurrentCaseId(null);
    }
  };

  const handleLoadCase = (c: SavedInvestigation) => {
    setQuery(c.query);
    setResult(c.result);
    setCurrentNotes(c.notes || []);
    setCurrentCaseId(c.id);
    setAppState(AppState.COMPLETE);
    setShowSavedCases(false);
    setActiveTab('overview');
    setView('workspace'); // Ensure we switch to workspace view
  };

  const isCurrentResultSaved = !!currentCaseId;

  // Render Logic
  if (showLogin) {
    return <LoginScreen onLogin={handleLogin} onCancel={() => setShowLogin(false)} />;
  }

  return (
    <div className="min-h-screen text-slate-200 selection:bg-sky-500/30 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('workspace')}>
            <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
              <ShieldAlert className="text-sky-400 w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
              ALETHEIA <span className="text-sky-500">SRB</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Main Navigation - Visible to All */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                {user && (
                    <button 
                        onClick={() => setView('dashboard')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'dashboard' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                    >
                        <LayoutDashboard size={16} />
                        Dashboard
                    </button>
                )}
                
                <button 
                    onClick={() => setView('workspace')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'workspace' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    <Search size={16} />
                    Workspace
                </button>
                <button 
                    onClick={() => setView('people')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'people' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    <Users size={16} />
                    People
                </button>
                <button 
                    onClick={() => setView('global_timeline')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'global_timeline' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    <Clock size={16} />
                    Timeline
                </button>
            </div>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block"></div>
            
            {/* Language Switcher */}
            <div className="relative group">
               <button className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors hover:bg-slate-800/50 px-3 py-1.5 rounded-md">
                  <Globe size={16} />
                  <span className="uppercase">{language}</span>
               </button>
               <div className="absolute right-0 top-full mt-2 w-24 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden hidden group-hover:block animate-fade-in z-50">
                  <div 
                    onClick={() => setLanguage('en')} 
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-800 ${language === 'en' ? 'text-sky-400' : 'text-slate-400'}`}
                  >
                    English
                  </div>
                  <div 
                    onClick={() => setLanguage('sr')} 
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-800 ${language === 'sr' ? 'text-sky-400' : 'text-slate-400'}`}
                  >
                    Srpski
                  </div>
               </div>
            </div>

          </div>
        </div>
      </header>
      
      {showSavedCases && (
        <SavedCases
          cases={savedCases}
          onLoad={handleLoadCase}
          onDelete={handleDeleteCase}
          onClose={() => setShowSavedCases(false)}
        />
      )}

      {/* DASHBOARD VIEWS - Only if logged in */}
      {view === 'dashboard' && user?.role === 'admin' && (
         <AdminDashboard sources={sources} setSources={setSources} />
      )}

      {view === 'dashboard' && user?.role === 'user' && (
         <UserDashboard 
            user={user} 
            savedCases={savedCases} 
            activeSourcesCount={sources.filter(s => s.active).length}
            onNewInvestigation={() => {
              setAppState(AppState.IDLE);
              setResult(null);
              setQuery('');
              setView('workspace');
            }}
            onLoadCase={handleLoadCase}
         />
      )}

      {view === 'people' && (
          <PeopleDatabase people={aggregatedPeople} onLoadCase={handleLoadCase} />
      )}

      {view === 'global_timeline' && (
          <GlobalTimeline events={aggregatedTimeline} onLoadCase={handleLoadCase} />
      )}


      {/* WORKSPACE VIEW (Default / Research Page) */}
      {view === 'workspace' && (
        <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col animate-fade-in relative z-10">
          
          {/* Search Bar - Always Visible but compact when viewing results */}
          <div className={`transition-all duration-500 ease-in-out ${appState === AppState.IDLE ? 'mt-10' : 'mb-6'}`}>
            {appState === AppState.IDLE && (
                <div className="text-center mb-10">
                  <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                    {t.hero.titleStart} <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">{t.hero.titleEnd}</span>
                  </h2>
                  <p className="text-slate-400 text-lg mb-8">
                    {t.hero.subtitle}
                  </p>
                </div>
              )}

              <div className={`mx-auto ${appState === AppState.IDLE ? 'max-w-3xl' : 'max-w-4xl'}`}>
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex items-center bg-slate-900 rounded-lg border border-slate-700 p-2 shadow-2xl">
                    <Search className="w-6 h-6 text-slate-400 ml-3" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t.search.placeholder}
                      className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 px-4 py-3 text-lg"
                    />
                    <button
                      type="submit"
                      disabled={appState === AppState.ANALYZING}
                      className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {appState === AppState.ANALYZING ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t.search.analyzing}
                        </>
                      ) : (
                        t.search.button
                      )}
                    </button>
                  </div>
                </form>
                {appState === AppState.IDLE && (
                  <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                    <span className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 cursor-pointer hover:border-sky-500 hover:text-sky-400" onClick={() => setQuery("Belgrade Waterfront Project")}>{t.hero.try}: Belgrade Waterfront</span>
                    <span className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 cursor-pointer hover:border-sky-500 hover:text-sky-400" onClick={() => setQuery("EPS Tender 2023")}>{t.hero.try}: EPS Tender 2023</span>
                  </div>
                )}
              </div>
          </div>

          {/* Loading State */}
          {appState === AppState.ANALYZING && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in flex-1">
              <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-t-4 border-sky-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-4 border-t-4 border-indigo-500 rounded-full animate-spin-reverse"></div>
              </div>
              <p className="text-xl text-slate-300 font-mono animate-pulse">{t.loading.title}</p>
              <p className="text-sm text-slate-500 mt-2">
                {t.loading.subtitle}
              </p>
            </div>
          )}

          {/* Error State */}
          {appState === AppState.ERROR && (
            <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t.error.title}</h3>
              <p className="text-red-200">{errorMsg}</p>
              <button 
                onClick={() => setAppState(AppState.IDLE)}
                className="mt-6 text-sm text-slate-400 hover:text-white underline"
              >
                {t.error.return}
              </button>
            </div>
          )}

          {/* WORKSPACE RESULTS */}
          {appState === AppState.COMPLETE && result && (
            <div className="animate-fade-in-up flex-1 flex flex-col">
              
              {/* Action Bar */}
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    {result.report.targetImage && (
                      <img 
                        src={result.report.targetImage} 
                        alt={result.report.target} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-sky-500 shadow-lg"
                        onError={(e) => {e.currentTarget.style.display = 'none'}}
                      />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white truncate max-w-xl">{result.report.target}</h2>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        {isCurrentResultSaved ? (
                          <span className="text-emerald-400 flex items-center gap-1"><Bookmark size={12}/> {t.actions.saved}</span>
                        ) : t.actions.unsaved}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSaveCase}
                      disabled={isCurrentResultSaved}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isCurrentResultSaved 
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20'
                      }`}
                    >
                      {isCurrentResultSaved ? <CheckIcon /> : <Save size={16} />}
                      {isCurrentResultSaved ? t.actions.saved : t.actions.save}
                    </button>
                  </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex mb-6 overflow-x-auto bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 gap-1 no-scrollbar">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutGrid size={16}/>}>{t.tabs.overview}</TabButton>
                <TabButton active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} icon={<Sparkles size={16}/>}>{t.tabs.assistant}</TabButton>
                <TabButton active={activeTab === 'advices'} onClick={() => setActiveTab('advices')} icon={<Lightbulb size={16}/>}>{t.tabs.advices}</TabButton>
                <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Building2 size={16}/>}>{t.tabs.assets}</TabButton>
                <TabButton active={activeTab === 'forensics'} onClick={() => setActiveTab('forensics')} icon={<Briefcase size={16}/>}>{t.tabs.forensics}</TabButton>
                <TabButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Users size={16}/>}>{t.tabs.network}</TabButton>
                <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<History size={16}/>}>{t.tabs.timeline}</TabButton>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-[500px]">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                    <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700/80 p-6 shadow-lg shadow-black/20 backdrop-blur-sm">
                          <div className="flex items-center gap-3 mb-4">
                          <FileText className="text-sky-400" />
                          <h3 className="text-lg font-semibold text-white">{t.overview.summary}</h3>
                          </div>
                          <p className="text-slate-300 leading-relaxed mb-6">
                          {result.report.summary}
                          </p>
                          <div className="space-y-4">
                              <div>
                                  <h5 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">{t.overview.findings}</h5>
                                  <ul className="space-y-2">
                                      {result.report.keyFindings.map((finding, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                          <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 shadow-[0_0_5px_red]"></span>
                                          {finding}
                                      </li>
                                      ))}
                                  </ul>
                              </div>
                              
                              {/* Investigative Leads */}
                              {result.report.investigativeLeads && result.report.investigativeLeads.length > 0 && (
                                  <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-lg">
                                      <h5 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                                          <Crosshair size={14} />
                                          {t.overview.leads}
                                      </h5>
                                      <ul className="space-y-2">
                                          {result.report.investigativeLeads.map((lead, idx) => (
                                              <li key={idx} className="flex items-start gap-2 text-indigo-100 text-sm">
                                                  <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                                                  {lead}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Legal Framework Analysis Card */}
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700/80 p-6 relative overflow-hidden shadow-lg shadow-black/20 backdrop-blur-sm">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                          <div className="flex items-center gap-3 mb-4 relative z-10">
                              <Scale className="text-indigo-400" />
                              <h3 className="text-lg font-semibold text-white">{t.overview.legal}</h3>
                          </div>
                          <div className="space-y-3 relative z-10">
                              {result.report.legalAnalysis && result.report.legalAnalysis.length > 0 ? (
                                  result.report.legalAnalysis.map((law, idx) => (
                                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-600 transition-colors">
                                          <Gavel className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                          <p className="text-slate-300 text-sm">{law}</p>
                                      </div>
                                  ))
                              ) : (
                                  <p className="text-slate-500 text-sm italic">{t.overview.noLegal}</p>
                              )}
                          </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <RiskGauge score={result.report.riskScore} level={result.report.riskLevel} />
                      
                      {result.report.corruptionTypology && (
                        <TypologyRadar typology={result.report.corruptionTypology} />
                      )}

                      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <LinkIcon className="text-slate-400 w-5 h-5" />
                          <h3 className="text-lg font-semibold text-white">{t.overview.sources}</h3>
                        </div>
                        <div className="space-y-3">
                          {result.groundingChunks.slice(0, 5).map((chunk, idx) => (
                            chunk.web?.uri && (
                              <a 
                                key={idx} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block p-3 bg-slate-900/80 border border-slate-800 rounded hover:border-sky-500/50 transition-all hover:bg-slate-800"
                              >
                                <h5 className="text-sky-400 text-sm font-medium truncate mb-1">{chunk.web.title}</h5>
                                <p className="text-slate-500 text-xs truncate font-mono">{new URL(chunk.web.uri).hostname}</p>
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ASSISTANT TAB */}
                {activeTab === 'assistant' && (
                  <AiAssistant report={result} />
                )}

                {/* ADVICES TAB */}
                {activeTab === 'advices' && (
                  <AdviceView report={result.report} />
                )}

                {/* ASSETS TAB */}
                {activeTab === 'assets' && (
                   <PropertyRegistry 
                      properties={result.report.properties || []} 
                      onAddProperty={handleAddProperty}
                      onDeleteProperty={handleDeleteProperty}
                   />
                )}

                {/* FORENSICS TAB */}
                {activeTab === 'forensics' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    
                    {/* Financial Analysis */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 shadow-lg shadow-black/20">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          <DollarSign className="text-emerald-400 w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">{t.forensics.financial}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">{t.forensics.estNetWorth}</p>
                            <p className="text-white font-mono text-lg font-bold">{result.report.financialAnalysis?.estimatedNetWorth || "Unknown"}</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">{t.forensics.decIncome}</p>
                            <p className="text-white font-mono text-lg font-bold">{result.report.financialAnalysis?.declaredIncome || "Unknown"}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase">{t.forensics.assets}</h4>
                            {result.report.financialAnalysis?.assetDiscrepancies?.length > 0 ? (
                              <ul className="space-y-2">
                                {result.report.financialAnalysis.assetDiscrepancies.map((item, i) => (
                                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2 bg-red-900/10 p-2 rounded border border-red-900/30">
                                    <TrendingUp size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-sm text-slate-500 italic">{t.forensics.noAssets}</p>}
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase">{t.forensics.offshore}</h4>
                            {result.report.financialAnalysis?.offshoreConnections?.length > 0 ? (
                              <ul className="space-y-2">
                                {result.report.financialAnalysis.offshoreConnections.map((item, i) => (
                                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2 bg-slate-900 p-2 rounded border border-slate-800">
                                    <Landmark size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-sm text-slate-500 italic">{t.forensics.noOffshore}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Procurement Analysis */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 shadow-lg shadow-black/20">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                          <Briefcase className="text-sky-400 w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">{t.forensics.procurement}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">{t.forensics.totalContracts}</p>
                            <p className="text-white font-mono text-lg font-bold">{result.report.procurementAnalysis?.totalContractValue || "N/A"}</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">{t.forensics.winRate}</p>
                            <p className="text-white font-mono text-lg font-bold">{result.report.procurementAnalysis?.tenderWinRate || "Unknown"}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase">{t.forensics.suspicious}</h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {result.report.procurementAnalysis?.suspiciousTenders?.length > 0 ? (
                              result.report.procurementAnalysis.suspiciousTenders.map((tender, i) => (
                                  <div key={i} className="bg-slate-900 p-3 rounded-lg border border-slate-800 hover:border-red-500/30 transition-colors">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-mono text-slate-500">{tender.date}</span>
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-900/20 px-1.5 py-0.5 rounded">{tender.value}</span>
                                      </div>
                                      <h5 className="text-sm font-medium text-white mb-1">{tender.authority}</h5>
                                      <p className="text-xs text-red-300 flex items-center gap-1.5">
                                        <AlertTriangle size={10} />
                                        {tender.issue}
                                      </p>
                                  </div>
                              ))
                          ) : <p className="text-sm text-slate-500 italic">{t.forensics.noTenders}</p>}
                        </div>
                      </div>
                    </div>
                    
                  </div>
                )}

                {/* NETWORK TAB */}
                {activeTab === 'network' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px] animate-fade-in">
                    <div className="lg:col-span-1 flex flex-col h-full">
                        <EntityList 
                            entities={result.report.entities} 
                            connections={result.report.connections} 
                            onAddEntity={handleAddEntity}
                            onDeleteEntity={handleDeleteEntity}
                            onUpdateEntity={handleUpdateEntity}
                            onInvestigate={handleInvestigateEntity}
                        />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                        <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-lg shadow-black/20">
                             {/* The actual graph would go here, for now it's usually modal, but we can inline it later if needed. The EntityList 'Visualize' opens it modal. */}
                             <div className="h-full flex flex-col items-center justify-center text-slate-500 p-10">
                                <Users size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">Select 'Graph' in the entity list or click 'Visualize' on an entity to open the interactive network explorer.</p>
                             </div>
                        </div>
                        <div className="h-1/3 bg-slate-800/50 rounded-xl border border-slate-700 p-4 overflow-y-auto">
                            <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-3">{t.network.title}</h3>
                            <div className="space-y-2">
                                {result.report.potentialConflicts.length > 0 ? (
                                    result.report.potentialConflicts.map((conflict, i) => (
                                        <div key={i} className="text-sm text-orange-200 bg-orange-900/20 border border-orange-900/50 p-3 rounded">
                                            <AlertTriangle size={14} className="inline mr-2 text-orange-400"/>
                                            {conflict}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">{t.network.noConflicts}</p>
                                )}
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {/* TIMELINE TAB */}
                {activeTab === 'timeline' && (
                  <TimelineView 
                    events={result.report.timeline} 
                    onAddEvent={handleAddTimelineEvent}
                    onDeleteEvent={handleDeleteTimelineEvent}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer (Visible only in Workspace view or when not logged in) */}
      {view === 'workspace' && (
        <footer className="border-t border-slate-800 bg-[#0f172a] py-6 mt-auto">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Aletheia AI. All rights reserved.
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowSavedCases(true)}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 hover:bg-slate-800/50 px-3 py-1.5 rounded-md"
                >
                  <Bookmark size={16} />
                  <span className="hidden lg:inline">{t.header.cases} ({savedCases.length})</span>
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1"></div>

                {user ? (
                    <button 
                      onClick={handleLogout}
                      className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800/50"
                      title="Logout"
                    >
                      <UserIcon size={14} />
                      <span className="text-sm font-medium">{user.name}</span>
                      <LogOut size={14} className="ml-1" />
                    </button>
                ) : (
                    <button 
                      onClick={() => setShowLogin(true)}
                      className="text-slate-500 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5 hover:bg-slate-800/50 px-3 py-1.5 rounded-md"
                    >
                      <Lock size={14} />
                      Admin Login
                    </button>
                )}
            </div>

            <div className="flex items-center gap-6">
              <span className="text-slate-500 text-sm">
                by <a href="https://tehnokratija.org" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 hover:underline transition-colors font-medium">tehnokratija.org</a>
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

const TabButton: React.FC<{active: boolean, onClick: () => void, children: React.ReactNode, icon: React.ReactNode}> = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
      active
        ? 'bg-sky-600 text-white shadow-md shadow-sky-900/20'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    {children}
  </button>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default App;