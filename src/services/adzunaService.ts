import { insforge } from '../insforge';

const ADZUNA_APP_ID = import.meta.env.VITE_ADZUNA_APP_ID;
const ADZUNA_APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY;
// Using the Vite proxy to bypass CORS restrictions
const API_BASE_URL = '/api/adzuna/v1/api/jobs/us/search/1';

export interface AdzunaJob {
  id: string;
  title: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
  };
  description: string;
  category: {
    label: string;
  };
  salary_max?: number;
  redirect_url: string;
}

/**
 * Strips HTML tags from job descriptions
 */
const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Fetches jobs from Adzuna and syncs them to the InsForge jobs_cache table
 */
export const syncAdzunaJobs = async (searchQuery: string = 'Software Engineer') => {
  try {
    // Need to pass window.location.origin because API_BASE_URL is a relative path now
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.append('app_id', ADZUNA_APP_ID);
    url.searchParams.append('app_key', ADZUNA_APP_KEY);
    url.searchParams.append('results_per_page', '50');
    url.searchParams.append('what', searchQuery);
    
    // Using content-type application/json to prevent standard API errors on adzuna
    url.searchParams.append('content-type', 'application/json');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!data.results) {
      throw new Error('Failed to fetch jobs from Adzuna');
    }

    const jobs = data.results.map((job: AdzunaJob) => ({
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

    // Upsert jobs into InsForge
    const { error } = await insforge.database
      .from('jobs_cache')
      .upsert(jobs, { onConflict: 'adzuna_id' });

    if (error) {
      console.error('Error syncing jobs to InsForge:', error);
      throw error;
    }

    return { success: true, count: jobs.length };
  } catch (err) {
    console.error('Error in Adzuna Ingestion Engine:', err);
    return { success: false, error: err };
  }
};
