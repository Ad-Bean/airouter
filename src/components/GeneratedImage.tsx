"use client";

import Image from "next/image";
import { useState } from "react";

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
  className = "", 
  onClick,
  onError 
}: GeneratedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine the actual image URL
  const imageUrl = src.startsWith("http") || src.startsWith("/api/") ? src : `/api/images/${src}`;
  
  // Check if this is an API route that should be unoptimized
  const isApiRoute = imageUrl.startsWith("/api/");
  
  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl ${className}`}
        style={{ width, height }}
        onClick={onClick}
      >
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 p-2">
          <div className="mb-1">⚠️</div>
          <div>Image Error</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl animate-pulse"
          style={{ width, height }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        unoptimized={isApiRoute} // Disable optimization for API routes
        className={className}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        style={{ 
          display: isLoading ? 'none' : 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        priority={false} // Don't prioritize these images
      />
    </div>
  );
}
