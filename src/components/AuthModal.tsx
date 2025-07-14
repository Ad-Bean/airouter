'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultTab = 'login',
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update activeTab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (activeTab === 'login') {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Invalid email or password');
        } else if (result?.ok) {
          const pendingPrompt = localStorage.getItem('pendingPrompt');
          const pendingProviders = localStorage.getItem('pendingProviders');

          if (pendingPrompt || pendingProviders) {
            localStorage.setItem('shouldRedirectToChat', 'true');
          }

          onAuthSuccess?.();
          onClose();
        } else {
          console.error('Unknown signin result:', result);
          setError('Sign in failed. Please try again.');
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          });

          if (result?.error) {
            console.error('Auto-login error:', result.error);
            setError('Registration successful, but login failed');
          } else if (result?.ok) {
            // Check if there are pending values to redirect to chat
            const pendingPrompt = localStorage.getItem('pendingPrompt');
            const pendingProviders = localStorage.getItem('pendingProviders');

            if (pendingPrompt || pendingProviders) {
              localStorage.setItem('shouldRedirectToChat', 'true');
            }

            // Call the success callback before closing
            onAuthSuccess?.();
            onClose();
          } else {
            console.error('Unknown auto-login result:', result);
            setError('Registration successful, but login failed');
          }
        } else {
          console.error('Registration failed:', data);
          setError(data.error || 'Registration failed');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const pendingPrompt = localStorage.getItem('pendingPrompt');
      const pendingProviders = localStorage.getItem('pendingProviders');

      if (pendingPrompt || pendingProviders) {
        localStorage.setItem('shouldRedirectToChat', 'true');
      }

      await signIn('google', {
        callbackUrl: '/chat',
        redirect: true,
      });
    } catch {
      setError('Google sign in failed');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setShowPassword(false);
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    resetForm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeTab === 'login'
                    ? 'Sign in to your account'
                    : 'Join us to start creating with AI'}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="mb-6 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                <button
                  onClick={() => switchTab('login')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    activeTab === 'login'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchTab('register')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    activeTab === 'register'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'register' && (
                  <div>
                    <div className="relative">
                      <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                      <input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-12 pl-10 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                    </div>
                  ) : (
                    <>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
