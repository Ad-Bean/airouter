'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Check, Terminal, Code, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CodeExamplesSkeleton } from './ApiDocsSkeletons';

// Import Prism for syntax highlighting
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import '@/styles/prism-terminal.css';

// Types for code examples
export interface CodeExample {
  id: string;
  language: string;
  label: string;
  code: string;
  description?: string;
}

export interface TerminalTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

interface CodeExamplesPanelProps {
  activeSection: string;
  examples?: CodeExample[];
  className?: string;
}

// Default examples for different sections - simplified version
const DEFAULT_EXAMPLES: Record<string, CodeExample[]> = {
  overview: [
    {
      id: 'curl-overview',
      language: 'bash',
      label: 'cURL',
      code: `# Generate an image using the AIRouter API
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "provider": "openai",
    "model": "dall-e-3",
    "size": "1024x1024"
  }'`,
      description: 'Basic API request to generate an image',
    },
    {
      id: 'javascript-overview',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Generate an image using fetch API
const response = await fetch('https://api.airouter.io/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A beautiful sunset over mountains',
    provider: 'openai',
    model: 'dall-e-3',
    size: '1024x1024'
  })
});

const data = await response.json();
console.log('Generated image:', data.images[0].url);`,
      description: 'JavaScript example using fetch API',
    },
    {
      id: 'python-overview',
      language: 'python',
      label: 'Python',
      code: `import requests

