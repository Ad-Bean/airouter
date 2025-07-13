export interface DashboardStats {
  totalImages: number;
  favoriteImages: number;
  recentImages: number;
  providerStats: Record<string, number>;
  recentImagesList: Array<{
    id: string;
    prompt: string;
    provider: string;
    createdAt: string;
    // S3 storage fields
    s3Url: string | null;
    s3Key: string | null;
    s3Bucket: string | null;
    // Legacy storage fields
    imageUrl: string | null;
    imagePath: string | null;
    // Expiration fields
    autoDeleteAt: string | null;
    userType: string | null;
  }>;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  // S3 storage fields
  s3Url: string | null;
  s3Key: string | null;
  s3Bucket: string | null;
  // Legacy storage fields
  imageUrl: string | null;
  imagePath: string | null;
  imageData: string | null;
  // Metadata
  mimeType: string | null;
  filename: string | null;
  provider: string;
  model: string | null;
  width: number;
  height: number;
  steps: number | null;
  isFavorite: boolean;
  isPublic: boolean;
  createdAt: string;
  // Expiration fields
  autoDeleteAt: string | null;
  userType: string | null;
}
