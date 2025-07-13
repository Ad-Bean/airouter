"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { FreeUserNotification } from "@/components/FreeUserNotification";
import { getImageStatus } from "@/lib/image-utils";
import Image from "next/image";
import {
  ImageIcon,
  Heart,
  TrendingUp,
  BarChart3,
  Eye,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { DashboardStats } from "@/types/dashboard";
import { PROVIDER_CONFIGS } from "@/config/providers";

// Helper function to get the display URL for an image
// Always use the API endpoint to ensure proper access control and S3 proxying
function getImageDisplayUrl(image: { id: string }): string {
  return `/api/images/${image.id}`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
    fetchStats();
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
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch stats:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleShowLogin = () => {
    router.push("/?showLogin=true");
  };

  const handleShowRegister = () => {
    router.push("/?showRegister=true");
  };

  if (status === "loading" || loading) {
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
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div>
        <Navigation
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onShowLogin={handleShowLogin}
          onShowRegister={handleShowRegister}
        />

        {/* Free User Notification */}
        <FreeUserNotification />

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {session.user?.name || session.user?.email}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here&apos;s an overview of your AI image generation activity.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Images */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Images
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalImages || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Favorite Images */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Favorites
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.favoriteImages || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    This Week
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.recentImages || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Account
                  </p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {(session?.user as { userType?: string })?.userType === "paid" ? "Paid Plan" : "Free Plan"}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Provider Stats & Recent Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Provider Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Images by Provider
                </h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>

              {stats?.providerStats &&
              Object.keys(stats.providerStats).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.providerStats).map(
                    ([provider, count]) => {
                      const config =
                        PROVIDER_CONFIGS[
                          provider as keyof typeof PROVIDER_CONFIGS
                        ];
                      return (
                        <div
                          key={provider}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                config ? config.badgeColor : "bg-gray-500"
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {config ? config.shortDescription : provider}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No images yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Start generating to see stats
                  </p>
                </div>
              )}
            </div>

            {/* Recent Images */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Images
                </h3>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>

              {stats?.recentImagesList && stats.recentImagesList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stats.recentImagesList.map((image) => {
                    const imageStatus = getImageStatus(image.autoDeleteAt, image.userType);
                    
                    return (
                      <div
                        key={image.id}
                        className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={() => {
                          if (!imageStatus.isExpired) {
                            router.push("/gallery");
                          }
                        }}
                      >
                        {!imageStatus.isExpired ? (
                          <Image
                            src={getImageDisplayUrl(image)}
                            alt={image.prompt}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                            <div className="text-center">
                              <div className="w-8 h-8 mx-auto mb-2 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">!</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Expired
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Expiration Status Overlay */}
                        {imageStatus.isExpired && (
                          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                            <div className="text-center text-white">
                              <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                              <p className="text-xs font-semibold">Image Expired</p>
                              <p className="text-xs opacity-90">URL no longer valid</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Expiration Warning for Free Users */}
                        {!imageStatus.isExpired && imageStatus.shouldShowWarning && image.userType === "free" && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                            {imageStatus.timeLeft}
                          </div>
                        )}
                        
                        {!imageStatus.isExpired && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-xs text-white truncate">
                            {image.prompt}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent images
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Generate your first image
                  </p>
                </div>
              )}

              {stats?.recentImagesList && stats.recentImagesList.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push("/gallery")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    View all images →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => router.push("/chat")}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate Images</span>
              </button>

              <button
                onClick={() => router.push("/gallery")}
                className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span>View Gallery</span>
              </button>

              <button
                onClick={() => router.push("/gallery?filter=favorites")}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span>My Favorites</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
