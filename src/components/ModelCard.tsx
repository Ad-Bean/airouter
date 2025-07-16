'use client';

import { ModelOptions } from './ModelOptions';
import { type ModelOptions as ModelOptionsType, type Model } from '@/types/model';

interface ModelCardProps {
  provider: string;
  model: Model;
  isSelected: boolean;
  options: ModelOptionsType;
  imageCount: number;
  onModelSelect: (modelId: string) => void;
  onOptionsChange: (options: ModelOptionsType) => void;
  onImageCountChange: (count: number) => void;
}

export function ModelCard({
  provider,
  model,
  isSelected,
  options,
  imageCount,
  onModelSelect,
  onOptionsChange,
  onImageCountChange,
}: ModelCardProps) {
  return (
    <div>
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
          onChange={(e) => onModelSelect(e.target.value)}
          className="mt-1 border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
        />
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{model.description}</div>
          {model.id.includes('preview') && (
            <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              Preview
            </span>
          )}
        </div>
      </label>

      {isSelected && (
        <>
          <ModelOptions
            provider={provider}
            modelId={model.id}
            options={options}
            onOptionsChange={onOptionsChange}
          />

          {model.supportsImageCount && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/30">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {provider === 'google' ? 'Sample Count' : 'Number of Images'}:{' '}
                {imageCount || model.defaultImages || 1}
              </label>
              <input
                type="range"
                min="1"
                max={model.maxImages || 1}
                value={imageCount || model.defaultImages || 1}
                onChange={(e) => onImageCountChange(parseInt(e.target.value))}
                className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-600"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>1</span>
                <span>{model.maxImages || 1}</span>
              </div>
              {model.maxImages === 1 && (
                <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                  This model only supports generating 1 image at a time
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
