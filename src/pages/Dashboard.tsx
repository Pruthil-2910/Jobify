import { useState, useEffect } from 'react';
import { insforge } from '../insforge';
import JobCard from '../components/JobCard';
import { syncAdzunaJobs } from '../services/adzunaService';
import type { AdzunaJob } from '../services/adzunaService';
import { calculateMatchScore } from '../utils/matchEngine';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [jobs, setJobs] = useState<(AdzunaJob & { matchScore: number | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ skills: string[] } | null>(null);

  const fetchJobsAndMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get current user profile (skills) if logged in
      const { data: { session } } = await insforge.auth.getCurrentSession();
      let skills: string[] = ['react', 'typescript', 'frontend', 'tailwind']; // Mock default for demo
      
      if (session?.user) {
        const { data: profile } = await insforge.database
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.skills && Array.isArray(profile.skills)) {
          skills = profile.skills;
        }
        setUserProfile({ skills });
      } else {
        setUserProfile({ skills }); // Using mock for now so we can show match engine working visually
      }

      // 2. Fetch jobs from our cache
      const { data: cachedJobs, error: dbError } = await insforge.database
        .from('jobs_cache')
        .select('*')
        .order('last_synced', { ascending: false })
        .limit(20);

      if (dbError) throw dbError;

      // Ensure we have formatting consistent with what UI expects
      const formattedJobs = (cachedJobs || []).map(job => ({
        id: job.adzuna_id,
        title: job.title,
        company: { display_name: job.company },
        location: { display_name: job.location },
        description: job.description,
        category: { label: job.category },
        salary_max: job.salary_max,
        redirect_url: job.redirect_url,
        matchScore: calculateMatchScore(skills, job.description, job.title)
      }));

      // Sort by match score safely
      formattedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      
      setJobs(formattedJobs);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await syncAdzunaJobs();
      await fetchJobsAndMatch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchJobsAndMatch();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 lg:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Job Dashboard
          </h1>
          <p className="text-slate-400">
            {userProfile ? `Matching jobs to your profile skills: ${userProfile.skills.join(', ')}` : 'Discover jobs matched to your potential.'}
          </p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={syncing}
          className="glass-panel px-4 py-2 flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Adzuna Data'}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-200">
          <AlertCircle className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-panel p-6 h-64 animate-pulse">
              <div className="h-6 w-3/4 bg-white/10 rounded mb-4"></div>
              <div className="h-4 w-1/2 bg-white/5 rounded mb-2"></div>
              <div className="h-4 w-1/3 bg-white/5 rounded mb-6"></div>
              <div className="h-16 w-full bg-white/5 rounded mb-4"></div>
              <div className="mt-auto flex justify-between pt-4 border-t border-white/5">
                <div className="h-5 w-20 bg-white/10 rounded"></div>
                <div className="h-8 w-24 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Database size={48} className="mx-auto text-brand-primary/50 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Jobs Found</h3>
          <p className="text-slate-400 mb-6">Your job cache appears to be empty. Sync data from Adzuna to populate the list.</p>
          <button 
            onClick={handleManualSync}
            className="bg-brand-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Pull Jobs from Adzuna
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
             <JobCard key={job.id} job={job} matchScore={job.matchScore} />
          ))}
        </div>
      )}
    </div>
  );
}
