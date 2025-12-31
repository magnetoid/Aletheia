import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, AnalysisReport, DataSource } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// --- Advanced LRU Persistent Cache Implementation ---
class PersistentCacheManager<T> {
  private cache: Map<string, { data: T; timestamp: number }>;
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly storageKey: string;

  constructor(storageKey: string = 'aletheia_cache_v2', maxSize: number = 20, ttl: number = 1000 * 60 * 60 * 24) { // 20 items, 24 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Verify TTL on load
          const now = Date.now();
          parsed.forEach(([key, value]) => {
             if (now - value.timestamp < this.ttl) {
                 this.cache.set(key, value);
             }
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load cache from storage", e);
    }
  }

  private saveToStorage() {
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (e) {
      console.warn("Failed to save cache to storage (likely quota exceeded)", e);
    }
  }

  get(key: string): T | null {
    if (!this.cache.has(key)) return null;

    const entry = this.cache.get(key)!;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // LRU Policy: Refresh the item's position by re-inserting it
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.saveToStorage();

    return entry.data;
  }

  set(key: string, data: T): void {
    // If key exists, delete it first to update position (LRU)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } 
    // If cache is full, evict the least recently used (first item in Map)
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
  }
}

const analysisCache = new PersistentCacheManager<AnalysisResult>();

// Function to fetch from Serbia Open Data Portal (CKAN API)
const searchOpenDataPortal = async (query: string): Promise<string> => {
  try {
    // Using the CKAN package_search API endpoint
    const apiUrl = `https://data.gov.rs/api/3/action/package_search?q=${encodeURIComponent(query)}&rows=5`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        return ""; 
    }

    const data = await response.json();
    
    if (!data.success || !data.result || !data.result.results || data.result.results.length === 0) {
        return "";
    }

    const datasets = data.result.results.map((ds: any) => {
        // Extract relevant resources (CSV, PDF, XLS, JSON)
        const resources = ds.resources
            ? ds.resources.map((r: any) => `   - [${r.format}] ${r.name || 'Resource'}: ${r.url}`).join('\n')
            : "   No resources listed";
            
        // Clean up description
        const description = ds.notes ? ds.notes.replace(/\r?\n|\r/g, " ").slice(0, 300) + "..." : "No description available";

        return `DATASET TITLE: ${ds.title}\nDESCRIPTION: ${description}\nRESOURCES:\n${resources}`;
    }).join('\n\n');

    return `\n\n*** OFFICIAL OPEN DATA PORTAL (data.gov.rs) API RESULTS ***\nThe following structured datasets were found directly via the Government's Open Data API. You MUST use these official records to verify claims made by other sources:\n\n${datasets}\n\n*******************************************************\n`;
  } catch (error) {
    console.warn("Failed to fetch from Open Data Portal API", error);
    return "";
  }
};

