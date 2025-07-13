"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { 
  CreditCard, 
  Coins, 
  History, 
  Star, 
  Check,
  ArrowUpRight,
  RefreshCw,
  Settings,
} from "lucide-react";
import { CREDIT_PACKAGES } from "@/config/credits";

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
    if (session) {
      fetchCredits();
    }
  }, [session]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/credits");
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchaseLoading(packageId);
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        console.error("Checkout error:", error);
      }
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case "usage":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "bonus":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "refund":
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <Coins className="w-4 h-4 text-gray-500" />;
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

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Credits
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your credits and purchase history
          </p>
        </div>

        {/* Current Credits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Credits
              </h3>
              <Coins className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? "..." : userCredits?.credits || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Available for image generation
            </p>
          </div>

          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
            (session?.user as { userType?: string })?.userType === "paid" 
              ? "ring-2 ring-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800" 
              : ""
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Plan
              </h3>
              <div className="flex items-center">
                {(session?.user as { userType?: string })?.userType === "paid" && (
                  <Star className="w-5 h-5 text-yellow-500 mr-1" />
                )}
                <Settings className="w-6 h-6 text-gray-500" />
              </div>
            </div>
            <div className={`text-2xl font-bold capitalize ${
              (session?.user as { userType?: string })?.userType === "paid"
                ? "text-green-600 dark:text-green-400"
                : "text-gray-900 dark:text-white"
            }`}>
              {(session?.user as { userType?: string })?.userType === "paid" ? "Paid Plan" : "Free Plan"}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {(session?.user as { userType?: string })?.userType === "paid" 
                ? "Enjoy premium features and 7-day image storage" 
                : "Upgrade for enhanced features"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Auto Top-up
              </h3>
              <RefreshCw className="w-6 h-6 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Disabled
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Automatic credit refill
            </p>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Buy Credits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow relative ${
                  pkg.popular ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {pkg.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {pkg.description}
                    </p>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${(pkg.price / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {pkg.credits} credits
                      {pkg.bonus > 0 && (
                        <span className="text-green-500 ml-1">
                          + {pkg.bonus} bonus
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Generate {pkg.credits + pkg.bonus} images
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      All AI providers
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      High resolution
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchaseLoading === pkg.id}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      pkg.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {purchaseLoading === pkg.id ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transaction History
              </h2>
              <History className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400">
                  Loading transactions...
                </div>
              </div>
            ) : userCredits?.transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400">
                  No transactions yet
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userCredits?.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
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
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
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
