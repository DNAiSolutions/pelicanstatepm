import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, ShieldCheck, ArrowRight, Headphones, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const tabs: Array<{ key: 'signin' | 'signup'; title: string; description: string }> = [
  { key: 'signin', title: 'Sign In', description: 'Existing Pelican staff & vendors' },
  { key: 'signup', title: 'Request Access', description: 'Submit details for review' },
];

export function LoginPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setIsSubmitting(true);
      if (authMode === 'signin') {
        await signIn(email, password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        await signUp(email, password);
        toast.success('Account created. Check your inbox to confirm.');
        setAuthMode('signin');
        setPassword('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to authenticate';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      toast('Redirecting to Google...', { icon: '🔐' });
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f1f2d] lg:bg-white">
      <section className="hidden lg:flex lg:w-1/2 relative text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1f2d] via-[#0f2749] to-[#1f4b7a]" />
        <div className="relative z-10 flex flex-col justify-center gap-8 p-16">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-white/60">Pelican State</p>
              <h1 className="text-4xl font-heading font-bold">Command Portal</h1>
            </div>
          </div>
          <p className="text-lg leading-relaxed text-white/80">
            Coordinate work requests, historic preservation, invoicing, and vendor collaboration across Wallace, Woodland,
            and Paris properties inside one secure workspace.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {['Property Ops', 'Capital Projects', 'Finance', 'Vendors'].map((badge) => (
              <span key={badge} className="text-xs uppercase tracking-[0.35em] border border-white/25 rounded-full px-4 py-1 text-center">
                {badge}
              </span>
            ))}
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.45em] text-white/60">Security</p>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6" />
              <div>
                <p className="font-semibold">Supabase Auth + Google Workspace</p>
                <p className="text-white/70 text-sm">MFA enforced for staff roles, SSO ready.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 flex items-center justify-center px-6 py-12 bg-[#0f1f2d] lg:bg-[#f8f9fb]">
        <div className="w-full max-w-lg">
          <div className="lg:hidden text-center mb-8 text-white">
            <div className="w-16 h-16 bg-white/15 mx-auto mb-4 flex items-center justify-center rounded-2xl">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-heading font-bold">Pelican State</h1>
            <p className="text-sm text-white/70">Command Portal</p>
          </div>

          <div className="bg-white border border-neutral-200 shadow-sm p-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-neutral-400 mb-6">
              <span>Secure Access</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span>{authMode === 'signin' ? 'Staff & Vendors' : 'Access Request'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={authMode === tab.key}
                  onClick={() => setAuthMode(tab.key)}
                  className={`text-left border px-4 py-3 transition-all ${
                    authMode === tab.key ? 'border-[#0f2749] bg-[#0f2749]/5 text-[#0f2749]' : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  <p className="text-sm font-semibold">{tab.title}</p>
                  <p className="text-xs text-neutral-500">{tab.description}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full border border-neutral-200 py-3 flex items-center justify-center gap-3 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              {isGoogleLoading ? 'Connecting…' : 'Continue with Google Workspace'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-400">or use email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" aria-label={authMode === 'signin' ? 'Sign in form' : 'Sign up form'}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1F2933] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@pelicanstate.org"
                    className="w-full pl-10 pr-4 py-3.5 border border-neutral-200 bg-white text-[#1F2933] placeholder-neutral-400 focus:outline-none focus:border-[#0f2749] transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-sm font-medium text-[#1F2933]">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button type="button" className="text-xs text-[#0f2749] hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3.5 border border-neutral-200 bg-white text-[#1F2933] placeholder-neutral-400 focus:outline-none focus:border-[#0f2749] transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0f2749] hover:bg-[#0F1F2D] text-white py-3.5 font-semibold transition-all shadow-sm active:transform active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting
                  ? authMode === 'signin'
                    ? 'Signing in…'
                    : 'Submitting…'
                  : authMode === 'signin'
                  ? 'Sign In'
                  : 'Request Access'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100 grid gap-4 md:grid-cols-2 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <Headphones className="w-4 h-4" />
                <span>Need an invite? operations@pelicanstate.org</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="flex items-center justify-end gap-2 text-[#0f2749] hover:underline"
              >
                {authMode === 'signin' ? 'Request access instead' : 'Back to sign in'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 bg-white/10 text-white border border-white/20 rounded-2xl p-5 flex items-center gap-3 text-sm lg:hidden">
            <Sparkles className="w-4 h-4" />
            <span>Google Workspace single sign-on available for Pelican staff.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
