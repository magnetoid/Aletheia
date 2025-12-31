
export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: 'transaction' | 'meeting' | 'legislation' | 'news' | 'other' | 'legal_action';
  impactLevel: number; // 1-10
  relatedLaw?: string; // Specific Serbian law reference (e.g., "Zakon o javnim nabavkama čl. 12")
}

export interface EntityMetadata {
  foundingDate?: string; // For companies: Incorporation date; For people: First public appearance/DOB
  lastRegistryUpdate?: string; // Date of last change in APR or relevant registry
  registrationNumber?: string; // MB/PIB for companies
  location?: string; // For events or companies
}

export interface EntityDocument {
  title: string;
  url?: string;
  type: 'registry' | 'news' | 'court' | 'contract' | 'other';
  date?: string;
}

export type EntityType = 
  | 'person' 
  | 'public_official' 
  | 'company' 
  | 'state_owned_enterprise' 
  | 'institution' 
  | 'political_party' 
  | 'ngo' 
  | 'organization'
  | 'event' 
  | 'corruption_scheme' 
  | 'other';

export interface Entity {
  name: string;
  type: EntityType;
  role: string;
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  investigatorNotes?: string;
  relatedLaw?: string;
  metadata?: EntityMetadata;
  documents?: EntityDocument[];
}

export interface Connection {
  from: string;
  to: string;
  type: string;
}

export interface Property {
  municipality: string; // "KO Savski Venac"
  parcelNumber: string; // "1234/5"
  address?: string;
  type: 'land' | 'apartment' | 'house' | 'business' | 'other';
  area: string; // "56m2"
  ownerRaw: string; // "Marko Markovic 1/1" or "Private property"
  encumbrances?: string; // "Mortgage", "Dispute", "Zabeležba"
  estimatedValue?: string;
  notes?: string;
}

export interface FinancialAnalysis {
  estimatedNetWorth: string;
  declaredIncome: string;
  assetDiscrepancies: string[]; // e.g., "Owns 5 apartments with $10k salary"
  offshoreConnections: string[]; // e.g., "Linked to BVI shell company via Panama Papers"
}

export interface SuspiciousTender {
  authority: string;
  value: string;
  date: string;
  issue: string; // e.g., "Single bidder", "Negotiated procedure without publication"
}

export interface ProcurementAnalysis {
  totalContractValue: string;
  tenderWinRate: string; // e.g. "85% of applied tenders"
  suspiciousTenders: SuspiciousTender[];
  redFlags: string[];
}

export interface CorruptionTypology {
  nepotism: number; // 0-10: Family connections, cronyism
  procurementFraud: number; // 0-10: Bid rigging, overpricing
  embezzlement: number; // 0-10: Misuse of funds, asset misappropriation
  shellCompanies: number; // 0-10: Hidden ownership, offshore layers
  politicalInfluence: number; // 0-10: Abuse of office, trading in influence, party pressure (0-10)
}

export interface StrategicAdvice {
  safetyProtocols: string[];
  legalStrategy: string[];
  publicInterest: string[];
}

export interface AnalysisReport {
  target: string;
  targetImage?: string; // URL to a public image of the target
  riskScore: number; // 0-100
  riskLevel: 'Safe' | 'Low' | 'Moderate' | 'High' | 'Critical';
  summary: string;
  keyFindings: string[];
  investigativeLeads: string[]; // New: Actionable next steps
  legalAnalysis: string[]; // Specific analysis against Serbian laws
  financialAnalysis: FinancialAnalysis;
  procurementAnalysis: ProcurementAnalysis;
  corruptionTypology: CorruptionTypology;
  timeline: TimelineEvent[];
  entities: Entity[];
  connections: Connection[];
  potentialConflicts: string[];
  strategicAdvice?: StrategicAdvice;
  properties?: Property[]; // New: Real Estate / Katastar data
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface AnalysisResult {
  report: AnalysisReport;
  groundingChunks: GroundingChunk[];
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  active: boolean;
}

export interface UserNote {
  id: string;
  content: string;
  timestamp: number;
}

export interface SavedInvestigation {
  id: string;
  timestamp: number;
  lastUpdated: number;
  query: string;
  result: AnalysisResult;
  notes: UserNote[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export enum AppState {
  IDLE,
  ANALYZING,
  COMPLETE,
  ERROR,
}