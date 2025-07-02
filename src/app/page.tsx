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
import { DEFAULT_PROVIDERS } from "@/config/providers";

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
  }, []);

  useEffect(() => {
    if (session && status === "authenticated") {
      const shouldRedirect = localStorage.getItem("shouldRedirectToChat");

      if (shouldRedirect === "true") {
        const redirectTimer = setTimeout(() => {
          router.push("/chat");
        }, 100);

        return () => clearTimeout(redirectTimer);
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
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== provider);
      } else {
        return [...prev, provider];
      }
    });
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    if (!session) {
      localStorage.setItem("pendingPrompt", prompt);
      localStorage.setItem(
        "pendingProviders",
        JSON.stringify(selectedProviders)
      );
      localStorage.setItem("shouldRedirectToChat", "true");

      setShowAuthModal(true);
      return;
    }

    localStorage.setItem("pendingPrompt", prompt);
    localStorage.setItem("pendingProviders", JSON.stringify(selectedProviders));
    router.push("/chat");
    return;
  };

  const handleAuthSuccess = () => {
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
