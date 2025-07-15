'use client';

import { X, ImageIcon } from 'lucide-react';
import { type Provider } from '@/lib/api';
import { PROVIDER_CONFIGS, getProviderModels } from '@/config/providers';
import { useState } from 'react';
import * as RadixSelect from '@radix-ui/react-select';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProviders: Provider[];
  selectedModels: Record<string, string>;
  imageCount: Record<string, number>;
  onModelChange: (provider: string, model: string) => void;
  onImageCountChange: (provider: string, count: number) => void;
  modelOptions?: Record<string, { quality?: string; moderation?: string; style?: string }>;
  onModelOptionsChange?: (
    provider: string,
    options: { quality?: string; moderation?: string; style?: string },
  ) => void;
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
  const [localModelOptions, setLocalModelOptions] = useState<
    Record<string, { quality?: string; moderation?: string; style?: string }>
  >({});

  const getOptions = (provider: string) =>
    modelOptions[provider] || localModelOptions[provider] || {};

  const setOptions = (
    provider: string,
    opts: { quality?: string; moderation?: string; style?: string },
  ) => {
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
          {selectedProviders.map((provider) => {
            const config = PROVIDER_CONFIGS[provider];
            const models = getProviderModels(provider);
            const selectedModel = models.find((m) => m.id === selectedModels[provider]);

            if (!config || models.length === 0) return null;

            return (
              <div key={provider} className="mb-6">
                <h4 className="text-md mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <ImageIcon className="h-4 w-4" />
                  {config.displayName} Models
                </h4>
                <div className="space-y-2">
                  {models.map((model) => {
                    const isSelected = selectedModels[provider] === model.id;
                    const options = getOptions(provider);
                    return (
                      <div key={model.id}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${provider}-model`}
                            value={model.id}
                            checked={isSelected}
                            onChange={(e) => onModelChange(provider, e.target.value)}
                            className="mt-1 border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {model.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {model.description}
                            </div>
                            {model.id.includes('preview') && (
                              <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                Preview
                              </span>
                            )}
                          </div>
                        </label>
                        {/* Model Options UI for selected model */}
                        {isSelected && (
                          <div className="mt-2 flex flex-wrap gap-4">
                            {/* Quality Option */}
                            {model.id === 'gpt-image-1' && (
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Quality
                                </label>
                                <RadixSelect.Root
                                  value={options.quality || 'auto'}
                                  onValueChange={(val) =>
                                    setOptions(provider, { ...options, quality: val })
                                  }
                                >
                                  <RadixSelect.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                    <RadixSelect.Value>
                                      {options.quality || 'Auto'}
                                    </RadixSelect.Value>
                                    <RadixSelect.Icon />
                                  </RadixSelect.Trigger>
                                  <RadixSelect.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <RadixSelect.Item
                                      value="auto"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Auto
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="low"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Low
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="medium"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Medium
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="high"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      High
                                    </RadixSelect.Item>
                                  </RadixSelect.Content>
                                </RadixSelect.Root>
                              </div>
                            )}
                            {model.id === 'dall-e-3' && (
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Quality
                                </label>
                                <RadixSelect.Root
                                  value={options.quality || 'auto'}
                                  onValueChange={(val) =>
                                    setOptions(provider, { ...options, quality: val })
                                  }
                                >
                                  <RadixSelect.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                    <RadixSelect.Value>
                                      {options.quality || 'Auto'}
                                    </RadixSelect.Value>
                                    <RadixSelect.Icon />
                                  </RadixSelect.Trigger>
                                  <RadixSelect.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <RadixSelect.Item
                                      value="auto"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Auto
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="standard"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Standard
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="hd"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      HD
                                    </RadixSelect.Item>
                                  </RadixSelect.Content>
                                </RadixSelect.Root>
                              </div>
                            )}
                            {model.id === 'dall-e-2' && (
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Quality
                                </label>
                                <RadixSelect.Root
                                  value={options.quality || 'standard'}
                                  onValueChange={(val) =>
                                    setOptions(provider, { ...options, quality: val })
                                  }
                                >
                                  <RadixSelect.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                    <RadixSelect.Value>
                                      {options.quality || 'Auto'}
                                    </RadixSelect.Value>
                                    <RadixSelect.Icon />
                                  </RadixSelect.Trigger>
                                  <RadixSelect.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <RadixSelect.Item
                                      value="standard"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Standard
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="auto"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Auto
                                    </RadixSelect.Item>
                                  </RadixSelect.Content>
                                </RadixSelect.Root>
                              </div>
                            )}
                            {/* Moderation Option (gpt-image-1 only) */}
                            {model.id === 'gpt-image-1' && (
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Moderation
                                </label>
                                <RadixSelect.Root
                                  value={options.moderation || 'auto'}
                                  onValueChange={(val) =>
                                    setOptions(provider, { ...options, moderation: val })
                                  }
                                >
                                  <RadixSelect.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                    <RadixSelect.Value>
                                      {options.moderation || 'Auto'}
                                    </RadixSelect.Value>
                                    <RadixSelect.Icon />
                                  </RadixSelect.Trigger>
                                  <RadixSelect.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <RadixSelect.Item
                                      value="auto"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Auto
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="low"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Low
                                    </RadixSelect.Item>
                                  </RadixSelect.Content>
                                </RadixSelect.Root>
                              </div>
                            )}
                            {/* Style Option (dall-e-3 only) */}
                            {model.id === 'dall-e-3' && (
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Style
                                </label>
                                <RadixSelect.Root
                                  value={options.style || 'vivid'}
                                  onValueChange={(val) =>
                                    setOptions(provider, { ...options, style: val })
                                  }
                                >
                                  <RadixSelect.Trigger className="inline-flex w-32 items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                    <RadixSelect.Value>
                                      {options.style || 'Vivid'}
                                    </RadixSelect.Value>
                                    <RadixSelect.Icon />
                                  </RadixSelect.Trigger>
                                  <RadixSelect.Content className="z-50 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <RadixSelect.Item
                                      value="vivid"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Vivid
                                    </RadixSelect.Item>
                                    <RadixSelect.Item
                                      value="natural"
                                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                      Natural
                                    </RadixSelect.Item>
                                  </RadixSelect.Content>
                                </RadixSelect.Root>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Image Count Controls */}
                {selectedModel?.supportsImageCount && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/30">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {provider === 'google' ? 'Sample Count' : 'Number of Images'}:{' '}
                      {imageCount[provider] || selectedModel.defaultImages || 1}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={selectedModel.maxImages || 1}
                      value={imageCount[provider] || selectedModel.defaultImages || 1}
                      onChange={(e) => onImageCountChange(provider, parseInt(e.target.value))}
                      className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-600"
                    />
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>1</span>
                      <span>{selectedModel.maxImages || 1}</span>
                    </div>
                    {selectedModel.maxImages === 1 && (
                      <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                        This model only supports generating 1 image at a time
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Info Section */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <h5 className="mb-1 font-medium text-blue-900 dark:text-blue-100">Model Information</h5>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              • <strong>GPT Image 1:</strong> OpenAI&apos;s latest image generation model (up to 10
              images)
              <br />• <strong>DALL-E 3:</strong> Highest quality, single image generation
              <br />• <strong>DALL-E 2:</strong> Faster generation, supports multiple images
              <br />• <strong>Imagen 4.0:</strong> Google&apos;s latest with configurable sample
              count
              <br />• <strong>Preview models:</strong> Latest features, may have limitations
            </p>
          </div>
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
