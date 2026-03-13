import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, DollarSign, ExternalLink } from 'lucide-react';
import type { AdzunaJob } from '../services/adzunaService';

interface JobCardProps {
  job: AdzunaJob;
  matchScore: number | null;
}

export default function JobCard({ job, matchScore }: JobCardProps) {
  const navigate = useNavigate();

  // Badge colour by match score
  let badgeColor = 'bg-gray-500 text-white';
  if (matchScore !== null) {
    if (matchScore >= 80) badgeColor = 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    else if (matchScore >= 50) badgeColor = 'bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    else badgeColor = 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]';
  }

  const handleCardClick = () => {
    navigate(`/job/${job.id}`);
  };

  const handleViewJob = (e: React.MouseEvent) => {
    // Prevent card click from firing when clicking "View Job"
    e.stopPropagation();
    window.open(job.redirect_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleCardClick}
      className="glass-card p-6 flex flex-col h-full group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-primary/40 transition-all duration-300"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/0 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-10 group-hover:from-brand-primary/10 group-hover:to-purple-500/5 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1">
          <h3 className="text-xl font-bold font-sans text-brand-light line-clamp-2 leading-tight mb-2 group-hover:text-white transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center text-slate-300 text-sm mb-1">
            <Building2 size={16} className="mr-2 opacity-70" />
            <span className="truncate">{job.company?.display_name || 'Company Name'}</span>
          </div>
          <div className="flex items-center text-slate-300 text-sm">
            <MapPin size={16} className="mr-2 opacity-70" />
            <span className="truncate">{job.location?.display_name || 'Location'}</span>
          </div>
        </div>

        {/* Match Score Badge */}
        {matchScore !== null && (
          <div className={`ml-4 px-3 py-1.5 rounded-full font-bold text-sm tracking-wide shrink-0 ${badgeColor} transition-transform group-hover:scale-105`}>
            {matchScore}% Match
          </div>
        )}
      </div>

      <p className="text-slate-400 text-sm line-clamp-3 mb-6 relative z-10 font-light">
        {job.description}
      </p>

      <div className="mt-auto flex justify-between items-center relative z-10 pt-4 border-t border-white/5">
        <div className="flex items-center text-emerald-400 font-medium">
          <DollarSign size={18} className="mr-1" />
          <span>{job.salary_max ? job.salary_max.toLocaleString() : 'Competitive'}</span>
        </div>

        <button
          onClick={handleViewJob}
          className="flex items-center text-brand-primary hover:text-blue-400 transition-colors bg-brand-primary/10 hover:bg-brand-primary/20 px-4 py-2 rounded-lg font-medium text-sm"
        >
          View Job
          <ExternalLink size={14} className="ml-2" />
        </button>
      </div>

      {/* Subtle "click to expand" hint */}
      <p className="text-slate-500 text-xs mt-3 text-center relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        Click card for full details
      </p>
    </div>
  );
}
