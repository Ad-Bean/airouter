'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  CreditCard,
  Coins,
  History,
  Star,
  Check,
  ArrowUpRight,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { CREDIT_PACKAGES } from '@/config/credits';

interface UserCredits {
  credits: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  useEffect(() => {
    if (session) {
      fetchCredits();
    }
  }, [session]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchaseLoading(packageId);
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        console.error('Checkout error:', error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'usage':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'bonus':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Coins className="h-4 w-4 text-gray-500" />;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
      <Navigation
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onShowLogin={() => router.push('/?showLogin=true')}
        onShowRegister={() => router.push('/?showRegister=true')}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Billing & Credits
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your credits and purchase history
          </p>
        </div>

        {/* Current Credits */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Credits
              </h3>
              <Coins className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? '...' : userCredits?.credits || 0}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Available for image generation
            </p>
          </div>

          <div
            className={`rounded-lg bg-white p-6 shadow dark:bg-gray-800 ${
              (session?.user as { userType?: string })?.userType === 'paid'
                ? 'bg-gradient-to-br from-green-50 to-white ring-2 ring-green-500 dark:from-green-900/20 dark:to-gray-800'
                : ''
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plan</h3>
              <div className="flex items-center">
                {(session?.user as { userType?: string })?.userType === 'paid' && (
                  <Star className="mr-1 h-5 w-5 text-yellow-500" />
                )}
                <Settings className="h-6 w-6 text-gray-500" />
              </div>
            </div>
            <div
              className={`text-2xl font-bold capitalize ${
                (session?.user as { userType?: string })?.userType === 'paid'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {(session?.user as { userType?: string })?.userType === 'paid'
                ? 'Paid Plan'
                : 'Free Plan'}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {(session?.user as { userType?: string })?.userType === 'paid'
                ? 'Enjoy premium features and 7-day image storage'
                : 'Upgrade for enhanced features'}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto Top-up</h3>
              <RefreshCw className="h-6 w-6 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Disabled</div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Automatic credit refill</p>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Buy Credits</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-lg bg-white shadow dark:bg-gray-800 ${
                  pkg.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                    <span className="rounded-full bg-blue-500 px-3 py-1 text-xs text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {pkg.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="mb-4 text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${(pkg.price / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {pkg.credits} credits
                      {pkg.bonus > 0 && (
                        <span className="ml-1 text-green-500">+ {pkg.bonus} bonus</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Generate {pkg.credits + pkg.bonus} images
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      All AI providers
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      High resolution
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchaseLoading === pkg.id}
                    className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
                      pkg.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {purchaseLoading === pkg.id ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transaction History
              </h2>
              <History className="h-6 w-6 text-gray-500" />
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="py-8 text-center">
                <div className="text-gray-600 dark:text-gray-400">Loading transactions...</div>
              </div>
            ) : userCredits?.transactions.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-gray-600 dark:text-gray-400">No transactions yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {userCredits?.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          transaction.amount > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount} credits
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Balance: {transaction.balanceAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
