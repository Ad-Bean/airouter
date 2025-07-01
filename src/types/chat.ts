export interface ProviderResult {
  provider: string;
  model: string | null;
  images: string[];
  displayUrls?: string[];
  status: "pending" | "generating" | "completed" | "failed";
  error?: string;
  timestamp?: Date;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
  imageUrls?: string[];
  providerResults?: ProviderResult[];
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
