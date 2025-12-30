import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, AnalysisReport, DataSource } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// --- Advanced LRU Cache Implementation ---
class CacheManager<T> {
  private cache: Map<string, { data: T; timestamp: number }>;
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number = 50, ttl: number = 1000 * 60 * 60) { // 50 items, 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    if (!this.cache.has(key)) return null;

    const entry = this.cache.get(key)!;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // LRU Policy: Refresh the item's position by re-inserting it
    this.cache.delete(key);
    this.cache.set(key, entry);

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
  }

  clear(): void {
    this.cache.clear();
  }
}

const analysisCache = new CacheManager<AnalysisResult>();

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

    return `\n\n*** OFFICIAL OPEN DATA PORTAL (data.gov.rs) API RESULTS ***\nThe following structured datasets were found directly via the Government's Open Data API. Use these specific resource URLs and descriptions to ground your findings regarding public spending, procurement, or entity registration:\n\n${datasets}\n\n*******************************************************\n`;
  } catch (error) {
    console.warn("Failed to fetch from Open Data Portal API", error);
    return "";
  }
};

// Schema for the structured analysis report
const reportSchema = {
  type: Type.OBJECT,
  properties: {
    target: { type: Type.STRING, description: "The main subject of the investigation." },
    targetImage: { type: Type.STRING, description: "A valid public URL to a profile image or logo of the target (e.g., from Wikipedia, Istinomer, or other public sources) if found." },
    riskScore: { type: Type.NUMBER, description: "A calculated corruption risk score from 0 to 100." },
    riskLevel: { type: Type.STRING, enum: ["Safe", "Low", "Moderate", "High", "Critical"] },
    summary: { type: Type.STRING, description: "Executive summary of the investigation." },
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
        estimatedNetWorth: { type: Type.STRING, description: "Estimated wealth or 'Unknown'" },
        declaredIncome: { type: Type.STRING, description: "Officially declared income or 'Unknown'" },
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
          type: { type: Type.STRING, enum: ['person', 'company', 'organization', 'event', 'corruption_scheme', 'other'], description: "Classify the entity." },
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
    const cacheKey = `analyze:${query.toLowerCase().trim()}:${language}:${activeSourcesIds}`;

    // Check LRU cache
    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult) {
        console.log("Serving from internal LRU cache:", cacheKey);
        return cachedResult;
    }

    // 1. Fetch Open Data Context
    const openDataPromise = searchOpenDataPortal(query);
    
    const activeSources = sources.filter(s => s.active);
    const sourceInstructions = activeSources.length > 0 
      ? `PRIORITY: You must prioritize and cross-reference information from the following trusted investigative databases and outlets: 
         ${activeSources.map(s => `- ${s.name} (${s.url})`).join('\n')}
         
         SPECIFICALLY CHECK THESE INTEGRITY SOURCES FOR PEOPLE PROFILES:
         - birodi.rs (Bureau for Social Research)
         - istinomer.rs (Truth-o-meter)
         - wikipedia.org
         - eKatastar (Republic Geodetic Authority)
         
         Use Google Search to specifically query these domains (e.g. site:istinomer.rs "${query}") along with general queries.`
      : "";

    const languageInstruction = language === 'sr' 
      ? "IMPORTANT: Provide all free-text content (summary, titles, descriptions, notes, keyFindings, legalAnalysis, investigativeLeads, strategicAdvice) in Serbian language (Latin script). However, keep all ENUM values (e.g. riskLevel, suspicionLevel, type) strictly in ENGLISH as defined in the schema." 
      : "Provide all content in English.";

    // Wait for open data API results
    const openDataContext = await openDataPromise;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a deep forensic investigative analysis on: "${query}" within the context of Serbia and the Western Balkans.
      
      ${sourceInstructions}
      
      ${openDataContext}

      ${languageInstruction}

      CORE OBJECTIVES:
      1. **IMAGE SOURCING**:
         - Attempt to find a public URL for an image of the target (e.g. from Wikimedia, Istinomer, official profiles). Include this in the 'targetImage' field.

      2. **FINANCIAL FORENSICS**:
         - Compare estimated net worth/lifestyle vs. officially declared income. Look for discrepancies.
         - Search for connections to offshore tax havens (BVI, Cyprus, Delaware) or leaks (Panama/Pandora Papers).
         - Identify unexplained property ownership or assets held by family members (proxies).
      
      3. **PROCUREMENT AUDIT**:
         - Analyze public tenders (javne nabavke). Look for "single bidder" contracts.
         - Identify contracts awarded via "negotiated procedure without publication of contract notice".
         - Check for connections between the target and the companies winning these tenders (conflict of interest).
      
      4. **NETWORK MAPPING & ENTITY METADATA**:
         - Map out the network of connected entities.
         - **STRICT CLASSIFICATION**: You MUST classify every entity as one of: 'person', 'company', 'organization', 'event', 'corruption_scheme'.
         - 'corruption_scheme' entities should represent abstract concepts like "Jovanjica Affair" or "Krušik Scandal".
         - 'event' entities should represent key meetings or incidents.
         - **CRITICAL**: For 'company' entities, find Registration Number (MB/PIB) and Founding Date. For 'person' entities, find DOB or first public appearance.
         - Include links to official registry entries or key news articles (as 'documents').
      
      5. **LEGAL ANALYSIS**: 
         - Cross-reference findings with specific Serbian legal frameworks.
         - Law on Public Procurement (Zakon o javnim nabavkama)
         - Law on Prevention of Corruption (Zakon o sprečavanju korupcije)
         - Criminal Code (Krivični zakonik)

      6. **CORRUPTION TYPOLOGY SCORING**:
         - Score the target (0-10) on the following axes based on evidence:
           - Nepotism: Favoring relatives/friends for positions or contracts.
           - Procurement Fraud: Rigging tenders, inflating prices.
           - Embezzlement: Theft of public resources.
           - Shell Companies: Using complex structures to hide ownership.
           - Political Influence: Abusing power for personal gain.
      
      7. **INVESTIGATIVE LEADS**:
         - Provide 3-5 concrete, actionable next steps for an investigator.
         - Examples: "Request bank records for entity X", "Verify land registry ownership for Plot 123 in Katastar", "Check cross-border entries for Person Y".

      8. **STRATEGIC ADVICE**:
         - **Safety Protocols**: Advise the investigator on physical and digital security risks associated with this specific target.
         - **Legal Strategy**: Suggest legal avenues for obtaining more info (FOIA requests) or pitfalls to avoid (defamation suits).
         - **Public Interest**: Suggest how to frame the narrative for maximum public impact.
      
      9. **REAL ESTATE / KATASTAR**:
         - Specifically search for declared assets (Imovinski karton) or news reports mentioning real estate.
         - If parcel numbers (Broj parcele) or Municipalities (Katastarska opština) are mentioned, extract them into the 'properties' array.
      
      10. **TIMELINE**: Construct a detailed timeline with "relatedLaw" citations where applicable.
      
      Be objective, fact-based, and forensic in your tone. 
      
      If no corruption is found, state that clearly in the summary and assign a low risk score.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        thinkingConfig: { thinkingBudget: 32768 }, 
      },
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