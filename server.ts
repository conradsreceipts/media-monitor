import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Parser from 'rss-parser';
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';

// Allow fetching from sites with strict or invalid TLS certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  minVersion: 'TLSv1.2',
  keepAlive: true,
  timeout: 60000
});

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

const referers = [
  'https://www.google.com/',
  'https://www.bing.com/',
  'https://duckduckgo.com/',
  'https://www.facebook.com/',
  'https://t.co/',
  'https://www.linkedin.com/',
  'https://news.google.com/'
];

const getStandardHeaders = (url: string) => {
  const urlObj = new URL(url);
  const randomReferer = referers[Math.floor(Math.random() * referers.length)];
  const randomLang = ['en-US,en;q=0.9', 'en-GB,en;q=0.8', 'en-ZA,en;q=0.9,en;q=0.8'][Math.floor(Math.random() * 3)];
  
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': randomLang,
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Referer': randomReferer,
    'Connection': 'keep-alive',
    'DNT': '1',
    'Host': urlObj.hostname,
    'Cookie': '_ga=GA1.1.' + Math.floor(Math.random() * 1000000000) + '.' + Math.floor(Date.now() / 1000) + '; _gid=GA1.1.' + Math.floor(Math.random() * 1000000000) + '.' + Math.floor(Date.now() / 1000) + ';'
  };
};

const isBlacklisted = (url: string): boolean => {
  const blacklistedDomains = [
    'gis.kouga.gov.za',
    'login.',
    'admin.',
    'portal.',
    'mail.',
    'webmail.',
    'cpanel.',
    'whm.',
    'accounts.google.com',
    'facebook.com/login',
    'twitter.com/login',
    'linkedin.com/login'
  ];
  const blacklistedPatterns = [
    '/ovvio/',
    '/login',
    '/admin',
    '/wp-admin',
    '/wp-login',
    '/cart',
    '/checkout',
    '/my-account',
    '/register',
    '/signup',
    '/signin',
    '/auth/',
    '/api/',
    '.pdf',
    '.zip',
    '.docx',
    '.xlsx',
    '.pptx',
    '.mp4',
    '.mp3',
    '.wav',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.mkv',
    '.dmg',
    '.exe',
    '.iso',
    '.bin',
    '.tar',
    '.gz',
    '.7z',
    '.rar'
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    if (blacklistedDomains.some(domain => hostname.includes(domain))) return true;
    if (blacklistedPatterns.some(pattern => pathname.includes(pattern))) return true;
    
    return false;
  } catch (e) {
    return true; // Invalid URL is considered blacklisted
  }
};

const app = express();
export default app;

const parser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent': userAgents[0],
  }
});

// Cache to remember which stealth mode works for which domain
const workingModeCache: Record<string, 'human' | 'direct' | 'googlebot' | 'bingbot' | 'facebook'> = {};

// Domain-specific last request time to enforce delays
const lastRequestTime: Record<string, number> = {};
const MIN_DOMAIN_DELAY = 2000; // 2 seconds between requests to the same domain

