import axios from 'axios';
import * as cheerio from 'cheerio';
import { FEED_SOURCES } from './rssService';
import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function verifySources() {
  console.log("===============================================================");
  console.log("SOURCE VERIFICATION REPORT");
  console.log(`Target: ${FEED_SOURCES.length} Sources`);
  console.log("===============================================================");

  const results = [];
  
  // Process in small batches to avoid overwhelming the system or getting blocked
  const batchSize = 5;
  for (let i = 0; i < FEED_SOURCES.length; i += batchSize) {
    const batch = FEED_SOURCES.slice(i, i + batchSize);
    const batchPromises = batch.map(async (source) => {
      const result = {
        name: source.name,
        url: source.url,
        status: 'FAILED',
        details: '',
        articleCount: 0
      };

      try {
        const response = await axios.get(source.url, {
          timeout: 15000,
          httpsAgent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });

        if (response.status === 200) {
          const contentType = response.headers['content-type'] || '';
          
          if (source.type === 'rss' || contentType.includes('xml') || contentType.includes('rss')) {
            // RSS Detection
            const isRss = response.data.includes('<rss') || response.data.includes('<feed') || response.data.includes('<channel');
            if (isRss) {
              const itemMatches = response.data.match(/<item>|<entry>/g);
              result.articleCount = itemMatches ? itemMatches.length : 0;
              if (result.articleCount > 0) {
                result.status = 'SUCCESS';
                result.details = `RSS Feed: Found ${result.articleCount} items.`;
              } else {
                result.status = 'WARNING';
                result.details = 'Valid RSS structure but no items found.';
              }
            } else {
              result.status = 'FAILED';
              result.details = 'Expected RSS/XML but received something else.';
            }
          } else {
            // HTML Scraping Detection
            const $ = cheerio.load(response.data);
            
            // Basic news detection logic
            const links = $('a').map((_, el) => ({
              text: $(el).text().trim(),
              href: $(el).attr('href')
            })).get();

            // Look for links that look like articles (long text, specific patterns)
            const potentialArticles = links.filter(l => 
              l.text.length > 25 && 
              l.href && 
              !l.href.includes('javascript:') && 
              !l.href.includes('#') &&
              (l.href.startsWith('http') || l.href.startsWith('/'))
            );

            result.articleCount = potentialArticles.length;
            
            if (potentialArticles.length > 0) {
              result.status = 'SUCCESS';
              result.details = `Found ${potentialArticles.length} potential articles.`;
            } else {
              // Try fallback: look for specific news-heavy tags
              const paragraphs = $('p').filter((_, el) => $(el).text().length > 100).length;
              if (paragraphs > 3) {
                result.status = 'SUCCESS';
                result.articleCount = paragraphs;
                result.details = `Found ${paragraphs} content blocks (likely a single article page).`;
              } else {
                result.status = 'WARNING';
                result.details = '200 OK but no clear article links found.';
              }
            }
          }
        } else {
          result.details = `HTTP ${response.status}`;
        }
      } catch (error: any) {
        result.details = error.message;
      }
      return result;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Print progress
    batchResults.forEach(r => {
      const statusIcon = r.status === 'SUCCESS' ? '✅' : (r.status === 'WARNING' ? '⚠️' : '❌');
      console.log(`${statusIcon} [${r.status}] ${r.name.padEnd(40)} | Articles: ${String(r.articleCount).padStart(3)} | ${r.details}`);
    });
  }

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const failCount = results.filter(r => r.status === 'FAILED').length;

  console.log("===============================================================");
  console.log("FINAL SUMMARY");
  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️ Warning: ${warningCount}`);
  console.log(`❌ Failed:  ${failCount}`);
  console.log(`Total:     ${results.length}`);
  console.log("===============================================================");
}

verifySources();
