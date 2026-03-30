import { GoogleGenAI } from "@google/genai";
import { MonitoringConfig, MonitoringReport, REPORT_SCHEMA } from "../types";
import { fetchRSSFeeds } from "./rssService";

// Use process.env.GEMINI_API_KEY or import.meta.env.VITE_GEMINI_API_KEY
export const AVAILABLE_MODELS = [
  { 
    id: 'gemini-3.1-pro-preview', 
    name: 'Gemini 3.1 Pro (Preview)', 
    description: 'The "Genius" Tier. Best for deep reasoning or complex code snippets.', 
    badge: 'Premium',
    contextWindow: '128K - 2M Tokens',
    inferenceSpeed: 'Advanced Reasoning',
    rpm: 2, rpd: 25, tpm: 100000
  },
  { 
    id: 'gemini-3-flash-preview', 
    name: 'Gemini 3 Flash (Preview)', 
    description: 'The "Efficiency" Tier. Ideal for chat interfaces and real-time summaries.', 
    badge: 'Fast',
    contextWindow: '1M Tokens',
    inferenceSpeed: 'High Performance',
    rpm: 10, rpd: 250, tpm: 250000
  },
  { 
    id: 'gemini-2.5-pro', 
    name: 'Gemini 2.5 Pro (Stable)', 
    description: 'The "Workhorse" Tier. Solid for daily productivity and moderate RAG tasks.', 
    badge: 'Stable',
    contextWindow: '128K - 2M Tokens',
    inferenceSpeed: 'Advanced',
    rpm: 5, rpd: 100, tpm: 250000
  },
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash (Stable)', 
    description: 'Stable efficiency model. Great for general purpose automation.', 
    badge: 'Stable',
    contextWindow: '1M Tokens',
    inferenceSpeed: 'Fast',
    rpm: 10, rpd: 250, tpm: 250000
  },
  { 
    id: 'gemini-2.5-flash-lite', 
    name: 'Gemini 2.5 Flash-Lite (Stable)', 
    description: 'The "Bulk" Tier. Best for high-volume automation or massive data cleaning.', 
    badge: 'Bulk',
    contextWindow: '1M Tokens',
    inferenceSpeed: 'Ultra Fast',
    rpm: 15, rpd: 1500, tpm: 250000
  }
];

const QUOTA_STORAGE_KEY = 'gemini_quota_tracking';

export function trackUsage(modelId: string) {
  try {
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    let quotas = saved ? JSON.parse(saved) : {};
    const today = new Date().toISOString().split('T')[0];
    
    if (!quotas[modelId] || quotas[modelId].lastUsed !== today) {
      quotas[modelId] = { requestsToday: 0, lastUsed: today };
    }
    
    quotas[modelId].requestsToday += 1;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quotas));
  } catch (e) {
    console.error("Failed to track usage:", e);
  }
}

export function getUsage(modelId: string) {
  try {
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!saved) return 0;
    const quotas = JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    if (!quotas[modelId] || quotas[modelId].lastUsed !== today) return 0;
    return quotas[modelId].requestsToday;
  } catch (e) {
    return 0;
  }
}

export function getBestModel(requestedModel: string, dateRange: string): { modelId: string, wasDowngraded: boolean, reason?: string } {
  const modelInfo = AVAILABLE_MODELS.find(m => m.id === requestedModel);
  const usage = getUsage(requestedModel);
  
  // Fallback for unknown/removed models
  if (!modelInfo) {
    return { 
      modelId: 'gemini-2.5-flash-lite', 
      wasDowngraded: true, 
      reason: 'Selected model is no longer available. Switching to Gemini 2.5 Flash-Lite.' 
    };
  }
  
  // Rule: If 3 month scan, use highest capacity model (Flash-Lite)
  if (dateRange === '3m' || dateRange === 'custom') {
    if (requestedModel !== 'gemini-2.5-flash-lite') {
      return { 
        modelId: 'gemini-2.5-flash-lite', 
        wasDowngraded: true, 
        reason: 'Large date range detected. Switching to "Bulk Tier" (Gemini 2.5 Flash-Lite) to prevent quota exhaustion.' 
      };
    }
  }
  
  // Rule: If quota exhausted, fallback
  if (modelInfo && usage >= modelInfo.rpd) {
    // Fallback chain: Pro -> Flash -> Flash-Lite
    if (requestedModel.includes('pro')) {
      return { 
        modelId: 'gemini-2.5-flash', 
        wasDowngraded: true, 
        reason: `Daily quota for ${modelInfo.name} exhausted. Switching to Gemini 2.5 Flash.` 
      };
    } else if (requestedModel.includes('flash') && !requestedModel.includes('lite')) {
      return { 
        modelId: 'gemini-2.5-flash-lite', 
        wasDowngraded: true, 
        reason: `Daily quota for ${modelInfo.name} exhausted. Switching to Gemini 2.5 Flash-Lite.` 
      };
    }
  }
  
  return { modelId: requestedModel, wasDowngraded: false };
}

