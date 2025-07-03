"use client";

import { X, ImageIcon } from "lucide-react";
import { type Provider } from "@/lib/api";
import { PROVIDER_CONFIGS, getProviderModels } from "@/config/providers";

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProviders: Provider[];
  selectedModels: Record<string, string>;
  imageCount: Record<string, number>;
  onModelChange: (provider: string, model: string) => void;
  onImageCountChange: (provider: string, count: number) => void;
}

export function ModelSelectorModal({
  isOpen,
  onClose,
  selectedProviders,
  selectedModels,
  imageCount,
  onModelChange,
  onImageCountChange,
}: ModelSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configure AI Models
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {selectedProviders.map((provider) => {
            const config = PROVIDER_CONFIGS[provider];
            const models = getProviderModels(provider);
            const selectedModel = models.find(
              (m) => m.id === selectedModels[provider]
            );

            if (!config || models.length === 0) return null;

            return (
              <div key={provider} className="mb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {config.displayName} Models
                </h4>
                <div className="space-y-2">
                  {models.map((model) => (
                    <label
                      key={model.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        selectedModels[provider] === model.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${provider}-model`}
                        value={model.id}
                        checked={selectedModels[provider] === model.id}
                        onChange={(e) =>
                          onModelChange(provider, e.target.value)
                        }
                        className="mt-1 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {model.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {model.description}
                        </div>
                        {model.id.includes("preview") && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                            Preview
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Image Count Controls */}
                {selectedModel?.supportsImageCount && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {provider === "google"
                        ? "Sample Count"
                        : "Number of Images"}
                      :{" "}
                      {imageCount[provider] || selectedModel.defaultImages || 1}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={selectedModel.maxImages || 1}
                      value={
                        imageCount[provider] || selectedModel.defaultImages || 1
                      }
                      onChange={(e) =>
                        onImageCountChange(provider, parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>1</span>
                      <span>{selectedModel.maxImages || 1}</span>
                    </div>
                    {selectedModel.maxImages === 1 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        This model only supports generating 1 image at a time
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Info Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Model Information
            </h5>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              • <strong>GPT Image 1:</strong> OpenAI&apos;s latest image
              generation model (up to 10 images)
              <br />• <strong>DALL-E 3:</strong> Highest quality, single image
              generation
              <br />• <strong>DALL-E 2:</strong> Faster generation, supports
              multiple images
              <br />• <strong>Imagen 4.0:</strong> Google&apos;s latest with
              configurable sample count
              <br />• <strong>Preview models:</strong> Latest features, may have
              limitations
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
