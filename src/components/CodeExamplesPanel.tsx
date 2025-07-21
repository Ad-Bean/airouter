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

// Default examples for different sections
const DEFAULT_EXAMPLES: Record<string, CodeExample[]> = {
  // Model-specific examples - these will be matched by ID pattern "model-{provider}-{modelId}"
  'model-openai-dall-e-3': [
    {
      id: 'curl-dalle3',
      language: 'bash',
      label: 'cURL',
      code: `# Generate an image with DALL-E 3
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A detailed oil painting of a sunset over mountains",
    "provider": "openai",
    "model": "dall-e-3",
    "size": "1024x1024",
    "quality": "hd",
    "style": "vivid"
  }'`,
      description: 'Generate high-quality image with DALL-E 3',
    },
    {
      id: 'javascript-dalle3',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Generate with DALL-E 3
const response = await fetch('https://api.airouter.io/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A detailed oil painting of a sunset over mountains',
    provider: 'openai',
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'hd',
    style: 'vivid'
  })
});

const data = await response.json();
console.log('Generated image:', data.images[0].url);`,
      description: 'JavaScript example for DALL-E 3',
    },
    {
      id: 'python-dalle3',
      language: 'python',
      label: 'Python',
      code: `import requests

# Generate with DALL-E 3
url = "https://api.airouter.io/v1/generate"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "prompt": "A detailed oil painting of a sunset over mountains",
    "provider": "openai",
    "model": "dall-e-3",
    "size": "1024x1024",
    "quality": "hd",
    "style": "vivid"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(f"Generated image: {result['images'][0]['url']}")`,
      description: 'Python example for DALL-E 3',
    },
  ],

  'model-google-imagen-4-preview': [
    {
      id: 'curl-imagen4',
      language: 'bash',
      label: 'cURL',
      code: `# Generate multiple images with Imagen 4 Preview
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A futuristic cityscape with flying cars",
    "provider": "google",
    "model": "imagen-4-preview",
    "sampleCount": 4
  }'`,
      description: 'Generate multiple images with Imagen 4',
    },
    {
      id: 'javascript-imagen4',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Generate with Imagen 4 Preview
const response = await fetch('https://api.airouter.io/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A futuristic cityscape with flying cars',
    provider: 'google',
    model: 'imagen-4-preview',
    sampleCount: 4
  })
});

