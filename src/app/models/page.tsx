"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { PROVIDER_CONFIGS } from "@/config/providers";
import { CREDIT_PACKAGES, GENERATION_COSTS } from "@/config/credits";
import {
  Wand2,
  Sparkles,
  Paintbrush,
  ImageIcon,
  ExternalLink,
  DollarSign,
  Crown,
  Check,
  Star,
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
  const [activeTab, setActiveTab] = useState<"models" | "pricing">("models");

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

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const formatCost = (costInCents: number) => {
    return `$${(costInCents / 100).toFixed(3)}`;
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Models & Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore our cutting-edge AI models and transparent pricing structure.
            Choose the perfect model for your creative needs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 inline-flex">
            <button
              onClick={() => setActiveTab("models")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "models"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Wand2 className="w-5 h-5 inline mr-2" />
              AI Models
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "pricing"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <DollarSign className="w-5 h-5 inline mr-2" />
              Pricing
            </button>
          </div>
        </div>

        {/* Models Tab */}
        {activeTab === "models" && (
          <div className="space-y-8">
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
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
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                    {model.id}
                                  </span>
                                  {model.id.includes("preview") && (
                                    <span className="inline-block px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                                      Preview
                                    </span>
                                  )}
                                  {model.supportsImageCount && (
                                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                      Up to {model.maxImages} images
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

            {/* Model Comparison */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mt-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Model Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Provider
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Model
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Cost per Image
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Max Images
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Best For
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(PROVIDER_CONFIGS).flatMap((provider) =>
                      provider.models.map((model) => (
                        <tr
                          key={`${provider.name}-${model.id}`}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {provider.displayName}
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {model.name}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {(() => {
                              if (provider.name === "openai") {
                                const openaiCosts = GENERATION_COSTS.openai[model.id as keyof typeof GENERATION_COSTS.openai];
                                if (openaiCosts) {
                                  if (typeof openaiCosts === "object") {
                                    return formatCost(Math.min(...Object.values(openaiCosts)));
                                  } else {
                                    return formatCost(openaiCosts);
                                  }
                                }
                              } else if (provider.name === "google") {
                                const googleCosts = GENERATION_COSTS.google[model.id as keyof typeof GENERATION_COSTS.google];
                                if (googleCosts) {
                                  return formatCost(googleCosts);
                                }
                              }
                              return "Contact us";
                            })()}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {model.maxImages || "1"}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {model.id.includes("dall-e-3") && "High quality art"}
                            {model.id.includes("dall-e-2") && "Fast generation"}
                            {model.id.includes("gpt-image") && "Token efficiency"}
                            {model.id.includes("imagen-4-ultra") && "Premium quality"}
                            {model.id.includes("imagen-4-preview") && "Latest features"}
                            {model.id.includes("imagen-4-standard") && "Balanced quality"}
                            {model.id.includes("imagen-3") && "Reliable results"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="space-y-12">
            {/* Credit Packages */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Credit Packages
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 p-6 hover:shadow-xl transition-all duration-300 ${
                      pkg.popular
                        ? "border-blue-500 scale-105"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          Most Popular
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {pkg.description}
                      </p>
                      
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(pkg.price)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {pkg.credits} credits
                          {pkg.bonus > 0 && (
                            <span className="text-green-600 dark:text-green-400 ml-1">
                              +{pkg.bonus} bonus
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                        {formatCost((pkg.price / (pkg.credits + pkg.bonus)) * 100)} per credit
                      </div>

                      <button
                        onClick={() => router.push("/billing")}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                          pkg.popular
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        Purchase
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Detailed Pricing
              </h2>
              
              <div className="space-y-8">
                {Object.entries(GENERATION_COSTS).map(([providerName, costs]) => {
                  const provider = PROVIDER_CONFIGS[providerName as keyof typeof PROVIDER_CONFIGS];
                  const IconComponent = iconMap[provider.iconName as keyof typeof iconMap];
                  
                  return (
                    <div key={providerName} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${provider.color} flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {provider.displayName}
                        </h3>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(costs).map(([modelId, cost]) => {
                          if (modelId === "default") return null;
                          
                          const model = provider.models.find(m => m.id === modelId);
                          if (!model) return null;
                          
                          return (
                            <div key={modelId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {model.name}
                              </h4>
                              <div className="space-y-1">
                                {typeof cost === "object" ? (
                                  Object.entries(cost).map(([size, price]) => (
                                    <div key={size} className="flex justify-between text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">{size}</span>
                                      <span className="text-gray-900 dark:text-white font-medium">
                                        {formatCost(price as number)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Per image</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                      {formatCost(cost)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                What You Get
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      No Subscription
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pay only for what you use with our credit system
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Multiple AI Models
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Access to OpenAI DALL-E and Google Imagen
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      High Resolution
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generate up to 1792x1024 images
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Batch Generation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create multiple images at once
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Cloud Storage
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Secure storage for your generated images
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      API Access
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Integrate with your applications
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documentation Links */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Learn More About Our AI Models
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/chat")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Start Creating
              </button>
              <button
                onClick={() => router.push("/billing")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Buy Credits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
