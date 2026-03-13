import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { insforge } from '../insforge';
import { Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') !== 'signup';

  const [isLogin, setIsLogin] = useState(initialMode);
  
  // Make sure to sync state if the URL changes while already on the page
  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
  }, [searchParams]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { error: signInError } = await insforge.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = '/dashboard';
      } else {
        const { error: signUpError, data } = await insforge.auth.signUp({
          email,
          password
        });
        if (signUpError) throw signUpError;
        
        if (data?.user) {
          await insforge.database
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);
        }

        if (data?.requireEmailVerification) {
          setIsVerifying(true);
          setSuccess('Please check your email for the 6-digit verification code.');
          return;
        }
        
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await insforge.auth.verifyEmail({
        email,
        otp
      });
      if (verifyError) throw verifyError;
      
      // Automatic sign in upon verification
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="glass-panel p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            {isVerifying ? 'Verify Email' : isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-slate-400 font-light">
            {isVerifying ? 'Enter the code sent to your email.' : isLogin ? 'Log in to access your matched jobs.' : 'Sign up to build your profile and find matches.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-200">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-start gap-3 text-green-200">
            <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {isVerifying ? (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Verification Code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center tracking-[0.5em] text-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-mono"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative inline-flex items-center justify-center px-6 py-3 font-bold text-white transition-all duration-300 bg-brand-primary rounded-xl hover:bg-blue-600 disabled:opacity-70 mt-2"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative inline-flex items-center justify-center px-6 py-3 font-bold text-white transition-all duration-300 bg-brand-primary rounded-xl hover:bg-blue-600 disabled:opacity-70 mt-2"
            >
              <span className="flex items-center gap-2">
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>
        )}

        {!isVerifying && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
