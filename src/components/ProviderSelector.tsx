import { Check, Wand2, Sparkles, Paintbrush, ImageIcon } from 'lucide-react';
import { Provider } from '@/lib/api';
import { PROVIDER_CONFIGS } from '@/config/providers';

interface ProviderSelectorProps {
  selectedProviders: Provider[];
  onToggleProvider: (provider: Provider) => void;
}

// Icon mapping
const iconMap = {
  Wand2: Wand2,
  Sparkles: Sparkles,
  Paintbrush: Paintbrush,
  ImageIcon: ImageIcon,
} as const;

export function ProviderSelector({ selectedProviders, onToggleProvider }: ProviderSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select AI Providers:
      </label>
      <div className="flex flex-wrap gap-3">
        {Object.values(PROVIDER_CONFIGS).map((config) => {
          const isSelected = selectedProviders.includes(config.name);
          const IconComponent = iconMap[config.iconName as keyof typeof iconMap];

          return (
            <label
              key={config.name}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all hover:scale-105 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleProvider(config.name)}
                className="sr-only"
              />
              <div
                className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.color} flex flex-shrink-0 items-center justify-center border border-white/30 text-white shadow-sm dark:border-gray-700 dark:shadow-none`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {config.displayName}
                </span>
              </div>
              {isSelected && <Check className="h-5 w-5 flex-shrink-0 text-blue-600" />}
            </label>
          );
        })}
      </div>
    </div>
  );
}