/**
 * Exponential backoff retry mechanism to handle 429 Rate Limit errors
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for 429 status code in various error structures
    const isRateLimit = 
      error?.status === 429 || 
      error?.code === 429 || 
      (error?.message && error.message.includes('429')) ||
      (error?.message && error.message.includes('RESOURCE_EXHAUSTED'));

    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

// Schema for the structured analysis report
const reportSchema = {
  type: Type.OBJECT,
  properties: {
    target: { type: Type.STRING, description: "The main subject of the investigation." },
    targetImage: { type: Type.STRING, description: "A valid public URL to a profile image or logo of the target (e.g., from Wikipedia, Istinomer, or other public sources) if found." },
    riskScore: { type: Type.NUMBER, description: "A calculated corruption risk score from 0 to 100 based on verified red flags." },
    riskLevel: { type: Type.STRING, enum: ["Safe", "Low", "Moderate", "High", "Critical"] },
    summary: { type: Type.STRING, description: "Executive summary of the investigation, highlighting only verified facts." },
    keyFindings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of key suspicious facts or patterns found."
    },
    investigativeLeads: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Concrete actionable next steps for an investigator (e.g., 'Request land registry records for plot X')."
    },
    strategicAdvice: {
      type: Type.OBJECT,
      description: "Strategic advice for the investigator categorized by domain.",
      properties: {
        safetyProtocols: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Safety and security advice for the whistleblower or investigator (e.g., 'Use encrypted comms', 'Physical surveillance risk')." 
        },
        legalStrategy: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Legal pitfalls and strategies (e.g., 'Avoid defamation by verifying X', 'Freedom of Information request to Y')."
        },
        publicInterest: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "How to frame this for the public or media (e.g., 'Focus on the environmental impact', 'Highlight tax money waste')."
        }
      },
      required: ["safetyProtocols", "legalStrategy", "publicInterest"]
    },
    legalAnalysis: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific analysis citing Serbian laws (Zakon o javnim nabavkama, Krivični zakonik, etc.) that may have been violated."
    },
    financialAnalysis: {
      type: Type.OBJECT,
      properties: {
        estimatedNetWorth: { type: Type.STRING, description: "Estimated wealth or 'Unknown' if not verified." },
        declaredIncome: { type: Type.STRING, description: "Officially declared income (Agencija za sprečavanje korupcije) or 'Unknown'." },
        assetDiscrepancies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of discrepancies between income and lifestyle/assets." },
        offshoreConnections: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mentions of tax havens, shell companies, or leaks (Pandora/Panama)." }
      },
      required: ["assetDiscrepancies", "offshoreConnections"]
    },
    properties: {
      type: Type.ARRAY,
      description: "List of real estate properties, land parcels, or apartments linked to the target.",
      items: {
        type: Type.OBJECT,
        properties: {
           municipality: { type: Type.STRING, description: "Katastarska opština (e.g. KO Vračar)" },
           parcelNumber: { type: Type.STRING, description: "Parcel Number if found (e.g. 1234/1)" },
           address: { type: Type.STRING },
           type: { type: Type.STRING, enum: ['land', 'apartment', 'house', 'business', 'other'] },
           area: { type: Type.STRING, description: "Area in m2 or ha" },
           ownerRaw: { type: Type.STRING, description: "Declared owner or share (e.g. 1/1)" },
           encumbrances: { type: Type.STRING, description: "Mortgages, disputes, or 'zabeležba' if mentioned." },
           estimatedValue: { type: Type.STRING },
           notes: { type: Type.STRING }
        }
      }
    },
    procurementAnalysis: {
      type: Type.OBJECT,
      properties: {
        totalContractValue: { type: Type.STRING, description: "Total value of public contracts won if applicable." },
        tenderWinRate: { type: Type.STRING, description: "Percentage or description of win rate." },
        suspiciousTenders: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              authority: { type: Type.STRING, description: "Who awarded the contract" },
              value: { type: Type.STRING },
              date: { type: Type.STRING },
              issue: { type: Type.STRING, description: "Why is it suspicious? (e.g. single bidder)" }
            }
          }
        },
        redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "General procurement red flags." }
      },
      required: ["suspiciousTenders", "redFlags"]
    },
    corruptionTypology: {
      type: Type.OBJECT,
      description: "Score from 0 to 10 for specific types of corruption detected.",
      properties: {
        nepotism: { type: Type.NUMBER, description: "Family connections, cronyism (0-10)" },
        procurementFraud: { type: Type.NUMBER, description: "Bid rigging, overpricing, tender manipulation (0-10)" },
        embezzlement: { type: Type.NUMBER, description: "Misuse of public funds, asset misappropriation (0-10)" },
        shellCompanies: { type: Type.NUMBER, description: "Use of offshore layers, hidden ownership, complex structures (0-10)" },
        politicalInfluence: { type: Type.NUMBER, description: "Abuse of office, trading in influence, party pressure (0-10)" }
      },
      required: ["nepotism", "procurementFraud", "embezzlement", "shellCompanies", "politicalInfluence"]
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "YYYY-MM-DD or approximate date." },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["transaction", "meeting", "legislation", "news", "other", "legal_action"] },
          impactLevel: { type: Type.NUMBER, description: "Impact score 1-10" },
          relatedLaw: { type: Type.STRING, description: "Reference to specific Serbian law article if applicable." }
        }
      }
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { 
              type: Type.STRING, 
              enum: ['person', 'public_official', 'company', 'state_owned_enterprise', 'institution', 'political_party', 'ngo', 'organization', 'event', 'corruption_scheme', 'other'], 
              description: "Classify the entity accurately." 
          },
          role: { type: Type.STRING },
          suspicionLevel: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          notes: { type: Type.STRING },
          relatedLaw: { type: Type.STRING, description: "Specific law violated by this entity if applicable (e.g. Criminal Code Art 359)." },
          metadata: {
            type: Type.OBJECT,
            properties: {
              foundingDate: { type: Type.STRING, description: "Date of incorporation (companies) or first public appearance" },
              lastRegistryUpdate: { type: Type.STRING, description: "Date of last official record change in registers (APR, etc)" },
              registrationNumber: { type: Type.STRING, description: "Company ID (MB) or Tax ID (PIB) if available" },
              location: { type: Type.STRING, description: "Location for events or headquarters for companies." }
            }
          },
          documents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["registry", "news", "court", "contract", "other"] },
                date: { type: Type.STRING }
              }
            }
          }
        }
      }
    },
    connections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING, description: "Name of the entity the link starts from. Must match a name in the entities list." },
          to: { type: Type.STRING, description: "Name of the entity the link goes to. Must match a name in the entities list." },
          type: { type: Type.STRING, description: "Type of relationship e.g., 'owner', 'associate', 'spouse', 'shell company'" }
        }
      }
    },
    potentialConflicts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of potential conflicts of interest."
    }
  },
  required: ["target", "riskScore", "riskLevel", "summary", "timeline", "entities", "connections", "legalAnalysis", "financialAnalysis", "procurementAnalysis", "corruptionTypology", "investigativeLeads", "strategicAdvice", "properties"]
};

export const analyzeTarget = async (query: string, sources: DataSource[], language: 'en' | 'sr' = 'sr'): Promise<AnalysisResult> => {
  try {
    const activeSourcesIds = sources.filter(s => s.active).map(s => s.id).sort().join(',');
    const cacheKey = `analyze_v2:${query.toLowerCase().trim()}:${language}:${activeSourcesIds}`;

    // Check LRU cache
    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult) {
        console.log("Serving from internal Persistent LRU cache:", cacheKey);
        return cachedResult;
    }

    // 1. Fetch Open Data Context
    const openDataPromise = searchOpenDataPortal(query);
    
    const activeSources = sources.filter(s => s.active);
    const sourceInstructions = activeSources.length > 0 
      ? `TRUSTED KNOWLEDGE GRAPH (INDEX): 
         You must prioritize and restrict your search primarily to the following indexed investigative journalism domains. 
         Treat these as your primary database of verified facts:
         ${activeSources.map(s => `- ${s.name} (site: ${s.url})`).join('\n')}
         
         INSTRUCTION: When searching, append "site:domain.rs" to your internal search queries for each of these high-value targets to ensure deep indexing.`
      : "";

    const languageInstruction = language === 'sr' 
      ? "IMPORTANT: Provide all free-text content (summary, titles, descriptions, notes, keyFindings, legalAnalysis, investigativeLeads, strategicAdvice) in Serbian language (Latin script). However, keep all ENUM values (e.g. riskLevel, suspicionLevel, type) strictly in ENGLISH as defined in the schema." 
      : "Provide all content in English.";

    // Wait for open data API results
    const openDataContext = await openDataPromise;

    // Use retry mechanism for the main AI call
    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Execute a strict DEEP FORENSIC INVESTIGATION & VERIFICATION ALGORITHM on: "${query}" (Serbia/Balkans Context).
            
            SCOPE: 20 YEARS (2004 - Present). You MUST dig into historical records, not just recent news.
            
            ${sourceInstructions}
            
            ${openDataContext}

            ${languageInstruction}

            --- VERIFICATION ALGORITHM (MANDATORY) ---
            
            PHASE 1: SOURCE TIERING & WEIGHTING
            - TIER 1 (Official): APR (Business Registers Agency), Katastar (RGZ), Agencija za sprečavanje korupcije, Courts (Sudovi), data.gov.rs. -> Weight: 100% (Accept as Fact)
            - TIER 2 (Investigative): KRIK, CINS, BIRN, Insajder, N1, Nova, Vreme, NIN, Radar, VOICE, Istinomer. -> Weight: 80% (High Confidence)
            - TIER 3 (Media/Tabloids): Informer, Kurir, Alo, General Blogs. -> Weight: 20% (Treat as Rumor/Unverified)
            
            PHASE 2: DATA TRIANGULATION
            - A "fact" requires: 1 Official Source OR 2 Independent Investigative Sources.
            - If verified by Tier 1 source: Mark as CONFIRMED.
            - If only in Tier 3: Exclude or label as "Alleged".
            
            PHASE 3: HISTORICAL DEPTH (20-YEAR LOOKBACK)
            - Check for "Brisana preduzeća" (Dissolved companies) in APR history.
            - Trace "Preletači" (Party switching) history. Was the target active in previous regimes (DS, DSS, G17+, SRS)?
            - Investigate privatization deals from 2000s.
            - Look for archived scandals (aferu) that may have been buried.
            - Correlate business success with government administration changes.

            PHASE 4: HALLUCINATION PREVENTION (NULL STATES)
            - If you cannot find a Company ID (MB), Tax ID (PIB), or exact Date: Output "Unknown". DO NOT GUESS NUMBERS.
            - If a specific law violation is not clear, do not invent an article number.
            - For "estimatedNetWorth", if no data exists, state "Unknown".

            PHASE 5: ENTITY CLASSIFICATION
            - Strictly categorize: 'person' vs 'public_official' vs 'company'.
            - For Public Officials: Search specifically for "Imovinski karton" (Asset Declaration) history.

            --- OUTPUT REQUIREMENTS ---

            1. **IMAGE**: Attempt to find a valid URL for the target (Wikimedia/Istinomer).
            
            2. **FINANCIALS**: 
                - Check declared income vs lifestyle over time.
                - Flag offshore zones (BVI, Cyprus, UAE).

            3. **PROCUREMENT**: 
                - Check for "Single Bidder" (Jedan ponuđač) contracts.
                - Check for "Negotiated Procedure" (Pregovarački postupak).
                - Analyze historical tender wins vs government changes.

            4. **LEGAL**: 
                - Cite *specific* articles of: Zakon o javnim nabavkama, Krivični zakonik, Zakon o sprečavanju korupcije.
                - IF query mentions a law, find PRECEDENTS.

            5. **SCORING**:
                - Calculate Risk Score (0-100) based ONLY on verified Tier 1/Tier 2 findings.

            6. **TIMELINE**:
                - Build a chronological sequence of events spanning up to 20 years. Use exact dates where possible.

            Be cynical, precise, and purely evidence-based.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: reportSchema,
                thinkingConfig: { thinkingBudget: 32768 }, 
            },
        });
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const report = JSON.parse(text);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const result = {
      report,
      groundingChunks
    };

    // Store in LRU cache
    analysisCache.set(cacheKey, result);

    return result;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Creates a chat session initialized with the investigation context.
 * This allows the user to ask follow-up questions about the report.
 */