// Default fallback API key provided by the user
const DEFAULT_GEMINI_API_KEY = "AIzaSyDbbhg18SnJzZleOWBD5uJBQrukVm6Kyrs";

export const getApiKey = () => {
  // Use direct string references for Vite's 'define' to work reliably
  const processKey = process.env.GEMINI_API_KEY;
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  const key = (processKey || viteKey || DEFAULT_GEMINI_API_KEY).trim();
  
  // Ignore common placeholders
  const invalidPlaceholders = [
    'YOUR_GEMINI_API_KEY', 
    'MY_GEMINI_API_KEY', 
    'AIza...', 
    'undefined', 
    'null',
    ''
  ];

  if (invalidPlaceholders.includes(key)) {
    return DEFAULT_GEMINI_API_KEY;
  }
  
  return key;
};

export const isApiKeyValid = () => {
  const key = getApiKey();
  return key.length > 0;
};

const defaultAi = new GoogleGenAI({ apiKey: getApiKey() });

interface Article {
  id: string;
  title: string;
  uri: string;
  snippet: string;
  pubDate: string | null;
  status: 'Verified' | 'Unverified' | 'Potentially Hallucinated';
  sphere: 'National' | 'Provincial' | 'Local' | 'Unclassified';
  subChunk: 'Figure Head' | 'Service Delivery' | 'Both' | 'General';
  source: string;
  location?: string;
  verifiedDate?: string;
}

/**
 * Systematic Categorization Engine (Heuristic-based to save AI tokens)
 */
