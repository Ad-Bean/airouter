export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  status?: 'generating' | 'completed' | 'failed' | 'partial'; // Only for assistant messages
  imageUrls?: string[];
  metadata?: {
    providers?: string[];
    models?: Record<string, string>;
    imageCount?: Record<string, number>;
    prompt?: string;
    imageProviderMap?: Record<string, string>;
    providerErrors?: Record<string, string>;
    error?: string;
    autoDeleteAt?: string; // ISO date string for when images expire
    userType?: 'free' | 'paid';
    isEdit?: boolean; // Whether this is an image edit operation
    originalImageUrl?: string; // URL of the original image being edited
  };
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}
