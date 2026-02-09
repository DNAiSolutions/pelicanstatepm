import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';
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
      
      // Role-based redirect will happen in App.tsx
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-heading">
            P
          </div>
          <h1 className="text-3xl font-heading font-bold text-primary-900 mb-2">
            Pelican State
          </h1>
          <p className="text-neutral-600">
            Construction & Facilities Management
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 shadow-soft p-8 space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="latoya@pelicanstate.org"
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary text-white py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Demo Credentials Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Demo Credentials</p>
              <p>After creating your Supabase project, use your registered email and password</p>
            </div>
          </div>
        </form>

        {/* Footer Info */}
        <p className="text-center text-sm text-neutral-600 mt-6">
          Part of the Pelican State facilities management system
        </p>
      </div>
    </div>
  );
}