function categorizeArticle(title: string, snippet: string, initialSphere?: string): { 
  sphere: Article['sphere'], 
  subChunk: Article['subChunk'] 
} {
  const content = (title + " " + snippet).toLowerCase();
  
  // 1. Sphere Detection
  let sphere: Article['sphere'] = (initialSphere as Article['sphere']) || "Unclassified";
  
  const nationalKeywords = [
    "national", "president", "parliament", "ramaphosa", "treasury", "sars", "reserve bank", 
    "pretoria", "cape town", "cabinet", "minister", "department of", "national assembly",
    "south africa", "country", "federal", "central government", "anc", "da", "eff", "mk party",
    "union buildings", "constitutional court", "supreme court of appeal", "npa", "siu", "sandf", "saps"
  ];
  const provincialKeywords = [
    "eastern cape", "ec government", "mabuyane", "premier", "bhisho", "mec", "provincial legislature",
    "provincial government", "province", "coega", "east london idz", "elidz", "ecdc", "ec provincial",
    "eastern cape province", "ec legislature", "ec cabinet", "oscar mabuyane", "ec health", "ec education",
    "ec treasury", "ec transport", "ec public works", "ec human settlements", "ec social development",
    "ec cogta", "ec drdar", "ec dedat", "ec sports", "ec dpt", "ec dsd", "ec doe", "ec doh"
  ];
  const localKeywords = [
    "municipality", "mayor", "metro", "nelson mandela bay", "buffalo city", "gqeberha", 
    "east london", "mthatha", "makhanda", "kariega", "district municipality", "ward",
    "councillor", "local government", "town hall", "port elizabeth", "uitenhage", "despatch",
    "king william's town", "grahamstown", "port st johns", "jeffreys bay", "st francis bay",
    "nmbm", "bcm", "ortambo", "chris hani", "joe gqabi", "alfred nzo", "amathole", "sarah baartman",
    "makana", "kouga", "sunday's river", "blue crane", "dr beyers naude", "koukamma", "ngqushwa",
    "raymond mhlaba", "great kei", "mnquma", "mbhashe", "intsika yethu", "emalahleni", "enoch mgijima",
    "sakhisizwe", "engcobo", "senqu", "elundini", "walter sisulu", "king sabata dalindyebo", "ksd",
    "nyandeni", "mhlontlo", "ingquza hill", "matatiele", "umzimvubu", "mbizana", "ntabankulu",
    "by-law", "service delivery protest"
  ];

  if (sphere === "Unclassified") {
    // Check Provincial first as it's our primary focus
    if (provincialKeywords.some(kw => content.includes(kw))) sphere = "Provincial";
    else if (localKeywords.some(kw => content.includes(kw))) sphere = "Local";
    else if (nationalKeywords.some(kw => content.includes(kw))) sphere = "National";
  }

  // 2. Sub-chunk Detection (Figure Head vs Service Delivery)
  const figureHeadKeywords = [
    "premier", "mec", "mayor", "president", "minister", "leadership", "visit", "address", 
    "speech", "governance", "executive", "cabinet", "council", "speaker", "political",
    "appointment", "reshuffle", "leadership contest", "party leader", "oscar mabuyane",
    "retief odendaal", "gary van niekerk", "princess faku"
  ];
  const serviceDeliveryKeywords = [
    "water", "electricity", "roads", "housing", "health", "education", "infrastructure", 
    "potholes", "loadshedding", "clinic", "school", "sanitation", "waste", "service delivery", 
    "protest", "strike", "refuse", "sewage", "power cut", "hospital", "transport", "bus",
    "rail", "police", "crime", "safety", "security", "fire", "emergency", "audit", "budget",
    "expenditure", "corruption", "tender", "procurement", "waste management", "water crisis"
  ];
  
  const hasFigureHead = figureHeadKeywords.some(kw => content.includes(kw));
  const hasServiceDelivery = serviceDeliveryKeywords.some(kw => content.includes(kw));
  
  let subChunk: Article['subChunk'] = "General";
  if (hasFigureHead && hasServiceDelivery) subChunk = "Both";
  else if (hasFigureHead) subChunk = "Figure Head";
  else if (hasServiceDelivery) subChunk = "Service Delivery";
  
  return { sphere, subChunk };
}

/**
 * Helper to call Gemini API with exponential backoff retry logic
 */
async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 2000,
  signal?: AbortSignal
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new Error("ABORTED");
    try {
      return await fn();
    } catch (error: any) {
      if (signal?.aborted) throw new Error("ABORTED");
      lastError = error;
      
      console.error("Gemini API Error Details:", {
        message: error.message,
        status: error.status,
        code: error.code
      });

      const isQuotaExhausted = 
        error.status === "RESOURCE_EXHAUSTED" || 
        error.code === 429 || 
        error.message?.includes("429") || 
        (error.message?.toLowerCase().includes("quota") && !error.message?.toLowerCase().includes("invalid"));
      
      if (isQuotaExhausted) {
        if (attempt === maxRetries) {
          // Track exhaustion to trigger UI popup
          const modelId = "unknown"; // We don't have easy access to modelId here without passing it down
          throw new Error("QUOTA_EXHAUSTED");
        }
        const delay = (initialDelay * 4) * Math.pow(2, attempt) + Math.random() * 5000;
        console.warn(`Gemini API Quota Exhausted. Retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, delay);
          signal?.addEventListener('abort', () => { clearTimeout(timeout); reject(new Error("ABORTED")); }, { once: true });
        });
        continue;
      }

      const isTransient = 
        error.message?.includes("Rpc failed") || 
        error.message?.includes("xhr error") ||
        error.message?.includes("fetch failed") ||
        error.status === "UNKNOWN" ||
        (error.code >= 500 && error.code <= 599);

      if (!isTransient || attempt === maxRetries) throw error;

      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Gemini API Transient Error. Retrying in ${Math.round(delay)}ms...`);
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, delay);
        signal?.addEventListener('abort', () => { clearTimeout(timeout); reject(new Error("ABORTED")); }, { once: true });
      });
    }
  }
  throw lastError;
}

