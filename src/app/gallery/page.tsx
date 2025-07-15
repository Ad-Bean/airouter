'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import Image from 'next/image';
import Zoom from 'react-medium-image-zoom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import 'react-medium-image-zoom/dist/styles.css';
import { Download, Trash2, Heart, Search, ImageIcon } from 'lucide-react';
import { GeneratedImage } from '@/types/dashboard';
import { AVAILABLE_PROVIDERS, PROVIDER_INFO } from '@/config/providers';

function getImageDisplayUrl(image: GeneratedImage): string {
  return `/api/images/${image.id}`;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type FilterOption = 'all' | 'favorites' | (typeof AVAILABLE_PROVIDERS)[number];

export default function GalleryPage() {
  const [selectOpen, setSelectOpen] = useState(false);
  // Use isFavorite from image data, no need for local favoriteIds
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gallery</h1>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="Search images by prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-full sm:w-64">
              <Select>
                <SelectTrigger
                  onClick={() => setSelectOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={selectOpen}
                >
                  {(() => {
                    if (filter === 'all') return 'All Images';
                    if (filter === 'favorites') return 'Favorites';
                    return PROVIDER_INFO[filter]?.displayName || filter;
                  })()}
                </SelectTrigger>
                {selectOpen && (
                  <SelectContent>
                    <SelectItem
                      onSelect={() => {
                        setFilter('all');
                        setSelectOpen(false);
                      }}
                      selected={filter === 'all'}
                    >
                      All Images
                    </SelectItem>
                    <SelectItem
                      onSelect={() => {
                        setFilter('favorites');
                        setSelectOpen(false);
                      }}
                      selected={filter === 'favorites'}
                    >
                      Favorites
                    </SelectItem>
                    {AVAILABLE_PROVIDERS.map((provider) => (
                      <SelectItem
                        key={provider}
                        onSelect={() => {
                          setFilter(provider as FilterOption);
                          setSelectOpen(false);
                        }}
                        selected={filter === provider}
                      >
                        {PROVIDER_INFO[provider].displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                )}
              </Select>
              {selectOpen && (
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setSelectOpen(false)}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
              <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          )}
          {!loading && filteredImages.length === 0 ? (
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
              <div className="mb-8 grid grid-cols-1 gap-6 bg-gray-50 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 dark:bg-gray-900">
                {filteredImages.map((image) => (
                  <Card
                    key={image.id}
                    className="bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg dark:bg-gray-800"
                  >
                    <CardHeader className="relative aspect-square bg-gray-100 p-0 dark:bg-gray-900">
                      <Tooltip content={image.prompt} side="top">
                        <Zoom>
                          <Image
                            src={getImageDisplayUrl(image)}
                            alt={image.prompt}
                            fill={true}
                            className="cursor-zoom-in object-cover"
                          />
                        </Zoom>
                      </Tooltip>
                      <Button
                        variant={image.isFavorite ? 'default' : 'ghost'}
                        size="icon"
                        aria-label={image.isFavorite ? 'Unfavorite' : 'Favorite'}
                        className={
                          'absolute top-2 right-2 z-10 rounded-full shadow-md ' +
                          (image.isFavorite
                            ? 'bg-white text-red-500 dark:bg-gray-900'
                            : 'bg-white/80 text-gray-400 hover:text-red-500 dark:bg-gray-900/80')
                        }
                        onClick={async () => {
                          try {
                            await fetch(`/api/images/${image.id}/favorite`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isFavorite: !image.isFavorite }),
                            });
                            // Refetch images to update UI
                            fetchImages();
                          } catch (err) {
                            console.error('Failed to update favorite:', err);
                          }
                        }}
                      >
                        <Heart
                          fill={image.isFavorite ? 'currentColor' : 'none'}
                          className="h-5 w-5"
                        />
                      </Button>
                    </CardHeader>
                    <CardContent className="bg-white dark:bg-gray-800">
                      <p className="mb-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                        {image.prompt}
                      </p>
                      <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{image.provider}</span>
                        <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex flex-1 cursor-pointer items-center gap-1"
                          onClick={() => downloadImage(getImageDisplayUrl(image), image.prompt)}
                          aria-label="Download image"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteImage(image.id)}
                          className="flex cursor-pointer items-center gap-1"
                          aria-label="Delete image"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
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
    </div>
  );
}
