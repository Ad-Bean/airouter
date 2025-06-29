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
  const [mounted, setMounted] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    "openai",
  ]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login"
  );

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

      // Only redirect if there's an explicit redirect flag (from auth success)
      if (shouldRedirect === "true") {
        // Clear the redirect flag
        localStorage.removeItem("shouldRedirectToChat");

        // Redirect to chat page
        router.push("/chat");
        return;
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
    // Set flag to redirect to chat after successful authentication
    localStorage.setItem("shouldRedirectToChat", "true");
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
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/30 dark:to-gray-900/30"></div>
      <div className="relative z-10">
        <Navigation
          isDark={isDark}
          mounted={mounted}
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
