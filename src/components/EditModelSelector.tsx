'use client';

import { useState } from 'react';
import { type Provider } from '@/lib/api';
import { PROVIDER_CONFIGS } from '@/config/providers';
import { Bot, ChevronDown, Check, Wand2, ImageIcon } from 'lucide-react';

interface EditModelSelectorProps {
  selectedProvider: Provider;
  selectedModel: string;
  onProviderChange: (provider: Provider) => void;
  onModelChange: (model: string) => void;
  isGenerating: boolean;
}

export function EditModelSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  isGenerating,
}: EditModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get all providers that support image editing and are enabled
  const editingProviders = Object.entries(PROVIDER_CONFIGS)
    .filter(([, config]) => {
      return config.models.some((model) => model.supportsImageEditing);
    })
    .map(([provider]) => provider as Provider);

  // Get editing models for current provider
  const editingModels =
    PROVIDER_CONFIGS[selectedProvider]?.models.filter((model) => model.supportsImageEditing) || [];

  // Get current model info
  const currentModel = editingModels.find((model) => model.id === selectedModel);
  const currentProviderConfig = PROVIDER_CONFIGS[selectedProvider];

  const getProviderIcon = (provider: Provider) => {
    switch (provider) {
      case 'openai':
        return <Wand2 className="h-4 w-4" />;
      case 'google':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Current Selection Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500"
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r ${currentProviderConfig?.color || 'from-gray-500 to-gray-600'} text-white`}
          >
            {getProviderIcon(selectedProvider)}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">
              {currentProviderConfig?.displayName || selectedProvider}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentModel?.name || selectedModel}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-[99999] mt-1 w-full max-w-md min-w-80 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-48 overflow-y-auto p-2">
            {editingProviders.map((provider) => {
              const providerConfig = PROVIDER_CONFIGS[provider];
              const providerModels = providerConfig.models.filter(
                (model) => model.supportsImageEditing,
              );

              return (
                <div key={provider} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded bg-gradient-to-r ${providerConfig.color} text-white`}
                    >
                      {getProviderIcon(provider)}
                    </div>
                    {providerConfig.displayName}
                  </div>

                  {/* Models */}
                  <div className="space-y-1">
                    {providerModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          if (provider !== selectedProvider) {
                            onProviderChange(provider);
                          }
                          onModelChange(model.id);
                          setIsOpen(false);
                        }}
                        className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                          selectedProvider === provider && selectedModel === model.id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {model.description}
                            </div>
                          </div>
                          {selectedProvider === provider && selectedModel === model.id && (
                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Choose a model that supports image editing
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && <div className="fixed inset-0 z-[99998]" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