const stealthFetch = async (url: string, returnOnFirstStatus = false, referer?: string) => {
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (e) {
    return { status: 400, statusText: "Invalid URL", data: null };
  }
  
  const domain = urlObj.hostname;
  
  // Enforce domain-specific delay - reduced for health checks
  const now = Date.now();
  const lastTime = lastRequestTime[domain] || 0;
  const timeSinceLast = now - lastTime;
  const delayNeeded = returnOnFirstStatus ? 500 : MIN_DOMAIN_DELAY;
  if (timeSinceLast < delayNeeded) {
    await new Promise(resolve => setTimeout(resolve, delayNeeded - timeSinceLast));
  }
  lastRequestTime[domain] = Date.now();

  // Try common URL variations if the first one fails
  const urlVariations = [url];
  // Only try variations if not a health check to save time
  if (!returnOnFirstStatus) {
    if (domain.startsWith('www.')) {
      urlVariations.push(url.replace('www.', ''));
    } else {
      const parts = domain.split('.');
      if (parts.length === 2) {
        urlVariations.push(url.replace(domain, 'www.' + domain));
      }
    }
  }

  let finalResponse: any;

  for (const targetUrl of urlVariations) {
    const currentUrlObj = new URL(targetUrl);
    const currentDomain = currentUrlObj.hostname;
    
    // Try the cached working mode first if it exists
    const cachedMode = workingModeCache[currentDomain];
    let modes: ('human' | 'direct' | 'googlebot' | 'bingbot' | 'facebook')[] = [
      'human', 'direct', 'googlebot', 'bingbot', 'facebook'
    ];

    // For health checks, we only try the most likely modes to avoid timeouts
    if (returnOnFirstStatus) {
      modes = ['human', 'direct', 'googlebot'];
    }

    // Reorder modes to put cached mode first
    if (cachedMode) {
      const index = modes.indexOf(cachedMode);
      if (index > -1) {
        modes.splice(index, 1);
        modes.unshift(cachedMode);
      }
    }

    for (const mode of modes) {
      try {
        // Randomized delays based on mode - reduced for health checks
        const baseDelay = returnOnFirstStatus ? 200 : 1000;
        const randomDelay = returnOnFirstStatus ? 300 : 2000;
        const delay = mode === 'human' || mode === 'direct' ? Math.random() * randomDelay + baseDelay : Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        let headers: any;
        if (mode === 'googlebot') {
          headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Host': currentDomain
          };
        } else if (mode === 'bingbot') {
          headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Host': currentDomain
          };
        } else if (mode === 'facebook') {
          headers = {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': '*/*',
            'Connection': 'keep-alive',
            'Host': currentDomain
          };
        } else if (mode === 'direct') {
          headers = getStandardHeaders(targetUrl);
          headers['Sec-Fetch-Site'] = 'none';
          headers['Sec-Fetch-Mode'] = 'navigate';
          headers['Sec-Fetch-Dest'] = 'document';
          delete headers['Referer'];
        } else {
          headers = getStandardHeaders(targetUrl);
          if (referer) {
            headers['Referer'] = referer;
            headers['Sec-Fetch-Site'] = 'same-origin';
          }
        }

        const axiosConfig: any = {
          timeout: returnOnFirstStatus ? 10000 : 30000, // Shorter timeout for health checks
          httpsAgent,
          headers,
          validateStatus: () => true,
          maxRedirects: 5
        };

        // Proxy support - allow leaving Vercel's server farm
        if (process.env.PROXY_URL) {
          try {
            const proxyUrl = new URL(process.env.PROXY_URL);
            axiosConfig.proxy = {
              host: proxyUrl.hostname,
              port: parseInt(proxyUrl.port) || (proxyUrl.protocol === 'https:' ? 443 : 80),
              protocol: proxyUrl.protocol.replace(':', ''),
            };
            if (proxyUrl.username && proxyUrl.password) {
              axiosConfig.proxy.auth = {
                username: decodeURIComponent(proxyUrl.username),
                password: decodeURIComponent(proxyUrl.password),
              };
            }
          } catch (e) {
            console.error(`[PROXY] Invalid PROXY_URL: ${process.env.PROXY_URL}`);
          }
        }

        const response = await axios.get(targetUrl, axiosConfig);
        
        finalResponse = response;

        // If we got a 200, we're done and we cache this mode
        if (response.status === 200) {
          workingModeCache[currentDomain] = mode;
          return response;
        }

        // If we're just checking status and it's not a block, we can return early if requested
        if (returnOnFirstStatus && response.status !== 403 && response.status !== 401 && response.status !== 429) {
          return response;
        }
        
        // Otherwise, if it's a block (403, 401, 429), we continue to the next mode
      } catch (error: any) {
        finalResponse = { 
          status: error.response?.status || 500, 
          data: null, 
          statusText: error.message,
          error: error
        };
        // If it's a timeout or network error during health check, don't try other modes to save time
        if (returnOnFirstStatus) break;
      }
    }
  }

  return finalResponse;
};

app.use(express.json());

app.post("/api/check-urls", async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "URLs array is required" });
    }

    const results: { url: string; status: number; error?: string }[] = [];
    
    // Process in batches of 5 to avoid overwhelming the server or being flagged
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(async (url) => {
        try {
          const response = await stealthFetch(url, true);
          return { 
            url, 
            status: response.status, 
            error: response.status !== 200 ? response.statusText : undefined 
          };
        } catch (e: any) {
          return {
            url,
            status: 500,
            error: e.message
          };
        }
      }));
      results.push(...batchResults);
    }

    res.json(results);
  } catch (err: any) {
    console.error("CRITICAL API ERROR [/api/check-urls]:", err);
    res.status(500).json([{ url: "global", status: 500, error: err.message }]);
  }
});

// API routes - Registered synchronously to ensure they are available immediately
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    host: req.headers.host,
    platform: process.env.VERCEL ? 'Vercel' : 'Standard'
  });
});

app.get("/api/scrape-news", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "URL is required" });

  if (isBlacklisted(url)) {
    return res.status(403).json({ error: "URL is blacklisted (non-news or system portal)", url });
  }

  try {
    console.log(`SCRAPE: Fetching ${url} with stealthFetch`);
    
    const response = await stealthFetch(url);

    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `Upstream returned HTTP ${response.status}`,
        url: url
      });
    }

    const $ = cheerio.load(response.data);
    const articles: any[] = [];
    
    // Common selectors for news articles
    const selectors = [
      'article', '.article', '.post', '.entry', '.item', 
      '.news-item', '.story', '.blog-post', '.card', '.media',
      'h2', 'h3', '.snl-article-card', '.article-list-item',
      '.snl-card', '.snl-item', '.snl-article'
    ];

    // Remove noise
    $('script, style, nav, footer, header, aside, .sidebar, .ads, .menu, .nav, .social-share, .snl-nav, .snl-footer').remove();

    $(selectors.join(', ')).each((i, el) => {
      if (articles.length >= 20) return false;

      const $el = $(el);
      
      // SNL24 specific extraction
      let title = $el.find('.snl-title, .article-title, h1, h2, h3, h4, a').first().text().trim();
      let link = $el.find('a').first().attr('href');
      
      // If it's a card, the link might be the whole card or a specific element
      if (!link) link = $el.attr('href');
      
      // Improved date extraction - searching deeper in the element
      let dateText = $el.find('time, .date, .pubdate, .time, .entry-date, .post-date, .published, .snl-date, .snl-time').first().text().trim();
      
      const dateRegex = /(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})|(?:\d{4}-\d{2}-\d{2})|(?:\d{2}\/\d{2}\/\d{4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4})/i;

      if (!dateText) {
        // Search in the entire element's text
        const fullText = $el.text();
        const dateMatch = fullText.match(dateRegex);
        dateText = dateMatch ? dateMatch[0] : "";
      }

      // Strict date validation for scraping
      let isDateValid = true;
      let finalDate = "";

      if (dateText) {
        try {
          const parsedDate = new Date(dateText);
          if (isNaN(parsedDate.getTime())) {
            isDateValid = false;
          } else {
            const currentYear = new Date().getFullYear();
            const articleYear = parsedDate.getFullYear();
            // If the article is more than 1 year old, we flag it as potentially invalid for a "current" report
            if (articleYear < currentYear - 1 || articleYear > currentYear + 1) {
              isDateValid = false;
            } else {
              finalDate = parsedDate.toISOString();
            }
          }
        } catch (e) {
          isDateValid = false;
        }
      } else {
        // If no date found at all, we mark as invalid to be strict
        isDateValid = false;
      }
      
      if (title && link && title.length > 15 && isDateValid) {
        try {
          const absoluteLink = link.startsWith('http') ? link : new URL(link, url).href;
          // Avoid duplicates
          if (!articles.some(a => a.link === absoluteLink)) {
            articles.push({
              title,
              link: absoluteLink,
              pubDate: finalDate,
              content: $el.find('p').first().text().trim().substring(0, 250)
            });
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }
    });

    // If no articles found by selectors, try a more aggressive link-based approach
    if (articles.length === 0) {
      $('a').each((i, el) => {
        if (articles.length >= 10) return false;
        const $el = $(el);
        const text = $el.text().trim();
        const href = $el.attr('href');
        if (text.length > 25 && href && href.length > 10 && !href.includes('javascript:')) {
          try {
            const absoluteLink = href.startsWith('http') ? href : new URL(href, url).href;
            if (!articles.some(a => a.link === absoluteLink)) {
              articles.push({
                title: text,
                link: absoluteLink,
                pubDate: new Date().toISOString(),
                content: ""
              });
            }
          } catch (e) {}
        }
      });
    }

    return res.json({ items: articles });
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN';
    const status = error.response?.status || 500;
    
    console.error(`SCRAPE ERROR [${errorCode}]: ${error.message} (Status: ${status}) for ${url}`);
    
    return res.status(status).json({ 
      error: error.message || "Failed to scrape news",
      code: errorCode,
      url: url,
      status: status
    });
  }
});

app.get("/api/verify-article", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "URL is required" });

  if (isBlacklisted(url)) {
    return res.status(403).json({ error: "URL is blacklisted (non-news or system portal)", url });
  }

  try {
    console.log(`VERIFY: Fetching ${url} with stealthFetch`);
    const response = await stealthFetch(url);

    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `Upstream returned HTTP ${response.status}`,
        url: url
      });
    }

    const $ = cheerio.load(response.data);
      
    // 1. Extract Date from Header/Body
    // Look for common date patterns in the top portion of the body
    const bodyText = $('body').text().substring(0, 5000); // Scan first 5k chars
    const dateRegex = /(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})|(?:\d{4}-\d{2}-\d{2})|(?:\d{2}\/\d{2}\/\d{4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4})/i;
    
    // Prioritize meta tags and specific date elements
    let dateText = $('meta[property="article:published_time"]').attr('content') || 
                   $('meta[name="publish-date"]').attr('content') ||
                   $('meta[name="publication_date"]').attr('content') ||
                   $('meta[name="date"]').attr('content') ||
                   $('meta[property="og:published_time"]').attr('content') ||
                   $('time[datetime]').attr('datetime') ||
                   $('.entry-date, .post-date, .published, .date, .time, .snl-date, .article-date, .story-date').first().text().trim();

    // If still no date, look for patterns in the first few paragraphs
    if (!dateText) {
      // Avoid picking up "Today is..." or "Friday, 27 March" site-wide headers
      // We look for dates that are likely article dates (e.g. near the title or byline)
      const headerArea = $('h1').parent().text().substring(0, 1000);
      const match = headerArea.match(dateRegex);
      if (match) {
        dateText = match[0];
      } else {
        const matchBody = bodyText.match(dateRegex);
        dateText = matchBody ? matchBody[0] : "";
      }
    }

    let verifiedDate = null;
    if (dateText) {
      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate.getTime())) {
        verifiedDate = parsedDate.toISOString();
      }
    }

    // 2. Extract better content/snippet
    // Remove noise first
    $('script, style, nav, footer, header, aside, .sidebar, .ads, .menu, .nav, .social-share, .comments').remove();
    
    // Try to find the main article content
    const contentSelectors = ['article', '.article-content', '.entry-content', '.post-content', '.story-content', '.content', 'main'];
    let content = "";
    for (const selector of contentSelectors) {
      const text = $(selector).text().trim();
      if (text.length > 300) {
        content = text;
        break;
      }
    }
    
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up content (remove excessive whitespace)
    content = content.replace(/\s+/g, ' ').substring(0, 2000);

    return res.json({
      url,
      verifiedDate,
      title: $('title').text().trim(),
      snippet: content.substring(0, 1000),
      isLikelyArticle: content.length > 500
    });
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN';
    const status = error.response?.status || 500;
    
    console.error(`VERIFY ERROR [${errorCode}]: ${error.message} (Status: ${status}) for ${url}`);
    
    return res.status(status).json({ 
      error: error.message || "Failed to verify article",
      code: errorCode,
      url: url,
      status: status
    });
  }
});

app.get("/api/rss-fetch", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    console.log(`RSS FETCH: Fetching ${url} with stealthFetch`);
    
    const response = await stealthFetch(url);

    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `Upstream returned HTTP ${response.status}`,
        url: url
      });
    }

    let xml = response.data;
    if (typeof xml !== 'string') {
      xml = typeof xml === 'object' ? JSON.stringify(xml) : String(xml);
    }
    
    if (!xml || xml.length < 50) {
      return res.status(500).json({ error: "Empty or too short response from source" });
    }

    // Basic check for HTML
    const trimmedXml = xml.trim().toLowerCase();
    if (trimmedXml.startsWith('<!doctype html') || trimmedXml.startsWith('<html')) {
      return res.status(403).json({ 
        error: "Source returned HTML instead of XML",
        details: "This usually means the site is blocking scrapers or requires a real browser session."
      });
    }

    // Clean XML - remove any leading junk
    const firstBracket = xml.indexOf('<');
    if (firstBracket > 0) xml = xml.substring(firstBracket);
    xml = xml.trim();

    // Fix News24 and other feeds that might omit version
    if (xml.includes('<rss') && !xml.includes('version=')) {
      xml = xml.replace('<rss', '<rss version="2.0"');
    }

    try {
      const feed = await parser.parseString(xml);
      return res.json(feed);
    } catch (parseError: any) {
      console.error(`RSS PARSE ERROR: ${parseError.message} for ${url}`);
      return res.status(500).json({ error: `Failed to parse RSS content: ${parseError.message}` });
    }
    
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN';
    const status = error.response?.status || 500;
    
    console.error(`RSS FETCH ERROR [${errorCode}]: ${error.message} (Status: ${status}) for ${url}`);
    
    return res.status(status).json({ 
      error: error.message || "Failed to fetch RSS",
      code: errorCode,
      url: url,
      status: status
    });
  }
});

app.get("/api/rss-proxy", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "URL is required" });
  
  try {
    const response = await axios.get(url, {
      timeout: 20000,
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      responseType: 'text'
    });
    
    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if we're not in a serverless environment (like Vercel)
  if (!process.env.VERCEL || process.env.RENDER) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
