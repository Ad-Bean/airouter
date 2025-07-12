"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/Navigation";
import { CheckCircle, Loader2, AlertCircle, CreditCard, Plus } from "lucide-react";

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number;
    creditsAdded: number;
    packageName: string;
  } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldUseDark =
      savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId && session) {
      verifyPayment(sessionId);
    }
  }, [searchParams, session]);

  const verifyPayment = async (sessionId: string) => {
    try {
      console.log("Verifying payment for session:", sessionId);
      const response = await fetch(`/api/billing/verify-new?session_id=${sessionId}`);
      const data = await response.json();
      
      console.log("Verification response:", response.status, data);
      
      if (response.ok) {
        setVerificationStatus('success');
        setPaymentDetails(data);
      } else {
        console.error("Verification failed:", data);
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
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleManualCreditAddition = async () => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    setIsAddingCredits(true);
    try {
      const response = await fetch("/api/billing/add-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCreditsAdded(true);
        alert(`Success! ${data.creditsAdded} credits added to your account. New balance: ${data.newBalance}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error adding credits:", error);
      alert("An error occurred while adding credits. Please try again.");
    } finally {
      setIsAddingCredits(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onShowLogin={() => router.push("/?showLogin=true")}
        onShowRegister={() => router.push("/?showRegister=true")}
      />

      <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {verificationStatus === 'loading' && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying Payment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we confirm your payment...
              </p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Successful!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Thank you for your purchase. Your credits have been added to your account.
              </p>
              
              {paymentDetails && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-blue-600 mr-2" />
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

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push("/billing")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Billing
                </button>
                <button
                  onClick={() => router.push("/chat")}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Start Creating
                </button>
              </div>
              
              {!creditsAdded && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Credits not showing up? Click below to manually add them:
                  </p>
                  <button
                    onClick={handleManualCreditAddition}
                    disabled={isAddingCredits}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {isAddingCredits ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding Credits...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
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
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Verification Failed
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                We couldn&apos;t verify your payment. Please contact support if you were charged.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push("/billing")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
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
