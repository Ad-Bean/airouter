"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type Provider } from "@/lib/api";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedModelsSection } from "@/components/FeaturedModelsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    "openai",
  ]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login"
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldUseDark =
      savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);

    // Check URL parameters for showing auth modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("showLogin") === "true") {
      setAuthModalTab("login");
      setShowAuthModal(true);
      // Clean up URL
      window.history.replaceState({}, "", "/");
    } else if (urlParams.get("showRegister") === "true") {
      setAuthModalTab("register");
      setShowAuthModal(true);
      // Clean up URL
      window.history.replaceState({}, "", "/");
    }
  }, []); // Redirect to chat if user just signed in with pending content
  useEffect(() => {
    if (session && status === "authenticated") {
      const shouldRedirect = localStorage.getItem("shouldRedirectToChat");
      const pendingPrompt = localStorage.getItem("pendingPrompt");
      const pendingProviders = localStorage.getItem("pendingProviders");

      // Redirect if there's an explicit redirect flag AND we have pending content
      // or if user came from a generate action (has pending prompt/providers)
      if (shouldRedirect === "true" && (pendingPrompt || pendingProviders)) {
        // Small delay to ensure the session is fully established after OAuth
        const redirectTimer = setTimeout(() => {
          // Clear the redirect flag
          localStorage.removeItem("shouldRedirectToChat");

          // Redirect to chat page
          router.push("/chat");
        }, 100);

        return () => clearTimeout(redirectTimer);
      }

      // Clean up stale redirect flag if no pending content
      if (shouldRedirect === "true" && !pendingPrompt && !pendingProviders) {
        localStorage.removeItem("shouldRedirectToChat");
      }
    }
  }, [session, status, router]);

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
      localStorage.setItem(
        "pendingProviders",
        JSON.stringify(selectedProviders)
      );
      localStorage.setItem("shouldRedirectToChat", "true"); // Set redirect flag

      // Show auth modal instead of redirecting
      setShowAuthModal(true);
      return;
    }

    // If user is authenticated, redirect to chat page with the prompt
    localStorage.setItem("pendingPrompt", prompt);
    localStorage.setItem("pendingProviders", JSON.stringify(selectedProviders));
    router.push("/chat");
    return;
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    // Only set flag to redirect to chat if there's pending content from a generate action
    const pendingPrompt = localStorage.getItem("pendingPrompt");
    const pendingProviders = localStorage.getItem("pendingProviders");

    if (pendingPrompt || pendingProviders) {
      localStorage.setItem("shouldRedirectToChat", "true");
    }

    setShowAuthModal(false);
  };

  const handleShowLogin = () => {
    setAuthModalTab("login");
    setShowAuthModal(true);
  };

  const handleShowRegister = () => {
    setAuthModalTab("register");
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div>
        <Navigation
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onShowLogin={handleShowLogin}
          onShowRegister={handleShowRegister}
        />

        <HeroSection
          prompt={prompt}
          onPromptChange={setPrompt}
          selectedProviders={selectedProviders}
          onToggleProvider={toggleProvider}
          isGenerating={false}
          onGenerate={handleGenerate}
          error={null}
          generatedImages={[]}
          isAuthenticated={!!session}
          onAuthRequired={handleAuthRequired}
        />

        <FeaturedModelsSection />
        <FeaturesSection />
        <CTASection />
        <Footer />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          defaultTab={authModalTab}
        />
      </div>
    </div>
  );
}
