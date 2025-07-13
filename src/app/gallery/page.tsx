'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import Image from 'next/image';
import { Heart, Download, Trash2, Grid, List, Search, ImageIcon } from 'lucide-react';
import { GeneratedImage } from '@/types/dashboard';
import { AVAILABLE_PROVIDERS, PROVIDER_INFO } from '@/config/providers';

// Helper function to get the display URL for an image
// Always use the API endpoint to ensure proper access control and S3 proxying
function getImageDisplayUrl(image: GeneratedImage): string {
  return `/api/images/${image.id}`;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'favorites' | (typeof AVAILABLE_PROVIDERS)[number];

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filter !== 'all') {
        if (filter === 'favorites') {
          params.append('favorites', 'true');
        } else {
          params.append('provider', filter);
        }
      }

      const response = await fetch(`/api/images?${params}`);
      const data = await response.json();

      if (data.success) {
        setImages(data.images);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter]);

  useEffect(() => {
    if (session) {
      fetchImages();
    }
  }, [session, fetchImages]);

  const toggleFavorite = async (imageId: string, currentFavorite: boolean) => {
    try {
      const response = await fetch(`/api/images/${imageId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      });

      if (response.ok) {
        setImages((prev) =>
          prev.map((img) => (img.id === imageId ? { ...img, isFavorite: !currentFavorite } : img)),
        );
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch('/api/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });

      if (response.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prompt.slice(0, 50).replace(/[^a-z0-9]/gi, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const filteredImages = images.filter((image) =>
    image.prompt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
    <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-gray-900">
      <Navigation
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onShowLogin={() => router.push('/?showLogin=true')}
        onShowRegister={() => router.push('/?showRegister=true')}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            My Generated Images
          </h1>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search images by prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterOption)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Images</option>
                <option value="favorites">Favorites</option>
                {AVAILABLE_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {PROVIDER_INFO[provider].displayName}
                  </option>
                ))}
              </select>

              <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading images...</div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
            <ImageIcon className="mx-auto mb-6 h-20 w-20 text-gray-400" />
            <p className="mb-2 text-lg text-gray-500 dark:text-gray-400">
              {images.length === 0 ? 'No images generated yet' : 'No images match your search'}
            </p>
            <p className="mb-6 text-gray-400 dark:text-gray-500">
              {images.length === 0
                ? 'Start creating amazing images with AI!'
                : 'Try adjusting your search or filters'}
            </p>
            <button
              onClick={() => router.push('/chat')}
              className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
            >
              Generate Your First Image
            </button>
          </div>
        ) : (
          <>
            {/* Images Grid/List */}
            <div
              className={`mb-8 ${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'space-y-4'
              }`}
            >
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className={`overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800 ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  <div
                    className={`relative ${
                      viewMode === 'list' ? 'h-32 w-48 flex-shrink-0' : 'aspect-square'
                    }`}
                  >
                    <Image
                      src={getImageDisplayUrl(image)}
                      alt={image.prompt}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => toggleFavorite(image.id, image.isFavorite)}
                        className={`rounded-full p-1.5 backdrop-blur-sm ${
                          image.isFavorite
                            ? 'bg-red-500 text-white'
                            : 'bg-black/20 text-white hover:bg-black/40'
                        }`}
                      >
                        <Heart
                          className="h-3 w-3"
                          fill={image.isFavorite ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <p className="mb-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                      {image.prompt}
                    </p>
                    <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{image.provider}</span>
                      <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadImage(getImageDisplayUrl(image), image.prompt)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md bg-blue-500 px-2 py-1.5 text-xs text-white hover:bg-blue-600"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="rounded-md bg-red-500 px-2 py-1.5 text-xs text-white hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
