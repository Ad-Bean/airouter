"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { PROVIDER_CONFIGS } from "@/config/providers";
import {
  Wand2,
  Sparkles,
  Paintbrush,
  ImageIcon,
  ExternalLink,
} from "lucide-react";

const iconMap = {
  Wand2: Wand2,
  Sparkles: Sparkles,
  Paintbrush: Paintbrush,
  ImageIcon: ImageIcon,
} as const;

export default function ModelsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldUseDark =
      savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleShowLogin = () => {
    router.push("/?showLogin=true");
  };

  const handleShowRegister = () => {
    router.push("/?showRegister=true");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onShowLogin={handleShowLogin}
        onShowRegister={handleShowRegister}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Image Generation Models
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore the cutting-edge AI models available for image generation.
            Each model offers unique capabilities and specializations.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {Object.values(PROVIDER_CONFIGS).map((provider) => {
            const IconComponent =
              iconMap[provider.iconName as keyof typeof iconMap];

            return (
              <div
                key={provider.name}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Provider Header */}
                <div
                  className={`bg-gradient-to-r ${provider.color} p-6 text-white`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {provider.displayName}
                      </h3>
                      <p className="text-white/80">
                        {provider.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Models List */}
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Available Models
                  </h4>
                  <div className="space-y-3">
                    {provider.models.map((model) => (
                      <div
                        key={model.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {model.name}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {model.description}
                            </p>
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                {model.id}
                              </span>
                              {model.id.includes("preview") && (
                                <span className="inline-block ml-2 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                                  Preview
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="mt-6 flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        provider.enabled ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.enabled ? "Available" : "Not configured"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Documentation Links */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Learn More About Our AI Models
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="https://openai.com/dall-e-3"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors group"
            >
              <Wand2 className="w-6 h-6 text-pink-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-pink-600">
                  DALL-E Documentation
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  OpenAI&apos;s official docs
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-pink-600" />
            </a>

            <a
              href="https://stability.ai/stable-diffusion"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors group"
            >
              <Sparkles className="w-6 h-6 text-teal-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-teal-600">
                  Stable Diffusion
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Stability AI docs
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
            </a>

            <a
              href="https://replicate.com/stability-ai/sdxl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors group"
            >
              <Paintbrush className="w-6 h-6 text-violet-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-violet-600">
                  Replicate Models
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  SDXL on Replicate
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-violet-600" />
            </a>

            <a
              href="https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors group"
            >
              <ImageIcon className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-red-600">
                  Google Imagen
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Vertex AI docs
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
            </a>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Create?</h3>
            <p className="text-lg mb-6 opacity-90">
              Start generating images with these powerful AI models
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Creating
              <Wand2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
