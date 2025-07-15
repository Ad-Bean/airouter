'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { AuthModal } from '@/components/AuthModal';
import { PROVIDER_CONFIGS } from '@/config/providers';
import { CREDIT_PACKAGES, GENERATION_COSTS } from '@/config/credits';
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
} from 'lucide-react';

const iconMap = {
  Wand2: Wand2,
  Sparkles: Sparkles,
  Paintbrush: Paintbrush,
  ImageIcon: ImageIcon,
} as const;

export default function ModelsPage() {
  // All logic and hooks inside function body
  const { data: session } = useSession();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'models' | 'pricing'>('models');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [pendingRedirect, setPendingRedirect] = useState<'chat' | 'billing' | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);

    if (window.location.hash === '#pricing') {
      setActiveTab('pricing');
      setTimeout(() => {
        const el = document.getElementById('pricing');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleShowLogin = () => {
    setAuthModalTab('login');
    setShowAuthModal(true);
  };

  const handleShowRegister = () => {
    setAuthModalTab('register');
    setShowAuthModal(true);
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const formatCost = (costInCents: number) => {
    return `$${(costInCents / 100).toFixed(3)}`;
  };

  const handleStartCreating = () => {
    if (!session) {
      setAuthModalTab('login');
      setPendingRedirect('chat');
      setShowAuthModal(true);
      return;
    }
    router.push('/chat');
  };

  const handleBuyCredits = () => {
    if (!session) {
      setAuthModalTab('login');
      setPendingRedirect('billing');
      setShowAuthModal(true);
      return;
    }
    router.push('/billing');
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
      <Navigation
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onShowLogin={handleShowLogin}
        onShowRegister={handleShowRegister}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            AI Models & Pricing
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-400">
            Explore our cutting-edge AI models and transparent pricing structure. Choose the perfect
            model for your creative needs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('models')}
              className={`rounded-lg px-6 py-3 font-medium transition-all ${
                activeTab === 'models'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Wand2 className="mr-2 inline h-5 w-5" />
              AI Models
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`rounded-lg px-6 py-3 font-medium transition-all ${
                activeTab === 'pricing'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <DollarSign className="mr-2 inline h-5 w-5" />
              Pricing
            </button>
          </div>
        </div>

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-8">
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
              {Object.values(PROVIDER_CONFIGS).map((provider) => {
                const IconComponent = iconMap[provider.iconName as keyof typeof iconMap];

                return (
                  <div
                    key={provider.name}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
                  >
                    {/* Provider Header */}
                    <div className={`bg-gradient-to-r ${provider.color} p-6 text-white`}>
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{provider.displayName}</h3>
                          <p className="text-white/80">{provider.shortDescription}</p>
                        </div>
                      </div>
                    </div>

                    {/* Models List */}
                    <div className="p-6">
                      <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Available Models
                      </h4>
                      <div className="space-y-3">
                        {provider.models.map((model) => (
                          <div
                            key={model.id}
                            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {model.name}
                                </h5>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {model.description}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {model.id}
                                  </span>
                                  {model.id.includes('preview') && (
                                    <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                      Preview
                                    </span>
                                  )}
                                  {model.supportsImageCount && (
                                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                      Up to {model.maxImages} images
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Model Comparison */}
            <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
                Model Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Provider
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Model
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Cost per Image
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Max Images
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
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
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {provider.displayName}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{model.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(() => {
                              if (provider.name === 'openai') {
                                const openaiCosts =
                                  GENERATION_COSTS.openai[
                                    model.id as keyof typeof GENERATION_COSTS.openai
                                  ];
                                if (openaiCosts) {
                                  if (typeof openaiCosts === 'object') {
                                    return formatCost(Math.min(...Object.values(openaiCosts)));
                                  } else {
                                    return formatCost(openaiCosts);
                                  }
                                }
                              } else if (provider.name === 'google') {
                                const googleCosts =
                                  GENERATION_COSTS.google[
                                    model.id as keyof typeof GENERATION_COSTS.google
                                  ];
                                if (googleCosts) {
                                  return formatCost(googleCosts);
                                }
                              }
                              return 'Contact us';
                            })()}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {model.maxImages || '1'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {model.id.includes('dall-e-3') && 'High quality art'}
                            {model.id.includes('dall-e-2') && 'Fast generation'}
                            {model.id.includes('gpt-image') && 'Token efficiency'}
                            {model.id.includes('imagen-4-ultra') && 'Premium quality'}
                            {model.id.includes('imagen-4-preview') && 'Latest features'}
                            {model.id.includes('imagen-4-standard') && 'Balanced quality'}
                            {model.id.includes('imagen-3') && 'Reliable results'}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div id="pricing" className="space-y-12">
            {/* Credit Packages */}
            <div>
              <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
                Credit Packages
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative rounded-xl border-2 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-gray-800 ${
                      pkg.popular
                        ? 'scale-105 border-blue-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                        <div className="flex items-center gap-1 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium whitespace-nowrap text-white sm:px-4 sm:text-sm">
                          <Star className="h-4 w-4" />
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        {pkg.description}
                      </p>

                      <div className="mb-4">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(pkg.price)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {pkg.credits} credits
                          {pkg.bonus > 0 && (
                            <span className="ml-1 text-green-600 dark:text-green-400">
                              +{pkg.bonus} bonus
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-6 text-xs text-gray-500 dark:text-gray-400">
                        {formatCost(pkg.price / (pkg.credits + pkg.bonus))} per credit
                      </div>

                      <button
                        onClick={handleBuyCredits}
                        className={`w-full rounded-lg px-4 py-3 font-medium transition-all ${
                          pkg.popular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
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
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
                Detailed Pricing
              </h2>

              <div className="space-y-8">
                {Object.entries(GENERATION_COSTS).map(([providerName, costs]) => {
                  const provider = PROVIDER_CONFIGS[providerName as keyof typeof PROVIDER_CONFIGS];
                  const IconComponent = iconMap[provider.iconName as keyof typeof iconMap];

                  return (
                    <div
                      key={providerName}
                      className="rounded-lg border border-gray-200 p-6 dark:border-gray-600"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-lg bg-gradient-to-r ${provider.color} flex items-center justify-center`}
                        >
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {provider.displayName}
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(costs).map(([modelId, cost]) => {
                          if (modelId === 'default') return null;

                          const model = provider.models.find((m) => m.id === modelId);
                          if (!model) return null;

                          return (
                            <div
                              key={modelId}
                              className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
                            >
                              <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                                {model.name}
                              </h4>
                              <div className="space-y-1">
                                {typeof cost === 'object' ? (
                                  Object.entries(cost).map(([size, price]) => (
                                    <div key={size} className="flex justify-between text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {size}
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCost(price as number)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Per image
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
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
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
                What You Get
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">No Subscription</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pay only for what you use with our credit system
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-white" />
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
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">High Resolution</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generate up to 1792x1024 images
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Batch Generation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create multiple images at once
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Cloud Storage</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Secure storage for your generated images
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">API Access</h3>
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
        <div className="mt-16 rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Learn More About AI Models
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <a
              href="https://openai.com/dall-e-3"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <Wand2 className="h-6 w-6 text-pink-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 group-hover:text-pink-600 dark:text-white">
                  DALL-E Documentation
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  OpenAI&apos;s official docs
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-pink-600" />
            </a>

            <a
              href="https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <ImageIcon className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 group-hover:text-red-600 dark:text-white">
                  Google Imagen
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Vertex AI docs</div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
            </a>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <h3 className="mb-4 text-2xl font-bold">Ready to Create?</h3>
            <p className="mb-6 text-lg opacity-90">
              Start generating images with these powerful AI models
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={handleStartCreating}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-gray-100"
              >
                <Wand2 className="h-4 w-4" />
                Start Creating
              </button>
              <button
                onClick={handleBuyCredits}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/30"
              >
                <Crown className="h-4 w-4" />
                Buy Credits
              </button>
            </div>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            if (pendingRedirect === 'chat') {
              router.push('/chat');
            } else if (pendingRedirect === 'billing') {
              router.push('/billing');
            }
            setPendingRedirect(null);
          }}
          defaultTab={authModalTab}
        />
      </div>
    </div>
  );
}
