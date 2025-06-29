"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Zap,
  Shield,
  Globe,
  Eye,
  Brain,
  ArrowRight,
  ChevronRight,
  Camera,
  Palette,
  Scan,
  Moon,
  Sun,
  Sparkles,
  Wand2,
  Paintbrush,
  Check,
} from "lucide-react";
import { generateImage, type Provider } from "@/lib/api";

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    "openai",
  ]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

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

  const toggleProvider = (provider: Provider) => {
    setSelectedProviders((prev) => {
      if (prev.includes(provider)) {
        // Don't allow removing the last provider
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== provider);
      } else {
        return [...prev, provider];
      }
    });
  };

  const getProviderDisplayName = (provider: Provider) => {
    switch (provider) {
      case "openai":
        return "OpenAI DALL-E";
      case "stability":
        return "Stability AI";
      case "replicate":
        return "Replicate (SDXL)";
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: Provider) => {
    switch (provider) {
      case "openai":
        return <Wand2 className="w-5 h-5" />;
      case "stability":
        return <Sparkles className="w-5 h-5" />;
      case "replicate":
        return <Paintbrush className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // Try providers in order until one succeeds
      let lastError = null;

      for (const provider of selectedProviders) {
        try {
          const result = await generateImage({
            prompt: prompt.trim(),
            provider,
            width: 1024,
            height: 1024,
            steps: 20,
          });

          if (result.success && result.images && result.images.length > 0) {
            setGeneratedImages(result.images);
            return; // Success, exit early
          }
        } catch (err) {
          lastError = err;
          console.warn(`Provider ${provider} failed:`, err);
          // Continue to next provider
        }
      }

      // If we get here, all providers failed
      const errorMessage =
        lastError instanceof Error
          ? lastError.message
          : "All selected providers failed";
      setError(errorMessage);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/30 dark:to-gray-900/30"></div>
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="relative z-50 px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                AIRouter
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#models"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Models
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Pricing
              </a>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  isDark ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                Sign In
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  isDark ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
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
                intelligent load balancing, competitive pricing, and
                zero-downtime infrastructure.
              </p>

              {/* Image Generation Demo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-12 max-w-4xl mx-auto"
              >
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
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want to generate..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />

                      {/* Provider Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          Select AI Providers:
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {(
                            ["openai", "stability", "replicate"] as Provider[]
                          ).map((provider) => (
                            <label
                              key={provider}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                selectedProviders.includes(provider)
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedProviders.includes(provider)}
                                onChange={() => toggleProvider(provider)}
                                className="sr-only"
                              />
                              <div
                                className={`w-6 h-6 rounded flex items-center justify-center ${
                                  selectedProviders.includes(provider)
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700"
                                }`}
                              >
                                {selectedProviders.includes(provider) ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  getProviderIcon(provider)
                                )}
                              </div>
                              <span className="text-sm font-medium">
                                {getProviderDisplayName(provider)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: isGenerating ? 1 : 1.05 }}
                      whileTap={{ scale: isGenerating ? 1 : 0.95 }}
                      onClick={handleGenerate}
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
                          Generate
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    {[
                      "A futuristic cityscape at sunset",
                      "A cute robot reading a book",
                      "Abstract geometric patterns",
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(suggestion)}
                        className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  {/* Loading State */}
                  {isGenerating && (
                    <div className="mt-8 flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Generating your image with{" "}
                        {selectedProviders
                          .map(getProviderDisplayName)
                          .join(", ")}
                        ...
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        This may take 10-30 seconds
                      </p>
                    </div>
                  )}

                  {/* Generated Images Display */}
                  {generatedImages.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Generated Images
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={imageUrl}
                              alt={`Generated image ${index + 1}`}
                              width={512}
                              height={512}
                              className="w-full h-auto rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                              unoptimized={true}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <button
                                onClick={() => window.open(imageUrl, "_blank")}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-2 bg-white bg-opacity-90 rounded-lg text-gray-900 font-medium hover:bg-opacity-100"
                              >
                                View Full Size
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              >
                {[
                  { value: "15+", label: "Vision Models" },
                  { value: "99.9%", label: "Uptime" },
                  { value: "50ms", label: "Avg Latency" },
                  { value: "10k+", label: "Developers" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </main>

        {/* Featured Models Section */}
        <section className="px-6 py-16 bg-slate-50/80 dark:bg-slate-800/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Featured AI Models
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Access the latest vision and image generation models through our
                unified API
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "DALL-E 3",
                  provider: "OpenAI",
                  type: "Generation",
                  latency: "8.2s",
                  growth: "+25%",
                  icon: <Wand2 className="w-6 h-6" />,
                  color: "from-pink-500 to-rose-600",
                },
                {
                  name: "Midjourney",
                  provider: "Midjourney",
                  type: "Generation",
                  latency: "12.1s",
                  growth: "+18%",
                  icon: <Paintbrush className="w-6 h-6" />,
                  color: "from-violet-500 to-indigo-600",
                },
                {
                  name: "Stable Diffusion",
                  provider: "Stability AI",
                  type: "Generation",
                  latency: "4.5s",
                  growth: "+32%",
                  icon: <Sparkles className="w-6 h-6" />,
                  color: "from-teal-500 to-emerald-600",
                },
                {
                  name: "GPT-4 Vision",
                  provider: "OpenAI",
                  type: "Analysis",
                  latency: "1.2s",
                  growth: "+15%",
                  icon: <Brain className="w-6 h-6" />,
                  color: "from-emerald-500 to-green-600",
                },
                {
                  name: "Claude Vision",
                  provider: "Anthropic",
                  type: "Analysis",
                  latency: "0.9s",
                  growth: "+22%",
                  icon: <Eye className="w-6 h-6" />,
                  color: "from-orange-500 to-red-600",
                },
                {
                  name: "Gemini Vision",
                  provider: "Google",
                  type: "Analysis",
                  latency: "0.7s",
                  growth: "+18%",
                  icon: <Scan className="w-6 h-6" />,
                  color: "from-blue-500 to-cyan-600",
                },
              ].map((model, index) => (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/80 dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-slate-200/50 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center text-white`}
                    >
                      {model.icon}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-slate-500 dark:text-slate-400 block">
                        {model.provider}
                      </span>
                      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                        {model.type}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {model.name}
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Avg Latency:</span>
                      <span className="font-medium">{model.latency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth:</span>
                      <span className="font-medium text-green-600">
                        {model.growth}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Why Choose AIRouter?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Built for developers who need reliable, fast, and cost-effective
                multimodal AI
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "Lightning Fast",
                  description:
                    "Optimized routing ensures your requests reach the fastest available model with minimal latency.",
                  color: "from-yellow-500 to-orange-500",
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "99.9% Uptime",
                  description:
                    "Automatic failover across multiple providers ensures your applications never go down.",
                  color: "from-green-500 to-emerald-500",
                },
                {
                  icon: <Camera className="w-8 h-8" />,
                  title: "Image First",
                  description:
                    "Purpose-built for vision tasks: OCR, object detection, image analysis, and generation.",
                  color: "from-teal-500 to-emerald-500",
                },
                {
                  icon: <Globe className="w-8 h-8" />,
                  title: "Global Edge",
                  description:
                    "Deployed across 50+ regions worldwide for the lowest possible latency to your users.",
                  color: "from-cyan-500 to-blue-500",
                },
                {
                  icon: <Palette className="w-8 h-8" />,
                  title: "Smart Routing",
                  description:
                    "AI-powered model selection based on your specific use case and performance requirements.",
                  color: "from-violet-500 to-purple-500",
                },
                {
                  icon: <Brain className="w-8 h-8" />,
                  title: "Cost Optimized",
                  description:
                    "Dynamic pricing and model selection to minimize costs while maintaining quality.",
                  color: "from-indigo-500 to-blue-500",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group p-6 rounded-xl border border-slate-200/50 dark:border-slate-700 hover:border-teal-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-16 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Build the Future?
              </h2>
              <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
                Join thousands of developers already using AIRouter to power
                their multimodal applications
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 text-lg font-semibold text-teal-600 bg-white rounded-xl hover:bg-teal-50 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 text-lg font-semibold text-white border-2 border-white/20 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  View Documentation
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">AIRouter</span>
                </div>
                <p className="text-slate-400">
                  The most reliable multimodal AI routing platform for
                  developers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Models
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      API
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Guides
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Status
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Support
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-slate-400">
                &copy; 2025 AIRouter. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 sm:mt-0">
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Security
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
