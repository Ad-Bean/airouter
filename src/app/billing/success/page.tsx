'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navigation } from '@/components/Navigation';
import { CheckCircle, Loader2, AlertCircle, CreditCard, Plus } from 'lucide-react';

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number;
    creditsAdded: number;
    packageName: string;
  } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(false);

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
    const sessionId = searchParams.get('session_id');
    if (sessionId && session) {
      verifyPayment(sessionId);
    }
  }, [searchParams, session]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/billing/verify-new?session_id=${sessionId}`);
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setPaymentDetails(data);
      } else {
        console.error('Verification failed:', data);
        setVerificationStatus('error');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('error');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleManualCreditAddition = async () => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return;

    setIsAddingCredits(true);
    try {
      const response = await fetch('/api/billing/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreditsAdded(true);
        alert(
          `Success! ${data.creditsAdded} credits added to your account. New balance: ${data.newBalance}`,
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding credits:', error);
      alert('An error occurred while adding credits. Please try again.');
    } finally {
      setIsAddingCredits(false);
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

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          {verificationStatus === 'loading' && (
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Verifying Payment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we confirm your payment...
              </p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-6 h-16 w-16 text-green-500" />
              <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                Payment Successful!
              </h1>
              <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
                Thank you for your purchase. Your credits have been added to your account.
              </p>

              {/* Tier Upgrade Notification */}
              <div className="mb-6 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-blue-900/20">
                <div className="mb-2 flex items-center justify-center">
                  <CheckCircle className="mr-2 h-6 w-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                    Account Upgraded to Paid Tier! 🎉
                  </h3>
                </div>
                <div className="space-y-1 text-center text-sm text-green-700 dark:text-green-300">
                  <p>✨ Your images now stay for 7 days instead of 10 minutes</p>
                  <p>🚀 Enjoy premium features and enhanced experience</p>
                </div>
              </div>

              {paymentDetails && (
                <div className="mb-6 rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                  <div className="mb-4 flex items-center justify-center">
                    <CreditCard className="mr-2 h-8 w-8 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Purchase Details
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Package:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {paymentDetails.packageName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${(paymentDetails.amount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Credits Added:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        +{paymentDetails.creditsAdded} credits
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => router.push('/billing')}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  View Billing
                </button>
                <button
                  onClick={() => router.push('/chat')}
                  className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Start Creating
                </button>
              </div>

              {!creditsAdded && (
                <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    Credits not showing up? Click below to manually add them:
                  </p>
                  <button
                    onClick={handleManualCreditAddition}
                    disabled={isAddingCredits}
                    className="mx-auto flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAddingCredits ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding Credits...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Manually Add Credits
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="text-center">
              <AlertCircle className="mx-auto mb-6 h-16 w-16 text-red-500" />
              <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                Payment Verification Failed
              </h1>
              <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
                We couldn&apos;t verify your payment. Please contact support if you were charged.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => router.push('/billing')}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Go Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingSuccessContent />
    </Suspense>
  );
}
