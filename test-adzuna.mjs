import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const ADZUNA_APP_ID = process.env.VITE_ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.VITE_ADZUNA_APP_KEY;
const API_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/us/search';

const insforge = createClient(
  process.env.VITE_INSFORGE_URL,
  process.env.VITE_INSFORGE_ANON_KEY
);

/**
 * Strips HTML tags from job descriptions
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTest = async () => {
  console.log('Testing Adzuna fetch (paginated)...');
  
  let page = 1;
  let hasMore = true;
  let totalInserted = 0;
  
  // Adzuna free tier limit: 25 hits per min -> wait > 2.4s between requests
  
  while (hasMore) {
    console.log(`Fetching page ${page}...`);
    const url = new URL(`${API_BASE_URL}/${page}`);
    url.searchParams.append('app_id', ADZUNA_APP_ID);
    url.searchParams.append('app_key', ADZUNA_APP_KEY);
    url.searchParams.append('results_per_page', '50'); // Max allowed
    url.searchParams.append('what', 'Software Engineer');
    url.searchParams.append('content-type', 'application/json');

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
        if (response.status === 429) {
            console.log("Rate limit hit! Waiting 10 seconds before continuing...");
            await delay(10000);
            continue; // Retry the same page
        }
        break; // For other errors, exit loop
      }
      
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.log('No more results found.');
        hasMore = false;
        break;
      }

      const jobs = data.results.map((job) => ({
        adzuna_id: String(job.id),
        title: job.title,
        company: job.company?.display_name || 'Unknown',
        location: job.location?.display_name || 'Remote',
        description: stripHtml(job.description),
        category: job.category?.label || 'Engineering',
        salary_max: job.salary_max || null,
        redirect_url: job.redirect_url,
        last_synced: new Date().toISOString()
      }));

      console.log(`Fetched ${jobs.length} jobs on page ${page}. Inserting into InsForge jobs_cache...`);

      // Upsert jobs into InsForge
      const { data: inserted, error } = await insforge
        .from('jobs_cache')
        .upsert(jobs, { onConflict: 'adzuna_id' })
        .select();

      if (error) {
        console.error('Error syncing jobs to InsForge:', error);
        break; // Stop on DB error
      }

      totalInserted += inserted ? inserted.length : jobs.length;
      console.log(`Successfully inserted/updated ${inserted?.length || jobs.length} jobs. Total so far: ${totalInserted}`);

      page++;
      
      // Respect rate limits: wait 2.5 seconds
      console.log('Waiting 2.5 seconds to respect rate limits...');
      await delay(2500);
      
    } catch (err) {
      console.error('An error occurred during fetch:', err);
      break;
    }
  }

  console.log(`Finished syncing jobs. Total jobs processed: ${totalInserted}`);
  process.exit(0);
};

runTest();
