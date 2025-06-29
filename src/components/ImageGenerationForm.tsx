import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Provider } from "@/lib/api";
import { ProviderSelector } from "./ProviderSelector";

interface ImageGenerationFormProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  selectedProviders: Provider[];
  onToggleProvider: (provider: Provider) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  error: string | null;
  isAuthenticated: boolean;
}

export function ImageGenerationForm({
  prompt,
  onPromptChange,
  selectedProviders,
  onToggleProvider,
  isGenerating,
  onGenerate,
  error,
  isAuthenticated,
}: ImageGenerationFormProps) {
  const suggestions = [
    "A futuristic cityscape at sunset",
    "A cute robot reading a book",
    "Abstract geometric patterns",
  ];

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Generate Images with AI
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Try our multimodal AI routing for image generation
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />

          <ProviderSelector
            selectedProviders={selectedProviders}
            onToggleProvider={onToggleProvider}
          />
        </div>
        <motion.button
          whileHover={{ scale: isGenerating ? 1 : 1.05 }}
          whileTap={{ scale: isGenerating ? 1 : 0.95 }}
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {isAuthenticated ? "Generate" : "Sign In to Generate"}
            </>
          )}
        </motion.button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            Error: {error}
          </p>
        </div>
      )}

      {/* Authentication Notice */}
      {!isAuthenticated && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium text-center">
            Sign in to start generating amazing AI images with multiple providers
          </p>
        </div>
      )}

      {/* Suggestion Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onPromptChange(suggestion)}
            className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 border border-gray-200 dark:border-gray-600"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
