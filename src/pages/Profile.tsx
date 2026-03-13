import { useState, useEffect } from 'react';
import { insforge } from '../insforge';
import { Link, useNavigate } from 'react-router-dom';
import { User, Link as LinkIcon, Github, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await insforge.auth.getCurrentSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUserId(session.user.id);

      const { data, error } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        setError(error.message);
      } else if (data) {
        setFullName(data.full_name || '');
        setLinkedinUrl(data.linkedin_url || '');
        setGithubUrl(data.github_url || '');
        setSkills(data.skills || []);
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, [navigate]);

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await insforge.database
        .from('profiles')
        .update({
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
        })
        .eq('id', userId);
        
      if (error) throw error;
      setSuccess('Profile links saved successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;
    const file = e.target.files[0];
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload the file to the resumes bucket
      const { error: uploadError } = await insforge.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setSuccess('Resume uploaded successfully! AI extraction is pending...');
      
      // Update profile with the resume URL reference
      await insforge.database
        .from('profiles')
        .update({ resume_url: filePath })
        .eq('id', userId);

      // Here is where the Edge Function invocation would happen
      // e.g. await insforge.functions.invoke('parse-resume', { body: { filePath } })
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-6 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 lg:px-12 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Your Profile
        </h1>
        <p className="text-slate-400">
          Upload your resume and links. Our AI will automatically extract your technical skills to find the best job matches.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-200">
          <AlertCircle className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-start gap-3 text-green-200">
          <CheckCircle2 className="shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid gap-8">
        {/* Links Section */}
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <User className="text-brand-primary" />
            Social Profiles
          </h2>
          
          <form onSubmit={handleSaveLinks} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={fullName}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <LinkIcon size={16} /> LinkedIn URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Github size={16} /> GitHub URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="mt-4 bg-brand-primary hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Social Links'}
            </button>
          </form>
        </div>

        {/* AI Resume Parsing Section */}
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Upload className="text-brand-primary" />
            AI Resume Analyzer
          </h2>
          <p className="text-slate-400 mb-6 text-sm">
            Upload your PDF resume. We will securely parse the document and extract your core technical competencies for the Job Match Engine.
          </p>
          
          <div className="border-2 border-dashed border-white/20 rounded-xl p-10 text-center hover:bg-white/5 transition-colors relative">
            <input 
              type="file" 
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            />
            <Upload size={48} className="mx-auto text-brand-primary/50 mb-4" />
            <p className="text-white font-medium text-lg mb-1">
              {uploading ? 'Uploading & Parsing...' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-slate-400 text-sm">Supports PDF, TXT, DOCX</p>
          </div>
          
          {skills.length > 0 && (
            <div className="mt-8">
              <h3 className="text-white font-medium mb-3">Currently Extracted Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-brand-primary/20 border border-brand-primary/30 text-brand-primary rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
