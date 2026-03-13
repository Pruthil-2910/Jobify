import { useState, useEffect, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Hero from './pages/Hero';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import './index.css';
import { insforge } from './insforge';
import type { Session } from '@insforge/sdk';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen pt-32 px-6 bg-slate-900 text-white">
          <div className="max-w-2xl mx-auto glass-panel p-8 border-red-500/50">
            <h1 className="text-3xl font-bold text-red-500 mb-4">React App Crashed</h1>
            <pre className="text-sm bg-black/50 p-4 rounded-xl overflow-auto text-red-200">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button onClick={() => window.location.reload()} className="mt-6 bg-slate-800 px-4 py-2 rounded">Refresh Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    insforge.auth.getCurrentSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleLogout = async () => {
    await insforge.auth.signOut();
    setSession(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="min-h-screen w-full relative">
        {/* Simple Navbar */}
        <nav className="absolute top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-transparent">
          <Link to="/" className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            JobPortal
          </Link>
          <div className="flex gap-4">
            {session ? (
              <>
                <Link to="/profile" className="text-slate-300 hover:text-white transition-colors text-sm font-medium mt-2">
                  Profile
                </Link>
                <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all border border-white/10 backdrop-blur-md">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-slate-300 hover:text-white transition-colors text-sm font-medium mt-2">
                  Log In
                </Link>
                <Link to="/auth?mode=signup" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all border border-white/10 backdrop-blur-md">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Content */}
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
