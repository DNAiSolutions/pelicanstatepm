import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Building2 } from 'lucide-react';
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
        localStorage.setItem('pelican-onboarding-required', 'true');
        toast.success('Account created! Tell us about your role.');
        navigate('/onboarding');
        return;
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
      localStorage.setItem('pelican-onboarding-required', 'true');
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
            <div className="flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-4 py-2 text-sm font-medium border ${
                  authMode === 'signin'
                    ? 'bg-[#143352] text-white border-[#143352]'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-4 py-2 text-sm font-medium border ${
                  authMode === 'signup'
                    ? 'bg-[#143352] text-white border-[#143352]'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Create Account
              </button>
            </div>

            <h2 className="text-2xl font-heading font-semibold text-[#1F2933] mb-2">
              {authMode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-neutral-500 mb-6">
              {authMode === 'signin'
                ? 'Please sign in to your account'
                : 'Enter your details to get instant access'}
            </p>

            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full border border-neutral-200 py-2.5 flex items-center justify-center gap-3 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21.35 11.1h-9.18v2.92h5.3c-.23 1.5-1.8 4.41-5.3 4.41-3.19 0-5.79-2.64-5.79-5.9s2.6-5.9 5.79-5.9c1.82 0 3.04.77 3.74 1.43l2.55-2.46C17.02 3.77 15.03 2.8 12.17 2.8 6.9 2.8 2.6 7.11 2.6 12.43S6.9 22.06 12.17 22.06c6.2 0 10.28-4.35 10.28-10.47 0-.7-.07-1.24-.1-1.49Z"
                    fill="currentColor"
                  />
                </svg>
                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1F2933] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@pelicanstate.org"
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 bg-white text-[#1F2933] placeholder-neutral-400 focus:outline-none focus:border-[#143352] transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1F2933] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 bg-white text-[#1F2933] placeholder-neutral-400 focus:outline-none focus:border-[#143352] transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#143352] hover:bg-[#0F1F2D] text-white py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? authMode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : authMode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">{authMode === 'signin' ? 'Demo Access' : 'Need Google?'}</p>
                  <p className="text-blue-600">
                    {authMode === 'signin'
                      ? 'Use your registered email and password or sign in with Google to access the dashboard.'
                      : 'You can also continue with Google to automatically create and sign in to your account.'}
                  </p>
                </div>
              </div>
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
