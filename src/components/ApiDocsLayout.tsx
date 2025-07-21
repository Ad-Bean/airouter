'use client';

import { useState, useEffect, Suspense } from 'react';
import { Menu, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ApiDocsSidebar } from './ApiDocsSidebar';
import { ApiDocsSearch } from './ApiDocsSearch';
import { CodeExamplesPanel } from './CodeExamplesPanel.optimized';
import { StatusProvider, useStatus } from '@/lib/status-context';
import { getNavigationItems } from '@/config/navigation';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  ApiDocsLayoutSkeleton,
  SidebarSkeleton,
  ContentSkeleton,
  CodeExamplesSkeleton,
} from './ApiDocsSkeletons';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface ApiDocsLayoutProps {
  children: React.ReactNode;
}

// NetworkStatus component uses this internally
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function debounce<T extends unknown[]>(
  func: (...args: T) => void,
  wait: number,
): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: T) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Network status component
function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert) return null;

  return (
    <div
      className={`fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
        isOnline
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You are offline. Some content may be unavailable.</span>
        </>
      )}
      <button
        onClick={() => setShowOfflineAlert(false)}
        className="ml-2 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <span className="text-xl leading-none">&times;</span>
      </button>
    </div>
  );
}

// Status error component
function StatusErrorAlert({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Unable to load service status
          </h3>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Status indicators may be unavailable or outdated.
          </p>
        </div>
        <Button
          onClick={onRetry}
          size="sm"
          variant="outline"
          className="flex items-center gap-1 border-amber-200 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry</span>
        </Button>
      </div>
    </div>
  );
}

// Main layout component with error handling
export function ApiDocsLayout({ children }: ApiDocsLayoutProps) {
  // Initialize active section from localStorage or URL hash
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (hash) {
        return hash;
      }
      // Check localStorage for last visited section
      const saved = localStorage.getItem('api-docs-active-section');
      if (saved) {
        return saved;
      }
    }
    return 'overview';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReloadDialog, setShowReloadDialog] = useState(false);

  // Handle section changes from sidebar navigation or intersection observer
  const handleSectionChange = (section: string) => {
    setActiveSection(section);

    // Update URL hash without triggering page reload
    if (typeof window !== 'undefined') {
      // Use pushState for better history navigation instead of replaceState
      const currentHash = window.location.hash.slice(1);

      // Only update if the section has changed to avoid unnecessary history entries
      if (currentHash !== section) {
        window.history.pushState(null, '', `#${section}`);
        // Persist active section to localStorage
        localStorage.setItem('api-docs-active-section', section);
      }
    }
  };

  // Initialize active section from URL hash on mount and set up scroll behavior
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get section from hash or use default
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);

        // Scroll to the section with a slight delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }

      // Enable smooth scrolling for all internal links
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e: Event) {
          e.preventDefault();
          const element = e.currentTarget as HTMLAnchorElement;
          const targetId = element.getAttribute('href')?.slice(1);
          if (targetId) {
            handleSectionChange(targetId);
          }
        });
      });
    }
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
      } else {
        setActiveSection('overview');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close sidebar on escape key
      if (event.key === 'Escape' && isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        return;
      }

      // Add keyboard shortcuts for navigation
      if (event.altKey) {
        // Get all section IDs in order
        const sections = Array.from(document.querySelectorAll('[data-section-id]'))
          .map((el) => el.getAttribute('data-section-id'))
          .filter(Boolean) as string[];

        const currentIndex = sections.indexOf(activeSection);

        // Navigate to next section with Alt+ArrowDown
        if (event.key === 'ArrowDown' && currentIndex < sections.length - 1) {
          event.preventDefault();
          handleSectionChange(sections[currentIndex + 1]);
        }

        // Navigate to previous section with Alt+ArrowUp
        if (event.key === 'ArrowUp' && currentIndex > 0) {
          event.preventDefault();
          handleSectionChange(sections[currentIndex - 1]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarCollapsed, activeSection]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarCollapsed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarCollapsed]);

  // Simulate loading state for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle page reload
  const handleReload = () => {
    window.location.reload();
  };

  // Show loading skeleton during initial load
  if (isLoading) {
    return <ApiDocsLayoutSkeleton />;
  }

  return (
    <StatusProvider refreshInterval={30000}>
      <ErrorBoundary
        fallback={
          <div className="min-h-screen bg-white p-8 dark:bg-gray-900">
            <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/20">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-300">
                Something went wrong
              </h2>
              <p className="mb-6 text-red-700 dark:text-red-400">
                We encountered an error while loading the documentation. Please try reloading the
                page.
              </p>
              <Button
                onClick={() => setShowReloadDialog(true)}
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload page
              </Button>
            </div>
          </div>
        }
      >
        <NetworkStatus />
        <ConfirmationDialog
          open={showReloadDialog}
          onOpenChange={setShowReloadDialog}
          title="Reload page?"
          description="The page will be reloaded and any unsaved changes may be lost."
          confirmText="Reload"
          onConfirm={handleReload}
        />
        <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-gray-900">
          {/* Mobile menu button and search bar */}
          <div className="sticky top-0 z-40 flex h-16 items-center justify-end gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Open navigation menu"
              aria-expanded={isSidebarCollapsed}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 lg:hidden dark:text-white">
              API Documentation
            </h1>
            <div className="hidden w-full max-w-md lg:block">
              <ApiDocsSearch
                onSectionChange={handleSectionChange}
                navigationItems={getNavigationItems()}
              />
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="sticky top-16 z-30 border-b border-gray-200 bg-white px-4 py-2 lg:hidden dark:border-gray-700 dark:bg-gray-900">
            <ApiDocsSearch
              onSectionChange={handleSectionChange}
              navigationItems={getNavigationItems()}
            />
          </div>

          {/* Main layout grid */}
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_400px]">
              {/* Sidebar with error handling */}
              <ErrorBoundary
                fallback={
                  <div className="hidden lg:block lg:px-4 lg:py-8">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                      <h3 className="mb-2 text-sm font-medium text-red-800 dark:text-red-300">
                        Navigation error
                      </h3>
                      <p className="mb-4 text-xs text-red-700 dark:text-red-400">
                        Unable to load the navigation sidebar.
                      </p>
                      <Button
                        onClick={() => window.location.reload()}
                        size="sm"
                        className="w-full bg-red-600 text-white hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700"
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Reload
                      </Button>
                    </div>
                    <SidebarSkeleton />
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="hidden lg:block lg:px-4 lg:py-8">
                      <SidebarSkeleton />
                    </div>
                  }
                >
                  <ApiDocsSidebar
                    activeSection={activeSection}
                    onSectionChange={handleSectionChange}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={toggleSidebar}
                    className="lg:px-4 lg:py-8"
                  />
                </Suspense>
              </ErrorBoundary>

              {/* Main content with error handling */}
              <main className="min-w-0 px-4 py-8 lg:px-8">
                <ErrorBoundary
                  fallback={
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/20">
                      <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
                      <h3 className="mb-2 text-lg font-medium text-red-800 dark:text-red-300">
                        Content error
                      </h3>
                      <p className="mb-4 text-sm text-red-700 dark:text-red-400">
                        We encountered an error while loading this content section.
                      </p>
                      <Button
                        onClick={() => window.location.reload()}
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700"
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Reload
                      </Button>
                    </div>
                  }
                >
                  <Suspense fallback={<ContentSkeleton />}>
                    <StatusErrorHandler>
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        {children}
                      </div>
                    </StatusErrorHandler>
                  </Suspense>
                </ErrorBoundary>
              </main>

              {/* Code examples panel with error handling */}
              <aside className="hidden px-4 py-8 xl:block">
                <ErrorBoundary
                  fallback={
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                      <h3 className="mb-2 text-sm font-medium text-red-800 dark:text-red-300">
                        Code examples error
                      </h3>
                      <p className="mb-4 text-xs text-red-700 dark:text-red-400">
                        Unable to load code examples.
                      </p>
                      <Button
                        onClick={() => window.location.reload()}
                        size="sm"
                        className="w-full bg-red-600 text-white hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700"
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Reload
                      </Button>
                    </div>
                  }
                >
                  <Suspense fallback={<CodeExamplesSkeleton />}>
                    <CodeExamplesPanel activeSection={activeSection} />
                  </Suspense>
                </ErrorBoundary>
              </aside>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </StatusProvider>
  );
}

// Status error handler component
function StatusErrorHandler({ children }: { children: React.ReactNode }) {
  const { error, refreshStatus } = useStatus();

  if (error) {
    return (
      <>
        <StatusErrorAlert onRetry={refreshStatus} />
        {children}
      </>
    );
  }

  return <>{children}</>;
}
