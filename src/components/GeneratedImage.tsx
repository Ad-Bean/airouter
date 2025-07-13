'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface GeneratedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
}

export function GeneratedImage({
  src,
  alt,
  width = 200,
  height = 200,
  className = '',
  onClick,
  onError,
}: GeneratedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setImageError(false);
    setRetryCount(0);
  }, [src]);

  const imageUrl = (() => {
    if (!src) return '';
    if (src.startsWith('data:')) return src; // Handle base64 data URLs
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/api/')) return src;
    if (src.startsWith('/')) return src;
    return `/api/images/${src}`;
  })();

  // Check if this is an API route or base64 data URL that should be unoptimized
  const isApiRoute = imageUrl.startsWith('/api/');
  const isDataUrl = imageUrl.startsWith('data:');

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const handleLoad = () => {
    setImageError(false);
  };

  const handleRetry = () => {
    if (retryCount < 2) {
      setImageError(false);
      setRetryCount((prev) => prev + 1);
    }
  };

  if (imageError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
        onClick={onClick}
      >
        <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400">
          <div className="mb-1">⚠️</div>
          <div>Image Error</div>
          {retryCount < 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="mt-2 rounded bg-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Image
        key={`${imageUrl}-${retryCount}`}
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        unoptimized={isApiRoute || isDataUrl} // Disable optimization for API routes and base64 data URLs
        className={className}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        priority={false} // Don't prioritize these images
      />
    </div>
  );
}
