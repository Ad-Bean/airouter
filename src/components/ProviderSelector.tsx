import { Check, Wand2, Sparkles, Paintbrush, ImageIcon } from "lucide-react";
import { Provider } from "@/lib/api";
import { PROVIDER_CONFIGS } from "@/config/providers";

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

export function ProviderSelector({
  selectedProviders,
  onToggleProvider,
}: ProviderSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
        Select AI Providers:
      </label>
      <div className="flex flex-wrap gap-3">
        {Object.values(PROVIDER_CONFIGS).map((config) => {
          const isSelected = selectedProviders.includes(config.name);
          const IconComponent =
            iconMap[config.iconName as keyof typeof iconMap];

          return (
            <label
              key={config.name}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleProvider(config.name)}
                className="sr-only"
              />
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white flex-shrink-0 border border-white/30 dark:border-gray-700 shadow-sm dark:shadow-none`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block text-gray-900 dark:text-gray-100">
                  {config.displayName}
                </span>
              </div>
              {isSelected && (
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