export const createInvestigationChat = (report: AnalysisReport, language: 'en' | 'sr') => {
  const contextInstruction = `
    You are Aletheia AI, an expert anticorruption investigator assistant.
    
    CONTEXT:
    You have just completed a deep forensic analysis of "${report.target}".
    Here is the structured report you generated:
    ${JSON.stringify(report)}
    
    USER GOAL:
    The user is an investigator asking follow-up questions to dig deeper, draft documents, or clarify findings.
    
    INSTRUCTIONS:
    1. Answer strictly based on the provided report and your general knowledge of Serbian law/context.
    2. If the user asks for a document (subpoena, memo), draft it professionally.
    3. Be precise, cynical, and fact-based.
    4. ${language === 'sr' ? 'Reply in Serbian language (Latin script).' : 'Reply in English.'}
  `;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: contextInstruction,
    }
  });
};

/**
 * Generates a specific legal document based on the analysis.
 */
export const generateLegalDocument = async (
    report: AnalysisReport, 
    docType: 'foi' | 'complaint' | 'preservation', 
    language: 'en' | 'sr'
  ): Promise<string> => {
    
    const instructions = {
        foi: `Draft a formal "Zahtev za pristup informacijama od javnog značaja" (Freedom of Information Request) to the relevant Serbian institution. 
              Focus on requesting documents related to the "${report.target}" case, specifically the suspicious tenders and asset discrepancies found. 
              Cite the Law on Free Access to Information of Public Importance.`,
        
        complaint: `Draft a "Krivična prijava" (Criminal Complaint) to the Public Prosecutor (Tužilaštvo). 
                    Summarize the evidence against "${report.target}" based on the analysis findings (procurement fraud, tax evasion, etc.).
                    Cite specific articles of the Criminal Code (Krivični zakonik) and Law on Public Procurement.`,
        
        preservation: `Draft a "Zahtev za očuvanje dokaza" (Evidence Preservation Letter) to a relevant institution or company. 
                       Demand they preserve all digital and physical records related to "${report.target}" and specific tender IDs mentioned in the report.`
    };

    const prompt = `
        ACT AS: Expert Legal Counsel in Serbian Anti-Corruption Law.
        TASK: ${instructions[docType]}
        
        CONTEXT DATA:
        Target: ${report.target}
        Suspicious Findings: ${report.keyFindings.join("; ")}
        Legal Violations: ${report.legalAnalysis.join("; ")}
        Tenders: ${JSON.stringify(report.procurementAnalysis.suspiciousTenders)}
        
        OUTPUT FORMAT:
        - Plain text, formatted as a formal legal letter.
        - Include placeholders like [DATUM], [INSTITUCIJA] where specific info is missing.
        - ${language === 'sr' ? 'Write strictly in Serbian (Latin script).' : 'Write in English.'}
        - Tone: Professional, authoritative, legally precise.
    `;

    // Wrapped in retry for robustness
    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                temperature: 0.3, // Low temperature for consistent legal drafting
            }
        });
    });

    return response.text || "Failed to generate document.";
};