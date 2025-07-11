export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
  status?: "generating" | "completed" | "failed"; // Only for assistant messages
  imageUrls?: string[];
  metadata?: {
    providers?: string[];
    models?: Record<string, string>;
    imageCount?: Record<string, number>;
    prompt?: string;
    imageProviderMap?: Record<string, string>;
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
