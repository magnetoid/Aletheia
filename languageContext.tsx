import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'sr';

export const translations = {
  en: {
    appTitle: "Anticorruption Intelligence",
    header: {
      cases: "Cases",
      sources: "Data Sources"
    },
    hero: {
      titleStart: "Expose the",
      titleEnd: "Hidden Truth",
      subtitle: "Deep investigative AI research into potential corruption and affairs using Serbian legal frameworks.",
      try: "Try"
    },
    sidebar: {
      platform: "Platform",
      research: "Research",
      admin: "Admin Console",
      knowledge: "Knowledge Base",
      people: "People & Entities",
      globalTimeline: "Global Timeline",
      mindMap: "Connection Mind Map",
      activeCase: "Active Investigation",
      signOut: "Sign Out"
    },
    userDashboard: {
      titleSuffix: "Research",
      subtitle: "Deep forensic analysis of public records, tenders, and corruption networks.",
      recent: "Recent Investigations",
      empty: "No investigations found. Start a new research above.",
      query: "Query"
    },
    admin: {
      title: "System Administration",
      subtitle: "Global oversight and configuration.",
      audit: "Audit Logs",
      config: "Config",
      status: "System Status",
      operational: "Operational",
      intelligence: "Data Intelligence",
      activeSources: "active sources",
      manage: "Manage Sources",
      quota: "API Quota",
      threats: "Threats Flags",
      users: "User Management",
      activity: "Live Activity",
      role: "Role",
      lastActive: "Last Active"
    },
    peopleDb: {
        title: "People & Entities",
        search: "Search database...",
        noResults: "No entities found.",
        bio: "Biography / Notes",
        metadata: "Metadata",
        linked: "Linked Cases",
        runAnalysis: "Run Extended Analysis",
        reg: "Reg. Number",
        born: "Founded/Born"
    },
    globalTimeline: {
        title: "Global Event Timeline",
        subtitle: "Master chronological record across all investigations",
        empty: "No timeline events recorded in saved cases."
    },
    legalTools: {
        title: "Legal Generator",
        subtitle: "Automated Drafting Engine",
        desc: "Select a document type to auto-draft formal legal requests based on the current investigation findings.",
        foi: "FOI Request",
        foiSub: "Request for Information",
        complaint: "Criminal Complaint",
        complaintSub: "Public Prosecutor",
        preservation: "Preservation Letter",
        preservationSub: "Evidence Preservation",
        context: "Context Loaded",
        drafting: "Drafting",
        preview: "Document Preview",
        loading: "Drafting legal document based on forensic data...",
        select: "Select a document type to generate a draft."
    },
    propertyRegistry: {
        new: "New Property Record",
        save: "Save Property Record",
    },
    timelineView: {
        add: "Add Event",
        new: "New Timeline Entry",
        save: "Save Timeline Event"
    },
    search: {
      placeholder: "Enter a politician, company, or tender ID...",
      button: "Investigate",
      analyzing: "Analyzing"
    },
    loading: {
      title: "Running Financial & Legal Forensics...",
      subtitle: "Auditing assets, procurement contracts, and cross-referencing sources..."
    },
    error: {
      title: "Investigation Halted",
      return: "Return to search"
    },
    actions: {
      save: "Save as Case",
      saved: "Case Saved",
      unsaved: "Unsaved Investigation Results",
      load: "Load Case",
      delete: "Delete Case"
    },
    tabs: {
      overview: "Overview",
      forensics: "Forensics",
      network: "Network & Entities",
      timeline: "Timeline",
      notes: "Case Notes",
      assistant: "AI Co-pilot",
      advices: "Strategy & Advice",
      assets: "Assets & Katastar",
      legal: "Legal Tools"
    },
    overview: {
      summary: "Executive Summary",
      findings: "Key Findings",
      leads: "Investigative Leads (Next Steps)",
      legal: "Legal Framework & Statutory Analysis",
      noLegal: "No specific legal violations were explicitly cited in the analysis.",
      sources: "Sources",
      riskScore: "Corruption Risk Score",
      risk: "Risk",
      safety: "Safety"
    },
    forensics: {
      financial: "Financial Discrepancies",
      estNetWorth: "Est. Net Worth",
      decIncome: "Declared Income",
      assets: "Asset Anomalies",
      noAssets: "No significant asset anomalies detected.",
      offshore: "Offshore Connections",
      noOffshore: "No direct offshore connections found.",
      procurement: "Procurement Audit",
      totalContracts: "Total Contracts",
      winRate: "Win Rate",
      suspicious: "Suspicious Tenders",
      noTenders: "No suspicious tender data available."
    },
    assets: {
      title: "Real Estate & Asset Registry",
      subtitle: "Track properties and verify via Republic Geodetic Authority (RGZ).",
      add: "Add Property",
      openKatastar: "Open eKatastar (RGZ)",
      parcel: "Parcel No.",
      municipality: "Municipality",
      owner: "Owner / Share",
      type: "Type",
      encumbrances: "Encumbrances",
      noProperties: "No property records found or added.",
      disclaimer: "Data is gathered from open sources (news, asset declarations). For official verification, use the eKatastar link."
    },
    entities: {
      title: "Entities & Subjects",
      add: "Add Entity",
      cancel: "Cancel",
      graph: "Graph",
      save: "Save Entity",
      visualize: "Visualize Graph",
      risk: "Risk",
      modal: {
        founded: "Founded / Created",
        modified: "Last Modified",
        registryId: "Registry ID (MB/PIB)",
        assessment: "Risk Assessment",
        notes: "Intelligence Notes",
        noNotes: "No additional intelligence notes recorded for this subject.",
        documents: "Associated Documents & Links",
        analyze: "Analyze Connections"
      },
      form: {
        name: "Name",
        role: "Role",
        notes: "Notes..."
      }
    },
    timeline: {
      title: "Event Timeline & Impact",
      critical: "Critical",
      standard: "Standard",
      transaction: "Transaction",
      violation: "VIOLATION"
    },
    network: {
      title: "Potencijalni Sukobi Interesa",
      noConflicts: "No immediate conflicts detected.",
      modalTitle: "Entity Relationship Network",
      drag: "Drag nodes to rearrange",
      visualizing: "Visualizing",
      focus: "Focusing on"
    },
    notes: {
      title: "Investigator Notes",
      subtitle: "Log evidence, thoughts, and manual findings.",
      empty: "No notes recorded for this case yet.",
      placeholder: "Add a new observation..."
    },
    assistant: {
        title: "AI Investigative Co-pilot",
        subtitle: "Ask follow-up questions, draft subpoenas, or analyze specific connections.",
        placeholder: "Ask about a specific tender or entity...",
        suggested: "Suggested:",
        send: "Send"
    },
    advicesView: {
        title: "Strategic Advisory",
        subtitle: "Operational guidance for the investigation.",
        safety: "Safety Protocols",
        legal: "Legal Strategy",
        public: "Public Interest & Media",
        noData: "No specific strategic advice generated for this case."
    },
    savedCases: {
      title: "Case Archives",
      subtitle: "Access previously analyzed investigations.",
      empty: "No saved investigations found.",
      emptySub: "Run an analysis and click 'Save Report' to bookmark it here.",
      query: "Query"
    },
    sources: {
      title: "Data Intelligence Sources",
      subtitle: "Configure targeted databases for the AI research engine.",
      add: "Add New Source",
      placeholderName: "Source Name",
      placeholderUrl: "Domain (e.g. occrp.org)",
      btn: "Add"
    },
    enums: {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
      safe: "Safe"
    }
  },
  sr: {
    appTitle: "Antikorupcijska Inteligencija",
    header: {
      cases: "Slučajevi",
      sources: "Izvori Podataka"
    },
    hero: {
      titleStart: "Razotkrijte",
      titleEnd: "Skrivenu Istinu",
      subtitle: "Duboka AI istraga o potencijalnoj korupciji i aferama koristeći pravne okvire Srbije.",
      try: "Probaj"
    },
    sidebar: {
      platform: "Platforma",
      research: "Istraživanje",
      admin: "Admin Konzola",
      knowledge: "Baza Znanja",
      people: "Ljudi i Entiteti",
      globalTimeline: "Globalna Vremenska Linija",
      mindMap: "Mreža Veza (Mind Map)",
      activeCase: "Aktivna Istraga",
      signOut: "Odjavi se"
    },
    userDashboard: {
      titleSuffix: "Istraživanje",
      subtitle: "Duboka forenzička analiza javnih zapisa, tendera i korupcijskih mreža.",
      recent: "Nedavne Istrage",
      empty: "Nema pronađenih istraga. Započnite novo istraživanje iznad.",
      query: "Upit"
    },
    admin: {
      title: "Sistemska Administracija",
      subtitle: "Globalni nadzor i konfiguracija.",
      audit: "Revizija",
      config: "Konfig",
      status: "Status Sistema",
      operational: "Operativan",
      intelligence: "Podaci i Izvori",
      activeSources: "aktivnih izvora",
      manage: "Upravljaj Izvorima",
      quota: "API Kvota",
      threats: "Zastavice Pretnji",
      users: "Upravljanje Korisnicima",
      activity: "Aktivnost Uživo",
      role: "Uloga",
      lastActive: "Aktivnost"
    },
    peopleDb: {
        title: "Ljudi i Entiteti",
        search: "Pretraži bazu...",
        noResults: "Nema pronađenih entiteta.",
        bio: "Biografija / Beleške",
        metadata: "Metapodaci",
        linked: "Povezani Slučajevi",
        runAnalysis: "Pokreni Proširenu Analizu",
        reg: "Reg. Broj",
        born: "Osnovano/Rođen"
    },
    globalTimeline: {
        title: "Globalna Vremenska Linija",
        subtitle: "Glavni hronološki zapis kroz sve istrage",
        empty: "Nema zabeleženih događaja u sačuvanim slučajevima."
    },
    legalTools: {
        title: "Pravni Generator",
        subtitle: "Automatska Izrada Dokumenata",
        desc: "Izaberite tip dokumenta za automatsku izradu formalnih pravnih zahteva na osnovu nalaza istrage.",
        foi: "Zahtev za Informacije",
        foiSub: "Pristup informacijama od javnog značaja",
        complaint: "Krivična Prijava",
        complaintSub: "Javno Tužilaštvo",
        preservation: "Zahtev za Očuvanje",
        preservationSub: "Očuvanje Dokaza",
        context: "Učitan Kontekst",
        drafting: "Izrada",
        preview: "Pregled Dokumenta",
        loading: "Izrada pravnog dokumenta na osnovu forenzičkih podataka...",
        select: "Izaberite tip dokumenta za generisanje nacrta."
    },
    propertyRegistry: {
        new: "Novi Zapis o Imovini",
        save: "Sačuvaj Zapis",
    },
    timelineView: {
        add: "Dodaj Događaj",
        new: "Novi Unos u Vremensku Liniju",
        save: "Sačuvaj Događaj"
    },
    search: {
      placeholder: "Unesite političara, firmu ili broj tendera...",
      button: "Istraži",
      analyzing: "Analiziranje"
    },
    loading: {
      title: "Pokretanje Finansijske i Pravne Forenzike...",
      subtitle: "Revizija imovine, javnih nabavki i unakrsna provera izvora..."
    },
    error: {
      title: "Istraga Zaustavljena",
      return: "Povratak na pretragu"
    },
    actions: {
      save: "Sačuvaj Slučaj",
      saved: "Sačuvano",
      unsaved: "Nesačuvani Rezultati Istrage",
      load: "Učitaj Slučaj",
      delete: "Obriši Slučaj"
    },
    tabs: {
      overview: "Pregled",
      forensics: "Forenzika",
      network: "Mreža i Entiteti",
      timeline: "Vremenska Linija",
      notes: "Beleške",
      assistant: "AI Ko-pilot",
      advices: "Strategija i Saveti",
      assets: "Imovina i Katastar",
      legal: "Pravni Alati"
    },
    overview: {
      summary: "Izvršni Sažetak",
      findings: "Ključni Nalazi",
      leads: "Istražni Tragovi (Sledeći Koraci)",
      legal: "Pravni Okvir i Zakonska Analiza",
      noLegal: "U analizi nisu eksplicitno navedena specifična kršenja zakona.",
      sources: "Izvori",
      riskScore: "Skor Rizika od Korupcije",
      risk: "Rizik",
      safety: "Bezbednost"
    },
    forensics: {
      financial: "Finansijska Odstupanja",
      estNetWorth: "Proc. Neto Vrednost",
      decIncome: "Prijavljeni Prihodi",
      assets: "Anomalije Imovine",
      noAssets: "Nisu otkrivene značajne anomalije u imovini.",
      offshore: "Offshore Veze",
      noOffshore: "Nisu pronađene direktne offshore veze.",
      procurement: "Revizija Javnih Nabavki",
      totalContracts: "Ukupno Ugovora",
      winRate: "Stopa Dobitka",
      suspicious: "Sumnjivi Tenderi",
      noTenders: "Nema podataka o sumnjivim tenderima."
    },
    assets: {
      title: "Registar Nepokretnosti (Imovina)",
      subtitle: "Praćenje imovine i verifikacija preko RGZ (eKatastar).",
      add: "Dodaj Imovinu",
      openKatastar: "Otvori eKatastar (RGZ)",
      parcel: "Broj Parcele",
      municipality: "Katastarska Opština",
      owner: "Vlasnik / Udeo",
      type: "Tip",
      encumbrances: "Tereti",
      noProperties: "Nema evidentiranih nepokretnosti.",
      disclaimer: "Podaci su prikupljeni iz otvorenih izvora (vesti, imovinski kartoni). Za zvaničnu proveru koristite eKatastar link."
    },
    entities: {
      title: "Entiteti i Subjekti",
      add: "Dodaj Entitet",
      cancel: "Otkaži",
      graph: "Graf",
      save: "Sačuvaj",
      visualize: "Vizualizuj Graf",
      risk: "Rizik",
      modal: {
        founded: "Osnovano / Kreirano",
        modified: "Poslednja Izmena",
        registryId: "Matični Broj (MB/PIB)",
        assessment: "Procena Rizika",
        notes: "Obaveštajne Beleške",
        noNotes: "Nema dodatnih beleški za ovaj subjekt.",
        documents: "Povezani Dokumenti i Linkovi",
        analyze: "Analiziraj Veze"
      },
      form: {
        name: "Ime",
        role: "Uloga",
        notes: "Beleške..."
      }
    },
    timeline: {
      title: "Vremenska Linija Događaja i Uticaj",
      critical: "Kritično",
      standard: "Standardno",
      transaction: "Transakcija",
      violation: "PREKRŠAJ"
    },
    network: {
      title: "Potencijalni Sukobi Interesa",
      noConflicts: "Nisu detektovani trenutni sukobi interesa.",
      modalTitle: "Mreža Odnosa Entiteta",
      drag: "Povucite čvorove za raspored",
      visualizing: "Vizualizacija",
      focus: "Fokus na"
    },
    notes: {
      title: "Beleške Istražitelja",
      subtitle: "Evidencija dokaza, misli i ručnih nalaza.",
      empty: "Još nema zabeleženih beleški za ovaj slučaj.",
      placeholder: "Dodaj novo zapažanje..."
    },
    assistant: {
        title: "AI Istražni Ko-pilot",
        subtitle: "Postavite dodatna pitanja, sastavite zahteve ili analizirajte veze.",
        placeholder: "Pitajte o specifičnom tenderu ili entitetu...",
        suggested: "Predloženo:",
        send: "Pošalji"
    },
    advicesView: {
        title: "Strateško Savetovanje",
        subtitle: "Operativne smernice za vođenje istrage.",
        safety: "Bezbednosni Protokoli",
        legal: "Pravna Strategija",
        public: "Javni Interes i Mediji",
        noData: "Nema specifičnih strateških saveta za ovaj slučaj."
    },
    savedCases: {
      title: "Arhiva Slučajeva",
      subtitle: "Pristup prethodno analiziranim istragama.",
      empty: "Nema sačuvanih istraga.",
      emptySub: "Pokrenite analizu i kliknite 'Sačuvaj' da biste je ovde arhivirali.",
      query: "Upit"
    },
    sources: {
      title: "Izvori Obaveštajnih Podataka",
      subtitle: "Konfigurišite ciljane baze podataka za AI pretragu.",
      add: "Dodaj Novi Izvor",
      placeholderName: "Ime Izvora",
      placeholderUrl: "Domen (npr. krik.rs)",
      btn: "Dodaj"
    },
    enums: {
      low: "Nizak",
      medium: "Srednji",
      high: "Visok",
      critical: "Kritičan",
      safe: "Bezbedno"
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Serbian
  const [language, setLanguage] = useState<Language>('sr');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};