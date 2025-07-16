'use client';

import { ImageIcon } from 'lucide-react';
import { ModelCard } from './ModelCard';
import { type Provider } from '@/lib/api';
import { PROVIDER_CONFIGS, getProviderModels } from '@/config/providers';
import { type ModelOptions } from '@/types/model';

interface ProviderSectionProps {
  provider: Provider;
  selectedModel: string;
  imageCount: number;
  options: ModelOptions;
  onModelChange: (modelId: string) => void;
  onImageCountChange: (count: number) => void;
  onOptionsChange: (options: ModelOptions) => void;
}

export function ProviderSection({
  provider,
  selectedModel,
  imageCount,
  options,
  onModelChange,
  onImageCountChange,
  onOptionsChange,
}: ProviderSectionProps) {
  const config = PROVIDER_CONFIGS[provider];
  const models = getProviderModels(provider);

  if (!config || models.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-md mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
        <ImageIcon className="h-4 w-4" />
        {config.displayName} Models
      </h4>
      <div className="space-y-2">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            provider={provider}
            model={model}
            isSelected={selectedModel === model.id}
            options={options}
            imageCount={imageCount}
            onModelSelect={onModelChange}
            onOptionsChange={onOptionsChange}
            onImageCountChange={onImageCountChange}
          />
        ))}
      </div>
    </div>
  );
}
