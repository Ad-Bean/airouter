'use client';

import { X } from 'lucide-react';
import { type Provider } from '@/lib/api';
import { useState } from 'react';
import { ProviderSection } from './ProviderSection';
import { ModelInfoSection } from './ModelInfoSection';
import { type ModelOptions } from '@/types/model';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProviders: Provider[];
  selectedModels: Record<string, string>;
  imageCount: Record<string, number>;
  onModelChange: (provider: string, model: string) => void;
  onImageCountChange: (provider: string, count: number) => void;
  modelOptions?: Record<string, ModelOptions>;
  onModelOptionsChange?: (provider: string, options: ModelOptions) => void;
}

export function ModelSelectorModal({
  isOpen,
  onClose,
  selectedProviders,
  selectedModels,
  imageCount,
  onModelChange,
  onImageCountChange,
  modelOptions = {},
  onModelOptionsChange,
}: ModelSelectorModalProps) {
  // Local state for model options if not controlled
  const [localModelOptions, setLocalModelOptions] = useState<Record<string, ModelOptions>>({});

  const getOptions = (provider: string) =>
    modelOptions[provider] || localModelOptions[provider] || {};

  const setOptions = (provider: string, opts: ModelOptions) => {
    if (onModelOptionsChange) {
      onModelOptionsChange(provider, opts);
    } else {
      setLocalModelOptions((prev) => ({ ...prev, [provider]: { ...prev[provider], ...opts } }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configure AI Models
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {selectedProviders.map((provider) => (
            <ProviderSection
              key={provider}
              provider={provider}
              selectedModel={selectedModels[provider]}
              imageCount={imageCount[provider] || 1}
              options={getOptions(provider)}
              onModelChange={(modelId) => onModelChange(provider, modelId)}
              onImageCountChange={(count) => onImageCountChange(provider, count)}
              onOptionsChange={(opts) => setOptions(provider, opts)}
            />
          ))}

          <ModelInfoSection />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
