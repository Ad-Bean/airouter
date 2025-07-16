'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { FreeUserNotification } from '@/components/FreeUserNotification';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { getImageStatus } from '@/lib/image-utils';
import Image from 'next/image';
import { ImageIcon, Heart, TrendingUp, BarChart3, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';
import { PROVIDER_CONFIGS } from '@/config/providers';

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
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    fetchStats();
  }, [session, status, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch stats:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleShowLogin = () => {
    router.push('/?showLogin=true');
  };

  const handleShowRegister = () => {
    router.push('/?showRegister=true');
  };

  if (status === 'loading' || loading) {
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
    <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-gray-900">
      <div>
        <Navigation
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onShowLogin={handleShowLogin}
          onShowRegister={handleShowRegister}
        />

        {/* Free User Notification */}
        <FreeUserNotification />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {session.user?.name || session.user?.email}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here&apos;s an overview of your AI image generation activity.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Images */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Images
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalImages || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                  <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Favorite Images */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorites</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.favoriteImages || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/20">
                  <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.recentImages || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {(session?.user as { userType?: string })?.userType === 'paid'
                      ? 'Paid Plan'
                      : 'Free Plan'}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Provider Stats & Recent Images */}
          <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Provider Stats */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Images by Provider
                </h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>

              {stats?.providerStats && Object.keys(stats.providerStats).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.providerStats).map(([provider, count]) => {
                    const config = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS];
                    return (
                      <div key={provider} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              config ? config.badgeColor : 'bg-gray-500'
                            }`}
                          ></div>
                          <span className="text-sm font-medium text-gray-700 capitalize dark:text-gray-300">
                            {config ? config.shortDescription : provider}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <ImageIcon className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">No images yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Start generating to see stats
                  </p>
                </div>
              )}
            </div>

            {/* Recent Images */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Images
                </h3>
                <Eye className="h-5 w-5 text-gray-400" />
              </div>

              {stats?.recentImagesList && stats.recentImagesList.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stats.recentImagesList.map((image) => {
                    const imageStatus = getImageStatus(image.autoDeleteAt, image.userType);

                    return (
                      <div
                        key={image.id}
                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-all hover:ring-2 hover:ring-blue-500 dark:bg-gray-700"
                        onClick={() => {
                          if (!imageStatus.isExpired) {
                            router.push('/gallery');
                          }
                        }}
                      >
                        {!imageStatus.isExpired ? (
                          <Image
                            src={getImageDisplayUrl(image)}
                            alt={image.prompt}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-600">
                            <div className="text-center">
                              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
                                <span className="text-xs font-bold text-white">!</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Expired</p>
                            </div>
                          </div>
                        )}

                        {/* Expiration Status Overlay */}
                        {imageStatus.isExpired && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                            <div className="text-center text-white">
                              <AlertCircle className="mx-auto mb-1 h-6 w-6" />
                              <p className="text-xs font-semibold">Image Expired</p>
                              <p className="text-xs opacity-90">URL no longer valid</p>
                            </div>
                          </div>
                        )}

                        {/* Expiration Warning for Free Users */}
                        {!imageStatus.isExpired &&
                          imageStatus.shouldShowWarning &&
                          image.userType === 'free' && (
                            <div className="absolute top-1 right-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white">
                              {imageStatus.timeLeft}
                            </div>
                          )}

                        {!imageStatus.isExpired && (
                          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                        )}

                        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="truncate text-xs text-white">{image.prompt}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <ImageIcon className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">No recent images</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Generate your first image
                  </p>
                </div>
              )}

              {stats?.recentImagesList && stats.recentImagesList.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push('/gallery')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View all images →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* API Key Management */}
          <div className="mb-8">
            <ApiKeyManager />
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => router.push('/chat')}
                className="flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Sparkles className="h-5 w-5" />
                <span>Generate Images</span>
              </button>

              <button
                onClick={() => router.push('/gallery')}
                className="flex items-center justify-center space-x-2 rounded-lg bg-gray-600 px-4 py-3 font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <ImageIcon className="h-5 w-5" />
                <span>View Gallery</span>
              </button>

              <button
                onClick={() => router.push('/gallery?filter=favorites')}
                className="flex items-center justify-center space-x-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
              >
                <Heart className="h-5 w-5" />
                <span>My Favorites</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
