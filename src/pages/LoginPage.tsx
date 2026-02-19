import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        toast.success('Account created! Check your email to confirm, then sign in.');
        setAuthMode('signin');
        setEmail(email);
        setPassword('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#143352] flex-col justify-center items-center text-white p-12">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-white/10 flex items-center justify-center mb-8">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-heading font-bold mb-4">Pelican State</h1>
          <p className="text-xl text-white/80 mb-6">Construction & Facilities Management</p>
          <p className="text-white/60 leading-relaxed">
            Streamline your construction projects, manage work requests, and track progress 
            across multiple campuses with our comprehensive project management dashboard.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#F8F9FA] p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-[#143352] mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-[#1F2933]">Pelican State</h1>
            <p className="text-neutral-500 text-sm">Construction & Facilities Management</p>
          </div>

          {/* Login Form */}
          <div className="bg-white border border-neutral-200 p-8">
            <h2 className="text-3xl font-heading font-bold text-[#1F2933] mb-2">
              {authMode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-neutral-500 mb-8">
              {authMode === 'signin'
                ? 'Please sign in to your dashboard'
                : 'Enter your credentials to get started'}
            </p>

            <div className="space-y-4 mb-8">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full border border-neutral-200 py-3 flex items-center justify-center gap-3 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
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
                    placeholder="you@pelicanstate.org"
                    className="w-full pl-10 pr-4 py-3.5 border border-neutral-200 bg-white text-[#1F2933] placeholder-neutral-400 focus:outline-none focus:border-[#143352] transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-sm font-medium text-[#1F2933]">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button type="button" className="text-xs text-[#143352] hover:underline">
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
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3.5 border border-neutral-200 bg-white text-[#1F2933] placeholder-neutral-400 focus:outline-none focus:border-[#143352] transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#143352] hover:bg-[#0F1F2D] text-white py-3.5 font-semibold transition-all shadow-sm active:transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? authMode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : authMode === 'signin'
                  ? 'Sign In'
                  : 'Get Started'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
              <p className="text-sm text-neutral-600">
                {authMode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-[#143352] font-semibold hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-[#143352] font-semibold hover:underline"
                    >
                      Sign in here
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-neutral-500 mt-6">
            Pelican State PM Dashboard v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
