import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
            <h2 className="text-2xl font-heading font-semibold text-[#1F2933] mb-2">Welcome back</h2>
            <p className="text-neutral-500 mb-6">Please sign in to your account</p>

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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#143352] hover:bg-[#0F1F2D] text-white py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Demo Access</p>
                  <p className="text-blue-600">Use your registered email and password to access the dashboard.</p>
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
