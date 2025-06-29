"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { generateImage, type Provider } from "@/lib/api";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedModelsSection } from "@/components/FeaturedModelsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  // Restore pending prompt and providers after successful login
  useEffect(() => {
    if (session && status === "authenticated") {
      const pendingPrompt = localStorage.getItem("pendingPrompt");
      const pendingProviders = localStorage.getItem("pendingProviders");

      if (pendingPrompt) {
        setPrompt(pendingPrompt);
        localStorage.removeItem("pendingPrompt");
      }

      if (pendingProviders) {
        try {
          const providers = JSON.parse(pendingProviders);
          setSelectedProviders(providers);
          localStorage.removeItem("pendingProviders");
        } catch (error) {
          console.warn("Failed to parse pending providers:", error);
        }
      }
    }
  }, [session, status]);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Check if user is authenticated before generating
    if (!session) {
      // Store the prompt in localStorage so we can restore it after login
      localStorage.setItem("pendingPrompt", prompt);
      localStorage.setItem("pendingProviders", JSON.stringify(selectedProviders));

      // Redirect to login
      router.push("/login?callbackUrl=" + encodeURIComponent("/"));
      return;
    }

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
            
            // Save images to database for authenticated users
            if (session) {
              try {
                for (const imageUrl of result.images) {
                  await fetch('/api/images/save', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      prompt: prompt.trim(),
                      imageUrl,
                      provider,
                      model: result.model,
                      width: 1024,
                      height: 1024,
                      steps: 20,
                    }),
                  });
                }
              } catch (saveError) {
                console.warn('Failed to save image to database:', saveError);
                // Don't throw error - image generation was successful
              }
            }
            
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
        <Navigation
          isDark={isDark}
          mounted={mounted}
          onToggleTheme={toggleTheme}
        />

        <HeroSection
          prompt={prompt}
          onPromptChange={setPrompt}
          selectedProviders={selectedProviders}
          onToggleProvider={toggleProvider}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          error={error}
          generatedImages={generatedImages}
          session={session}
          isAuthenticated={!!session}
        />

        <FeaturedModelsSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
