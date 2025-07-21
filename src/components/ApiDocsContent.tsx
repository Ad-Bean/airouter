'use client';

import { Heading } from '@radix-ui/themes';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentSkeleton } from './ApiDocsSkeletons';

interface ApiDocsContentProps {
  activeSection: string;
  onSectionInView: (section: string) => void;
  children: ReactNode;
}

export function ApiDocsContent({ activeSection, onSectionInView, children }: ApiDocsContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Debounce function to limit scroll event handling
  const debounce = <T extends unknown[]>(
    func: (...args: T) => void,
    wait: number,
  ): ((...args: T) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: T) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Enhanced Intersection Observer for detecting active sections
  useEffect(() => {
    try {
      const observer = new IntersectionObserver(
        (entries) => {
          // Update the set of visible sections
          const updatedVisibleSections = new Set(visibleSections);

          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target.id) {
              updatedVisibleSections.add(entry.target.id);
            } else if (entry.target.id) {
              updatedVisibleSections.delete(entry.target.id);
            }
          });

          setVisibleSections(updatedVisibleSections);

          // If we have visible sections, determine which one should be active
          // Prioritize sections near the top of the viewport
          if (updatedVisibleSections.size > 0) {
            const visibleSectionsArray = Array.from(updatedVisibleSections);

            // Get positions of all visible sections
            const sectionPositions = visibleSectionsArray.map((id) => {
              const element = document.getElementById(id);
              const rect = element?.getBoundingClientRect();
              return {
                id,
                top: rect?.top || 0,
                // Calculate how far into the viewport the section is (as a percentage)
                viewportPercentage: rect ? (window.innerHeight - rect.top) / window.innerHeight : 0,
              };
            });

            // First prioritize sections that are at least 15% into the viewport
            const visibleEnough = sectionPositions.filter((s) => s.viewportPercentage >= 0.15);

            if (visibleEnough.length > 0) {
              // Sort by proximity to the top of the viewport
              visibleEnough.sort((a, b) => a.top - b.top);

              // Update the active section if it's different
              if (visibleEnough[0].id !== activeSection) {
                onSectionInView(visibleEnough[0].id);
              }
            } else {
              // Fall back to the original sorting if no section is visible enough
              sectionPositions.sort((a, b) => a.top - b.top);

              // Update the active section if it's different
              if (sectionPositions[0].id !== activeSection) {
                onSectionInView(sectionPositions[0].id);
              }
            }
          }
        },
        {
          // Adjust the root margin to better detect sections
          rootMargin: '-5% 0px -70% 0px',
          threshold: [0, 0.1, 0.2, 0.5],
        },
      );

      // Observe all sections with IDs
      const sections = contentRef.current?.querySelectorAll('[id]');
      sections?.forEach((section) => observer.observe(section));

      return () => {
        sections?.forEach((section) => observer.unobserve(section));
      };
    } catch (err) {
      console.error('Error setting up intersection observer:', err);
      setError(err instanceof Error ? err : new Error('Failed to set up section detection'));
    }
  }, [activeSection, onSectionInView, visibleSections]);

  // Handle manual scroll events to enhance section detection
  useEffect(() => {
    try {
      const handleScroll = debounce(() => {
        // Get all sections
        const sections = Array.from(document.querySelectorAll('[data-section-id]'));

        // Find which sections are currently visible
        const visibleSections = sections.filter((section) => {
          const rect = section.getBoundingClientRect();
          // Consider a section visible if it's within the viewport with some margin
          return rect.top < window.innerHeight * 0.5 && rect.bottom > 0;
        });

        if (visibleSections.length > 0) {
          // Sort by proximity to the top of the viewport
          visibleSections.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return Math.abs(rectA.top) - Math.abs(rectB.top);
          });

          // Get the ID of the most visible section
          const mostVisibleSectionId = visibleSections[0].getAttribute('data-section-id');

          // Update active section if needed
          if (mostVisibleSectionId && mostVisibleSectionId !== activeSection) {
            onSectionInView(mostVisibleSectionId);
          }
        }
      }, 100);

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    } catch (err) {
      console.error('Error setting up scroll handler:', err);
      setError(err instanceof Error ? err : new Error('Failed to set up scroll detection'));
    }
  }, [activeSection, onSectionInView]);

  // Scroll to section when activeSection changes from external sources (like sidebar clicks)
  useEffect(() => {
    try {
      if (activeSection) {
        const element = document.getElementById(activeSection);
        if (element) {
          // Check if this was triggered by a user click rather than scroll detection
          const isUserInitiated = !visibleSections.has(activeSection);

          if (isUserInitiated) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }
      }
    } catch (err) {
      console.error('Error scrolling to section:', err);
      // Don't set error state here as it's not critical
    }
  }, [activeSection, visibleSections]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Handle retry
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);

    // Simulate reload
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  if (isLoading) {
    return <ContentSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/20">
        <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-500" />
        <h3 className="mb-2 text-lg font-medium text-red-800 dark:text-red-300">
          Content loading error
        </h3>
        <p className="mb-4 text-sm text-red-700 dark:text-red-400">
          {error.message || 'Failed to load documentation content.'}
        </p>
        <Button
          onClick={handleRetry}
          size="sm"
          className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div ref={contentRef} className="prose prose-gray dark:prose-invert max-w-none">
      {children}
    </div>
  );
}

// Section wrapper component for consistent styling
interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
  level?: 1 | 2 | 3;
}

export function Section({ id, title, children, level = 1 }: SectionProps) {
  return (
    <section
      id={id}
      className="mb-12 scroll-mt-24" // Increased scroll margin for better positioning with fixed header
      data-section-id={id} // Add data attribute for easier section identification
    >
      <Heading as={`h${level}`} className="mb-6 text-gray-900 dark:text-white">
        {title}
      </Heading>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
