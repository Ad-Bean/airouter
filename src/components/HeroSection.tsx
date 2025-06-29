import { motion } from "framer-motion";
import { Provider } from "@/lib/api";
import { ImageGenerationForm } from "./ImageGenerationForm";
import { GeneratedImagesDisplay } from "./GeneratedImagesDisplay";
import { StatsSection } from "./StatsSection";

interface HeroSectionProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  selectedProviders: Provider[];
  onToggleProvider: (provider: Provider) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  error: string | null;
  generatedImages: string[];
  session: any;
  isAuthenticated: boolean;
}

export function HeroSection({
  prompt,
  onPromptChange,
  selectedProviders,
  onToggleProvider,
  isGenerating,
  onGenerate,
  error,
  generatedImages,
  session,
  isAuthenticated,
}: HeroSectionProps) {
  return (
    <main className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">
              The Multimodal
            </span>
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              AI Interface
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Route your AI requests across multiple vision models with
            intelligent load balancing, competitive pricing, and zero-downtime
            infrastructure.
          </p>

          {/* Image Generation Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12 max-w-4xl mx-auto"
          >
            <ImageGenerationForm
              prompt={prompt}
              onPromptChange={onPromptChange}
              selectedProviders={selectedProviders}
              onToggleProvider={onToggleProvider}
              isGenerating={isGenerating}
              onGenerate={onGenerate}
              error={error}
              isAuthenticated={isAuthenticated}
            />

            <GeneratedImagesDisplay
              images={generatedImages}
              isGenerating={isGenerating}
              selectedProviders={selectedProviders}
            />
          </motion.div>

          <StatsSection
            stats={[
              { value: "15+", label: "Vision Models" },
              { value: "99.9%", label: "Uptime" },
              { value: "50ms", label: "Avg Latency" },
              { value: "10k+", label: "Developers" },
            ]}
          />
        </motion.div>
      </div>
    </main>
  );
}
