'use client';

import { useState, useEffect, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  ApiOverviewSection,
  AuthenticationSection,
  EndpointsSection,
  ModelsSection,
  ModelPages,
} from '@/components/ApiDocumentationSections.optimized';
import { ApiDocsLayout } from '@/components/ApiDocsLayout';
import { ApiDocsContent } from '@/components/ApiDocsContent';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ApiDocsLayoutSkeleton } from '@/components/ApiDocsSkeletons';

export default function ApiDocsPage() {
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      // Check for saved theme preference or use system preference
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Set initial theme state
      const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark);
      setIsDark(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme);
    } catch (err) {
      console.error('Error initializing theme:', err);
      // Default to light theme if there's an error
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

    // Simulate initial loading - reduced loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      document.documentElement.classList.toggle('dark', newTheme);
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (err) {
      console.error('Error toggling theme:', err);
    }
  };

  // Handle section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  // Show loading skeleton during initial load
  if (isLoading) {
    return (
      <>
        <Navigation
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onShowLogin={() => {}}
          onShowRegister={() => {}}
        />
        <ApiDocsLayoutSkeleton />
        <Footer />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <Navigation
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onShowLogin={() => {}}
        onShowRegister={() => {}}
      />
      <ApiDocsLayout>
        <Suspense
          fallback={<div className="p-8 text-center">Loading documentation content...</div>}
        >
          <ApiDocsContent activeSection={activeSection} onSectionInView={handleSectionChange}>
            <ApiOverviewSection />
            <AuthenticationSection />
            <EndpointsSection />
            <ModelsSection />
            <ModelPages />
          </ApiDocsContent>
        </Suspense>
      </ApiDocsLayout>
      <Footer />
    </ErrorBoundary>
  );
}
