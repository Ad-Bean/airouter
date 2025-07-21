import { PROVIDER_CONFIGS } from './providers';
import { FileText, Shield, Code, Layers } from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  href?: string;
  description?: string;
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: NavigationItem[];
}

// Generate model navigation items from provider configs
function generateModelNavigation(): NavigationItem[] {
  return Object.values(PROVIDER_CONFIGS)
    .filter((provider) => provider.enabled)
    .map((provider) => ({
      id: `models-${provider.name}`,
      label: provider.displayName,
      description: provider.shortDescription,
      children: provider.models.map((model) => ({
        id: `model-${provider.name}-${model.id}`,
        label: model.name,
        description: model.description,
      })),
    }));
}

// Main navigation configuration
export const NAVIGATION_CONFIG: NavigationSection[] = [
  {
    id: 'overview',
    label: 'API Overview',
    icon: FileText,
    description: 'Introduction to the AIRouter API and getting started guide',
    items: [
      {
        id: 'introduction',
        label: 'Introduction',
        description: 'Welcome to the AIRouter API documentation',
      },
      {
        id: 'base-url',
        label: 'Base URL',
        description: 'API endpoint and base URL information',
      },
      {
        id: 'rate-limits',
        label: 'Rate Limits',
        description: 'Understanding rate limits and credit system',
      },
      {
        id: 'status',
        label: 'Service Status',
        description: 'Current status of all providers and models',
      },
    ],
  },
  {
    id: 'authentication',
    label: 'Authentication',
    icon: Shield,
    description: 'API key management and security best practices',
    items: [
      {
        id: 'api-keys',
        label: 'API Keys',
        description: 'How to generate and manage your API keys',
      },
      {
        id: 'security',
        label: 'Security Best Practices',
        description: 'Keep your API keys secure and follow best practices',
      },
      {
        id: 'errors',
        label: 'Error Handling',
        description: 'Common errors and how to handle them',
      },
    ],
  },
  {
    id: 'endpoints',
    label: 'API Endpoints',
    icon: Code,
    description: 'Detailed documentation for all API endpoints',
    items: [
      {
        id: 'generate',
        label: 'Generate Images',
        description: 'POST /api/v1/generate - Generate images using AI models',
      },
      {
        id: 'models-endpoint',
        label: 'List Models',
        description: 'GET /api/v1/models - Retrieve available models',
      },
      {
        id: 'status-endpoint',
        label: 'Service Status',
        description: 'GET /api/v1/status - Check service health',
      },
    ],
  },
  {
    id: 'models',
    label: 'Models',
    icon: Layers,
    description: 'Comprehensive documentation for all available AI models',
    items: generateModelNavigation(),
  },
];

// Helper functions for navigation
export function getNavigationItem(id: string): NavigationItem | null {
  for (const section of NAVIGATION_CONFIG) {
    if (section.id === id) {
      return {
        id: section.id,
        label: section.label,
        icon: section.icon,
        description: section.description,
      };
    }

    for (const item of section.items) {
      if (item.id === id) {
        return item;
      }

      if (item.children) {
        for (const child of item.children) {
          if (child.id === id) {
            return child;
          }
        }
      }
    }
  }
  return null;
}

export function getNavigationSection(itemId: string): NavigationSection | null {
  for (const section of NAVIGATION_CONFIG) {
    if (section.id === itemId) {
      return section;
    }

    for (const item of section.items) {
      if (item.id === itemId) {
        return section;
      }

      if (item.children) {
        for (const child of item.children) {
          if (child.id === itemId) {
            return section;
          }
        }
      }
    }
  }
  return null;
}

export function getParentNavigationItem(childId: string): NavigationItem | null {
  for (const section of NAVIGATION_CONFIG) {
    for (const item of section.items) {
      if (item.children) {
        for (const child of item.children) {
          if (child.id === childId) {
            return item;
          }
        }
      }
    }
  }
  return null;
}

// Convert navigation config to the format expected by the sidebar
export function getNavigationItems(): NavigationItem[] {
  return NAVIGATION_CONFIG.map((section) => ({
    id: section.id,
    label: section.label,
    icon: section.icon,
    children: section.items,
  }));
}
