export interface ModelOptions {
  quality?: string;
  moderation?: string;
  style?: string;
  safetySetting?: string;
  personGeneration?: string;
  addWatermark?: boolean;
  enhancePrompt?: boolean;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  supportsImageCount?: boolean;
  maxImages?: number;
  defaultImages?: number;
}