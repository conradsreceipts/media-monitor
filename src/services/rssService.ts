export interface RSSFeedSource {
  name: string;
  url: string;
  altUrls?: string[];
  category: 'Government' | 'News' | 'Local';
  type?: 'rss' | 'scrape';
  sphere?: 'National' | 'Provincial' | 'Local';
  location?: string;
}

export const FEED_SOURCES: RSSFeedSource[] = [
  {
    name: "Gov.za - National News (SANews)",
    url: "https://www.gov.za/news-feed",
    category: "Government",
    sphere: "National",
    location: "South Africa",
    type: "rss"
  },
  {
    name: "Gov.za - Speeches & Statements",
    url: "https://www.gov.za/speeches-feed",
    category: "Government",
    sphere: "National",
    location: "South Africa",
    type: "rss"
  },
  {
    name: "SARS - Latest News",
    url: "http://www.sars.gov.za/feed/",
    category: "Government",
    sphere: "National",
    location: "South Africa",
    type: "rss"
  },
  {
    name: "The Representative (The Rep)",
    url: "https://www.therep.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Komani",
    type: "scrape"
  },
  {
    name: "Pondoland Times",
    url: "https://www.pondolandtimes.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Pondoland",
    type: "scrape"
  },
  {
    name: "Barkly East Reporter",
    url: "https://www.bereporter.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Barkly East",
    type: "scrape"
  },
  {
    name: "Mthatha Express",
    url: "https://mthathaexpress.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Mthatha",
    type: "scrape"
  },
  {
    name: "PE Express",
    url: "https://www.peexpress.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Gqeberha",
    type: "scrape"
  },
  {
    name: "Kouga Express",
    url: "https://kougaexpress.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Kouga",
    type: "scrape"
  },
  {
    name: "UD News",
    url: "https://novanews.co.za/udexpress/",
    category: "Local",
    sphere: "Local",
    location: "Uitenhage/Despatch",
    type: "scrape"
  },
  {
    name: "Go! & Express",
    url: "https://www.goexpress.co.za/",
    category: "Local",
    sphere: "Local",
    location: "East London",
    type: "scrape"
  },
  {
    name: "St Francis Chronicle",
    url: "https://www.stfrancischronicle.com/",
    category: "Local",
    sphere: "Local",
    location: "St Francis Bay",
    type: "scrape"
  },
  {
    name: "Eastern Cape Mirror",
    url: "https://ecmirror.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Ikamva Lisezandleni Zethu",
    url: "https://ikamva.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "The New Era",
    url: "https://thenewera.co.za",
    category: "Local",
    sphere: "Local",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "The Voice of the People",
    url: "https://voiceofthepeople.co.za",
    category: "Local",
    sphere: "Local",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Daily Dispatch",
    url: "https://www.dispatchlive.co.za/news/",
    category: "News",
    sphere: "Provincial",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "The Herald",
    url: "https://www.heraldlive.co.za/news/",
    category: "News",
    sphere: "Provincial",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Algoa FM News",
    url: "https://www.algoafm.co.za/news",
    category: "News",
    sphere: "Provincial",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Grocott's Mail",
    url: "https://grocotts.ru.ac.za/",
    category: "Local",
    sphere: "Local",
    location: "Makhanda",
    type: "scrape"
  },
  {
    name: "The Citizen Eastern Cape",
    url: "https://www.citizen.co.za/news/south-africa/eastern-cape/",
    category: "News",
    sphere: "Provincial",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Talk of the Town",
    url: "https://talkofthetown.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Graaff-Reinet Advertiser",
    url: "https://www.graaffreinetadvertiser.com/",
    category: "Local",
    sphere: "Local",
    location: "Graaff-Reinet",
    type: "scrape"
  },
  {
    name: "Komani Karoo",
    url: "https://www.komani-karoo.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Komani",
    type: "scrape"
  },
  {
    name: "The Informer",
    url: "https://theinformer.africa/",
    category: "Local",
    sphere: "Local",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Icamagu Online",
    url: "https://icamaguonline.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "Komani",
    url: "https://www.komani.co.za/",
    category: "Local",
    sphere: "Local",
    location: "Komani",
    type: "scrape"
  },
  {
    name: "EC Department of Cooperative Governance",
    url: "https://eccogta.gov.za/news",
    category: "Government",
    sphere: "Provincial",
    location: "Eastern Cape",
    type: "scrape"
  },
  {
    name: "SA Government News Agency",
    url: "https://sanews.gov.za",
    category: "Government",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  },
  {
    name: "Buffalo City Metro",
    url: "https://www.buffalocity.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Buffalo City",
    type: "scrape"
  },
  {
    name: "Amathole District News",
    url: "https://www.amathole.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Amathole",
    type: "scrape"
  },
  {
    name: "Chris Hani District News",
    url: "https://www.chrishanidm.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Chris Hani",
    type: "scrape"
  },
  {
    name: "Joe Gqabi District News",
    url: "https://www.jgdm.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Joe Gqabi",
    type: "scrape"
  },
  {
    name: "OR Tambo District News",
    url: "https://ortambodm.gov.za/news/",
    category: "Government",
    sphere: "Local",
    location: "OR Tambo",
    type: "scrape"
  },
  {
    name: "Alfred Nzo District News",
    url: "https://www.andm.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Alfred Nzo",
    type: "scrape"
  },
  {
    name: "Sarah Baartman District News",
    url: "https://www.sarahbaartman.co.za/index.php?option=com_zoo&view=category&layout=category&Itemid=1985",
    category: "Government",
    sphere: "Local",
    location: "Sarah Baartman",
    type: "scrape"
  },
  {
    name: "Kouga Municipality News",
    url: "https://www.kouga.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Kouga",
    type: "scrape"
  },
  {
    name: "Makana Municipality News",
    url: "https://www.makana.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Makana",
    type: "scrape"
  },
  {
    name: "Ndlambe Municipality News",
    url: "https://www.ndlambe.gov.za/category/news/",
    category: "Government",
    sphere: "Local",
    location: "Ndlambe",
    type: "scrape"
  },
  {
    name: "Sundays River Valley News",
    url: "https://www.srvm.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Sundays River Valley",
    type: "scrape"
  },
  {
    name: "Blue Crane Route Municipality News",
    url: "https://www.bcrm.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Blue Crane Route",
    type: "scrape"
  },
  {
    name: "Dr Beyers Naudé Municipality News",
    url: "https://www.bnlm.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Dr Beyers Naudé",
    type: "scrape"
  },
  {
    name: "Mbhashe Municipality News",
    url: "https://www.mbhashemun.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Mbhashe",
    type: "scrape"
  },
  {
    name: "Mnquma Municipality News",
    url: "https://www.mnquma.gov.za/category/news/",
    category: "Government",
    sphere: "Local",
    location: "Mnquma",
    type: "scrape"
  },
  {
    name: "Ngqushwa Municipality News",
    url: "https://www.ngqushwamun.gov.za/category/news/",
    category: "Government",
    sphere: "Local",
    location: "Ngqushwa",
    type: "scrape"
  },
  {
    name: "Amahlathi Municipality News",
    url: "https://www.amahlathi.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Amahlathi",
    type: "scrape"
  },
  {
    name: "Raymond Mhlaba Municipality News",
    url: "https://www.raymondmhlaba.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Raymond Mhlaba",
    type: "scrape"
  },
  {
    name: "Emalahleni Municipality News",
    url: "https://www.emalahlenilm.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Emalahleni",
    type: "scrape"
  },
  {
    name: "Engcobo Municipality News",
    url: "https://www.chrishanidm.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Engcobo",
    type: "scrape"
  },
  {
    name: "Intsika Yethu Municipality News",
    url: "https://www.intsikayethu.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Intsika Yethu",
    type: "scrape"
  },
  {
    name: "Enoch Mgijima Municipality News",
    url: "https://www.enochmgijima.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Enoch Mgijima",
    type: "scrape"
  },
  {
    name: "Elundini Municipality News",
    url: "https://www.elundini.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Elundini",
    type: "scrape"
  },
  {
    name: "Senqu Municipality News",
    url: "https://www.senqu.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Senqu",
    type: "scrape"
  },
  {
    name: "Walter Sisulu Municipality News",
    url: "https://www.jgdm.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Walter Sisulu",
    type: "scrape"
  },
  {
    name: "Ingquza Hill Municipality News",
    url: "https://www.ihlm.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Ingquza Hill",
    type: "scrape"
  },
  {
    name: "King Sabata Dalindyebo Municipality News",
    url: "https://www.ksd.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "King Sabata Dalindyebo",
    type: "scrape"
  },
  {
    name: "Nyandeni Municipality News",
    url: "https://www.nyandenilm.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Nyandeni",
    type: "scrape"
  },
  {
    name: "Winnie Madikizela-Mandela Municipality News",
    url: "https://www.andm.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Winnie Madikizela-Mandela",
    type: "scrape"
  },
  {
    name: "Ntabankulu Municipality News",
    url: "https://www.ntabankulu.gov.za/",
    category: "Government",
    sphere: "Local",
    location: "Ntabankulu",
    type: "scrape"
  },
  {
    name: "Umzimvubu Municipality News",
    url: "https://www.umzimvubu.gov.za/news",
    category: "Government",
    sphere: "Local",
    location: "Umzimvubu",
    type: "scrape"
  },
  {
    name: "Matatiele Municipality News",
    url: "https://www.matatiele.gov.za/media/",
    category: "Government",
    sphere: "Local",
    location: "Matatiele",
    type: "scrape"
  },
  {
    name: "TimesLIVE",
    url: "https://www.timeslive.co.za/news/south-africa/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  },
  {
    name: "Daily Maverick",
    url: "https://www.dailymaverick.co.za/section/south-africa/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  },
  {
    name: "Mail & Guardian",
    url: "https://mg.co.za/section/news/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  },
  {
    name: "Sowetan Live",
    url: "https://www.sowetan.co.za/news/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  },
  {
    name: "Eyewitness News",
    url: "https://ewn.co.za/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  },
  {
    name: "Business Day",
    url: "https://www.businesslive.co.za/bd/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  },
  {
    name: "Moneyweb",
    url: "https://www.moneyweb.co.za/feed/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "rss"
  },
  {
    name: "The South African",
    url: "https://www.thesouthafrican.com/news/",
    category: "News",
    sphere: "National",
    location: "South Africa",
    type: "scrape"
  }
];

async function fetchWithRetry(url: string, options?: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || i === maxRetries) return response;
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

export async function fetchRSSFeeds(
  startDate: string, 
  onProgress?: (status: string) => void, 
  signal?: AbortSignal,
  disabledSources: string[] = [],
  customSources: any[] = []
) {
  const allArticles: any[] = [];
  const startDateTime = new Date(startDate).getTime();
  
  const activeSources = [...FEED_SOURCES, ...customSources].filter(s => !disabledSources.includes(s.url));
  
  // Fetch sources sequentially to avoid rate limits and serverless timeouts
  for (const source of activeSources) {
    if (signal?.aborted) throw new Error("ABORTED");
    const urlsToTry = [source.url, ...(source.altUrls || [])];
    let sourceArticles: any[] = [];
    
    // Try URLs for this source sequentially (failover logic)
    for (const url of urlsToTry) {
      if (signal?.aborted) throw new Error("ABORTED");
      try {
        const isScrape = source.type === 'scrape';
        const actionLabel = isScrape ? 'Scraping Page' : 'Fetching RSS';
        
        if (onProgress) onProgress(`${actionLabel} from ${source.name} (${url === source.url ? 'Primary' : 'Alternative'})...`);
        
        const apiEndpoint = isScrape ? '/api/scrape-news' : '/api/rss-fetch';
        const fetchUrl = `${apiEndpoint}?url=${encodeURIComponent(url)}`;
        const response = await fetchWithRetry(fetchUrl);
        
        if (!response.ok) {
          console.warn(`Failed to fetch ${source.name} from ${url}: HTTP ${response.status}`);
          continue; 
        }
        
        const feed = await response.json();
        
        if (!feed.items || feed.items.length === 0) {
          console.warn(`No items found from ${source.name} (${url})`);
          continue; 
        }

        const articles = feed.items
          .map((item: any) => ({
            title: item.title || "Untitled Article",
            link: item.link || "",
            pubDate: item.pubDate || item.isoDate || null,
            content: item.contentSnippet || item.content || item.summary || "",
            source: source.name,
            category: source.category,
            sphere: source.sphere,
            location: source.location
          }))
          .filter((article: any) => {
            if (!article.link || !article.title) return false;
            if (!article.pubDate) return false;
            try {
              const articleDate = new Date(article.pubDate).getTime();
              if (isNaN(articleDate)) return false;
              if (articleDate < startDateTime) return false;
              return true;
            } catch (e) {
              return false;
            }
          });
        
        if (articles.length > 0) {
          if (onProgress) onProgress(`SUCCESS: Extracted ${articles.length} articles from ${source.name}`);
          sourceArticles = articles;
          break; 
        }
      } catch (error: any) {
        console.error(`Error fetching from ${source.name} (${url}): ${error.message}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    if (sourceArticles.length > 0) {
      allArticles.push(...sourceArticles);
    } else {
      if (onProgress) onProgress(`CRITICAL: All URLs failed for ${source.name}.`);
    }

    await new Promise(r => setTimeout(r, 300));
  }
  
  return allArticles;
}

