'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { NavigationItem } from '@/config/navigation';
import { useStatus } from '@/lib/status-context';
import { Provider } from '@/lib/api';

interface ApiDocsSearchProps {
  onSectionChange: (section: string) => void;
  navigationItems: NavigationItem[];
}

interface SearchResult {
  id: string;
  label: string;
  parentLabel?: string;
  description?: string;
  type: 'section' | 'model' | 'endpoint';
  provider?: Provider;
}

export function ApiDocsSearch({ onSectionChange, navigationItems }: ApiDocsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sections: true,
    models: true,
    endpoints: true,
    providers: {
      openai: true,
      google: true,
    },
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { getProviderStatus, getModelStatus } = useStatus();

  // Focus search input when pressing Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus search on Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      // Clear search on Escape
      if (event.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Flatten navigation items for searching
  const flattenNavigationItems = (
    items: NavigationItem[],
    parentLabel?: string,
  ): SearchResult[] => {
    let results: SearchResult[] = [];

    items.forEach((item) => {
      // Add the current item
      if (item.id.startsWith('models-')) {
        // This is a provider section
        const provider = item.id.replace('models-', '') as Provider;
        results.push({
          id: item.id,
          label: item.label,
          parentLabel,
          description: item.description,
          type: 'section',
          provider,
        });
      } else if (item.id.startsWith('model-')) {
        // This is a model item
        const [_, provider, modelId] = item.id.split('-');
        results.push({
          id: item.id,
          label: item.label,
          parentLabel,
          description: item.description,
          type: 'model',
          provider: provider as Provider,
        });
      } else if (item.id.includes('endpoint')) {
        // This is an endpoint
        results.push({
          id: item.id,
          label: item.label,
          parentLabel,
          description: item.description,
          type: 'endpoint',
        });
      } else {
        // Regular section
        results.push({
          id: item.id,
          label: item.label,
          parentLabel,
          description: item.description,
          type: 'section',
        });
      }

      // Recursively add children
      if (item.children && item.children.length > 0) {
        results = [...results, ...flattenNavigationItems(item.children, item.label)];
      }
    });

    return results;
  };

  // Search function
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const allItems = flattenNavigationItems(navigationItems);

    // Filter based on search query and current filters
    const filteredResults = allItems.filter((item) => {
      // Apply type filters
      if (item.type === 'section' && !filters.sections) return false;
      if (item.type === 'model' && !filters.models) return false;
      if (item.type === 'endpoint' && !filters.endpoints) return false;

      // Apply provider filters for models
      if (item.provider && !filters.providers[item.provider]) return false;

      // Search in label, description, and parent label
      const searchIn = [item.label, item.description || '', item.parentLabel || '']
        .join(' ')
        .toLowerCase();

      return searchIn.includes(query.toLowerCase());
    });

    setSearchResults(filteredResults);
    setIsSearching(false);
  };

  // Handle search input changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, filters]);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Handle provider filter changes
  const handleProviderFilterChange = (provider: Provider, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: value,
      },
    }));
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    onSectionChange(result.id);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Get status indicator for models
  const getStatusIndicator = (result: SearchResult) => {
    if (result.type !== 'model' || !result.provider) return null;

    const [_, provider, modelId] = result.id.split('-');
    const status = getModelStatus(provider as Provider, modelId);

    if (!status) return null;

    const statusColors = {
      available: 'bg-green-500',
      unavailable: 'bg-red-500',
      limited: 'bg-amber-500',
    };

    return (
      <span
        className={`inline-flex h-2 w-2 rounded-full ${statusColors[status] || 'bg-gray-400'}`}
      />
    );
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documentation... (Ctrl+K)"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mr-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-full p-1 ${
              showFilters
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700'
            }`}
            aria-label="Show filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Filter by type
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={filters.sections}
                onChange={(e) => handleFilterChange('sections', e.target.checked)}
                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Sections</span>
            </label>
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={filters.models}
                onChange={(e) => handleFilterChange('models', e.target.checked)}
                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Models</span>
            </label>
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={filters.endpoints}
                onChange={(e) => handleFilterChange('endpoints', e.target.checked)}
                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Endpoints</span>
            </label>
          </div>

          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Filter by provider
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={filters.providers.openai}
                onChange={(e) => handleProviderFilterChange('openai', e.target.checked)}
                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">OpenAI</span>
            </label>
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={filters.providers.google}
                onChange={(e) => handleProviderFilterChange('google', e.target.checked)}
                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Google</span>
            </label>
          </div>
        </div>
      )}

      {/* Search results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {searchResults.map((result) => (
              <li key={result.id}>
                <button
                  onClick={() => handleResultClick(result)}
                  className="flex w-full items-start px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {result.label}
                      </span>
                      {getStatusIndicator(result)}
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {result.type === 'model' ? `${result.provider} model` : result.type}
                      </span>
                    </div>
                    {result.parentLabel && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.parentLabel}
                      </div>
                    )}
                    {result.description && (
                      <div className="mt-1 line-clamp-1 text-xs text-gray-600 dark:text-gray-300">
                        {result.description}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results message */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
        </div>
      )}
    </div>
  );
}
