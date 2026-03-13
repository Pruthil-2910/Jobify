import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { insforge } from '../insforge';
import {
  Building2, MapPin, DollarSign, Calendar, Tag,
  ExternalLink, ArrowLeft, Briefcase, ChevronRight
} from 'lucide-react';

interface Job {
  id: string;
  adzuna_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  category: string;
  salary_max: number | null;
  redirect_url: string;
  date_posted: string | null;
  last_synced: string;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await insforge.database
          .from('jobs_cache')
          .select('*')
          .eq('adzuna_id', id)
          .single();

        if (dbError) throw dbError;
        if (!data) throw new Error('Job not found');
        setJob(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJob();
  }, [id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatSalary = (salary: number | null) => {
    if (!salary) return 'Competitive';
    return `₹${salary.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center items-start px-6">
        <div className="w-full max-w-4xl">
          <div className="glass-panel p-8 animate-pulse space-y-6">
            <div className="h-8 w-2/3 bg-white/10 rounded-xl" />
            <div className="h-5 w-1/3 bg-white/5 rounded-xl" />
            <div className="h-5 w-1/4 bg-white/5 rounded-xl" />
            <div className="h-48 w-full bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen pt-32 flex justify-center items-start px-6">
        <div className="glass-panel p-10 text-center max-w-lg w-full">
          <Briefcase size={48} className="mx-auto text-red-400/50 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Job Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'This job listing is no longer available.'}</p>
          <Link to="/dashboard" className="bg-brand-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background blobs */}
      <div className="fixed top-1/4 -left-40 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <ChevronRight size={14} className="opacity-40" />
          <span className="text-slate-300 truncate max-w-xs">{job.title}</span>
        </nav>

        {/* Hero Card */}
        <div className="glass-panel p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-slate-300 text-sm">
                <span className="flex items-center gap-1.5">
                  <Building2 size={15} className="text-brand-primary" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-brand-primary" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag size={15} className="text-brand-primary" />
                  {job.category}
                </span>
              </div>
            </div>

            {/* Salary badge */}
            <div className="shrink-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-400 font-semibold text-lg">
              <DollarSign size={20} />
              {formatSalary(job.salary_max)}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              Posted: <span className="text-slate-300 ml-1">{formatDate(job.date_posted)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              Last synced: <span className="text-slate-300 ml-1">{formatDate(job.last_synced)}</span>
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="glass-panel p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-5">Job Description</h2>
          <div className="space-y-4">
            {job.description
              ? job.description
                  .split(/\n+/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className="text-slate-300 text-sm leading-relaxed">
                      {para}
                    </p>
                  ))
              : <p className="text-slate-500 italic">No description available for this listing.</p>
            }
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={job.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-blue-600 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-base"
          >
            View Job on Adzuna
            <ExternalLink size={18} />
          </a>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-base backdrop-blur-sm"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
