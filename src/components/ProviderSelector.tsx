import { Check, Wand2, Sparkles, Paintbrush, ImageIcon } from "lucide-react";
import { Provider } from "@/lib/api";

interface ProviderSelectorProps {
  selectedProviders: Provider[];
  onToggleProvider: (provider: Provider) => void;
}

const providerConfig = {
  openai: {
    name: "OpenAI DALL-E",
    icon: <Wand2 className="w-5 h-5" />,
    color: "from-pink-500 to-rose-600",
  },
  stability: {
    name: "Stability AI",
    icon: <Sparkles className="w-5 h-5" />,
    color: "from-teal-500 to-emerald-600",
  },
  replicate: {
    name: "Replicate (SDXL)",
    icon: <Paintbrush className="w-5 h-5" />,
    color: "from-violet-500 to-indigo-600",
  },
  google: {
    name: "Google Imagen",
    icon: <ImageIcon className="w-5 h-5" />,
    color: "from-red-500 to-orange-600",
  },
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
        {(["openai", "stability", "replicate", "google"] as Provider[]).map(
          (provider) => {
            const config = providerConfig[provider];
            const isSelected = selectedProviders.includes(provider);

            return (
              <label
                key={provider}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleProvider(provider)}
                  className="sr-only"
                />
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white flex-shrink-0`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">
                    {config.name}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
              </label>
            );
          }
        )}
      </div>
    </div>
  );
}