# Generate an image using Python requests
url = "https://api.airouter.io/v1/generate"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "prompt": "A beautiful sunset over mountains",
    "provider": "openai",
    "model": "dall-e-3",
    "size": "1024x1024"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(f"Generated image: {result['images'][0]['url']}")`,
      description: 'Python example using requests library',
    },
  ],
  authentication: [
    {
      id: 'curl-auth',
      language: 'bash',
      label: 'cURL',
      code: `# Using API key in Authorization header
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer sk-airouter-1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "test image"}'`,
      description: 'API key authentication methods with validation',
    },
    {
      id: 'javascript-auth',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Secure API key handling in JavaScript
const apiKey = process.env.AIROUTER_API_KEY;

async function generateImage(prompt) {
  try {
    const response = await fetch('https://api.airouter.io/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
      throw new Error(\`API error: \${response.status}\`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}`,
      description: 'Secure JavaScript authentication with error handling',
    },
  ],
  endpoints: [
    {
      id: 'curl-generate',
      language: 'bash',
      label: 'cURL',
      code: `# POST /v1/generate - Generate images
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A futuristic cityscape at night",
    "provider": "openai",
    "model": "dall-e-3",
    "size": "1024x1024"
  }'`,
      description: 'Core API endpoints for image generation',
    },
    {
      id: 'javascript-generate',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Generate image with options
const generateImage = async (prompt, options = {}) => {
  const response = await fetch('https://api.airouter.io/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      provider: options.provider || 'openai',
      model: options.model || 'dall-e-3',
      size: options.size || '1024x1024'
    })
  });

  return await response.json();
};`,
      description: 'JavaScript wrapper function for image generation',
    },
  ],
  models: [
    {
      id: 'curl-models',
      language: 'bash',
      label: 'cURL',
      code: `# Generate with DALL-E 3 (OpenAI)
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A majestic eagle soaring over mountains",
    "provider": "openai",
    "model": "dall-e-3",
    "size": "1024x1024"
  }'`,
      description: 'Examples using different AI models and providers',
    },
    {
      id: 'javascript-models',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Model comparison utility
const compareModels = async (prompt) => {
  const models = [
    { provider: 'openai', model: 'dall-e-3' },
    { provider: 'google', model: 'imagen-4-preview' }
  ];

  const results = await Promise.allSettled(
    models.map(async ({ provider, model }) => {
      const response = await fetch('https://api.airouter.io/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          provider,
          model,
          size: '1024x1024'
        })
      });
      
      const data = await response.json();
      return { provider, model, ...data };
    })
  );

  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
};`,
      description: 'JavaScript utility to compare different AI models',
    },
  ],
};

export function CodeExamplesPanel({ activeSection, examples, className }: CodeExamplesPanelProps) {
  // Use provided examples or fall back to defaults
  const isModelSection = activeSection.startsWith('model-');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentExamples, setCurrentExamples] = useState<CodeExample[]>([]);

  // Load examples based on active section
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate network delay for loading examples
      setTimeout(() => {
        let loadedExamples = examples;

        if (!loadedExamples) {
          if (isModelSection) {
            // For model sections, use models examples
            loadedExamples = DEFAULT_EXAMPLES.models;
          } else {
            // For non-model sections, use section-specific examples or fall back to overview
            loadedExamples = DEFAULT_EXAMPLES[activeSection] || DEFAULT_EXAMPLES.overview;
          }
        }

        setCurrentExamples(loadedExamples);
        setIsLoading(false);
      }, 400); // Reduced loading time
    } catch (err) {
      console.error('Error loading code examples:', err);
      setError(err instanceof Error ? err : new Error('Failed to load code examples'));
      setIsLoading(false);
    }
  }, [activeSection, examples, isModelSection]);

  // Group examples by language
  const examplesByLanguage = currentExamples.reduce(
    (acc, example) => {
      const { language } = example;
      if (!acc[language]) {
        acc[language] = [];
      }
      acc[language].push(example);
      return acc;
    },
    {} as Record<string, CodeExample[]>,
  );

  // Get unique languages
  const languages = Object.keys(examplesByLanguage);

  // Set up tabs based on languages
  const [activeTab, setActiveTab] = useState(languages[0] || 'bash');

  // Update active tab when languages change
  useEffect(() => {
    if (languages.length > 0 && !languages.includes(activeTab)) {
      setActiveTab(languages[0]);
    }
  }, [languages, activeTab]);

  // Get examples for the active tab
  const activeExamples = examplesByLanguage[activeTab] || [];

  // Set up copy functionality
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      },
      (err) => {
        console.error('Failed to copy code:', err);
      },
    );
  }, []);

  // Highlight code when tab changes or examples update
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading && activeExamples.length > 0) {
      try {
        Prism.highlightAll();
      } catch (err) {
        console.error('Error highlighting code:', err);
      }
    }
  }, [activeTab, activeExamples, isLoading]);

  // Get icon for language
  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'bash':
        return Terminal;
      case 'javascript':
      case 'typescript':
        return Code;
      default:
        return FileText;
    }
  };

  // Get display name for language
  const getLanguageDisplayName = (language: string) => {
    switch (language) {
      case 'bash':
        return 'cURL';
      case 'javascript':
        return 'JS';
      case 'python':
        return 'Python';
      case 'json':
        return 'Response';
      default:
        return language.charAt(0).toUpperCase() + language.slice(1);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);

    // Simulate reload
    setTimeout(() => {
      try {
        let loadedExamples = examples;

        if (!loadedExamples) {
          if (isModelSection) {
            loadedExamples = DEFAULT_EXAMPLES.models;
          } else {
            loadedExamples = DEFAULT_EXAMPLES[activeSection] || DEFAULT_EXAMPLES.overview;
          }
        }

        setCurrentExamples(loadedExamples);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load code examples'));
        setIsLoading(false);
      }
    }, 400);
  };

  // Loading state
  if (isLoading) {
    return <CodeExamplesSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
          className,
        )}
      >
        <div className="flex items-center border-b border-gray-200 bg-gray-100 px-3 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Code Examples
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="mb-3 h-6 w-6 text-amber-500" />
          <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            Failed to load examples
          </h3>
          <Button
            onClick={handleRetry}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try again</span>
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (languages.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
          className,
        )}
      >
        <div className="flex items-center border-b border-gray-200 bg-gray-100 px-3 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Code Examples
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <FileText className="mb-3 h-6 w-6 text-gray-400 dark:text-gray-600" />
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
            No examples available
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
    >
      {/* Terminal header with tabs */}
      <div className="flex items-center border-b border-gray-200 bg-gray-100 px-3 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="scrollbar-hide flex space-x-1 overflow-x-auto py-1.5">
          {languages.map((language) => {
            const Icon = getLanguageIcon(language);
            return (
              <button
                key={language}
                onClick={() => setActiveTab(language)}
                className={`flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  activeTab === language
                    ? 'bg-gray-800 text-white dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                }`}
                aria-current={activeTab === language ? 'page' : undefined}
              >
                <Icon className="mr-1 h-3 w-3" />
                <span>{getLanguageDisplayName(language)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code examples */}
      <div className="p-3">
        {activeExamples.map((example) => (
          <div key={example.id} className="mb-4 last:mb-0">
            {example.description && (
              <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                {example.description}
              </div>
            )}
            <div className="relative">
              <pre className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 max-h-[500px] overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-50">
                <code className={`language-${example.language}`}>{example.code}</code>
              </pre>
              <button
                onClick={() => handleCopy(example.code, example.id)}
                className="absolute top-2 right-2 rounded-md bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
                aria-label="Copy code"
              >
                {copiedId === example.id ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
