import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  Newspaper, 
  MapPin, 
  ShieldAlert,
  ShieldCheck,
  Cpu,
  FileText,
  Check,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ExternalLink,
  Filter,
  Info,
  Calendar,
  Building2,
  Users,
  Briefcase,
  Flag,
  ChevronDown,
  Terminal,
  Layers,
  Key,
  Settings2,
  X,
  CalendarDays,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Database,
  Truck,
  Zap,
  ZapOff,
  Minus,
  Tag,
  Plus,
  Copy,
  Download,
  Globe,
  Activity,
  Server,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  MessageSquare,
  Menu,
  HelpCircle,
  Trash2,
  CheckSquare,
  Square,
  Target,
  Layout,
  Play,
  Scale,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { runMonitoring, generateArticleSummary, listAvailableModels, AVAILABLE_MODELS, getUsage, isApiKeyValid } from './services/geminiService';
import { MonitoringReport, Article, MonitoringConfig, ReportData, PDFArticleCluster, AppSettings, PdfConfig, MonitoringSummary, PdfPreset } from './types';
import { pdf } from '@react-pdf/renderer';
import { MediaIntelligencePDF } from './components/MediaIntelligencePDF';
import { FEED_SOURCES } from './services/rssService';

// Constants
const LOGO_URL = "https://ecprov.gov.za/images/logo_big.jpg";

const PDF_PRESETS: PdfPreset[] = [
  {
    id: 'light',
    name: 'Light Overview',
    description: 'A concise 2-3 page summary of key insights and social climate.',
    config: {
      depth: 'light',
      layoutTemplate: 'standard',
      includeSummary: true,
      includeDate: true,
      includeSwot: true,
      includeGraphs: false,
      includeKeyEntities: true,
      includeSentiment: true,
      sections: { provincialGovernment: true, localGovernment: true, figureHeads: false, serviceDelivery: false },
      includeSectionSummaries: true,
      includeStrategicAnalysis: false,
      includeDataReferences: false,
      includeNuancedInsights: false,
      includeNational: false,
      includeProvincial: true,
      includeLocal: true,
      includeUncategorized: false
    }
  },
  {
    id: 'standard',
    name: 'Standard Report',
    description: 'Balanced report with detailed sections and SWOT analysis.',
    config: {
      depth: 'standard',
      layoutTemplate: 'standard',
      includeSummary: true,
      includeDate: true,
      includeSwot: true,
      includeGraphs: true,
      includeKeyEntities: true,
      includeSentiment: true,
      sections: { provincialGovernment: true, localGovernment: true, figureHeads: true, serviceDelivery: true },
      includeSectionSummaries: true,
      includeStrategicAnalysis: false,
      includeDataReferences: true,
      includeNuancedInsights: true,
      includeNational: true,
      includeProvincial: true,
      includeLocal: true,
      includeUncategorized: true
    }
  },
  {
    id: 'technical',
    name: 'Deep Strategic Analysis',
    description: 'Comprehensive 20-30 page technical analysis with data references.',
    config: {
      depth: 'technical',
      layoutTemplate: 'executive',
      includeSummary: true,
      includeDate: true,
      includeSwot: true,
      includeGraphs: true,
      includeKeyEntities: true,
      includeSentiment: true,
      sections: { provincialGovernment: true, localGovernment: true, figureHeads: true, serviceDelivery: true },
      includeSectionSummaries: true,
      includeStrategicAnalysis: true,
      includeDataReferences: true,
      includeNuancedInsights: true,
      includeNational: true,
      includeProvincial: true,
      includeLocal: true,
      includeUncategorized: true
    }
  }
];