/**
 * Helper to call internal API with retry logic
 */
async function fetchWithRetry(url: string, options?: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || i === maxRetries) return response;
      // If 5xx or 429, retry
      if (response.status >= 500 || response.status === 429) {
        const delay = 1000 * Math.pow(2, i);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return response;
    } catch (e) {
      lastError = e;
      if (i === maxRetries) throw e;
      const delay = 1000 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export async function listAvailableModels(userApiKey?: string): Promise<any[]> {
  const apiKey = (userApiKey && userApiKey.trim()) || getApiKey();
  if (!apiKey || apiKey.length < 10) return [];
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const models: any[] = [];
    const response = await ai.models.list();
    for await (const model of response) {
      models.push(model);
    }
    return models;
  } catch (error) {
    console.error("Failed to list models:", error);
    return [];
  }
}

export async function runMonitoring(
  config: MonitoringConfig, 
  userApiKey?: string,
  onProgress?: (report: MonitoringReport, status: string) => void,
  signal?: AbortSignal,
  disabledSources: string[] = [],
  customSources: any[] = [],
  selectedModel: string = "gemini-2.5-flash-lite"
): Promise<MonitoringReport> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Apply best model logic
  const { modelId: activeModel, wasDowngraded, reason } = getBestModel(selectedModel, config.dateRange);
  if (wasDowngraded && onProgress) {
    console.warn(reason);
  }
  
  const getStartDate = (range: MonitoringConfig['dateRange']) => {
    const d = new Date(now);
    switch(range) {
      case '24h': d.setHours(d.getHours() - 24); break;
      case '72h': d.setHours(d.getHours() - 72); break;
      case '7d': d.setDate(d.getDate() - 7); break;
      case '14d': d.setDate(d.getDate() - 14); break;
      case '21d': d.setDate(d.getDate() - 21); break;
      case '28d': d.setDate(d.getDate() - 28); break;
      case '3m': d.setMonth(d.getMonth() - 3); break;
      case 'custom': return config.customDateRange?.start || today;
    }
    return d.toISOString().split('T')[0];
  };

  const startDate = getStartDate(config.dateRange);
  const endDate = config.dateRange === 'custom' && config.customDateRange?.end ? config.customDateRange.end : today;
  const dateRangeText = config.dateRange === 'custom' 
    ? `from ${config.customDateRange?.start} to ${config.customDateRange?.end}`
    : `last ${config.dateRange}`;

  let currentReport: MonitoringReport = {
    query_period: dateRangeText,
    generated_at: new Date().toISOString(),
    summary: {
      total_articles_scanned: 0,
      total_relevant_articles: 0,
      total_highly_relevant: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      mixed: 0,
      high_risk: 0,
      critical_risk: 0,
      response_needed: 0,
      top_topics: [],
      top_sources: [],
      top_entities: [],
      top_municipalities_or_districts: [],
      swot_analysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      social_climate_summary: ""
    },
    articles: [],
    verification_checklist: []
  };

  const log = (msg: string) => {
    if (onProgress) {
      const timestamp = new Date().toLocaleTimeString('en-ZA', { hour12: false });
      onProgress(currentReport, `[${timestamp}] ${msg}`);
    }
  };

  const apiKey = (userApiKey && userApiKey.trim()) || getApiKey();
  if (!apiKey || apiKey.length < 10) {
    throw new Error("INVALID_API_KEY: No valid API key provided.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const model = activeModel;

  // Track usage for the active model
  trackUsage(activeModel);

  // --- STEP 1: PULL ---
  log("NETWORK: Initializing Media Intelligence Discovery engine...");
  log("NETWORK: Dispatching search and pulling data from RSS feeds...");
  log("STEP 1: Pulling relevant data from RSS and Google Search...");
  
  const getEnabledTerms = (category: any, catName: string) => {
    if (!category.enabled) return [];
    return Object.entries(category.subSections)
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => name);
  };

  const allTerms = [
    ...getEnabledTerms(config.provincial.executive, "Provincial Executive"),
    ...getEnabledTerms(config.provincial.delivery, "Provincial Delivery"),
    ...getEnabledTerms(config.local.executive, "Local Executive"),
    ...getEnabledTerms(config.local.delivery, "Local Delivery")
  ];

  const termsQuery = allTerms.length > 0 ? `(${allTerms.map(t => `"${t}"`).join(' OR ')})` : '(Government OR "Service Delivery")';
  const partyExclusion = config.includePoliticalParties ? "" : "-ANC -DA -EFF -\"Political Party\"";
  const searchConstraint = `after:${startDate}`;

  const searchQueries = [
    { name: "National & Regional", query: `"Eastern Cape" ${termsQuery} ${partyExclusion} ${searchConstraint}` },
    { name: "Official & Local", query: `"Eastern Cape" South Africa (site:gov.za OR news) ${termsQuery} ${partyExclusion} ${searchConstraint}` }
  ];

  const discoveryPromises = searchQueries.map(async (sq) => {
    try {
      const response = await callGeminiWithRetry(() => 
        ai.models.generateContent({
          model,
          contents: `Search for news articles matching: ${sq.query}.`,
          config: { tools: [{ googleSearch: {} }] }
        }), 5, 2000, signal
      );
      return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } catch (e) {
      log(`WARNING: Search failed for ${sq.name}`);
      return [];
    }
  });

  const rssArticles = await fetchRSSFeeds(startDate, (status) => log(status), signal, disabledSources, customSources);
  const discoveryChunks = (await Promise.all(discoveryPromises)).flat();

  // Combine into raw article objects
  const rawArticles: any[] = [
    ...rssArticles.map(a => ({ title: a.title, uri: a.link, snippet: a.content, source: "RSS", pubDate: a.pubDate })),
    ...discoveryChunks.map((c: any) => ({ title: c.web?.title, uri: c.web?.uri, snippet: c.snippet, source: "Search", pubDate: null }))
  ].filter(a => a.uri);

  // Deduplicate by URI
  const uniqueArticles = Array.from(new Map(rawArticles.map(a => [a.uri, a])).values());
  log(`METRIC: TOTAL_RAW_ARTICLES: ${uniqueArticles.length}`);
  log(`PULL COMPLETE: Found ${uniqueArticles.length} unique articles.`);

  // --- STEP 2: DATE CHECK ---
  log("SYSTEM: Discovery phase complete. Starting verification...");
  log("SYSTEM: Initializing Semantic Verification...");
  log("STEP 2: Verifying dates and discarding non-matching articles...");
  
  const verifiedArticles: Article[] = [];
  const startDateTime = new Date(startDate).getTime();
  const endDateTime = new Date(endDate).getTime() + 86400000; // +1 day grace

  const verifyBatchSize = 5;
  for (let i = 0; i < uniqueArticles.length; i += verifyBatchSize) {
    if (signal?.aborted) throw new Error("ABORTED");
    const batch = uniqueArticles.slice(i, i + verifyBatchSize);
    
    await Promise.all(batch.map(async (a) => {
      try {
        // If it's RSS and has a date, check it first to save a fetch
        if (a.pubDate) {
          const d = new Date(a.pubDate).getTime();
          if (d < startDateTime || d > endDateTime) {
            log(`DATE CHECK: [SKIP] ${a.title} is outside range.`);
            return;
          }
        }

        // Deep verification for all articles to be sure
        const response = await fetchWithRetry(`/api/verify-article?url=${encodeURIComponent(a.uri)}`);
        if (response.ok) {
          const verified = await response.json();
          if (verified.verifiedDate) {
            const d = new Date(verified.verifiedDate).getTime();
            if (d < startDateTime || d > endDateTime) {
              log(`DATE CHECK: [SKIP] ${a.title} verified date ${verified.verifiedDate} is outside range.`);
              return;
            }
            verifiedArticles.push({
              id: `REF_${verifiedArticles.length + 1}`,
              title: verified.title || a.title,
              uri: a.uri,
              snippet: verified.snippet || a.snippet,
              pubDate: verified.verifiedDate,
              status: 'Verified',
              sphere: 'Unclassified', // Will be set in Step 3
              subChunk: 'General',    // Will be set in Step 3
              source: a.source,
              verifiedDate: verified.verifiedDate
            });
          } else {
            // No date found on page, if RSS had a date we trust it, otherwise we keep as unverified
            if (a.pubDate) {
              verifiedArticles.push({
                id: `REF_${verifiedArticles.length + 1}`,
                title: a.title,
                uri: a.uri,
                snippet: a.snippet,
                pubDate: a.pubDate,
                status: 'Verified',
                sphere: 'Unclassified',
                subChunk: 'General',
                source: a.source
              });
            } else {
              log(`DATE CHECK: [WARN] No date found for ${a.title}, keeping as unverified.`);
              verifiedArticles.push({
                id: `REF_${verifiedArticles.length + 1}`,
                title: a.title,
                uri: a.uri,
                snippet: a.snippet,
                pubDate: null,
                status: 'Unverified',
                sphere: 'Unclassified',
                subChunk: 'General',
                source: a.source
              });
            }
          }
        } else {
          // Verification failed, keep if it has a date
          if (a.pubDate) {
            verifiedArticles.push({
              id: `REF_${verifiedArticles.length + 1}`,
              title: a.title,
              uri: a.uri,
              snippet: a.snippet,
              pubDate: a.pubDate,
              status: 'Unverified',
              sphere: 'Unclassified',
              subChunk: 'General',
              source: a.source
            });
          }
        }
      } catch (e) {
        log(`DATE CHECK ERROR: ${a.uri}`);
      }
    }));
  }
  log(`METRIC: TOTAL_VERIFIED_ARTICLES: ${verifiedArticles.length}`);
  log(`DATE CHECK COMPLETE: ${verifiedArticles.length} articles passed.`);

  // --- STEP 3: CHUNK / SORT ---
  log("STEP 3: Categorizing and chunking articles by Sphere and Sub-chunk...");
  
  const categorizedArticles = verifiedArticles.map(a => {
    const { sphere, subChunk } = categorizeArticle(a.title, a.snippet);
    return { ...a, sphere, subChunk };
  });

  // Group by Sphere for better context
  const sphereGroups = {
    National: categorizedArticles.filter(a => a.sphere === 'National'),
    Provincial: categorizedArticles.filter(a => a.sphere === 'Provincial'),
    Local: categorizedArticles.filter(a => a.sphere === 'Local'),
    Unclassified: categorizedArticles.filter(a => a.sphere === 'Unclassified')
  };

  log(`CHUNK/SORT COMPLETE: P:${sphereGroups.Provincial.length}, L:${sphereGroups.Local.length}, N:${sphereGroups.National.length}`);

  // --- STEP 4: INFERENCE ---
  log("SYSTEM: Initializing AI Inference...");
  log("STEP 4: Running AI Inference for final report generation...");
  
  currentReport.summary.total_articles_scanned = uniqueArticles.length;

  const systemInstruction = `
    You are a Senior Media Intelligence Analyst for the Eastern Cape Office of the Premier.
    TODAY'S DATE IS: ${today}.
    
    TASK: Analyze the provided articles and generate a structured monitoring report.
    
    STRICT RULES:
    1. Only report on articles provided in the context.
    2. Use the Reference ID (e.g. REF_1) for the "article_url" field.
    3. EXCLUDE national news unless it has a direct, explicit impact on the Eastern Cape.
    4. Focus on Figure Heads (Premier, MECs, Mayors) and Service Delivery issues.
    5. Ensure "municipality_or_district" is specific to the Eastern Cape if possible.
    6. POLITICAL PARTY NEWS: If the user has NOT enabled political party news, you MUST EXCLUDE articles that are primarily about political party internal affairs (e.g. ANC Elective Conferences, party leadership contests, internal party disputes) unless they directly involve the Premier or MECs in their official government capacity.
    7. ARTICLE CLUSTERING: If multiple articles cover the same event or topic, assign them the same "duplicate_cluster_id". For each cluster, identify exactly ONE "lead" article and set its "is_duplicate_or_syndicated" to false. All other articles in that same cluster MUST have "is_duplicate_or_syndicated" set to true.
    8. CONTROVERSY ANALYSIS: For article clusters, pay close attention to differing tones and sentiments across different sources. If outlets report with different biases or interpretations, highlight this in the "tone_reason" and "risk_reason" fields of the lead article.
  `;

  // Process in batches
  const allCategorized = [
    ...sphereGroups.Provincial,
    ...sphereGroups.Local,
    ...sphereGroups.National,
    ...sphereGroups.Unclassified
  ];

  const batchSize = 15;
  for (let i = 0; i < allCategorized.length; i += batchSize) {
    if (signal?.aborted) throw new Error("ABORTED");
    const batch = allCategorized.slice(i, i + batchSize);
    const batchContext = batch.map(a => 
      `[${a.id}] TITLE: ${a.title}\nCONTENT: ${a.snippet}\nSPHERE: ${a.sphere}\nSUB-CHUNK: ${a.subChunk}\nDATE: ${a.pubDate || 'Unknown'}`
    ).join("\n\n---\n\n");

    log(`METRIC: BATCH_COMPLETE: ${Math.floor(i/batchSize) + 1}/${Math.ceil(allCategorized.length/batchSize)}`);
    log(`INFERENCE: Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allCategorized.length/batchSize)}...`);
    
    try {
      const response = await callGeminiWithRetry(() => 
        ai.models.generateContent({
          model,
          contents: `Analyze these articles:\n\n${batchContext}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: REPORT_SCHEMA
          }
        }), 5, 2000, signal
      );

      if (response.text) {
        const batchReport = JSON.parse(response.text) as MonitoringReport;
        
        // Map REF_IDs back to URIs
        const processedArticles = batchReport.articles.map(article => {
          const original = allCategorized.find(a => a.id === article.article_url);
          if (original) {
            return { ...article, article_url: original.uri, url_verification_status: original.status };
          }
          return null;
        }).filter(a => a !== null);

        currentReport.articles.push(...processedArticles);
        
        // Update summary stats incrementally
        currentReport.summary.total_relevant_articles = currentReport.articles.length;
        currentReport.summary.total_highly_relevant = currentReport.articles.filter(a => a.relevance_classification === 'Highly Relevant').length;
        currentReport.summary.positive = currentReport.articles.filter(a => a.tone_classification === 'Positive').length;
        currentReport.summary.neutral = currentReport.articles.filter(a => a.tone_classification === 'Neutral').length;
        currentReport.summary.negative = currentReport.articles.filter(a => a.tone_classification === 'Negative').length;
        currentReport.summary.mixed = currentReport.articles.filter(a => a.tone_classification === 'Mixed').length;
        currentReport.summary.high_risk = currentReport.articles.filter(a => a.reputational_risk === 'High').length;
        currentReport.summary.critical_risk = currentReport.articles.filter(a => a.reputational_risk === 'Critical').length;
        currentReport.summary.response_needed = currentReport.articles.filter(a => a.response_needed).length;

        // Merge topics and entities
        if (batchReport.summary.top_topics) {
          currentReport.summary.top_topics = Array.from(new Set([...currentReport.summary.top_topics, ...batchReport.summary.top_topics])).slice(0, 10);
        }
        if (batchReport.summary.top_sources) {
          currentReport.summary.top_sources = Array.from(new Set([...currentReport.summary.top_sources, ...batchReport.summary.top_sources])).slice(0, 10);
        }
        if (batchReport.summary.top_entities) {
          currentReport.summary.top_entities = Array.from(new Set([...currentReport.summary.top_entities, ...batchReport.summary.top_entities])).slice(0, 10);
        }
        if (batchReport.summary.top_municipalities_or_districts) {
          currentReport.summary.top_municipalities_or_districts = Array.from(new Set([...currentReport.summary.top_municipalities_or_districts, ...batchReport.summary.top_municipalities_or_districts])).slice(0, 10);
        }
      }
    } catch (e) {
      log(`INFERENCE ERROR: Batch failed.`);
    }
  }

  log("STEP 5: Finalizing report structure and generating summaries...");
  
  // --- STEP 5: HOLISTIC OVERVIEW (SWOT & SOCIAL CLIMATE) ---
  if (currentReport.articles.length > 0) {
    log("SYSTEM: Generating holistic SWOT analysis and social climate overview...");
    
    const articleSummaries = currentReport.articles.map(a => 
      `- [${a.tone_classification}] ${a.article_title}: ${a.summary_1_sentence}`
    ).join("\n");

    const overviewPrompt = `
      As a Senior Media Intelligence Analyst, provide a holistic overview of the media landscape for the Eastern Cape Provincial Government based on these ${currentReport.articles.length} news articles from the last 24 hours.
      
      ARTICLES:
      ${articleSummaries}
      
      TASK:
      1. Provide a SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) regarding the government's current public standing and service delivery perception.
      2. Provide a "Social Climate Summary" (max 150 words) that explains the general mood of the public and journalists on the ground. Use non-technical, communicative language suitable for administrators and politicians.
      3. Provide a "Strategic Analysis" section that includes:
         - Interpretation: A deep-dive interpretation of the current media landscape.
         - Potential Consequences (Historic): Potential consequences based on the historic background of the Eastern Cape.
         - Low Hanging Fruit Interventions: Immediate, easy-to-implement actions.
         - Long Term Interventions: Strategic, long-term actions.
         - OTP Orchestration Plan: How the Office of the Premier (OTP) should coordinate with executing departments, including what is likely to work and what is unlikely to work.
      
      Format the response as JSON matching this structure:
      {
        "swot_analysis": {
          "strengths": ["string"],
          "weaknesses": ["string"],
          "opportunities": ["string"],
          "threats": ["string"]
        },
        "social_climate_summary": "string",
        "strategic_analysis": {
          "interpretation": "string",
          "potential_consequences_historic": "string",
          "low_hanging_fruit_interventions": ["string"],
          "long_term_interventions": ["string"],
          "otp_orchestration_plan": {
            "likely_to_work": ["string"],
            "unlikely_to_work": ["string"],
            "coordination_strategy": "string"
          }
        }
      }
    `;

    try {
      const overviewResponse = await callGeminiWithRetry(() => 
        ai.models.generateContent({
          model,
          contents: overviewPrompt,
          config: { responseMimeType: "application/json" }
        }), 3, 2000, signal
      );

      if (overviewResponse.text) {
        const overview = JSON.parse(overviewResponse.text);
        currentReport.summary.swot_analysis = overview.swot_analysis || { strengths: [], weaknesses: [], opportunities: [], threats: [] };
        currentReport.summary.social_climate_summary = overview.social_climate_summary || "No summary generated.";
        currentReport.summary.strategic_analysis = overview.strategic_analysis;
      }
    } catch (e) {
      log("WARNING: Failed to generate holistic overview.");
      currentReport.summary.swot_analysis = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
      currentReport.summary.social_climate_summary = "Analysis unavailable due to processing error.";
    }
  } else {
    currentReport.summary.swot_analysis = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
    currentReport.summary.social_climate_summary = "No relevant articles found for analysis.";
  }

  log("SYSTEM: Monitoring Complete.");
  return currentReport;
}


export async function generateArticleSummary(article: any, userApiKey?: string, selectedModel: string = "gemini-2.5-flash-lite"): Promise<string> {
  const { modelId: activeModel } = getBestModel(selectedModel, '24h');
  const apiKey = (userApiKey && userApiKey.trim()) || getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = activeModel;
  
  // Track usage
  trackUsage(activeModel);
  
  try {
    const response = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model,
        contents: `Generate an extremely concise, one-sentence summary (max 15 words) for this article that captures its core message:
        Title: ${article.article_title}
        Source: ${article.source_name}
        Context: ${article.summary_1_paragraph || 'No detailed summary available.'}`,
      })
    );
    
    return response.text?.trim() || "No summary generated.";
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return "Failed to generate summary.";
  }
}
