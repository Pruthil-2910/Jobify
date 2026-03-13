import dotenv from 'dotenv';
import { createClient } from '@insforge/sdk';

dotenv.config({ path: '.env.local' });

const ADZUNA_APP_ID = process.env.VITE_ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.VITE_ADZUNA_APP_KEY;
// India country code: 'in'
const API_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search';

// ✅ Correct InsForge SDK initialization (object format)
const insforge = createClient({
  baseUrl: process.env.VITE_INSFORGE_URL,
  anonKey: process.env.VITE_INSFORGE_ANON_KEY,
});

/**
 * Strips HTML tags from job descriptions
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_PAGES = 100;

const runSync = async () => {
  console.log('🚀 Starting Adzuna India job sync (up to 100 pages)...');

  let page = 1;
  let totalInserted = 0;
  let totalFetched = 0;

  while (page <= MAX_PAGES) {
    console.log(`\n📄 Fetching page ${page}/${MAX_PAGES}...`);

    const url = new URL(`${API_BASE_URL}/${page}`);
    url.searchParams.append('app_id', ADZUNA_APP_ID);
    url.searchParams.append('app_key', ADZUNA_APP_KEY);
    url.searchParams.append('results_per_page', '50');
    url.searchParams.append('content-type', 'application/json');

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️  Rate limit hit. Waiting 15 seconds before retrying...');
          await delay(15000);
          continue; // retry same page
        }
        console.error(`❌ HTTP Error on page ${page}: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.log('✅ No more results from Adzuna. All pages fetched.');
        break;
      }

      totalFetched += data.results.length;

      // Map Adzuna fields → jobs_cache columns
      const jobs = data.results.map((job) => ({
        adzuna_id:    String(job.id),
        title:        job.title || 'Untitled',
        company:      job.company?.display_name || 'Unknown',
        location:     job.location?.display_name || 'India',
        description:  stripHtml(job.description),
        category:     job.category?.label || 'General',
        salary_max:   job.salary_max || null,
        redirect_url: job.redirect_url,
        date_posted:  job.created || null,   // Adzuna 'created' = job posting date
        last_synced:  new Date().toISOString(),
      }));

      console.log(`   ↪ Fetched ${jobs.length} jobs. Upserting to InsForge...`);

      // ✅ Correct InsForge SDK database access
      const { data: inserted, error } = await insforge.database
        .from('jobs_cache')
        .upsert(jobs, { onConflict: 'adzuna_id' })
        .select();

      if (error) {
        console.error(`❌ DB Error on page ${page}:`, JSON.stringify(error, null, 2));
        break;
      }

      const count = inserted ? inserted.length : jobs.length;
      totalInserted += count;
      console.log(`   ✅ Upserted ${count} jobs. Total so far: ${totalInserted}`);

      page++;

      // Adzuna free tier: ~25 req/min → wait 2.5s between pages
      if (page <= MAX_PAGES) {
        console.log('   ⏳ Waiting 2.5s (rate limit)...');
        await delay(2500);
      }

    } catch (err) {
      console.error(`❌ Unexpected error on page ${page}:`, err.message);
      break;
    }
  }

  console.log(`\n🎉 Sync complete!`);
  console.log(`   Total pages processed : ${page - 1}`);
  console.log(`   Total jobs fetched     : ${totalFetched}`);
  console.log(`   Total jobs upserted    : ${totalInserted}`);
  process.exit(0);
};

runSync();