const ModelSelectorModal = ({ isOpen, onClose, onBack, selectedModel, onSelect, availableModels }: { isOpen: boolean, onClose: () => void, onBack?: () => void, selectedModel: string, onSelect: (modelId: string) => void, availableModels: any[] }) => {
  if (!isOpen) return null;

  const displayModels = useMemo(() => {
    if (availableModels.length === 0) return AVAILABLE_MODELS;
    
    // Merge discovered models with our metadata
    return AVAILABLE_MODELS.map(m => {
      const discovered = availableModels.find(am => am.name === `models/${m.id}` || am.name === m.id);
      if (discovered) {
        return { ...m, name: discovered.displayName || m.name };
      }
      return m;
    });
  }, [availableModels]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#333] flex items-center justify-between bg-[#222]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack} 
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-[#333] rounded-xl transition-all mr-2 group"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold text-gray-400">Back</span>
              </button>
            )}
            <div className="p-2 bg-primary/10 rounded-lg">
              <Cpu className="w-5 h-5 text-primary/80" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">AI Engine Selection</h2>
              <p className="text-xs text-gray-400">Choose the model for this session</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {displayModels.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setTimeout(() => onClose(), 200);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                selectedModel === model.id 
                  ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/50' 
                  : 'bg-[#222] border-[#333] hover:border-[#444] hover:bg-[#282828]'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${selectedModel === model.id ? 'text-primary/90' : 'text-white'}`}>
                    {model.name}
                  </span>
                  {model.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                      model.badge === 'Free Tier' ? 'bg-blue-500/20 text-blue-400' :
                      model.badge === 'Recommended' ? 'bg-primary/20 text-primary/90' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {model.badge}
                    </span>
                  )}
                </div>
                {selectedModel === model.id && (
                  <CheckCircle className="w-5 h-5 text-primary/90" />
                )}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {model.description}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                <span>ID: {model.id}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 bg-[#222] border-t border-[#333] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Confirm Selection
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [config, setConfig] = useState<MonitoringConfig>({
    dateRange: '24h',
    provincial: {
      executive: {
        enabled: true,
        subSections: {
          'Premier': true,
          'MEC': true,
          'Director General': true,
          'Head of Department': true
        }
      },
      delivery: {
        enabled: true,
        subSections: {
          'Health': true,
          'Education': true,
          'Public Works': true,
          'Social Development': true,
          'Agriculture': true,
          'Economic Development': true,
          'Transport': true,
          'Human Settlements': true
        }
      }
    },
    local: {
      executive: {
        enabled: true,
        subSections: {
          'Mayor': true,
          'Municipal Manager': true,
          'Council Speaker': true
        }
      },
      delivery: {
        enabled: true,
        subSections: {
          'Water & Sanitation': true,
          'Electricity': true,
          'Waste Management': true,
          'Roads & Stormwater': true,
          'Housing': true,
          'Community Safety': true
        }
      }
    },
    includePoliticalParties: false
  });
  
  const [report, setReport] = useState<MonitoringReport | null>(null);

  const filteredReport = useMemo(() => {
    if (!report) return null;
    
    // Filter articles based on political party news toggle
    let filteredArticles = report.articles;
    if (!config.includePoliticalParties) {
      const partyKeywords = ['ANC', 'DA', 'EFF', 'IFP', 'ActionSA', 'Patriotic Alliance', 'MK Party', 'Political Party', 'Elective Conference', 'Party Leadership', 'Internal Party'];
      filteredArticles = filteredArticles.filter(a => {
        const textToSearch = `${a.article_title} ${a.primary_entity} ${a.topic_categories?.join(' ') || ''}`.toLowerCase();
        const isPartyNews = partyKeywords.some(keyword => textToSearch.includes(keyword.toLowerCase()));
        
        if (isPartyNews) {
          // Allow if it mentions key government officials in their official capacity
          const mentionsOfficial = ['Premier', 'MEC', 'Mayor', 'Mabuyane', 'Oscar Mabuyane'].some(official => 
            textToSearch.includes(official.toLowerCase())
          );
          return mentionsOfficial;
        }
        return true;
      });
    }

    // Recalculate summary stats for the filtered set
    const summary = {
      ...report.summary,
      total_relevant_articles: filteredArticles.length,
      total_highly_relevant: filteredArticles.filter(a => a.relevance_classification === 'Highly Relevant').length,
      positive: filteredArticles.filter(a => a.tone_classification === 'Positive').length,
      neutral: filteredArticles.filter(a => a.tone_classification === 'Neutral').length,
      negative: filteredArticles.filter(a => a.tone_classification === 'Negative').length,
      mixed: filteredArticles.filter(a => a.tone_classification === 'Mixed').length,
      high_risk: filteredArticles.filter(a => a.reputational_risk === 'High').length,
      critical_risk: filteredArticles.filter(a => a.reputational_risk === 'Critical').length,
      response_needed: filteredArticles.filter(a => a.response_needed).length,
    };

    return {
      ...report,
      articles: filteredArticles,
      summary
    };
  }, [report, config.includePoliticalParties]);

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [subProcess, setSubProcess] = useState<string>("");
  const [estimateInfo, setEstimateInfo] = useState<{
    totalSeconds: number;
    elapsedSeconds: number;
    adjustmentMessage: string;
    rawCount: number;
    verifiedCount: number;
  }>({
    totalSeconds: 0,
    elapsedSeconds: 0,
    adjustmentMessage: "",
    rawCount: 0,
    verifiedCount: 0
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate users from the old default to the new cost-efficient default
        if (!parsed.selectedModel) {
          parsed.selectedModel = 'gemini-2.5-flash-lite';
        }
        return {
          disabledSources: [],
          customSources: [],
          showOnboarding: true,
          modelQuotas: {},
          ...parsed
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      disabledSources: [],
      customSources: [],
      showOnboarding: true,
      selectedModel: 'gemini-2.5-flash-lite',
      modelQuotas: {}
    };
  });

  const [discoveredModels, setDiscoveredModels] = useState<any[]>([]);

  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(() => {
    const saved = localStorage.getItem('pdfConfig');
    const defaultConfig = PDF_PRESETS[1].config;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultConfig, ...parsed, sections: { ...defaultConfig.sections, ...parsed.sections } };
      } catch (e) {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showQuotaPopup, setShowQuotaPopup] = useState(false);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{title: string, subtext: string} | null>(null);
  const [activeFocusSubModal, setActiveFocusSubModal] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPage, setOnboardingPage] = useState(0);
  const [menuStack, setMenuStack] = useState<string[]>(['home']);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const pushMenu = (view: string) => setMenuStack(prev => [...prev, view]);
  const popMenu = () => setMenuStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  const resetMenu = () => {
    setMenuStack(['home']);
    setShowSidebar(false);
  };

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig));
  }, [pdfConfig]);

  useEffect(() => {
    if (appSettings.showOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const stages = [
    { id: 1, name: "Initialization", desc: "Setting up monitoring parameters", icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 2, name: "Discovery", desc: "Searching Google & RSS feeds", icon: <Search className="w-3.5 h-3.5" /> },
    { id: 3, name: "Verification", desc: "Verifying source authenticity", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 4, name: "Inference", desc: "Semantic analysis & classification", icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 5, name: "Finalizing", desc: "Generating intelligence report", icon: <FileText className="w-3.5 h-3.5" /> }
  ];
  const [error, setError] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState<string>(import.meta.env.VITE_GEMINI_API_KEY || '');

  useEffect(() => {
    const fetchModels = async () => {
      if (userApiKey) {
        const models = await listAvailableModels(userApiKey);
        if (models.length > 0) {
          setDiscoveredModels(models);
        }
      }
    };
    fetchModels();
  }, [userApiKey]);

  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [activeSubModal, setActiveSubModal] = useState<{
    type: 'provincial' | 'local';
    category: 'executive' | 'delivery';
  } | null>(null);
  const [showTimespanModal, setShowTimespanModal] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showModelSelector, setShowModelSelector] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isMobile, setIsMobile] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showRunConfirmation, setShowRunConfirmation] = useState(false);
  const [pendingRange, setPendingRange] = useState<MonitoringConfig['dateRange'] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const healthAbortControllerRef = useRef<AbortController | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [sourceHealth, setSourceHealth] = useState<{ url: string; status: number; error?: string; lastChecked?: string }[] | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);
  const [healthLog, setHealthLog] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLPreElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getTimeRangeLabel = (range: string) => {
    const ranges: Record<string, string> = {
      '24h': '24H',
      '72h': '72H',
      '7d': '7D',
      '14d': '14D',
      '21d': '21D',
      '28d': '28D',
      '3m': '3M',
      'custom': 'Custom'
    };
    return ranges[range] || range.toUpperCase();
  };

  useEffect(() => {
    if (loading) {
      timerRef.current = setInterval(() => {
        setEstimateInfo(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [healthLog]);

  const checkSourceHealth = async () => {
    if (healthAbortControllerRef.current) {
      healthAbortControllerRef.current.abort();
    }
    healthAbortControllerRef.current = new AbortController();
    const signal = healthAbortControllerRef.current.signal;

    setCheckingHealth(true);
    setShowHealthDashboard(true);
    setSourceHealth([]);
    setHealthLog("INITIALIZING SOURCE HEALTH CHECK...\n" + "=".repeat(40) + "\n");
    
    const results: { url: string; status: number; error?: string; lastChecked?: string }[] = [];
    const now = new Date().toLocaleString();
    
    try {
      for (const source of FEED_SOURCES) {
        if (signal.aborted) break;

        setHealthLog(prev => prev + `PINGING: ${source.name} (${source.url})... `);
        
        try {
          const response = await fetch('/api/check-urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [source.url] }),
            signal
          });
          
          const [result] = await response.json();
          const resultWithTimestamp = { ...result, lastChecked: now };
          results.push(resultWithTimestamp);
          setSourceHealth([...results]);
          
          const statusText = result.status === 200 ? "OK (200)" : 
                           result.status === 403 ? "RESTRICTED (403)" : 
                           `FAILED (${result.status || 'ERR'})`;
          
          setHealthLog(prev => prev + `${statusText}\n`);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            setHealthLog(prev => prev + `CANCELLED\n`);
            break;
          }
          const errorResult = { url: source.url, status: 0, error: 'Fetch failed', lastChecked: now };
          results.push(errorResult);
          setSourceHealth([...results]);
          setHealthLog(prev => prev + `CRITICAL ERROR\n`);
        }
        
        // Small delay for visual effect and to prevent overwhelming
        await new Promise(r => setTimeout(r, 100));
      }
      
      if (!signal.aborted) {
        setHealthLog(prev => prev + "\n" + "=".repeat(40) + "\nCHECK COMPLETE. TOTAL SOURCES: " + results.length + "\n");
      } else {
        setHealthLog(prev => prev + "\n" + "=".repeat(40) + "\nCHECK ABORTED BY USER.\n");
      }
    } catch (err) {
      console.error(err);
      setError('Failed to check source health');
    } finally {
      setCheckingHealth(false);
      healthAbortControllerRef.current = null;
    }
  };

  const stopSourceHealth = () => {
    if (healthAbortControllerRef.current) {
      healthAbortControllerRef.current.abort();
    }
  };

  const copyHealthLog = () => {
    navigator.clipboard.writeText(healthLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateEstimates = (range: MonitoringConfig['dateRange']) => {
    const rssSources = 99; // Total sources in rssService.ts
    let articlesPerSource = 5;
    let discoveryTime = 600; // 10 minutes base for discovery
    
    switch(range) {
      case '24h': articlesPerSource = 5; discoveryTime = 480; break;
      case '72h': articlesPerSource = 12; discoveryTime = 600; break;
      case '7d': articlesPerSource = 25; discoveryTime = 720; break;
      case '14d': articlesPerSource = 40; discoveryTime = 840; break;
      case '21d': articlesPerSource = 55; discoveryTime = 960; break;
      case '28d': articlesPerSource = 70; discoveryTime = 1080; break;
      case '3m': articlesPerSource = 150; discoveryTime = 1800; break;
      case 'custom': articlesPerSource = 30; discoveryTime = 720; break;
    }

    const totalArticles = rssSources * articlesPerSource + 30; // +30 from search
    const batches = Math.ceil((totalArticles * 0.35) / 15); // Batch size 15 in service
    const inferenceTime = batches * 45; // 45s per batch (more realistic)
    const verificationTime = (totalArticles * 0.5) * 2; // 2s per article verification avg
    const totalTime = discoveryTime + inferenceTime + verificationTime + 120; // +120 for finalizing/overhead

    return {
      articles: totalArticles,
      sources: rssSources + 2,
      discoveryTime,
      inferenceTime,
      totalTime: Math.ceil(totalTime / 60), // minutes
      totalSeconds: totalTime,
      batches
    };
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activityLog]);

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
      setIsMobile(window.innerWidth < 1024);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const [sort, setSort] = useState<{ field: 'date' | 'relevance' | 'risk', direction: 'asc' | 'desc' }>({
    field: 'date',
    direction: 'desc'
  });
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSpheres, setFilterSpheres] = useState<string[]>([]);
  const [filterRisks, setFilterRisks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('Backend offline');
        console.log('System Health: OK');
        
        // Check API Key
        if (!isApiKeyValid()) {
          console.warn('System Health: Gemini API Key is missing or invalid.');
          setActivityLog(prev => [...prev, "CRITICAL: Gemini API Key is missing or invalid. Please set it in the Secrets panel."]);
        }
      } catch (e) {
        console.warn('System Health: Backend API unreachable. RSS features will be disabled.');
        setActivityLog(prev => [...prev, "CRITICAL: Backend API unreachable. RSS features will be disabled."]);
      }
    };
    checkHealth();
  }, []);

  const handleMonitor = async (range?: MonitoringConfig['dateRange'], confirmed = false) => {
    const selectedRange = range || config.dateRange;
    
    if (!confirmed) {
      setPendingRange(selectedRange);
      setShowRunConfirmation(true);
      return;
    }

    // Check API Key before running
    if (!isApiKeyValid()) {
      setToast({ message: "Gemini API Key is missing or invalid. Please set it in the Secrets panel.", type: 'error' });
      setError("Gemini API Key is missing or invalid. Please set it in the Secrets panel.");
      return;
    }

    const finalConfig = selectedRange === 'custom' ? { ...config, dateRange: 'custom' as const, customDateRange: customDates } : { ...config, dateRange: selectedRange };
    
    if (selectedRange === 'custom' && !customDates.start && !confirmed) {
      setShowCustomDate(true);
      return;
    }
    
    // Initialize AbortController
    abortControllerRef.current = new AbortController();
    
    const initialEst = calculateEstimates(selectedRange === 'custom' ? 'custom' : selectedRange);
    setEstimateInfo({
      totalSeconds: initialEst.totalSeconds,
      elapsedSeconds: 0,
      adjustmentMessage: `Estimated: ${initialEst.totalTime} minutes`,
      rawCount: 0,
      verifiedCount: 0
    });

    setLoading(true);
    setLoadingStatus("Initializing...");
    setSubProcess("Starting Media Intelligence Discovery...");
    setLoadingStage(1);
    setActivityLog(["SYSTEM: Initializing Media Intelligence Discovery..."]);
    setActivityLog(prev => [...prev, `DEBUG: API Key Source: ${userApiKey ? "User Provided (UI)" : "Environment Variable"}`]);
    if (userApiKey) {
      setActivityLog(prev => [...prev, `DEBUG: User API Key Length: ${userApiKey.trim().length}`]);
    }
    setShowLogs(true);
    setError(null);
    setShowCompletionPopup(false);
    setShowRunConfirmation(false);

    // Check backend health before starting
    try {
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        setActivityLog(prev => [...prev, "CONNECTION: Backend API is online and reachable."]);
      } else {
        setActivityLog(prev => [...prev, `CRITICAL: Backend API returned status ${healthRes.status}. RSS fetching will likely fail.`]);
      }
    } catch (e) {
      setActivityLog(prev => [...prev, "CRITICAL: Backend API is UNREACHABLE. Ensure the server is running and routes are configured."]);
    }

    console.log("Starting Monitor with config:", finalConfig);

    try {
      const result = await runMonitoring(
        finalConfig, 
        userApiKey.trim() || undefined, 
        (partialReport, status) => {
          setActivityLog(prev => [...prev, status].slice(-100));
          setLoadingStatus(status);
          
          const cleanStatus = status.replace(/\[.*\]\s*/, '').replace(/^[A-Z]+:\s*/, '');
          setSubProcess(cleanStatus);

          // Parse Metrics
          if (status.includes("METRIC: TOTAL_RAW_ARTICLES:")) {
            const count = parseInt(status.split("METRIC: TOTAL_RAW_ARTICLES:")[1].trim());
            setEstimateInfo(prev => {
              const discoveryElapsed = prev.elapsedSeconds;
              // Re-calculate based on actual count
              const verificationTime = count * 2; // 2s per article
              const inferenceTime = Math.ceil((count * 0.35) / 15) * 45;
              const newTotal = discoveryElapsed + verificationTime + inferenceTime + 120;
              return {
                ...prev,
                rawCount: count,
                totalSeconds: newTotal,
                adjustmentMessage: `Adjusted from ${count} articles: ${Math.ceil(newTotal / 60)} minutes`
              };
            });
          }

          if (status.includes("METRIC: TOTAL_VERIFIED_ARTICLES:")) {
            const count = parseInt(status.split("METRIC: TOTAL_VERIFIED_ARTICLES:")[1].trim());
            setEstimateInfo(prev => {
              const elapsed = prev.elapsedSeconds;
              const inferenceTime = Math.ceil(count / 15) * 45;
              const newTotal = elapsed + inferenceTime + 60;
              return {
                ...prev,
                verifiedCount: count,
                totalSeconds: newTotal,
                adjustmentMessage: `Adjusted to ${count} articles: ${Math.ceil(newTotal / 60)} minutes`
              };
            });
          }

          if (status.includes("METRIC: BATCH_COMPLETE:")) {
             // Optional: refine further as batches complete
          }

          if (status.includes("NETWORK: Initializing Media Intelligence Discovery engine") || status.includes("NETWORK: Dispatching search") || status.includes("STEP 1") || status.includes("Fetching RSS") || status.includes("Scraping Page")) setLoadingStage(2);
          if (status.includes("SYSTEM: Discovery phase complete") || status.includes("STEP 2")) setLoadingStage(3);
          if (status.includes("SYSTEM: Initializing Semantic Verification") || status.includes("STEP 3")) setLoadingStage(3); 
          if (status.includes("SYSTEM: Initializing AI Inference") || status.includes("STEP 4")) setLoadingStage(4);
          if (status.includes("STEP 5") || status.includes("SYSTEM: Finalizing report structure")) setLoadingStage(5);

          setActivityLog(prev => {
            const newLog = [...prev, status];
            return newLog.slice(-50);
          });
        },
        abortControllerRef.current.signal,
        appSettings.disabledSources,
        appSettings.customSources,
        appSettings.selectedModel
      );
      setReport(result);
      setShowCompletionPopup(true);
    } catch (err: any) {
      if (err.message === "ABORTED") {
        setActivityLog(prev => [...prev, "SYSTEM: Monitoring process stopped by user."]);
        // Don't show completion popup if aborted
      } else {
        console.error("Monitoring Error:", err);
        const errorMessage = err.message || 'Unknown error';
        
        if (errorMessage === "QUOTA_EXHAUSTED") {
          setActivityLog(prev => [...prev, "CRITICAL: Gemini API Quota Exhausted. Please try again later or use a different API key."]);
          setShowQuotaPopup(true);
        } else if (errorMessage.startsWith("INVALID_API_KEY")) {
          const detail = errorMessage.split(': ')[1] || 'Please check your key.';
          setActivityLog(prev => [...prev, `CRITICAL: Invalid API Key: ${detail}`]);
          setError(`Invalid API Key: ${detail}`);
        } else if (errorMessage.startsWith("SEARCH_TOOL_ERROR")) {
          const detail = errorMessage.split(': ')[1] || 'The Google Search tool is currently unavailable for this key/region.';
          setActivityLog(prev => [...prev, `CRITICAL: Search Tool Error: ${detail}`]);
          setError(`Search Tool Error: ${detail}. This often happens if the Google Search tool is not supported in your region or for your specific API key type.`);
        } else {
          setActivityLog(prev => [...prev, `CRITICAL: ${errorMessage}`]);
          setError(`Error: ${errorMessage}`);
        }
        setShowCompletionPopup(true);
      }
    } finally {
      setLoading(false);
      setLoadingStatus("");
      setLoadingStage(0);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setLoadingStatus("");
    setLoadingStage(0);
    setSubProcess("");
  };

  const handleCustomDateSubmit = () => {
    if (!customDates.start || !customDates.end) return;
    const finalConfig = { ...config, dateRange: 'custom' as const, customDateRange: customDates };
    setConfig(finalConfig);
    setShowCustomDate(false);
    handleMonitor('custom');
  };

  const groupArticles = (articles: Article[]) => {
    let filtered = [...articles];
    
    // Cluster-aware search: if any article in a cluster matches, show the whole cluster
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchingClusterIds = new Set(
        articles.filter(a => 
          a.article_title.toLowerCase().includes(term) || 
          a.summary_1_sentence?.toLowerCase().includes(term) ||
          a.source_name.toLowerCase().includes(term) ||
          a.primary_entity?.toLowerCase().includes(term) ||
          a.secondary_entities?.some(e => e.toLowerCase().includes(term)) ||
          a.user_tags?.some(t => t.toLowerCase().includes(term))
        ).map(a => a.duplicate_cluster_id || a.article_url)
      );
      filtered = filtered.filter(a => matchingClusterIds.has(a.duplicate_cluster_id || a.article_url));
    }

    if (filterTags.length > 0) {
      filtered = filtered.filter(a => a.user_tags?.some(tag => filterTags.includes(tag)));
    }
    if (filterSpheres.length > 0) {
      filtered = filtered.filter(a => filterSpheres.includes(a.sphere_of_government));
    }
    if (filterRisks.length > 0) {
      filtered = filtered.filter(a => filterRisks.includes(a.reputational_risk));
    }
    const sorted = filtered.sort((a, b) => {
      if (sort.field === 'date') {
        const dateA = new Date(a.publication_date).getTime();
        const dateB = new Date(b.publication_date).getTime();
        return sort.direction === 'desc' ? dateB - dateA : dateA - dateB;
      }
      if (sort.field === 'risk') {
        const riskMap: { [key: string]: number } = { 'Critical': 4, 'High': 3, 'Moderate': 2, 'Low': 1, 'None': 0 };
        const riskA = riskMap[a.reputational_risk] || 0;
        const riskB = riskMap[b.reputational_risk] || 0;
        return sort.direction === 'desc' ? riskB - riskA : riskA - riskB;
      }
      return 0;
    });

    const groups: { [key: string]: Article[] } = {};
    sorted.forEach(article => {
      const id = article.duplicate_cluster_id || article.article_url;
      if (!groups[id]) groups[id] = [];
      groups[id].push(article);
    });

    // Ensure primary article (not syndicated) is first in each group
    Object.keys(groups).forEach(id => {
      groups[id].sort((a, b) => {
        if (a.is_duplicate_or_syndicated === b.is_duplicate_or_syndicated) return 0;
        return a.is_duplicate_or_syndicated ? 1 : -1;
      });
    });

    return groups;
  };

  const topEntities = useMemo(() => {
    if (!filteredReport) return [];
    const entityCounts: { [key: string]: number } = {};
    filteredReport.articles.forEach(article => {
      if (article.primary_entity) {
        entityCounts[article.primary_entity] = (entityCounts[article.primary_entity] || 0) + 1;
      }
      article.secondary_entities?.forEach(entity => {
        entityCounts[entity] = (entityCounts[entity] || 0) + 1;
      });
    });

    return Object.entries(entityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);
  }, [filteredReport]);

  const handleUpdateArticleTags = (articleUrl: string, tags: string[]) => {
    if (!report) return;
    const updatedArticles = report.articles.map(article => 
      article.article_url === articleUrl ? { ...article, user_tags: tags } : article
    );
    setReport({ ...report, articles: updatedArticles });
    if (selectedArticle && selectedArticle.article_url === articleUrl) {
      setSelectedArticle({ ...selectedArticle, user_tags: tags });
    }
  };

  const handleGenerateSummary = async (articleUrl: string) => {
    if (!report) return;
    const article = report.articles.find(a => a.article_url === articleUrl);
    if (!article) return;
    
    try {
      const summary = await generateArticleSummary(article, userApiKey || undefined);
      const updatedArticles = report.articles.map(a => 
        a.article_url === articleUrl ? { ...a, summary_1_sentence: summary } : a
      );
      setReport({ ...report, articles: updatedArticles });
      if (selectedArticle && selectedArticle.article_url === articleUrl) {
        setSelectedArticle({ ...selectedArticle, summary_1_sentence: summary });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "QUOTA_EXHAUSTED") {
        setShowQuotaPopup(true);
      }
    }
  };

  const handleTagClick = (tag: string) => {
    setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const preparePDFData = (): ReportData => {
    if (!filteredReport) return { clusters: {} };
    const grouped = groupArticles(filteredReport.articles);
    const pdfClusters: { [key: string]: PDFArticleCluster[] } = {};
    
    // Group by sphere of government for the PDF report
    Object.values(grouped).forEach(articles => {
      const primary = articles[0];
      const category = primary.sphere_of_government || 'Uncategorized';
      if (!pdfClusters[category]) pdfClusters[category] = [];
      pdfClusters[category].push({
        articles,
        summary: primary.summary_1_paragraph
      });
    });
    
    return { clusters: pdfClusters };
  };

  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex flex-col ${!filteredReport && !loading ? 'h-screen overflow-hidden' : 'overflow-auto'}`}>
      {/* Sidebar / Menu */}
      <AnimatePresence>
        {showSidebar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetMenu}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-white shadow-2xl flex flex-col rounded-[40px] overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start sm:items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 flex-wrap">
                  {menuStack.length > 1 && (
                    <button 
                      onClick={popMenu} 
                      className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-xs font-bold text-gray-600">Back</span>
                    </button>
                  )}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <img 
                      src={LOGO_URL} 
                      alt="Eastern Cape Logo" 
                      className="h-8 sm:h-10 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 text-xs sm:text-sm leading-none tracking-tight">EASTERN CAPE</span>
                      <span className="text-[8px] font-bold text-primary mt-0.5 uppercase tracking-widest leading-none">Intelligence Engine</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <h2 className="text-lg sm:text-xl font-bold">
                      {menuStack[menuStack.length - 1] === 'home' ? 'Intelligence Menu' : 
                       menuStack[menuStack.length - 1] === 'api-access' ? 'API Access' : 
                       'Menu'}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-widest">Portal Navigation</p>
                  </div>
                </div>
                <button onClick={resetMenu} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 ml-4">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                {menuStack[menuStack.length - 1] === 'home' ? (
                  <div className={`grid gap-4 ${orientation === 'landscape' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                      onClick={() => { setShowHealthDashboard(true); setShowSidebar(false); }}
                      className="group p-6 bg-white border border-gray-100 rounded-[32px] text-left hover:border-orange-100 hover:bg-orange-50/30 transition-all flex flex-col gap-3"
                    >
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Source Health</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Monitor real-time feed status</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowAiSettings(true); setShowSidebar(false); }}
                      className="group p-6 bg-white border border-gray-100 rounded-[32px] text-left hover:border-primary/20 hover:bg-primary/5 transition-all flex flex-col gap-3"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">AI Engine</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Configure inference parameters</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowConfig(true); setShowSidebar(false); }}
                      className="group p-6 bg-white border border-gray-100 rounded-[32px] text-left hover:border-primary/20 hover:bg-primary/5 transition-all flex flex-col gap-3"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Settings2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Scan Config</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Fine-tune intelligence parameters</p>
                      </div>
                    </button>

                    <button
                      onClick={() => pushMenu('api-access')}
                      className="group p-6 bg-white border border-gray-100 rounded-[32px] text-left hover:border-green-100 hover:bg-green-50/30 transition-all flex flex-col gap-3"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <Key className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">API Access</h4>
                        <p className="text-[10px] text-gray-400 font-medium">{userApiKey ? 'Update authentication key' : 'Provide Gemini API key'}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowOnboarding(true); setShowSidebar(false); }}
                      className="group p-6 bg-white border border-gray-100 rounded-[32px] text-left hover:border-purple-100 hover:bg-purple-50/30 transition-all flex flex-col gap-3"
                    >
                      <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">User Guide</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Platform walkthrough & help</p>
                      </div>
                    </button>
                  </div>
                ) : menuStack[menuStack.length - 1] === 'api-access' ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary rounded-xl">
                          <Key className="text-white w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Gemini API Configuration</h3>
                      </div>
                      
                      <div className="mb-6 space-y-4">
                        <div className="p-4 bg-white/50 rounded-2xl border border-primary/10">
                          <h4 className="text-xs font-bold text-primary/80 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-3.5 h-3.5" />
                            What is an API Key?
                          </h4>
                          <p className="text-xs text-primary/70 leading-relaxed">
                            Think of an API Key as a digital <strong>"secret key"</strong> that allows this application to securely talk to Google's AI models. It's like a passport that grants the engine permission to process your data and generate intelligence reports.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">How to get your key:</h4>
                          <ol className="space-y-2">
                            <li className="flex gap-3 text-xs text-gray-600">
                              <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[10px] text-gray-500">1</span>
                              <div>
                                Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                                  Google AI Studio <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </li>
                            <li className="flex gap-3 text-xs text-gray-600">
                              <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[10px] text-gray-500">2</span>
                              <span>Click <strong>"Create API key"</strong> in a new or existing project.</span>
                            </li>
                            <li className="flex gap-3 text-xs text-gray-600">
                              <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[10px] text-gray-500">3</span>
                              <span>Copy the generated key (it starts with <strong>"AIza..."</strong>).</span>
                            </li>
                            <li className="flex gap-3 text-xs text-gray-600">
                              <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[10px] text-gray-500">4</span>
                              <span>Paste the key into the field below and click <strong>"Save & Return"</strong>.</span>
                            </li>
                          </ol>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your API Key</label>
                        <div className="relative">
                          <input 
                            type="password"
                            value={userApiKey}
                            onChange={(e) => setUserApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {userApiKey ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-orange-500" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic mt-2">
                          Tip: You can also save this key in the <strong>Secrets</strong> panel of the App Settings to load it automatically next time.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</h4>
                        <p className="text-sm font-bold text-gray-900">{userApiKey ? 'Authenticated' : 'Key Required'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Engine</h4>
                        <p className="text-sm font-bold text-gray-900">{appSettings.selectedModel}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={popMenu}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all"
                      >
                        Save & Return
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {menuStack[menuStack.length - 1] === 'home' && (
                <div className="p-8 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => { setShowAppSettings(true); setShowSidebar(false); }}
                    className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
                      <span className="text-sm font-bold text-gray-600">Source Settings</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Settings Modal */}
      <AnimatePresence>
        {showAppSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowAppSettings(false); setShowSidebar(true); }} 
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-xs font-bold text-gray-600">Back</span>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Source Settings</h2>
                    <p className="text-sm text-gray-500">Manage intelligence sources and feeds</p>
                  </div>
                </div>
                <button onClick={() => setShowAppSettings(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Source Management */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Source Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">Add Custom Source</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="custom-source-url"
                          placeholder="https://news.example.com/rss"
                          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={async () => {
                            const input = document.getElementById('custom-source-url') as HTMLInputElement;
                            const url = input.value.trim();
                            if (!url) return;
                            
                            // Basic validation
                            try {
                              new URL(url);
                              // 200 check (simulated for now, but we'll add a real check if possible)
                              // In a real app, we'd fetch it to see if it's a valid RSS
                              const newSource = {
                                id: `custom-${Date.now()}`,
                                name: new URL(url).hostname.replace('www.', ''),
                                url,
                                category: 'Local'
                              };
                              setAppSettings(prev => ({
                                ...prev,
                                customSources: [...prev.customSources, newSource]
                              }));
                              input.value = '';
                            } catch (e) {
                              alert("Please enter a valid URL");
                            }
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 block">Manage Sources</label>
                      <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                        {/* Default Sources */}
                        {FEED_SOURCES.map(source => (
                          <div key={source.url} className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setAppSettings(prev => ({
                                    ...prev,
                                    disabledSources: prev.disabledSources.includes(source.url)
                                      ? prev.disabledSources.filter(url => url !== source.url)
                                      : [...prev.disabledSources, source.url]
                                  }));
                                }}
                                className={`p-1 rounded ${appSettings.disabledSources.includes(source.url) ? 'text-gray-300' : 'text-primary'}`}
                              >
                                {appSettings.disabledSources.includes(source.url) ? <Square className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                              </button>
                              <span className={`text-sm font-medium ${appSettings.disabledSources.includes(source.url) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {source.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{source.category}</span>
                          </div>
                        ))}
                        {/* Custom Sources */}
                        {appSettings.customSources.map(source => (
                          <div key={source.url} className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setAppSettings(prev => ({
                                    ...prev,
                                    disabledSources: prev.disabledSources.includes(source.url)
                                      ? prev.disabledSources.filter(url => url !== source.url)
                                      : [...prev.disabledSources, source.url]
                                  }));
                                }}
                                className={`p-1 rounded ${appSettings.disabledSources.includes(source.url) ? 'text-gray-300' : 'text-primary'}`}
                              >
                                {appSettings.disabledSources.includes(source.url) ? <Square className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                              </button>
                              <span className={`text-sm font-medium ${appSettings.disabledSources.includes(source.url) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {source.name} (Custom)
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                  setAppSettings(prev => ({
                                    ...prev,
                                    customSources: prev.customSources.filter(s => s.url !== source.url),
                                    disabledSources: prev.disabledSources.filter(url => url !== source.url)
                                  }));
                              }}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowAppSettings(false)}
                  className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Engine Settings Modal */}
      <AnimatePresence>
        {showAiSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowAiSettings(false); setShowSidebar(true); }} 
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-xs font-bold text-gray-600">Back</span>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">AI Engine Configuration</h2>
                    <p className="text-sm text-gray-500">Configure inference parameters and model selection</p>
                  </div>
                </div>
                <button onClick={() => setShowAiSettings(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-[24px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                      <Cpu className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                        {AVAILABLE_MODELS.find(m => m.id === appSettings.selectedModel)?.name || 'Gemini 2.5 Flash Lite'}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">Current active inference engine</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModelSelector(true)}
                    className="px-5 py-2.5 bg-white border border-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-all shadow-sm"
                  >
                    CHANGE MODEL
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Engine Capabilities</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Quota Tracking Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Context Window</p>
                      <p className="text-sm font-black text-gray-900">
                        {AVAILABLE_MODELS.find(m => m.id === appSettings.selectedModel)?.contextWindow || '1M Tokens'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Inference Speed</p>
                      <p className="text-sm font-black text-gray-900">
                        {AVAILABLE_MODELS.find(m => m.id === appSettings.selectedModel)?.inferenceSpeed || 'High Performance'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Model Burn Rates (Daily)</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {AVAILABLE_MODELS.map(model => {
                      const usage = getUsage(model.id);
                      const percentage = Math.min(100, (usage / model.rpd) * 100);
                      const isExhausted = usage >= model.rpd;
                      
                      return (
                        <div key={model.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-700">{model.name}</span>
                            <span className={`text-[10px] font-black ${isExhausted ? 'text-red-500' : 'text-gray-400'}`}>
                              {usage} / {model.rpd} RPD
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={`h-full rounded-full ${isExhausted ? 'bg-red-500' : percentage > 80 ? 'bg-orange-500' : 'bg-primary'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowAiSettings(false)}
                  className="px-10 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  Confirm Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Onboarding Floating Window */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnboarding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-white shadow-2xl flex flex-col rounded-[32px] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowOnboarding(false); setShowSidebar(true); }} 
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-xs font-bold text-gray-600">Back</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-primary">User Guide</h2>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                      PAGE {onboardingPage + 1} / 6
                    </span>
                  </div>
                </div>
                <button onClick={() => { setShowOnboarding(false); setOnboardingPage(0); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto relative">
                <AnimatePresence mode="wait">
                  {onboardingPage === 0 && (
                    <motion.div
                      key="page0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-8 space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <ShieldAlert className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Welcome to EC Intelligence</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          This platform provides a real-time, AI-powered overview of the media landscape affecting the Eastern Cape Provincial Government.
                        </p>
                      </div>

                      <div className="space-y-6">
                        {[
                          { title: 'Real-time Monitoring', desc: 'Scrapes Google News and RSS feeds to find relevant articles.', icon: <Search className="w-5 h-5 text-primary" /> },
                          { title: 'AI Analysis', desc: 'Uses Gemini AI to summarize and analyze sentiment.', icon: <Activity className="w-5 h-5 text-green-500" /> },
                          { title: 'Strategic Insights', desc: 'Generates SWOT analysis and social climate overviews.', icon: <TrendingUp className="w-5 h-5 text-purple-500" /> }
                        ].map((feature, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              {feature.icon}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">{feature.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-bold text-orange-900">API Key Required</span>
                        </div>
                        <p className="text-xs text-orange-700 leading-relaxed">
                          To run the monitor, you'll need a Google Gemini API key. You can provide this in the menu.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {onboardingPage === 1 && (
                    <motion.div
                      key="page1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-8 space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                          <Settings className="w-6 h-6 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Application Settings</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Customize your intelligence sources and report formatting in the <strong>Application Settings</strong> menu.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            Source Management
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Enable or disable default news sources, or add your own custom RSS feeds. Custom sources are stored locally in your browser.
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-500" />
                            PDF Formatting
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Choose which sections to include in your exported PDF reports, such as SWOT analysis, graphs, or specific government spheres.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {onboardingPage === 2 && (
                    <motion.div
                      key="page2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-8 space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <Settings2 className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Scan Configuration</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Fine-tune what the AI looks for during a monitoring run.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <Building2 className="w-5 h-5 text-primary shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">Government Spheres</h4>
                            <p className="text-xs text-gray-500 mt-1">Select specific departments or municipal services to monitor.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                          <Flag className="w-5 h-5 text-orange-600 shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">Political Context</h4>
                            <p className="text-xs text-gray-500 mt-1">Toggle whether to include political party news (ANC, DA, EFF, etc.) in the scan.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {onboardingPage === 3 && (
                    <motion.div
                      key="page3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-8 space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Running the Monitor</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Start a monitoring run by clicking the <strong>Run Monitor</strong> button.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Date Ranges
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Choose from preset ranges (24h to 3 months) or set a custom date range for targeted intelligence.
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            Live Progress
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Watch the system console for real-time updates on discovery, verification, and AI inference stages.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {onboardingPage === 4 && (
                    <motion.div
                      key="page4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-8 space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Strategic Intelligence</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Once the run is complete, explore the results in your dashboard.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-purple-600" />
                            SWOT & Sentiment
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            The AI automatically identifies Strengths, Weaknesses, Opportunities, and Threats based on the news cycle.
                          </p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Download className="w-4 h-4 text-primary" />
                            Intelligence Reports
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Export your findings to a professional PDF report for distribution to leadership and stakeholders.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {onboardingPage === 5 && (
                    <motion.div
                      key="page5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-8 space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Advanced PDF Intelligence</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Customize your intelligence reports with granular control over depth, focus areas, and strategic analysis.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Depth Levels
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Choose between a Light Overview (2-3 pages) or a Deep Strategic Analysis (20+ pages) for technical depth.
                          </p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            Focus Sections
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Delineate reports by Provincial or Local Government, Figureheads, and Service Delivery metrics.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-8 border-t border-gray-100 space-y-4 bg-gray-50/50">
                <div className="flex gap-3">
                  {onboardingPage > 0 && (
                    <button
                      onClick={() => setOnboardingPage(prev => prev - 1)}
                      className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onboardingPage < 5) {
                        setOnboardingPage(prev => prev + 1);
                      } else {
                        setShowOnboarding(false);
                        setOnboardingPage(0);
                      }
                    }}
                    className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {onboardingPage < 5 ? (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Get Started
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setAppSettings(prev => ({ ...prev, showOnboarding: !prev.showOnboarding }));
                    }}
                    className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-gray-600"
                  >
                    <div className={`p-0.5 rounded ${!appSettings.showOnboarding ? 'text-primary' : 'text-gray-300'}`}>
                      {!appSettings.showOnboarding ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </div>
                    Don't show on startup
                  </button>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${onboardingPage === i ? 'bg-primary w-4' : 'bg-gray-200'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header removed as per user request */}

      <AnimatePresence>
        {showHealthDashboard && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setShowHealthDashboard(false); setShowSidebar(true); }} 
                      className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-xs font-bold text-gray-600">Back</span>
                    </button>
                    <div className="bg-orange-500 p-2 rounded-xl">
                      <Activity className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Source Health Dashboard</h2>
                      <p className="text-xs text-gray-500 font-medium">Monitoring {FEED_SOURCES.length} Active Intelligence Channels</p>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-gray-200" />

                  <div className="flex items-center gap-2">
                    <button 
                      disabled={checkingHealth}
                      onClick={checkSourceHealth}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 disabled:opacity-30 transition-all shadow-sm flex items-center gap-2"
                    >
                      <Play className="w-3 h-3" />
                      Start Monitoring
                    </button>
                    <button 
                      disabled={!checkingHealth}
                      onClick={stopSourceHealth}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 disabled:opacity-30 transition-all shadow-sm flex items-center gap-2"
                    >
                      <Square className="w-3 h-3" />
                      Stop
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHealthDashboard(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                  {/* Live Log / Copy-Paste Block */}
                  <div className="relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={copyHealthLog}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Report
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-3xl p-6 font-mono text-[11px] text-green-400 overflow-hidden border border-gray-800 shadow-2xl">
                      <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-4">
                        <Terminal className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500 uppercase tracking-widest font-black">Intelligence Source Ping Log</span>
                        {checkingHealth && <RefreshCw className="w-3 h-3 animate-spin ml-auto text-orange-500" />}
                      </div>
                      <pre 
                        ref={logEndRef}
                        className="max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed"
                      >
                        {healthLog}
                        {checkingHealth && <span className="animate-pulse">_</span>}
                      </pre>
                    </div>
                  </div>

                  {sourceHealth && sourceHealth.length > 0 && (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Total Sources</p>
                          <p className="text-2xl font-black text-primary">{FEED_SOURCES.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Active (200)</p>
                          <p className="text-2xl font-black text-green-700">
                            {sourceHealth.filter(s => s.status === 200).length}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Restricted (403)</p>
                          <p className="text-2xl font-black text-orange-700">
                            {sourceHealth.filter(s => s.status === 403).length}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                          <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mb-1">Offline (404+)</p>
                          <p className="text-2xl font-black text-red-700">
                            {sourceHealth.filter(s => s.status >= 404 || s.status === 0 || s.status === 408).length}
                          </p>
                        </div>
                      </div>

                      <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source Name</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">URL Endpoint</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Checked</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {sourceHealth.map((health, idx) => {
                              const source = FEED_SOURCES.find(s => s.url === health.url) || FEED_SOURCES[idx];
                              let statusColor = "bg-gray-100 text-gray-500";
                              if (health.status === 200) statusColor = "bg-green-100 text-green-700";
                              else if (health.status === 403) statusColor = "bg-orange-100 text-orange-700";
                              else if (health.status >= 404 || health.status === 408) statusColor = "bg-red-100 text-red-700";

                              return (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-gray-800">{source.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase">{source.category} • {source.sphere}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-[11px] text-gray-500 font-mono truncate max-w-[300px]">{health.url}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-[10px] text-gray-400 font-medium uppercase">{health.lastChecked || 'N/A'}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${statusColor}`}>
                                      {health.status || 'ERR'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <a 
                                      href={health.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 hover:bg-gray-100 rounded-lg inline-block text-gray-400 hover:text-primary transition-all"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {!checkingHealth && (!sourceHealth || sourceHealth.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Server className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-bold text-gray-400">No Health Data Available</p>
                      <button 
                        onClick={checkSourceHealth}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-all"
                      >
                        Initialize Health Check
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <p className="text-xs text-gray-400 font-medium italic">
                  * Status codes indicate the direct accessibility of the source endpoint from the intelligence engine.
                </p>
                <button 
                  onClick={() => setShowHealthDashboard(false)}
                  className="px-8 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                  Close Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPdfSettings && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-xl">
                    <FileText className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Intelligence Report Configuration</h2>
                    <p className="text-xs text-gray-500 font-medium">Customize the depth and focus of your PDF intelligence reports</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPdfSettings(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Report Presets</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {PDF_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setPdfConfig(preset.config)}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              pdfConfig.depth === preset.config.depth 
                                ? 'bg-primary/5 border-primary shadow-sm' 
                                : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <p className={`text-sm font-bold ${pdfConfig.depth === preset.config.depth ? 'text-primary' : 'text-gray-900'}`}>
                              {preset.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Depth & Nuance</h3>
                      <div className="space-y-3">
                        {[
                          { id: 'includeStrategicAnalysis', label: 'Strategic Analysis Perspective', icon: <TrendingUp className="w-4 h-4" /> },
                          { id: 'includeDataReferences', label: 'Technical Data References', icon: <Database className="w-4 h-4" /> },
                          { id: 'includeNuancedInsights', label: 'Nuanced Insight Extraction', icon: <Zap className="w-4 h-4" /> }
                        ].map((option) => (
                          <div key={option.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="text-primary">{option.icon}</div>
                              <span className="text-sm font-bold text-gray-700">{option.label}</span>
                            </div>
                            <div 
                              className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                                (pdfConfig as any)[option.id] ? 'bg-primary' : 'bg-gray-300'
                              }`}
                              onClick={() => setPdfConfig({ ...pdfConfig, [option.id]: !(pdfConfig as any)[option.id] })}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                                (pdfConfig as any)[option.id] ? 'left-7' : 'left-1'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Focus Area Selection</h3>
                      <p className="text-xs text-gray-500 font-medium">Select specific spheres of government or intelligence focus areas to delineate in the report.</p>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { id: 'provincialGovernment', label: 'Provincial Government', icon: <Building2 className="w-4 h-4" /> },
                          { id: 'localGovernment', label: 'Local Government', icon: <MapPin className="w-4 h-4" /> },
                          { id: 'figureHeads', label: 'Key Figureheads & Officials', icon: <Users className="w-4 h-4" /> },
                          { id: 'serviceDelivery', label: 'Service Delivery & Infrastructure', icon: <Truck className="w-4 h-4" /> }
                        ].map((section) => (
                          <div key={section.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-50 rounded-xl text-primary">
                                {section.icon}
                              </div>
                              <span className="text-sm font-bold text-gray-700">{section.label}</span>
                            </div>
                            <div 
                              className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                                (pdfConfig.sections as any)[section.id] ? 'bg-primary' : 'bg-gray-300'
                              }`}
                              onClick={() => setPdfConfig({
                                ...pdfConfig,
                                sections: {
                                  ...pdfConfig.sections,
                                  [section.id]: !(pdfConfig.sections as any)[section.id]
                                }
                              })}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                                (pdfConfig.sections as any)[section.id] ? 'left-7' : 'left-1'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                      <div className="flex items-center gap-3 mb-3">
                        <Info className="w-5 h-5 text-primary" />
                        <h4 className="text-sm font-bold text-primary">Intelligence Depth Notice</h4>
                      </div>
                      <p className="text-xs text-primary/80 leading-relaxed font-medium">
                        Selecting 'Deep Strategic Analysis' will generate a comprehensive report (up to 30 pages) with cross-referenced data points and strategic governance insights. Ensure your focus areas are correctly selected for maximum relevance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setShowPdfSettings(false)}
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                  SAVE REPORT CONFIGURATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start sm:items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 flex-wrap">
                  <button 
                    onClick={() => { setShowConfig(false); setShowSidebar(true); }} 
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-xs font-bold text-gray-600">Back</span>
                  </button>
                  <div className="bg-primary p-2 rounded-xl">
                    <Settings2 className="text-white w-5 h-5" />
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <h2 className="text-lg sm:text-xl font-bold">Monitoring Configuration</h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Fine-tune your media intelligence parameters</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0 ml-4"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Provincial Government */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <Building2 className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-bold">Provincial Government</h3>
                    </div>

                    <div className="space-y-6">
                      <CategoryToggle 
                        label="Executive & Administration"
                        sub="Premier, MECs, DGs, HODs"
                        active={config.provincial.executive.enabled}
                        onToggle={() => setConfig({
                          ...config,
                          provincial: {
                            ...config.provincial,
                            executive: { ...config.provincial.executive, enabled: !config.provincial.executive.enabled }
                          }
                        })}
                        onConfigure={() => setActiveSubModal({ type: 'provincial', category: 'executive' })}
                      />

                      <CategoryToggle 
                        label="Service Delivery"
                        sub="Departmental Programmes"
                        active={config.provincial.delivery.enabled}
                        onToggle={() => setConfig({
                          ...config,
                          provincial: {
                            ...config.provincial,
                            delivery: { ...config.provincial.delivery, enabled: !config.provincial.delivery.enabled }
                          }
                        })}
                        onConfigure={() => setActiveSubModal({ type: 'provincial', category: 'delivery' })}
                      />
                    </div>
                  </div>

                  {/* Local Government */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <MapPin className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-bold">Local Government</h3>
                    </div>

                    <div className="space-y-6">
                      <CategoryToggle 
                        label="Executive & Administration"
                        sub="Mayors, Speakers, MMs"
                        active={config.local.executive.enabled}
                        onToggle={() => setConfig({
                          ...config,
                          local: {
                            ...config.local,
                            executive: { ...config.local.executive, enabled: !config.local.executive.enabled }
                          }
                        })}
                        onConfigure={() => setActiveSubModal({ type: 'local', category: 'executive' })}
                      />

                      <CategoryToggle 
                        label="Service Delivery"
                        sub="Municipal Services"
                        active={config.local.delivery.enabled}
                        onToggle={() => setConfig({
                          ...config,
                          local: {
                            ...config.local,
                            delivery: { ...config.local.delivery, enabled: !config.local.delivery.enabled }
                          }
                        })}
                        onConfigure={() => setActiveSubModal({ type: 'local', category: 'delivery' })}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100">
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-all ${
                        config.includePoliticalParties ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Flag className="w-6 h-6" />
                      </div>
                      <div className={`w-14 h-7 rounded-full transition-all relative cursor-pointer ${
                        config.includePoliticalParties ? 'bg-orange-500' : 'bg-gray-300'
                      }`} onClick={() => setConfig({ ...config, includePoliticalParties: !config.includePoliticalParties })}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                          config.includePoliticalParties ? 'left-8' : 'left-1'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Include Political Party News</p>
                        <p className="text-xs text-gray-500">ANC, DA, EFF, etc. (Governance vs Politics separation)</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      config.includePoliticalParties ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {config.includePoliticalParties ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setShowConfig(false)}
                  className="px-8 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSubModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start sm:items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 flex-wrap">
                  <button 
                    onClick={() => { setActiveSubModal(null); setShowSidebar(true); }} 
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-xs font-bold text-gray-600">Back</span>
                  </button>
                  <div className="bg-primary p-2 rounded-xl text-white">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <h3 className="text-base sm:text-lg font-bold capitalize">
                      {activeSubModal.category === 'executive' ? 'Executive & Admin' : 'Service Delivery'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {activeSubModal.type} Government
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveSubModal(null); setShowConfig(false); }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0 ml-4"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(config[activeSubModal.type][activeSubModal.category].subSections).map(([name, isEnabled]) => (
                    <button
                      key={name}
                      onClick={() => setConfig({
                        ...config,
                        [activeSubModal.type]: {
                          ...config[activeSubModal.type],
                          [activeSubModal.category]: {
                            ...config[activeSubModal.type][activeSubModal.category],
                            subSections: {
                              ...config[activeSubModal.type][activeSubModal.category].subSections,
                              [name]: !isEnabled
                            }
                          }
                        }
                      })}
                      className={`px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border transition-all flex items-center gap-3 ${
                        isEnabled 
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-white' : 'bg-gray-200'}`} />
                      {name}
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                  <button 
                    onClick={() => {
                      const current = config[activeSubModal.type][activeSubModal.category].subSections;
                      const allEnabled = Object.keys(current).reduce((acc, key) => ({ ...acc, [key]: true }), {});
                      setConfig({
                        ...config,
                        [activeSubModal.type]: {
                          ...config[activeSubModal.type],
                          [activeSubModal.category]: {
                            ...config[activeSubModal.type][activeSubModal.category],
                            subSections: allEnabled
                          }
                        }
                      });
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={() => {
                      const current = config[activeSubModal.type][activeSubModal.category].subSections;
                      const allDisabled = Object.keys(current).reduce((acc, key) => ({ ...acc, [key]: false }), {});
                      setConfig({
                        ...config,
                        [activeSubModal.type]: {
                          ...config[activeSubModal.type],
                          [activeSubModal.category]: {
                            ...config[activeSubModal.type][activeSubModal.category],
                            subSections: allDisabled
                          }
                        }
                      });
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setActiveSubModal(null)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTimespanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start sm:items-center justify-between bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <button 
                    onClick={() => { setShowTimespanModal(false); setShowSidebar(true); }} 
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-xs font-bold text-gray-600">Back</span>
                  </button>
                  <div className="bg-primary p-2 rounded-xl text-white">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <h3 className="text-lg sm:text-xl font-bold">Select Timespan</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-widest">
                      Monitoring Duration
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTimespanModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0 ml-4"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                <div className={`grid gap-4 ${orientation === 'landscape' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {[
                    { id: '24h', label: 'Last 24 Hours', desc: 'Recent updates' },
                    { id: '72h', label: 'Last 72 Hours', desc: 'Weekend/3-day view' },
                    { id: '7d', label: 'Last 7 Days', desc: 'Weekly summary' },
                    { id: '14d', label: 'Last 14 Days', desc: 'Bi-weekly trends' },
                    { id: '21d', label: 'Last 21 Days', desc: '3-week analysis' },
                    { id: '28d', label: 'Last 28 Days', desc: 'Monthly overview' },
                    { id: '3m', label: 'Last 3 Months', desc: 'Quarterly review' },
                    { id: 'custom', label: 'Custom Range', desc: 'Specific dates', icon: <Calendar className="w-4 h-4" /> }
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => {
                        if (range.id === 'custom') {
                          setShowCustomDate(true);
                        } else {
                          setConfig(prev => ({ ...prev, dateRange: range.id as any }));
                        }
                        setShowTimespanModal(false);
                      }}
                      className={`group p-6 rounded-[32px] border text-left transition-all flex flex-col gap-2 ${config.dateRange === range.id ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-white border-gray-100 hover:border-primary/20 hover:shadow-sm'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black uppercase tracking-widest ${config.dateRange === range.id ? 'text-primary' : 'text-gray-900'}`}>
                          {range.label}
                        </span>
                        {range.icon && <div className="text-primary">{range.icon}</div>}
                      </div>
                      <span className="text-[10px] font-medium text-gray-400">{range.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPdfExportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start sm:items-center justify-between bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-primary p-2 rounded-xl text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <h3 className="text-lg sm:text-xl font-bold">PDF Export Configuration</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-widest">
                      Customize Your Intelligence Report
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowPdfExportModal(false); setIsGeneratingPdf(false); }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0 ml-4"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                {isGeneratingPdf ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 space-y-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h4 className="text-lg font-bold text-gray-900">{pdfProgress?.title || 'Generating Intelligence Report'}</h4>
                      <p className="text-sm text-gray-500 animate-pulse">{pdfProgress?.subtext || 'Preparing document structure...'}</p>
                    </div>
                    
                    <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5, ease: "easeInOut" }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Presets */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Quick Presets</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {PDF_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setPdfConfig(preset.config)}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              pdfConfig.depth === preset.id 
                                ? 'bg-primary/5 border-primary/20 shadow-inner' 
                                : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 truncate ${pdfConfig.depth === preset.id ? 'text-primary' : 'text-gray-900'}`}>{preset.name}</p>
                            <p className="text-[9px] text-gray-400 leading-tight line-clamp-2">{preset.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout Template */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Layout Template</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'standard', label: 'Standard', desc: 'Balanced multi-page' },
                          { id: 'executive', label: 'Executive', desc: 'Summary focused' },
                          { id: 'compact', label: 'Compact', desc: 'Information dense' }
                        ].map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => setPdfConfig({ ...pdfConfig, layoutTemplate: tpl.id as any })}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              pdfConfig.layoutTemplate === tpl.id 
                                ? 'bg-primary/5 border-primary/20 shadow-inner' 
                                : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 truncate ${pdfConfig.layoutTemplate === tpl.id ? 'text-primary' : 'text-gray-900'}`}>{tpl.label}</p>
                            <p className="text-[9px] text-gray-400 leading-tight line-clamp-2">{tpl.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sections Toggle */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Include Content Components</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'includeSummary', label: 'Executive Summary', icon: <FileText className="w-4 h-4" /> },
                          { key: 'includeSwot', label: 'SWOT Analysis', icon: <Target className="w-4 h-4" /> },
                          { key: 'includeSentiment', label: 'Sentiment Analysis', icon: <BarChart3 className="w-4 h-4" /> },
                          { key: 'includeKeyEntities', label: 'Key Entities', icon: <Users className="w-4 h-4" /> },
                          { key: 'includeGraphs', label: 'Data Visualizations', icon: <PieChartIcon className="w-4 h-4" /> },
                          { key: 'includeStrategicAnalysis', label: 'Strategic Insights', icon: <Zap className="w-4 h-4" /> }
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="text-gray-400">{item.icon}</div>
                              <span className="text-xs font-bold text-gray-700 truncate">{item.label}</span>
                            </div>
                            <button
                              onClick={() => setPdfConfig({ ...pdfConfig, [item.key]: !pdfConfig[item.key as keyof PdfConfig] })}
                              className={`w-10 h-6 rounded-full transition-colors relative ${pdfConfig[item.key as keyof PdfConfig] ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pdfConfig[item.key as keyof PdfConfig] ? 'left-5' : 'left-1'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Focus Area Selection */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Focus Area Selection</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'provincialGovernment', label: 'Provincial Government', icon: <Building2 className="w-4 h-4" /> },
                          { id: 'localGovernment', label: 'Local Government', icon: <MapPin className="w-4 h-4" /> },
                          { id: 'figureHeads', label: 'Key Figureheads', icon: <Users className="w-4 h-4" /> },
                          { id: 'serviceDelivery', label: 'Service Delivery', icon: <Truck className="w-4 h-4" /> }
                        ].map((section) => (
                          <div key={section.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-50 rounded-xl text-primary">
                                {section.icon}
                              </div>
                              <span className="text-xs font-bold text-gray-700 truncate">{section.label}</span>
                            </div>
                            <button
                              onClick={() => setPdfConfig({
                                ...pdfConfig,
                                sections: {
                                  ...pdfConfig.sections,
                                  [section.id]: !(pdfConfig.sections as any)[section.id]
                                }
                              })}
                              className={`w-10 h-6 rounded-full transition-colors relative ${
                                (pdfConfig.sections as any)[section.id] ? 'bg-primary' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                                (pdfConfig.sections as any)[section.id] ? 'left-5' : 'left-1'
                              }`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
                {!isGeneratingPdf ? (
                  <button 
                    onClick={async () => {
                      setIsGeneratingPdf(true);
                      
                      try {
                        const data = preparePDFData();
                        const dateRangeStr = config.dateRange === 'custom' ? `${customDates.start} to ${customDates.end}` : config.dateRange;
                        
                        setPdfProgress({ title: 'INITIALIZING PDF ENGINE', subtext: 'Preparing document structure and layout templates...' });
                        await new Promise(r => setTimeout(r, 800));

                        setPdfProgress({ title: 'PROCESSING DATA', subtext: `Formatting ${Object.keys(data?.clusters || {}).length} categories and intelligence metrics...` });
                        await new Promise(r => setTimeout(r, 800));

                        setPdfProgress({ title: 'RENDERING PDF', subtext: 'Generating typography, charts, and applying styles...' });
                        const doc = <MediaIntelligencePDF 
                          data={data} 
                          dateRange={dateRangeStr} 
                          config={pdfConfig}
                          summary={report?.summary || null}
                        />;
                        
                        const asPdf = pdf(doc);
                        
                        setPdfProgress({ title: 'FINALIZING DOCUMENT', subtext: 'Compressing assets and preparing download blob...' });
                        const blob = await asPdf.toBlob();
                        
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `EC_Media_Intelligence_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        setIsGeneratingPdf(false);
                        setShowPdfExportModal(false);
                        setPdfProgress(null);
                      } catch (err) {
                        console.error("PDF Generation Error:", err);
                        setPdfProgress({ title: 'GENERATION FAILED', subtext: err instanceof Error ? err.message : 'An unknown error occurred during PDF creation.' });
                        setTimeout(() => {
                          setIsGeneratingPdf(false);
                          setPdfProgress(null);
                        }, 4000);
                      }
                    }}
                    className="w-full py-4 px-8 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    GENERATE PDF REPORT
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setIsGeneratingPdf(false); setShowPdfExportModal(false); setPdfProgress(null); }}
                      className="flex-1 py-4 px-6 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                      CANCEL
                    </button>
                    <button 
                      disabled={true}
                      className="flex-[2] py-4 px-8 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 min-w-[200px]"
                    >
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
                      <span className="whitespace-nowrap">PREPARING PDF...</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRunConfirmation && pendingRange && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-xl text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Run Confirmation</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                      Estimated Workload for {pendingRange === 'custom' ? 'Custom Range' : `Last ${pendingRange}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRunConfirmation(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto flex-1">
                {(() => {
                  const est = calculateEstimates(pendingRange);
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10">
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Articles</p>
                          <p className="text-2xl font-black text-primary">~{est.articles}</p>
                          <p className="text-[10px] text-primary/60 mt-1">Expected Volume</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
                          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Batches</p>
                          <p className="text-2xl font-black text-orange-700">{est.batches}</p>
                          <p className="text-[10px] text-orange-400 mt-1">AI Processing Units</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-3xl border border-green-100">
                          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Est. Time</p>
                          <p className="text-2xl font-black text-green-700">~{est.totalTime}m</p>
                          <p className="text-[10px] text-green-400 mt-1">Optimistic Window</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 border-b pb-2">What the app will be doing:</h4>
                        
                        <div className="flex gap-4">
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">1</div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Finding (Discovery)</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              The app will scan {est.sources} news sources and perform targeted Google searches to find any mention of the Eastern Cape government. This takes about {est.discoveryTime} seconds.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">2</div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Sorting & Verifying</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              We filter out duplicates and verify if the news links are from trusted sources like News24 or Daily Dispatch to ensure accuracy.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">3</div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Inferring (AI Analysis)</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Gemini AI will read the articles in {est.batches} batches. It looks for sentiment, reputational risk, and specific service delivery issues. We include "breathers" between batches to stay within API limits. This takes about {est.inferenceTime} seconds.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">4</div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Packaging</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Finally, the app compiles all findings into the interactive dashboard and prepares your downloadable PDF intelligence report.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
                <button 
                  onClick={() => setShowRunConfirmation(false)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleMonitor(pendingRange, true)}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                  Understood, Execute Run
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomDate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowCustomDate(false); setShowSidebar(true); }} 
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all mr-2 group"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-xs font-bold text-gray-600">Back</span>
                  </button>
                  <div className="bg-primary p-2 rounded-xl">
                    <CalendarDays className="text-primary w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Custom Range</h3>
                </div>
                <button onClick={() => { setShowCustomDate(false); setShowTimespanModal(false); }}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" 
                    value={customDates.start}
                    onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date" 
                    value={customDates.end}
                    onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>

                <button 
                  onClick={handleCustomDateSubmit}
                  disabled={!customDates.start || !customDates.end}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold transition-all hover:bg-primary-hover shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Apply & Run Monitor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuotaPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-xl text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-700">Quota Exceeded</h3>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                      Free Tier Limit Reached
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQuotaPopup(false)}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    What happened?
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    The API key has reached its limit. This can happen if the free tier token quota is exhausted or if the Google Search tool limit has been reached for today. To continue, please provide a fresh Gemini API key from Google AI Studio.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    How to get a free API Key:
                  </h4>
                  <ol className="space-y-3">
                    {[
                      { step: "1", text: "Visit Google AI Studio", link: "https://aistudio.google.com/app/apikey" },
                      { step: "2", text: "Sign in with your Google Account" },
                      { step: "3", text: "Click 'Create API key' in the left sidebar" },
                      { step: "4", text: "Copy your new key and paste it below" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                          {item.step}
                        </span>
                        <div className="text-xs text-gray-600">
                          {item.text}
                          {item.link && (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-primary hover:underline font-bold inline-flex items-center gap-1"
                            >
                              aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Your Gemini API Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password"
                      value={userApiKey}
                      onChange={(e) => setUserApiKey(e.target.value)}
                      placeholder="Paste your API key here (AIza...)"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => {
                    if (userApiKey) {
                      setShowQuotaPopup(false);
                      handleMonitor();
                    }
                  }}
                  disabled={!userApiKey}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Save Key & Retry Monitor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="bg-white border-b border-gray-100 z-30 sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <img 
                src={LOGO_URL} 
                alt="Eastern Cape Logo" 
                className="h-14 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <nav className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setShowSidebar(true)}
                className="px-3 py-2 text-[10px] sm:text-xs font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2"
              >
                <Menu className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden md:inline">Menu</span>
              </button>
              <button 
                onClick={() => setShowConfig(true)}
                className="px-3 py-2 text-[10px] sm:text-xs font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2"
              >
                <Settings2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden md:inline">Monitor Config</span>
              </button>
              <button 
                onClick={() => setShowPdfSettings(true)}
                className="px-3 py-2 text-[10px] sm:text-xs font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden md:inline">PDF Config</span>
              </button>
              <button 
                onClick={() => setShowOnboarding(true)}
                className="px-3 py-2 text-[10px] sm:text-xs font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden md:inline">Help</span>
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowTimespanModal(true)}
                disabled={loading}
                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-[10px] sm:text-xs hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 h-4 text-primary" />
                <span>Timespan: {getTimeRangeLabel(config.dateRange)}</span>
              </button>
            </div>

            <button 
              onClick={loading ? handleStop : () => handleMonitor()}
              className={`px-4 py-2 ${loading ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'} text-white rounded-xl font-bold text-[10px] sm:text-xs transition-all shadow-lg shadow-primary/20 flex items-center gap-2`}
            >
              {loading ? (
                <>
                  <X className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>SCAN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {!isApiKeyValid() && (
        <div className="w-full bg-orange-50 border-b border-orange-100 px-4 py-2 flex items-center justify-center gap-2">
          <Key className="w-4 h-4 text-orange-600" />
          <span className="text-[10px] sm:text-xs font-medium text-orange-800">
            Gemini API Key is missing. Please configure it in the Secrets panel to enable AI features.
          </span>
        </div>
      )}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${orientation === 'landscape' ? 'pt-4 pb-8 sm:pt-6 sm:pb-12' : 'pt-2 pb-6 sm:pt-4 sm:pb-8'} flex-1 w-full ${!report && !loading ? 'flex flex-col items-center justify-start overflow-y-auto' : 'overflow-auto'}`}>
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Dashboard Header - Only show when report or loading */}
        {(report || loading) && (
          <div className={`flex flex-col ${orientation === 'landscape' ? 'md:flex-row md:items-end' : ''} justify-between gap-6 mb-8 p-6 bg-white rounded-3xl border border-gray-200 shadow-sm w-full`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`${orientation === 'portrait' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold tracking-tight truncate`}>Media Intelligence Dashboard</h2>
              </div>
              <p className="text-gray-500 font-medium text-xs sm:text-sm">Real-time monitoring of governance and service delivery in the Eastern Cape.</p>
            </div>
            <div className={`flex items-center ${orientation === 'portrait' ? 'flex-wrap gap-2' : 'gap-3'} shrink-0`}>
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-[9px] sm:text-xs font-bold text-gray-600">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                {config.dateRange === 'custom' ? `${customDates.start} to ${customDates.end}` : config.dateRange.toUpperCase()}
              </div>
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-[9px] sm:text-xs font-bold text-gray-600">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                {orientation === 'landscape' ? 'SECURE MONITORING ACTIVE' : 'SECURE'}
              </div>
              <button 
                onClick={() => setShowLogs(!showLogs)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-[9px] sm:text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {showLogs ? 'HIDE LOGS' : 'VIEW LOGS'}
              </button>
              <button 
                onClick={() => setShowPdfExportModal(true)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-white rounded-xl flex items-center gap-2 text-[9px] sm:text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                EXPORT PDF
              </button>
            </div>
          </div>
        )}

        {showLogs && !loading && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8"
          >
            <div className="bg-[#0a0a0a] rounded-3xl p-4 sm:p-6 border border-gray-800 shadow-2xl">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">System Console History</span>
                </div>
                <button 
                  onClick={() => setActivityLog([])}
                  className="text-[8px] sm:text-[9px] font-mono text-gray-600 hover:text-gray-400"
                >
                  CLEAR LOGS
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar font-mono">
                {activityLog.length === 0 ? (
                  <div className="text-gray-600 text-[10px]">No activity logs available.</div>
                ) : (
                  activityLog.map((log, idx) => (
                    <div key={idx} className="text-[9px] sm:text-[10px] leading-relaxed break-all text-gray-500">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white rounded-[32px] border border-primary/10 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center relative">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  <div className="absolute inset-0 border-2 border-primary/20 border-t-transparent rounded-2xl animate-[spin_3s_linear_infinite]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      {stages.find(s => s.id === loadingStage)?.name || 'Processing Intelligence...'}
                    </h3>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    </div>
                  </div>
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-0.5 animate-pulse">
                    {subProcess || loadingStatus || 'Initializing System...'}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-2">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Elapsed</span>
                    <span className="text-xs font-mono font-bold text-gray-900">
                      {Math.floor(estimateInfo.elapsedSeconds / 60)}:{(estimateInfo.elapsedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estimate</span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {estimateInfo.adjustmentMessage}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-64 bg-gray-100 rounded-full overflow-hidden border border-gray-50 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full transition-all duration-1000 ease-linear" 
                    style={{ width: `${Math.min((estimateInfo.elapsedSeconds / estimateInfo.totalSeconds) * 100, 99)}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Granular Progress Stages */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
              {stages.map((stage) => {
                const isCompleted = loadingStage > stage.id;
                const isActive = loadingStage === stage.id;
                return (
                  <div 
                    key={stage.id} 
                    className={`p-3.5 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                      isActive 
                        ? 'bg-white border-primary shadow-md ring-1 ring-primary/10 scale-[1.02] z-10' 
                        : isCompleted 
                          ? 'bg-emerald-50/50 border-emerald-100' 
                          : 'bg-gray-50/50 border-gray-100 opacity-40'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-1.5 rounded-lg ${
                          isActive ? 'bg-primary text-white' : isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {stage.icon}
                        </div>
                        {isCompleted ? (
                          <div className="bg-emerald-500 rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        ) : isActive ? (
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                          </div>
                        ) : null}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                        isActive ? 'text-primary' : isCompleted ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        {stage.name}
                      </span>
                      <p className={`text-[9px] font-bold leading-tight ${
                        isActive ? 'text-primary/70' : isCompleted ? 'text-emerald-600/70' : 'text-gray-400'
                      }`}>
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-[#0a0a0a] rounded-3xl p-4 sm:p-6 border border-gray-800 shadow-2xl">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Live System Console</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono text-gray-600">v2.1.0-STABLE</span>
              </div>
              <div className="space-y-1 max-h-32 sm:max-h-48 overflow-y-auto pr-2 custom-scrollbar font-mono" ref={logContainerRef}>
                {activityLog.map((log, idx) => (
                  <div key={idx} className={`text-[9px] sm:text-[10px] leading-relaxed break-all ${idx === activityLog.length - 1 ? 'text-green-400' : 'text-gray-500'}`}>
                    {idx === activityLog.length - 1 ? '> ' : '  '}{log}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {filteredReport && (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard 
                title="Total Scanned" 
                value={filteredReport?.summary?.total_articles_scanned || 0} 
                icon={<Newspaper className="w-5 h-5" />}
                color="primary"
              />
              <StatCard 
                title="Articles Discovered" 
                value={filteredReport?.articles?.length || 0} 
                icon={<CheckCircle className="w-5 h-5" />}
                color="green"
              />
              <StatCard 
                title="High Risk" 
                value={(filteredReport?.summary?.high_risk || 0) + (filteredReport?.summary?.critical_risk || 0)} 
                icon={<AlertTriangle className="w-5 h-5" />}
                color="red"
              />
              <StatCard 
                title="Response Needed" 
                value={filteredReport?.summary?.response_needed || 0} 
                icon={<Clock className="w-5 h-5" />}
                color="orange"
              />
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Risk Distribution
                  </h3>
                </div>
                <div className="h-64 min-h-[256px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={[
                      { name: 'Critical', count: filteredReport?.summary?.critical_risk || 0, color: '#ef4444' },
                      { name: 'High', count: filteredReport?.summary?.high_risk || 0, color: '#f97316' },
                      { name: 'Moderate', count: (filteredReport?.articles || []).filter(a => a.reputational_risk === 'Moderate').length, color: '#f59e0b' },
                      { name: 'Low', count: (filteredReport?.articles || []).filter(a => a.reputational_risk === 'Low').length, color: '#3b82f6' },
                      { name: 'None', count: (filteredReport?.articles || []).filter(a => a.reputational_risk === 'None').length, color: '#10b981' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f9fafb' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Critical', color: '#ef4444' },
                          { name: 'High', color: '#f97316' },
                          { name: 'Moderate', color: '#f59e0b' },
                          { name: 'Low', color: '#3b82f6' },
                          { name: 'None', color: '#10b981' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tone Bar Chart */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-primary" />
                    Sentiment Tone
                  </h3>
                </div>
                <div className="h-64 min-h-[256px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={[
                      { name: 'Positive', count: filteredReport?.summary?.positive || 0, color: '#10b981' },
                      { name: 'Neutral', count: filteredReport?.summary?.neutral || 0, color: '#3b82f6' },
                      { name: 'Mixed', count: filteredReport?.summary?.mixed || 0, color: '#f97316' },
                      { name: 'Negative', count: filteredReport?.summary?.negative || 0, color: '#ef4444' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f9fafb' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Positive', color: '#10b981' },
                          { name: 'Neutral', color: '#3b82f6' },
                          { name: 'Mixed', color: '#f97316' },
                          { name: 'Negative', color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Social Climate Summary */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Social Climate
                  </h3>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">AI Insight</span>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 h-[200px] overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 leading-relaxed italic">
                    "{filteredReport?.summary?.social_climate_summary || 'No summary generated for this period.'}"
                  </p>
                </div>
                <p className="mt-4 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Based on pattern matching across {filteredReport?.articles?.length || 0} news reports
                </p>
              </div>
            </div>

            {/* SWOT Analysis Section */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Holistic SWOT Analysis</h3>
                  <p className="text-sm text-gray-500 font-medium">Semantic overview of the Eastern Cape media landscape (24h Snapshot)</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Intelligence Matrix</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-emerald-900 uppercase tracking-tight">Strengths</h4>
                  </div>
                  <ul className="space-y-3">
                    {(filteredReport?.summary?.swot_analysis?.strengths || []).map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium text-emerald-800 leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                    {(!filteredReport?.summary?.swot_analysis?.strengths || filteredReport?.summary?.swot_analysis?.strengths.length === 0) && (
                      <li className="text-sm text-emerald-600 italic">No significant strengths identified.</li>
                    )}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-red-900 uppercase tracking-tight">Weaknesses</h4>
                  </div>
                  <ul className="space-y-3">
                    {(filteredReport?.summary?.swot_analysis?.weaknesses || []).map((w, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium text-red-800 leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {w}
                      </li>
                    ))}
                    {(!filteredReport?.summary?.swot_analysis?.weaknesses || filteredReport?.summary?.swot_analysis?.weaknesses.length === 0) && (
                      <li className="text-sm text-red-600 italic">No significant weaknesses identified.</li>
                    )}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-primary uppercase tracking-tight">Opportunities</h4>
                  </div>
                  <ul className="space-y-3">
                    {(filteredReport?.summary?.swot_analysis?.opportunities || []).map((o, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium text-primary/80 leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                        {o}
                      </li>
                    ))}
                    {(!filteredReport?.summary?.swot_analysis?.opportunities || filteredReport?.summary?.swot_analysis?.opportunities.length === 0) && (
                      <li className="text-sm text-primary/60 italic">No significant opportunities identified.</li>
                    )}
                  </ul>
                </div>

                {/* Threats */}
                <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-orange-900 uppercase tracking-tight">Threats</h4>
                  </div>
                  <ul className="space-y-3">
                    {(filteredReport?.summary?.swot_analysis?.threats || []).map((t, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium text-orange-800 leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        {t}
                      </li>
                    ))}
                    {(!filteredReport?.summary?.swot_analysis?.threats || filteredReport?.summary?.swot_analysis?.threats.length === 0) && (
                      <li className="text-sm text-orange-600 italic">No significant threats identified.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Top Entities Section */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Top Entities Mentioned
                </h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Entity Frequency</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {topEntities.map(([entity, count], i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all group cursor-default"
                  >
                    <span className="text-xs font-bold text-gray-700 group-hover:text-primary">{entity}</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-white border border-gray-200 rounded-md text-gray-400 group-hover:text-primary group-hover:border-primary/20">
                      {count}
                    </span>
                  </div>
                ))}
                {topEntities.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No entities identified in this report.</p>
                )}
              </div>
            </div>

            {/* Sentiment Breakdown Section */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-emerald-600" />
                  Sentiment Breakdown
                </h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Overall Sentiment</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-64 min-h-[256px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: 'Positive', count: report?.summary?.positive || 0, color: '#10b981' },
                        { name: 'Neutral', count: report?.summary?.neutral || 0, color: '#3b82f6' },
                        { name: 'Mixed', count: report?.summary?.mixed || 0, color: '#f97316' },
                        { name: 'Negative', count: report?.summary?.negative || 0, color: '#ef4444' },
                      ]}
                      margin={{ left: 20, right: 30, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f9fafb' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {[
                          { name: 'Positive', color: '#10b981' },
                          { name: 'Neutral', color: '#3b82f6' },
                          { name: 'Mixed', color: '#f97316' },
                          { name: 'Negative', color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Positive', count: report?.summary?.positive || 0, color: 'bg-emerald-500', text: 'text-emerald-700' },
                    { name: 'Neutral', count: report?.summary?.neutral || 0, color: 'bg-primary', text: 'text-primary' },
                    { name: 'Negative', count: report?.summary?.negative || 0, color: 'bg-red-500', text: 'text-red-700' },
                    { name: 'Mixed', count: report?.summary?.mixed || 0, color: 'bg-orange-500', text: 'text-orange-700' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm font-bold text-gray-700">{item.name}</span>
                      </div>
                      <span className={`text-sm font-black ${item.text}`}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Source Verification Checklist */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold">Source Verification Checklist</h3>
                </div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Checks & Balances</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(report?.verification_checklist || []).map((check, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold truncate pr-2">{check.domain}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        check.status === 'Checked - Articles Found' ? 'bg-green-100 text-green-700' :
                        check.status === 'Checked - No Relevant Articles' ? 'bg-primary/10 text-primary' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {check.status.replace('Checked - ', '')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{check.findings_summary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`grid grid-cols-1 ${orientation === 'landscape' ? 'md:grid-cols-3' : ''} gap-8`}>
              {/* Article List */}
              <div className={`${orientation === 'landscape' ? 'md:col-span-2' : ''} space-y-6`}>
                <div className={`flex flex-col ${orientation === 'landscape' ? 'sm:flex-row sm:items-center' : ''} justify-between gap-4 mb-4`}>
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Latest Coverage
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {report?.articles?.length || 0} articles in {Object.keys(groupArticles(report?.articles || [])).length} clusters
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort:</span>
                    <select 
                      value={sort.field}
                      onChange={(e) => setSort({ ...sort, field: e.target.value as any })}
                      className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="date">Date</option>
                      <option value="risk">Risk</option>
                    </select>
                    <button 
                      onClick={() => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                      className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      title={sort.direction === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                    >
                      {sort.direction === 'asc' ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Search and Filters Section */}
                <div className="space-y-4 mb-6">
                  {/* Search Bar */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search articles by title, source, entity, or tags..."
                      className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-medium text-sm"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filters</span>
                  </div>
                  
                  {/* Sphere Filter */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sphere</span>
                    <div className="flex gap-1.5">
                      {['National', 'Provincial', 'Local'].map(sphere => (
                        <button
                          key={sphere}
                          onClick={() => setFilterSpheres(prev => prev.includes(sphere) ? prev.filter(s => s !== sphere) : [...prev, sphere])}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            filterSpheres.includes(sphere)
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {sphere}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Risk Filter */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Risk</span>
                    <div className="flex gap-1.5">
                      {['Critical', 'High', 'Moderate', 'Low', 'None'].map(risk => (
                        <button
                          key={risk}
                          onClick={() => setFilterRisks(prev => prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk])}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            filterRisks.includes(risk)
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {risk}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags Filter */}
                  {filteredReport && Array.from(new Set(filteredReport.articles.flatMap(a => a.user_tags || []))).length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tags</span>
                      <div className="flex gap-1.5">
                        {Array.from(new Set(filteredReport.articles.flatMap(a => a.user_tags || []))).map(tag => (
                          <button
                            key={tag}
                            onClick={() => setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                              filterTags.includes(tag)
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(filterTags.length > 0 || filterSpheres.length > 0 || filterRisks.length > 0 || searchTerm) && (
                    <button 
                      onClick={() => {
                        setFilterTags([]);
                        setFilterSpheres([]);
                        setFilterRisks([]);
                        setSearchTerm('');
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 ml-auto flex items-center gap-1.5 px-2 py-1 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="w-3 h-3" />
                      CLEAR ALL
                    </button>
                  )}
                </div>
              </div>
              
              {Object.keys(groupArticles(filteredReport.articles)).length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
                    <Info className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm text-gray-400">No articles found matching your current search or filters.</p>
                    {(filterTags.length > 0 || filterSpheres.length > 0 || filterRisks.length > 0 || searchTerm) && (
                      <button 
                        onClick={() => {
                          setFilterTags([]);
                          setFilterSpheres([]);
                          setFilterRisks([]);
                          setSearchTerm('');
                        }}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
                      >
                        Clear All Filters & Search
                      </button>
                    )}
                  </div>
                ) : (
                  Object.entries(groupArticles(filteredReport.articles)).map(([clusterId, articles], idx) => (
                    <ArticleCluster 
                      key={clusterId} 
                      articles={articles} 
                      index={idx}
                      selectedArticle={selectedArticle}
                      onSelect={(article) => {
                        setSelectedArticle(article);
                        setShowMobileDetail(true);
                      }}
                      onUpdateTags={handleUpdateArticleTags}
                      onGenerateSummary={handleGenerateSummary}
                    />
                  ))
                )}
              </div>

              {/* Detail Panel - Desktop (Landscape) */}
              <div className={`${orientation === 'landscape' && !isMobile ? 'block md:col-span-1' : 'hidden'}`}>
                <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2">
                  <AnimatePresence mode="wait">
                    {selectedArticle ? (
                      <ArticleDetailView 
                        article={selectedArticle} 
                        onClose={() => setSelectedArticle(null)} 
                        onUpdateTags={handleUpdateArticleTags}
                        onTagClick={handleTagClick}
                        onGenerateSummary={handleGenerateSummary}
                      />
                    ) : (
                      <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
                        <Info className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm text-gray-400">Select an article to view detailed intelligence and risk assessment.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {!report && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center text-center w-full ${orientation === 'landscape' ? 'max-w-5xl' : 'max-w-md'}`}
          >
            {/* Intelligence Ready Block */}
            <div className="w-full flex flex-col items-center mb-8">
              <div className={`w-10 h-10 bg-primary/5 rounded-[20px] flex items-center justify-center mb-2 shadow-inner`}>
                <ShieldCheck className={`w-5 h-5 text-primary`} />
              </div>
              <h3 className={`${orientation === 'landscape' ? 'text-2xl' : 'text-lg'} font-black text-gray-900 mb-1 tracking-tight uppercase`}>Intelligence Ready</h3>
              <p className="text-gray-500 max-w-lg mx-auto mb-4 font-medium leading-relaxed text-[10px]">
                Configure your monitoring parameters and execute a scan to discover real-time media intelligence and reputational risks.
              </p>

              <div className={`grid gap-2 w-full ${orientation === 'landscape' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {[
                  { icon: <Search className="w-3.5 h-3.5" />, title: "Discovery", desc: "Scan 100+ government and news sources" },
                  { icon: <ShieldAlert className="w-3.5 h-3.5" />, title: "Risk Analysis", desc: "AI-powered reputational risk assessment" },
                  { icon: <FileText className="w-3.5 h-3.5" />, title: "Reporting", desc: "Generate executive intelligence reports" }
                ].map((item, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center text-primary mb-1.5">
                      {item.icon}
                    </div>
                    <h4 className="text-[9px] font-bold text-gray-900 mb-0.5 uppercase tracking-wide">{item.title}</h4>
                    <p className="text-[8px] text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Center Block */}
            <div className="w-full flex flex-col items-center mb-8">
              <div className={`w-10 h-10 bg-primary/5 rounded-[20px] flex items-center justify-center mb-2 shadow-inner`}>
                <Settings className={`w-5 h-5 text-primary`} />
              </div>
              <h3 className={`${orientation === 'landscape' ? 'text-2xl' : 'text-lg'} font-black text-gray-900 mb-1 tracking-tight uppercase`}>Control Center</h3>
              <p className="text-gray-500 max-w-lg mx-auto mb-4 font-medium leading-relaxed text-[10px]">
                Manage your monitoring environment, configure output formats, and execute intelligence gathering operations.
              </p>
              
              <div className={`grid gap-2 w-full ${orientation === 'landscape' ? 'grid-cols-3 max-w-2xl' : 'grid-cols-2 max-w-xs'}`}>
                {/* Row 1: Menu | Monitor Config | PDF Config */}
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="group flex flex-col items-center justify-center p-3 bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all aspect-square"
                >
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-1.5 group-hover:scale-110 transition-transform">
                    <Menu className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Menu</span>
                </button>

                <button 
                  onClick={() => setShowConfig(true)}
                  className="group flex flex-col items-center justify-center p-3 bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all aspect-square"
                >
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-1.5 group-hover:scale-110 transition-transform">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest text-center leading-tight">Monitor Config</span>
                </button>

                <button 
                  onClick={() => setShowPdfSettings(true)}
                  className="group flex flex-col items-center justify-center p-3 bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all aspect-square"
                >
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-1.5 group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest text-center leading-tight">PDF Config</span>
                </button>

                {/* Row 2: Help | Timespan | Execute Scan */}
                <button 
                  onClick={() => setShowOnboarding(true)}
                  className="group flex flex-col items-center justify-center p-3 bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all aspect-square"
                >
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-1.5 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Help</span>
                </button>

                <button 
                  onClick={() => setShowTimespanModal(true)}
                  className="group flex flex-col items-center justify-center p-3 bg-primary/5 rounded-[20px] border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/20 transition-all aspect-square"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary mb-1.5 group-hover:scale-110 transition-transform shadow-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest text-center leading-tight">Timespan: {getTimeRangeLabel(config.dateRange)}</span>
                </button>

                <button 
                  onClick={() => handleMonitor()}
                  className="group flex flex-col items-center justify-center p-3 bg-primary rounded-[20px] shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all aspect-square"
                >
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white mb-1.5 group-hover:scale-110 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black text-white uppercase tracking-widest text-center leading-tight">Execute Scan</span>
                </button>
              </div>
            </div>

            {/* System Insights Block */}
            <div className="w-full flex flex-col items-center mb-6">
              <div className={`w-10 h-10 bg-primary/5 rounded-[20px] flex items-center justify-center mb-2 shadow-inner`}>
                <Activity className={`w-5 h-5 text-primary`} />
              </div>
              <h3 className={`${orientation === 'landscape' ? 'text-2xl' : 'text-lg'} font-black text-gray-900 mb-1 tracking-tight uppercase`}>System Insights</h3>
              <p className="text-gray-500 max-w-lg mx-auto mb-4 font-medium leading-relaxed text-[10px]">
                Real-time status of intelligence sources and the underlying AI engine configuration.
              </p>

              <div className={`grid grid-cols-2 gap-2 w-full mx-auto ${orientation === 'landscape' ? 'max-w-lg' : 'max-w-[340px]'}`}>
                <button 
                  onClick={() => setShowHealthDashboard(true)}
                  className="p-4 bg-gray-50/50 rounded-[24px] border border-gray-100 flex flex-col items-center text-center gap-2 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wide">Source Health</h4>
                    <p className="text-[9px] text-gray-500 font-medium">124 active intelligence nodes verified</p>
                  </div>
                </button>
                <button 
                  onClick={() => setShowModelSelector(true)}
                  className="p-4 bg-gray-50/50 rounded-[24px] border border-gray-100 flex flex-col items-center text-center gap-2 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wide">AI Engine</h4>
                    <p className="text-[9px] text-gray-500 font-medium uppercase">{AVAILABLE_MODELS.find(m => m.id === appSettings.selectedModel)?.name || 'Gemini 2.5 Flash Lite'} ready</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}


        <AnimatePresence>
          {showCompletionPopup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl border border-primary/10 p-8 max-w-md w-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-2xl mb-6">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Intelligence Scan Complete</h3>
                  <p className="text-gray-500 mb-8 font-medium">
                    The media intelligence scan has finished processing. We've discovered {report?.articles.length || 0} relevant articles and identified key reputational risks.
                  </p>
                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={() => setShowCompletionPopup(false)}
                      className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                    >
                      VIEW INTELLIGENCE DASHBOARD
                    </button>
                    <button
                      onClick={() => {
                        setShowCompletionPopup(false);
                        setShowPdfSettings(true);
                      }}
                      className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
                    >
                      CONFIGURE PDF REPORT
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCompletionPopup(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showModelSelector && (
            <ModelSelectorModal
              isOpen={showModelSelector}
              onClose={() => setShowModelSelector(false)}
              onBack={() => setShowModelSelector(false)}
              selectedModel={appSettings.selectedModel}
              availableModels={discoveredModels}
              onSelect={(modelId) => {
                setAppSettings(prev => ({ ...prev, selectedModel: modelId }));
                setToast({ message: `Engine switched to ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name}`, type: 'success' });
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showQuotaPopup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border border-red-100"
              >
                <div className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center text-red-500 mx-auto animate-bounce">
                    <ZapOff className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Quota Exhausted</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      You've reached the daily limit for the selected Gemini model. The AI Engine has automatically attempted to switch to a higher-capacity model.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Recommended Action</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Switch to <strong>Gemini 2.5 Flash Lite</strong> or <strong>Gemini 3.1 Flash Lite</strong> for maximum daily capacity (up to 1,500 requests).
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setShowQuotaPopup(false);
                        setShowAiSettings(true);
                        setShowModelSelector(true);
                      }}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                      Change Model Now
                    </button>
                    <button
                      onClick={() => setShowQuotaPopup(false)}
                      className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800"
            >
              {toast.type === 'success' ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-sm font-bold">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Detail Panel - Mobile (Portrait or Small Landscape) */}
      <AnimatePresence>
        {showMobileDetail && selectedArticle && (orientation === 'portrait' || isMobile) && (
          <div className="fixed inset-0 z-[100]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileDetail(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
              <div className="flex-1 overflow-y-auto">
                <ArticleDetailView 
                  article={selectedArticle} 
                  onClose={() => setShowMobileDetail(false)} 
                  onUpdateTags={handleUpdateArticleTags}
                  onTagClick={handleTagClick}
                  onGenerateSummary={handleGenerateSummary}
                  isMobile
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticleDetailView({ article, onClose, onUpdateTags, onTagClick, onGenerateSummary, isMobile }: { 
  article: Article, 
  onClose: () => void, 
  onUpdateTags: (url: string, tags: string[]) => void, 
  onTagClick?: (tag: string) => void,
  onGenerateSummary: (url: string) => Promise<void>,
  isMobile?: boolean 
}) {
  const [newTag, setNewTag] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const currentTags = article.user_tags || [];
    if (!currentTags.includes(newTag.trim())) {
      onUpdateTags(article.article_url, [...currentTags, newTag.trim()]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = article.user_tags || [];
    onUpdateTags(article.article_url, currentTags.filter(t => t !== tag));
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Critical': return { 
        color: 'text-red-700 bg-red-50 border-red-200', 
        icon: <ShieldAlert className="w-4 h-4" />,
        dot: 'bg-red-500'
      };
      case 'High': return { 
        color: 'text-orange-700 bg-orange-50 border-orange-200', 
        icon: <AlertTriangle className="w-4 h-4" />,
        dot: 'bg-orange-500'
      };
      case 'Moderate': return { 
        color: 'text-amber-700 bg-amber-50 border-amber-200', 
        icon: <Zap className="w-4 h-4" />,
        dot: 'bg-amber-500'
      };
      case 'Low': return { 
        color: 'text-primary bg-primary/5 border-primary/20', 
        icon: <Info className="w-4 h-4" />,
        dot: 'bg-primary'
      };
      default: return { 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        icon: <ShieldCheck className="w-4 h-4" />,
        dot: 'bg-emerald-500'
      };
    }
  };

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case 'Positive': return { 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        icon: <ThumbsUp className="w-4 h-4" />,
        dot: 'bg-emerald-500'
      };
      case 'Negative': return { 
        color: 'text-red-700 bg-red-50 border-red-200', 
        icon: <ThumbsDown className="w-4 h-4" />,
        dot: 'bg-red-500'
      };
      case 'Mixed': return { 
        color: 'text-orange-700 bg-orange-50 border-orange-200', 
        icon: <RefreshCw className="w-4 h-4" />,
        dot: 'bg-orange-500'
      };
      case 'Neutral': return { 
        color: 'text-primary bg-primary/5 border-primary/20', 
        icon: <Minus className="w-4 h-4" />,
        dot: 'bg-primary'
      };
      default: return { 
        color: 'text-gray-700 bg-gray-50 border-gray-200', 
        icon: <Info className="w-4 h-4" />,
        dot: 'bg-gray-500'
      };
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'Verified': return { 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        icon: <ShieldCheck className="w-4 h-4" />,
        dot: 'bg-emerald-500'
      };
      case 'Potentially Hallucinated': return { 
        color: 'text-red-700 bg-red-50 border-red-200', 
        icon: <ShieldAlert className="w-4 h-4" />,
        dot: 'bg-red-500'
      };
      case 'Unverified': return { 
        color: 'text-gray-700 bg-gray-50 border-gray-200', 
        icon: <Info className="w-4 h-4" />,
        dot: 'bg-gray-500'
      };
      default: return { 
        color: 'text-gray-700 bg-gray-50 border-gray-200', 
        icon: <Info className="w-4 h-4" />,
        dot: 'bg-gray-500'
      };
    }
  };

  const riskBadge = getRiskBadge(article.reputational_risk);
  const toneBadge = getToneBadge(article.tone_classification);
  const verificationBadge = getVerificationBadge(article.url_verification_status);

  return (
    <motion.div 
      key={article.article_url}
      initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : 20 }}
      className={`bg-white ${isMobile ? '' : 'rounded-3xl border border-gray-200 shadow-sm'} overflow-hidden`}
    >
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${verificationBadge.color}`}>
              {verificationBadge.icon}
              {article.url_verification_status}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${riskBadge.color}`}>
              {riskBadge.icon}
              {article.reputational_risk} Risk
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${toneBadge.color}`}>
              {toneBadge.icon}
              {article.tone_classification} Tone
            </span>
          </div>
          {isMobile && (
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
        <h3 className="text-xl font-bold mb-4 leading-tight">{article.article_title}</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
            <Globe className="w-3.5 h-3.5" />
            {article.sphere_of_government || 'Provincial'} | {article.source_name} | {article.municipality_or_district || article.department_or_office || 'Eastern Cape'}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            {article.publication_date}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {article.topic_categories.map((cat, i) => (
            <span key={i} className="text-[10px] font-bold uppercase px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-600">
              {cat}
            </span>
          ))}
        </div>
        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
          <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Quick Summary</h5>
          <p className="text-sm font-medium text-gray-800 leading-relaxed italic">
            "{article.summary_1_sentence}"
          </p>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Grounding Verification</h5>
          <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
            {article.grounding_source || "Verified via Google Search grounding."}
          </p>
        </div>

        <div>
          <h5 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
            <Tag className="w-3 h-3" />
            Manual Tags
          </h5>
          <div className="flex flex-wrap gap-2 mb-3">
            {article.user_tags?.map((tag, i) => (
              <AppTooltip key={i} content="Click to filter by this tag, or 'x' to remove.">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase border rounded-md overflow-hidden">
                  <button
                    onClick={() => onTagClick?.(tag)}
                    className="px-2 py-1 bg-primary/5 text-primary border-r border-primary/10 hover:bg-primary/10 transition-colors"
                  >
                    {tag}
                  </button>
                  <button 
                    onClick={() => handleRemoveTag(tag)} 
                    className="px-1.5 py-1 bg-primary/5 text-primary hover:bg-red-50 hover:text-red-500 transition-colors"
                    title={`Remove tag "${tag}"`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              </AppTooltip>
            ))}
            {(!article.user_tags || article.user_tags.length === 0) && (
              <p className="text-[10px] text-gray-400 italic">No manual tags added yet.</p>
            )}
          </div>
          <form onSubmit={handleAddTag} className="flex gap-2">
            <label htmlFor="article-tag-input" className="sr-only">Add custom label</label>
            <input 
              id="article-tag-input"
              type="text" 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add custom label..."
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <button 
              type="submit"
              className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              title="Add Tag"
            >
              <Plus className="w-4 h-4" />
            </button>
            {!article.summary_1_sentence && (
              <button 
                type="button"
                onClick={async () => {
                  setIsGenerating(true);
                  await onGenerateSummary(article.article_url);
                  setIsGenerating(false);
                }}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-all disabled:opacity-50"
                title="Generate Concise Summary"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                GENERATE
              </button>
            )}
          </form>
        </div>

        <div>
          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
            <Newspaper className="w-3 h-3" />
            Full Executive Summary
          </h5>
          <p className="text-sm text-gray-700 leading-relaxed">{article.summary_1_paragraph}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-xl border ${toneBadge.color}`}>
            <div className="flex items-center gap-2 mb-1">
              {toneBadge.icon}
              <h5 className="text-[10px] font-bold uppercase opacity-70">Tone Analysis</h5>
            </div>
            <p className="text-sm font-bold">
              {article.tone_classification}
            </p>
            <p className="text-[10px] opacity-80 mt-1">{article.tone_reason}</p>
          </div>
          <div className={`p-3 rounded-xl border ${riskBadge.color}`}>
            <div className="flex items-center gap-2 mb-1">
              {riskBadge.icon}
              <h5 className="text-[10px] font-bold uppercase opacity-70">Risk Level</h5>
            </div>
            <p className="text-sm font-bold">
              {article.reputational_risk}
            </p>
            <p className="text-[10px] opacity-80 mt-1">{article.risk_reason}</p>
          </div>
        </div>

        <div>
          <h5 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" />
            Strategic Recommendation
          </h5>
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 mb-1 uppercase tracking-tight">
                  {article.recommended_action}
                </p>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {article.action_reason}
                </p>
              </div>
            </div>
          </div>
        </div>

        <a 
          href={article.article_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors"
        >
          View Original Source
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}

interface ArticleClusterProps {
  articles: Article[];
  index: number;
  selectedArticle: Article | null;
  onSelect: (a: Article) => void;
  onUpdateTags: (url: string, tags: string[]) => void;
  onGenerateSummary: (url: string) => Promise<void>;
}

const ArticleCluster: React.FC<ArticleClusterProps> = ({ articles, index, selectedArticle, onSelect, onUpdateTags, onGenerateSummary }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSyndicated, setShowSyndicated] = useState(false);
  const currentArticle = articles[currentIndex];
  const isSelected = selectedArticle && articles.some(a => a.article_url === selectedArticle.article_url);

  const selectArticle = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(idx);
    onSelect(articles[idx]);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  useEffect(() => {
    if (isSelected && selectedArticle) {
      const idx = articles.findIndex(a => a.article_url === selectedArticle.article_url);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [isSelected, selectedArticle, articles]);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Critical': return { 
        color: 'text-red-700 bg-red-50 border-red-200', 
        icon: <ShieldAlert className="w-3 h-3" />,
        dot: 'bg-red-500'
      };
      case 'High': return { 
        color: 'text-orange-700 bg-orange-50 border-orange-200', 
        icon: <AlertTriangle className="w-3 h-3" />,
        dot: 'bg-orange-500'
      };
      case 'Moderate': return { 
        color: 'text-amber-700 bg-amber-50 border-amber-200', 
        icon: <Zap className="w-3 h-3" />,
        dot: 'bg-amber-500'
      };
      case 'Low': return { 
        color: 'text-primary bg-primary/5 border-primary/10', 
        icon: <Info className="w-3 h-3" />,
        dot: 'bg-primary'
      };
      default: return { 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        icon: <ShieldCheck className="w-3 h-3" />,
        dot: 'bg-emerald-500'
      };
    }
  };

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case 'Positive': return { 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        icon: <ThumbsUp className="w-3 h-3" />,
        dot: 'bg-emerald-500'
      };
      case 'Negative': return { 
        color: 'text-red-700 bg-red-50 border-red-200', 
        icon: <ThumbsDown className="w-3 h-3" />,
        dot: 'bg-red-500'
      };
      case 'Mixed': return { 
        color: 'text-orange-700 bg-orange-50 border-orange-200', 
        icon: <RefreshCw className="w-3 h-3" />,
        dot: 'bg-orange-500'
      };
      case 'Neutral': return { 
        color: 'text-primary bg-primary/5 border-primary/10', 
        icon: <Minus className="w-3 h-3" />,
        dot: 'bg-primary'
      };
      default: return { 
        color: 'text-gray-700 bg-gray-50 border-gray-200', 
        icon: <Info className="w-3 h-3" />,
        dot: 'bg-gray-500'
      };
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'Verified': return { 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        icon: <ShieldCheck className="w-3 h-3" />,
        dot: 'bg-emerald-500'
      };
      case 'Potentially Hallucinated': return { 
        color: 'text-red-700 bg-red-50 border-red-200', 
        icon: <ShieldAlert className="w-3 h-3" />,
        dot: 'bg-red-500'
      };
      case 'Unverified': return { 
        color: 'text-gray-700 bg-gray-50 border-gray-200', 
        icon: <Info className="w-3 h-3" />,
        dot: 'bg-gray-500'
      };
      default: return { 
        color: 'text-gray-700 bg-gray-50 border-gray-200', 
        icon: <Info className="w-3 h-3" />,
        dot: 'bg-gray-500'
      };
    }
  };

  const riskBadge = getRiskBadge(currentArticle.reputational_risk);
  const toneBadge = getToneBadge(currentArticle.tone_classification);
  const verificationBadge = getVerificationBadge(currentArticle.url_verification_status);

  return (
    <div className="relative group">
      {/* Visual Stack Effect for syndicated articles - Refined for subtlety */}
      {articles.length > 1 && (
        <>
          <div className="absolute inset-x-1.5 -bottom-1 h-full bg-gray-50/80 border border-gray-100 rounded-3xl -z-10 transition-all duration-500 group-hover:-bottom-1.5 group-hover:bg-gray-100/50" />
          <div className="absolute inset-x-3 -bottom-2 h-full bg-gray-50/40 border border-gray-50 rounded-3xl -z-20 transition-all duration-700 group-hover:-bottom-3 group-hover:bg-gray-50/60" />
        </>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => onSelect(currentArticle)}
        className={`relative p-4 sm:p-6 bg-white rounded-3xl border transition-all cursor-pointer hover:shadow-xl ${
          isSelected 
            ? 'border-primary ring-2 ring-primary/5 shadow-lg' 
            : currentIndex === 0 && articles.length > 1
              ? 'border-primary/20 bg-gradient-to-br from-white to-primary/5'
              : 'border-gray-200'
        }`}
      >
        {articles.length > 1 && (
          <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 shadow-lg z-10">
            <Layers className="w-3 h-3" />
            {articles.length} SOURCES SYNDICATED
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <AppTooltip content={currentIndex === 0 ? "This is the primary source for this intelligence cluster." : "This is a syndicated version of the primary report."}>
              <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-sm transition-all ${
                currentIndex === 0 
                  ? 'bg-primary text-white border border-primary' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                {currentIndex === 0 ? <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Newspaper className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {currentIndex === 0 ? 'Primary Intelligence' : 'Syndicated Report'}
              </div>
            </AppTooltip>

            <AppTooltip content="Sourcing Identification: Sphere | Source | Location/Entity">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:py-1 bg-primary/5 text-primary border border-primary/10 rounded-full shadow-sm flex items-center gap-1 sm:gap-1.5">
                <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {currentArticle.sphere_of_government || 'Provincial'} | {currentArticle.source_name} | {currentArticle.municipality_or_district || currentArticle.department_or_office || 'Eastern Cape'}
              </span>
            </AppTooltip>

            <AppTooltip content="The date the primary intelligence report was first published.">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:py-1 bg-white rounded-full text-gray-400 border border-gray-100 shadow-sm flex items-center gap-1 sm:gap-1.5">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                {articles[0].publication_date}
              </span>
            </AppTooltip>

            <AppTooltip content="The potential impact this story has on the reputation of the Eastern Cape Government.">
              <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:py-1 rounded-full border shadow-sm flex items-center gap-1 sm:gap-1.5 ${riskBadge.color}`}>
                {riskBadge.icon}
                {currentArticle.reputational_risk}
              </span>
            </AppTooltip>

            {currentArticle.user_tags?.map((tag, i) => (
              <AppTooltip key={i} content="Manual tag added by user.">
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:py-1 bg-primary/5 text-primary border border-primary/10 rounded-full shadow-sm flex items-center gap-1 sm:gap-1.5">
                  <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {tag}
                </span>
              </AppTooltip>
            ))}
          </div>
        </div>

        <h4 className={`font-bold text-base sm:text-lg mb-1 leading-tight transition-colors ${currentIndex === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
          {currentArticle.article_title}
        </h4>

        {articles.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter self-center">Also reported by:</span>
            {articles.slice(1, 4).map((art, i) => (
              <button 
                key={i} 
                onClick={(e) => selectArticle(i + 1, e)}
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-all ${
                  currentIndex === i + 1 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'
                }`}
              >
                {art.source_name}
              </button>
            ))}
            {articles.length > 4 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSyndicated(true);
                }}
                className="text-[9px] font-semibold text-primary hover:underline"
              >
                +{articles.length - 4} more
              </button>
            )}
          </div>
        )}
        
        <div className="relative mb-4">
          {!currentArticle.summary_1_sentence ? (
            <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-between">
              <p className="text-[10px] text-gray-400 italic">No concise summary available.</p>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsGenerating(true);
                  await onGenerateSummary(currentArticle.article_url);
                  setIsGenerating(false);
                }}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                GENERATE SUMMARY
              </button>
            </div>
          ) : (
            <>
              <p className={`text-sm text-gray-600 leading-relaxed italic transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                "{isExpanded ? currentArticle.summary_1_paragraph : currentArticle.summary_1_sentence}"
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-[10px] font-bold text-primary hover:text-primary-hover mt-2 flex items-center gap-1 transition-colors"
              >
                {isExpanded ? (
                  <>SHOW LESS <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>READ MORE <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </>
          )}
        </div>
        
        {/* Syndication Navigation & List */}
        {articles.length > 1 && (
          <div className="mb-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSyndicated(!showSyndicated);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                showSyndicated 
                  ? 'bg-primary text-white border-primary shadow-md' 
                  : 'bg-gray-50 text-primary border-gray-100 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-3 h-3" />
              {showSyndicated ? 'Hide Syndicated Versions' : `View ${articles.length - 1} Syndicated Versions`}
              {showSyndicated ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>

            <AnimatePresence>
              {showSyndicated && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Syndication Network</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={prev} className="p-1.5 bg-white border border-gray-200 hover:border-primary rounded-lg text-gray-400 hover:text-primary transition-all shadow-sm">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-black text-gray-600 min-w-[45px] text-center bg-white border border-gray-200 py-1 rounded-lg shadow-sm">
                          {currentIndex + 1} <span className="text-gray-300 mx-0.5">/</span> {articles.length}
                        </span>
                        <button onClick={next} className="p-1.5 bg-white border border-gray-200 hover:border-primary rounded-lg text-gray-400 hover:text-primary transition-all shadow-sm">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {articles.map((art, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => selectArticle(idx, e)}
                          className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border flex flex-col items-start gap-1 ${
                            currentIndex === idx 
                              ? 'bg-primary border-primary text-white shadow-md scale-105' 
                              : 'bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {idx === 0 && <ShieldCheck className="w-3 h-3" />}
                            {art.source_name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${getToneBadge(art.tone_classification).dot}`} />
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${currentIndex === idx ? 'text-white/80' : 'text-gray-400'}`}>
                              {art.tone_classification}
                            </span>
                          </div>
                          <div className={`text-[9px] opacity-70 flex items-center gap-1 ${currentIndex === idx ? 'text-white/60' : 'text-gray-400'}`}>
                            <Calendar className="w-2.5 h-2.5" />
                            {art.publication_date}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Controversy Analysis */}
        {articles.length > 1 && (
          <div className={`mb-4 p-4 rounded-2xl border transition-all ${
            articles.some(a => a.tone_classification !== articles[0].tone_classification)
              ? 'bg-orange-50/50 border-orange-100'
              : 'bg-gray-50/50 border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  articles.some(a => a.tone_classification !== articles[0].tone_classification)
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Multi-Source Analysis</h5>
                  <p className="text-[9px] text-gray-400 font-medium">Cross-referencing {articles.length} intelligence sources</p>
                </div>
              </div>
              {articles.some(a => a.tone_classification !== articles[0].tone_classification) && (
                <div className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded-full animate-pulse">
                  HIGH CONTROVERSY
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {(Array.from(new Set(articles.map(a => a.tone_classification))) as string[]).map(tone => {
                const badge = getToneBadge(tone as any);
                const count = articles.filter(a => a.tone_classification === tone).length;
                return (
                  <div key={tone} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-bold ${badge.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {tone} ({count})
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-600 leading-relaxed italic">
              {articles.some(a => a.tone_classification !== articles[0].tone_classification)
                ? `Strategic Note: This topic exhibits significant "Tone Divergence" across ${articles.length} sources. While some outlets report ${articles[0].tone_classification.toLowerCase()} sentiment, others vary, indicating a complex public perception and potential for reputational volatility.`
                : `Strategic Note: Media sentiment is unified across all ${articles.length} sources. This indicates a stable narrative with low risk of immediate interpretive shift.`}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${toneBadge.color} bg-transparent border-none p-0`}>
              {toneBadge.icon}
              {currentArticle.tone_classification} Tone
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold text-[11px] uppercase tracking-wider">
            Intelligence Report
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};


function CategoryToggle({ label, sub, active, onToggle, onConfigure }: { 
  label: string, 
  sub: string, 
  active: boolean, 
  onToggle: () => void,
  onConfigure: () => void
}) {
  return (
    <div className={`rounded-3xl border transition-all overflow-hidden ${
      active ? 'bg-white border-primary shadow-sm' : 'bg-gray-50 border-gray-100'
    }`}>
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onToggle}>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            active ? 'bg-primary border-primary' : 'border-gray-300'
          }`}>
            {active && <CheckCircle className="w-3.5 h-3.5 text-white" />}
          </div>
          <div>
            <p className={`text-sm font-bold ${active ? 'text-primary' : 'text-gray-700'}`}>{label}</p>
            <p className="text-[10px] text-gray-400 font-medium">{sub}</p>
          </div>
        </div>
        {active && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onConfigure();
            }}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2 text-[10px] font-bold text-gray-600"
          >
            <Filter className="w-3 h-3" />
            Filter
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number | string, icon: React.ReactNode, color: 'primary' | 'green' | 'red' | 'orange' }) {
  const colors = {
    primary: 'bg-primary/5 text-primary border-primary/10',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">{value}</span>
      </div>
      <h4 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">{title}</h4>
    </div>
  );
}

const AppTooltip: React.FC<{ children: React.ReactNode, content: string }> = ({ children, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1A1A1A] text-white text-[10px] rounded-xl shadow-2xl z-50 pointer-events-none min-w-[140px] text-center border border-gray-800"
          >
            <div className="relative z-10 font-bold leading-tight">{content}</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1A1A] rotate-45 border-r border-b border-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
