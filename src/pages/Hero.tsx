import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="z-10 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-brand-primary font-medium mb-8">
          <Sparkles size={16} />
          <span>AI-Powered Job Matching</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 tracking-tight">
          Find the Work That <br className="hidden md:block" /> Matches Your Potential
        </h1>
        
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Stop scrolling through irrelevant listings. Our Match Engine pairs your unique skills with the perfect roles in tech.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/dashboard"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-brand-primary rounded-xl hover:bg-blue-600 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              SEARCH JOBS
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <button className="px-8 py-4 font-bold text-slate-300 transition-all duration-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white backdrop-blur-sm">
            Upload Resume
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-6 text-left">
            <Target className="text-brand-primary mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-2">Precision Matching</h3>
            <p className="text-slate-400 text-sm">Our algorithm analyzes your skills against job descriptions to score compatibility perfectly.</p>
          </div>
          <div className="glass-panel p-6 text-left">
            <Zap className="text-yellow-400 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Sync</h3>
            <p className="text-slate-400 text-sm">Directly pulls from Adzuna APIs to ensure you're applying to active, fresh opportunities.</p>
          </div>
          <div className="glass-panel p-6 text-left">
            <div className="mb-4 w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <div className="w-5 h-5 bg-emerald-500 rounded-sm"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Glassmorphism UI</h3>
            <p className="text-slate-400 text-sm">Experience your job search in a high-fidelity, visually stunning dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
