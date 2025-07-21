'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { getNavigationItems, type NavigationItem } from '@/config/navigation';
import { useStatus, type ModelStatus, type ProviderStatus } from '@/lib/status-context';
import { Provider } from '@/lib/api';

// Use NavigationItem type from config instead of local SidebarItem

interface ApiDocsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function ApiDocsSidebar({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggle,
  className = '',
}: ApiDocsSidebarProps) {
  // Get status from context
  const { getProviderStatus, getModelStatus } = useStatus();

  // Initialize expanded sections from localStorage or default to models section
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('api-docs-expanded-sections');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          // Fall back to default if parsing fails
        }
      }
    }
    return new Set(['models']);
  });

  // Get navigation structure from configuration
  const navigationItems: NavigationItem[] = getNavigationItems();

  const toggleSection = useCallback(
    (sectionId: string) => {
      const newExpanded = new Set(expandedSections);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      setExpandedSections(newExpanded);
    },
    [expandedSections],
  );

  // Persist expanded sections to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('api-docs-expanded-sections', JSON.stringify([...expandedSections]));
    }
  }, [expandedSections]);

  const handleSectionClick = (sectionId: string, hasChildren: boolean = false) => {
    if (hasChildren) {
      toggleSection(sectionId);
    } else {
      // Update active section through the parent component
      onSectionChange(sectionId);

      // Close mobile sidebar when navigating to a section
      if (isCollapsed) {
        onToggle();
      }

      // Note: We don't need to manually scroll here anymore
      // The scrolling is now handled by the ApiDocsContent component
      // when it detects an activeSection change
    }
  };

  // Add keyboard shortcuts for expanding/collapsing sections
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when Alt key is pressed
      if (!event.altKey) return;

      // Alt+Right Arrow to expand current section
      if (event.key === 'ArrowRight') {
        const currentSection = navigationItems.find(
          (item) =>
            item.id === activeSection ||
            (item.children && item.children.some((child) => child.id === activeSection)),
        );

        if (currentSection && currentSection.children && currentSection.children.length > 0) {
          if (!expandedSections.has(currentSection.id)) {
            toggleSection(currentSection.id);
          }
        }
      }

      // Alt+Left Arrow to collapse current section
      if (event.key === 'ArrowLeft') {
        const currentSection = navigationItems.find(
          (item) =>
            item.id === activeSection ||
            (item.children && item.children.some((child) => child.id === activeSection)),
        );

        if (currentSection && expandedSections.has(currentSection.id)) {
          toggleSection(currentSection.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, expandedSections, navigationItems, toggleSection]);

  // Auto-expand section containing active item
  useEffect(() => {
    const findParentSection = (items: NavigationItem[], targetId: string): string | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return null; // Found at top level
        }
        if (item.children) {
          const found = findParentSection(item.children, targetId);
          if (found !== null) {
            return found;
          }
          // Check if target is direct child
          if (item.children.some((child) => child.id === targetId)) {
            return item.id;
          }
        }
      }
      return null;
    };

    const parentSection = findParentSection(navigationItems, activeSection);
    if (parentSection && !expandedSections.has(parentSection)) {
      setExpandedSections((prev) => new Set([...prev, parentSection]));
    }
  }, [activeSection, expandedSections, navigationItems]);

  // Helper function to render status indicator
  const renderStatusIndicator = (status: ProviderStatus | ModelStatus | undefined) => {
    if (!status) return null;

    switch (status) {
      case 'operational':
      case 'available':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'degraded':
      case 'limited':
        return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      case 'outage':
      case 'unavailable':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  // Helper function to get provider and model status
  const getItemStatus = (item: NavigationItem): ProviderStatus | ModelStatus | undefined => {
    // Check if this is a provider item
    if (item.id.startsWith('models-')) {
      const provider = item.id.replace('models-', '') as Provider;
      return getProviderStatus(provider);
    }

    // Check if this is a model item
    if (item.id.startsWith('model-')) {
      const parts = item.id.split('-');
      const provider = parts[1];
      const modelId = parts[2];
      return getModelStatus(provider as Provider, modelId);
    }

    return undefined;
  };

  const renderSidebarItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.id);

    // Enhanced active section detection - check if this item or any of its children are active
    const isActive = activeSection === item.id;
    const hasActiveChild =
      hasChildren &&
      item.children!.some(
        (child) =>
          activeSection === child.id ||
          (child.children && child.children.some((grandchild) => activeSection === grandchild.id)),
      );

    const Icon = item.icon;
    const status = getItemStatus(item);

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => handleSectionClick(item.id, hasChildren)}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            level === 0 ? 'font-medium' : 'font-normal'
          } ${
            isActive || hasActiveChild
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          aria-current={isActive ? 'page' : undefined}
        >
          {hasChildren && (
            <span className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          {Icon && level === 0 && <Icon className="h-4 w-4 flex-shrink-0" />}
          <span className="truncate">{item.label}</span>

          {/* Status indicator */}
          {status && <span className="ml-auto flex-shrink-0">{renderStatusIndicator(status)}</span>}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className={`fixed inset-0 z-50 lg:hidden ${className}`}>
        {/* Backdrop with fade animation */}
        <div
          className="fixed inset-0 bg-black/20 transition-opacity duration-300 ease-out"
          onClick={onToggle}
        />
        {/* Sidebar with slide animation */}
        <div className="fixed top-0 left-0 h-full w-80 transform bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documentation</h2>
            <button
              onClick={onToggle}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Close navigation"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
          <nav className="h-[calc(100%-4rem)] overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => renderSidebarItem(item))}
            </div>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className={`hidden lg:block ${className}`}>
      <div className="sticky top-8 h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documentation</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Navigate through our API documentation
          </p>
        </div>
        <nav>
          <div className="space-y-2">{navigationItems.map((item) => renderSidebarItem(item))}</div>
        </nav>

        {/* Keyboard shortcuts help */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Keyboard Shortcuts
          </h3>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center justify-between">
              <span>Search</span>
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Ctrl+K
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Next section</span>
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Alt+↓
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Previous section</span>
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Alt+↑
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Expand section</span>
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Alt+→
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Collapse section</span>
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Alt+←
              </kbd>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