const data = await response.json();
console.log(\`Generated \${data.images.length} images\`);`,
      description: 'JavaScript example for Imagen 4 Preview',
    },
    {
      id: 'python-imagen4',
      language: 'python',
      label: 'Python',
      code: `import requests

# Generate with Imagen 4 Preview
url = "https://api.airouter.io/v1/generate"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "prompt": "A futuristic cityscape with flying cars",
    "provider": "google",
    "model": "imagen-4-preview",
    "sampleCount": 4
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(f"Generated {len(result['images'])} images")`,
      description: 'Python example for Imagen 4 Preview',
    },
  ],

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
    {
      id: 'response-overview',
      language: 'json',
      label: 'Response',
      code: `{
  "success": true,
  "images": [
    {
      "url": "https://storage.airouter.io/images/abc123.png",
      "id": "img_abc123",
      "size": "1024x1024",
      "provider": "openai",
      "model": "dall-e-3",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "usage": {
    "credits_used": 1,
    "remaining_credits": 99
  }
}`,
      description: 'Successful API response format',
    },
  ],
  authentication: [
    {
      id: 'curl-auth',
      language: 'bash',
      label: 'cURL',
      code: `# Using API key in Authorization header (recommended)
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer sk-airouter-1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "test image"}'

# Alternative: Using X-API-Key header
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "X-API-Key: sk-airouter-1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "test image"}'

# Checking API key validity
curl -X GET "https://api.airouter.io/v1/auth/validate" \\
  -H "Authorization: Bearer sk-airouter-1234567890abcdef"`,
      description: 'API key authentication methods with validation',
    },
    {
      id: 'javascript-auth',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Secure API key handling in JavaScript

// 1. Using environment variables (Node.js)
const apiKey = process.env.AIROUTER_API_KEY;

// 2. Using secure backend proxy (recommended for browser apps)
// Your frontend calls your backend, which adds the API key and forwards to AIRouter
async function generateImageSecurely(prompt) {
  const response = await fetch('/api/proxy/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  return await response.json();
}

// 3. Comprehensive error handling
async function generateWithErrorHandling(prompt) {
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
      const errorData = await response.json();
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed: Invalid API key');
        case 403:
          throw new Error('API key disabled or insufficient permissions');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later');
        default:
          throw new Error(\`API error: \${errorData.error?.message || 'Unknown error'}\`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}`,
      description: 'Secure JavaScript authentication with comprehensive error handling',
    },
    {
      id: 'python-auth',
      language: 'python',
      label: 'Python',
      code: `import os
import requests
from dotenv import load_dotenv
from requests.exceptions import HTTPError, Timeout, ConnectionError

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable (best practice)
api_key = os.getenv('AIROUTER_API_KEY')
if not api_key:
    raise ValueError("API key not found. Set AIROUTER_API_KEY environment variable")

class AIRouterClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.airouter.io/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def validate_api_key(self):
        """Validate the API key is active and working."""
        try:
            response = requests.get(
                f"{self.base_url}/auth/validate",
                headers=self.headers,
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except HTTPError as e:
            if e.response.status_code == 401:
                raise ValueError("Invalid API key")
            raise
    
    def generate_image(self, prompt, **kwargs):
        """Generate an image with error handling."""
        try:
            response = requests.post(
                f"{self.base_url}/generate",
                headers=self.headers,
                json={"prompt": prompt, **kwargs},
                timeout=30
            )
            
            response.raise_for_status()
            return response.json()
            
        except HTTPError as e:
            if e.response.status_code == 401:
                raise ValueError("Authentication failed: Invalid API key")
            elif e.response.status_code == 403:
                raise ValueError("API key disabled or insufficient permissions")
            elif e.response.status_code == 429:
                raise ValueError("Rate limit exceeded. Please try again later")
            else:
                error_data = e.response.json()
                error_msg = error_data.get('error', {}).get('message', 'Unknown error')
                raise ValueError(f"API error: {error_msg}")
        except Timeout:
            raise ValueError("Request timed out. Please try again later")
        except ConnectionError:
            raise ValueError("Connection error. Please check your internet connection")
        except Exception as e:
            raise ValueError(f"Unexpected error: {str(e)}")

# Usage
client = AIRouterClient(api_key)
try:
    # Validate API key before using
    client.validate_api_key()
    
    # Generate image
    result = client.generate_image("A beautiful sunset")
    print(f"Image generated: {result['images'][0]['url']}")
except ValueError as e:
    print(f"Error: {e}")`,
      description: 'Python client with API key validation and comprehensive error handling',
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
    "size": "1024x1024",
    "n": 1,
    "quality": "standard"
  }'

# GET /v1/models - List available models
curl -X GET "https://api.airouter.io/v1/models" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      description: 'Core API endpoints for image generation and model listing',
    },
    {
      id: 'javascript-generate',
      language: 'javascript',
      label: 'JavaScript',
      code: `// Generate image with multiple options
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
      size: options.size || '1024x1024',
      n: options.count || 1,
      quality: options.quality || 'standard'
    })
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return await response.json();
};

// Usage
const result = await generateImage('A serene mountain lake', {
  provider: 'google',
  model: 'imagen-3',
  size: '1024x1024'
});`,
      description: 'JavaScript wrapper function for image generation',
    },
    {
      id: 'python-generate',
      language: 'python',
      label: 'Python',
      code: `import requests
from typing import Optional, Dict, Any

class AIRouterClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.airouter.io/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def generate_image(self, prompt: str, **kwargs) -> Dict[Any, Any]:
        """Generate an image using the specified parameters."""
        data = {
            "prompt": prompt,
            "provider": kwargs.get("provider", "openai"),
            "model": kwargs.get("model", "dall-e-3"),
            "size": kwargs.get("size", "1024x1024"),
            "n": kwargs.get("n", 1),
            "quality": kwargs.get("quality", "standard")
        }
        
        response = requests.post(
            f"{self.base_url}/generate",
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def list_models(self) -> Dict[Any, Any]:
        """List all available models."""
        response = requests.get(
            f"{self.base_url}/models",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
client = AIRouterClient("YOUR_API_KEY")
result = client.generate_image(
    "A cyberpunk street scene",
    provider="google",
    model="imagen-4-preview"
)`,
      description: 'Python client class for AIRouter API',
    },
    {
      id: 'response-generate',
      language: 'json',
      label: 'Response',
      code: `{
  "success": true,
  "images": [
    {
      "url": "https://storage.airouter.io/images/xyz789.png",
      "id": "img_xyz789",
      "size": "1024x1024",
      "provider": "google",
      "model": "imagen-4-preview",
      "created_at": "2024-01-15T14:22:30Z",
      "expires_at": "2024-01-22T14:22:30Z"
    }
  ],
  "usage": {
    "credits_used": 1,
    "remaining_credits": 48,
    "cost_breakdown": {
      "base_cost": 1,
      "provider_multiplier": 1.0
    }
  },
  "metadata": {
    "request_id": "req_abc123",
    "processing_time_ms": 3420
  }
}`,
      description: 'Detailed API response with metadata and usage information',
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
    "size": "1024x1024",
    "quality": "hd"
  }'

# Generate with Imagen 4 (Google)
curl -X POST "https://api.airouter.io/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A vibrant coral reef underwater scene",
    "provider": "google",
    "model": "imagen-4-preview",
    "size": "1024x1024",
    "n": 4
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
    { provider: 'openai', model: 'dall-e-2' },
    { provider: 'google', model: 'imagen-4-preview' },
    { provider: 'google', model: 'imagen-3-fast' }
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
};

// Usage
const comparisons = await compareModels('A sunset over the ocean');
console.log('Model comparison results:', comparisons);`,
      description: 'JavaScript utility to compare different AI models',
    },
    {
      id: 'python-models',
      language: 'python',
      label: 'Python',
      code: `import requests
import asyncio
import aiohttp
from typing import List, Dict

class ModelBenchmark:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.airouter.io/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def test_model(self, session, prompt: str, provider: str, model: str):
        """Test a specific model with the given prompt."""
        data = {
            "prompt": prompt,
            "provider": provider,
            "model": model,
            "size": "1024x1024"
        }
        
        async with session.post(
            f"{self.base_url}/generate",
            headers=self.headers,
            json=data
        ) as response:
            result = await response.json()
            return {
                "provider": provider,
                "model": model,
                "success": response.status == 200,
                "result": result
            }
    
    async def benchmark_models(self, prompt: str) -> List[Dict]:
        """Benchmark multiple models with the same prompt."""
        models = [
            ("openai", "dall-e-3"),
            ("openai", "dall-e-2"),
            ("google", "imagen-4-preview"),
            ("google", "imagen-3-fast")
        ]
        
        async with aiohttp.ClientSession() as session:
            tasks = [
                self.test_model(session, prompt, provider, model)
                for provider, model in models
            ]
            return await asyncio.gather(*tasks, return_exceptions=True)

# Usage
benchmark = ModelBenchmark("YOUR_API_KEY")
results = await benchmark.benchmark_models("A futuristic robot in a garden")`,
      description: 'Python async benchmark tool for comparing AI models',
    },
    {
      id: 'models-list',
      language: 'json',
      label: 'Available Models',
      code: `{
  "models": {
    "openai": [
      {
        "id": "dall-e-3",
        "name": "DALL-E 3",
        "description": "Latest and most capable model",
        "max_images": 1,
        "sizes": ["1024x1024", "1024x1792", "1792x1024"],
        "pricing": "$0.04-$0.12 per image",
        "features": ["high_quality", "prompt_following"]
      },
      {
        "id": "dall-e-2",
        "name": "DALL-E 2",
        "description": "Faster and more reliable",
        "max_images": 10,
        "sizes": ["256x256", "512x512", "1024x1024"],
        "pricing": "$0.016-$0.02 per image",
        "features": ["batch_generation", "image_editing"]
      }
    ],
    "google": [
      {
        "id": "imagen-4-preview",
        "name": "Imagen 4 Preview",
        "description": "Latest preview with improved quality",
        "max_images": 8,
        "sizes": ["1024x1024", "1152x896", "896x1152"],
        "pricing": "$0.04 per image",
        "features": ["high_quality", "fast_generation"]
      },
      {
        "id": "imagen-3-fast",
        "name": "Imagen 3 Fast",
        "description": "Fast generation with good quality",
        "max_images": 8,
        "sizes": ["1024x1024", "1152x896", "896x1152"],
        "pricing": "$0.02 per image",
        "features": ["fast_generation", "cost_effective"]
      }
    ]
  }
}`,
      description: 'Complete list of available models and their capabilities',
    },
  ],
};

export function CodeExamplesPanel({ activeSection, examples, className }: CodeExamplesPanelProps) {
  // Use provided examples or fall back to defaults
  // Check if the active section is a model-specific section
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
          if (isModelSection && DEFAULT_EXAMPLES[activeSection]) {
            loadedExamples = DEFAULT_EXAMPLES[activeSection];
          } else if (isModelSection) {
            // If no exact match for model, use generic models examples
            loadedExamples = DEFAULT_EXAMPLES.models;
          } else {
            // For non-model sections, use section-specific examples or fall back to overview
            loadedExamples = DEFAULT_EXAMPLES[activeSection] || DEFAULT_EXAMPLES.overview;
          }
        }

        setCurrentExamples(loadedExamples);
        setIsLoading(false);
      }, 600);
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
          if (isModelSection && DEFAULT_EXAMPLES[activeSection]) {
            loadedExamples = DEFAULT_EXAMPLES[activeSection];
          } else if (isModelSection) {
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
    }, 600);
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
        <div className="flex items-center border-b border-gray-200 bg-gray-100 px-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Code Examples
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="mb-4 h-8 w-8 text-amber-500" />
          <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            Failed to load code examples
          </h3>
          <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
            {error.message || 'An error occurred while loading examples.'}
          </p>
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
        <div className="flex items-center border-b border-gray-200 bg-gray-100 px-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Code Examples
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <FileText className="mb-4 h-8 w-8 text-gray-400 dark:text-gray-600" />
          <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            No examples available
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Code examples for this section are coming soon.
          </p>
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
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
                  activeTab === language
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{getLanguageDisplayName(language)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code content */}
      <div className="max-h-[600px] overflow-y-auto">
        {activeExamples.map((example) => (
          <div key={example.id} className="relative">
            {example.description && (
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
                {example.description}
              </div>
            )}
            <div className="group relative">
              <pre className={`language-${example.language} m-0 overflow-x-auto p-4 text-sm`}>
                <code className={`language-${example.language}`}>{example.code}</code>
              </pre>
              <button
                onClick={() => handleCopy(example.code, example.id)}
                className={cn(
                  'absolute top-2 right-2 rounded-md p-2 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100',
                  copiedId === example.id
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                )}
                aria-label={copiedId === example.id ? 'Copied' : 'Copy to clipboard'}
              >
                {copiedId === example.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
