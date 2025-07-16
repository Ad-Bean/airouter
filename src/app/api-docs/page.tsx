'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Copy, Key, Code, FileText, Shield, ArrowLeft } from 'lucide-react';

export default function ApiDocsPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'authentication' | 'endpoints' | 'examples'
  >('overview');

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sampleRequest = `curl -X POST "https://airouter.com/api/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A futuristic cityscape with flying cars and neon lights",
    "models": ["openai:dall-e-3", "google:imagen-4"],
    "imageCount": 2
  }'`;

  const sampleResponse = `{
  "success": true,
  "prompt": "A futuristic cityscape with flying cars and neon lights",
  "imageCount": 2,
  "totalCreditsUsed": 8,
  "remainingCredits": 42,
  "results": [
    {
      "provider": "openai",
      "model": "dall-e-3",
      "creditsUsed": 4,
      "images": [
        {
          "id": "img_abc123",
          "url": "https://storage.url/image1.png",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ]
    },
    {
      "provider": "google",
      "model": "imagen-4",
      "creditsUsed": 4,
      "images": [
        {
          "id": "img_def456",
          "url": "https://storage.url/image2.png",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ]
}`;

  const availableModels = [
    { provider: 'openai', models: ['dall-e-3', 'dall-e-2', 'gpt-image-1'] },
    {
      provider: 'google',
      models: [
        'imagen-4',
        'imagen-3',
        'imagen-4-fast',
        'gemini-2.0-flash-preview-image-generation',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-gray-900">
      <Navigation
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onShowLogin={() => {}}
        onShowRegister={() => {}}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            API Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Integrate AI image generation into your applications with our simple REST API
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h2 className="mb-2 text-2xl font-bold">Quick Start</h2>
          <p className="mb-4">Get started with the AIRouter API in minutes</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600">
                  1
                </div>
                <span className="font-semibold">Get API Key</span>
              </div>
              <p className="text-sm">Generate your API key from the dashboard</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600">
                  2
                </div>
                <span className="font-semibold">Make Request</span>
              </div>
              <p className="text-sm">Send a POST request with your prompt</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600">
                  3
                </div>
                <span className="font-semibold">Get Images</span>
              </div>
              <p className="text-sm">Receive generated images in the response</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'authentication', label: 'Authentication', icon: Shield },
                { id: 'endpoints', label: 'Endpoints', icon: Code },
                { id: 'examples', label: 'Examples', icon: Key },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() =>
                    setActiveTab(id as 'overview' | 'authentication' | 'endpoints' | 'examples')
                  }
                  className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    API Overview
                  </h2>
                  <p className="mb-6 text-gray-600 dark:text-gray-300">
                    The AIRouter API allows you to generate images programmatically using multiple
                    AI providers. Our API uses a credit-based system where 1 credit = $0.10.
                  </p>
                  <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
                    <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
                      Base URL
                    </h3>
                    <code className="text-lg text-blue-700 dark:text-blue-400">
                      https://airouter.com/api/v1
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Available Models
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {availableModels.map(({ provider, models }) => (
                      <div
                        key={provider}
                        className="rounded-lg border border-gray-200 p-6 dark:border-gray-700"
                      >
                        <h4 className="mb-4 text-lg font-semibold text-gray-900 capitalize dark:text-white">
                          {provider}
                        </h4>
                        <div className="space-y-2">
                          {models.map((model) => (
                            <div key={model} className="flex items-center gap-2">
                              <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {provider}:{model}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Rate Limits
                  </h3>
                  <div className="rounded-lg bg-yellow-50 p-6 dark:bg-yellow-900/20">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      Rate limiting is controlled by your credit balance. Each generation consumes
                      credits based on the model and image count. No additional rate limits are
                      enforced beyond credit availability.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'authentication' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    Authentication
                  </h2>
                  <p className="mb-6 text-gray-600 dark:text-gray-300">
                    API requests are authenticated using API keys. You can generate and manage
                    multiple API keys from your dashboard.
                  </p>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Getting Your API Key
                  </h3>
                  <ol className="mb-6 list-inside list-decimal space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Sign in to your AIRouter account</li>
                    <li>Go to your dashboard</li>
                    <li>Navigate to the API Keys section</li>
                    <li>Click &quot;Generate New API Key&quot;</li>
                    <li>Give your key a name for easy identification</li>
                    <li>Copy and securely store your API key</li>
                  </ol>
                  <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                    <p className="text-orange-800 dark:text-orange-200">
                      <strong>Important:</strong> API keys are only displayed once after creation.
                      Store them securely and never share them publicly.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Using Your API Key
                  </h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    Include your API key in the Authorization header of your requests:
                  </p>
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Security Best Practices
                  </h3>
                  <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Store API keys in environment variables, not in your code</li>
                    <li>Use different API keys for different environments (dev, staging, prod)</li>
                    <li>Rotate your API keys regularly</li>
                    <li>Monitor your API key usage in the dashboard</li>
                    <li>Delete unused API keys immediately</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'endpoints' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    API Endpoints
                  </h2>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Generate Images
                  </h3>
                  <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <code className="text-lg font-semibold text-green-700 dark:text-green-400">
                      POST /api/v1/generate
                    </code>
                  </div>
                  <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Generate images using AI models with custom parameters.
                  </p>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Request Body
                  </h4>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-start gap-3">
                        <code className="rounded bg-blue-50 px-2 py-1 font-mono text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          prompt
                        </code>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            required
                          </span>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            The text prompt describing the image you want to generate. Maximum 1000
                            characters.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-start gap-3">
                        <code className="rounded bg-blue-50 px-2 py-1 font-mono text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          models
                        </code>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            optional
                          </span>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            Array of model strings or &quot;auto&quot; to use all available models.
                            Format: [&quot;provider:model&quot;]
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Default: &quot;auto&quot;
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-start gap-3">
                        <code className="rounded bg-blue-50 px-2 py-1 font-mono text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          imageCount
                        </code>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            optional
                          </span>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            Number of images to generate per model (1-10). Default: 1
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Response Format
                  </h4>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    Returns a JSON object containing generation results, credit usage, and image
                    URLs.
                  </p>
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <pre className="overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                      {`{
  "success": true,
  "prompt": "string",
  "imageCount": number,
  "totalCreditsUsed": number,
  "remainingCredits": number,
  "results": [
    {
      "provider": "string",
      "model": "string",
      "creditsUsed": number,
      "images": [
        {
          "id": "string",
          "url": "string",
          "createdAt": "string"
        }
      ]
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    Code Examples
                  </h2>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Basic Example
                  </h3>
                  <div className="relative rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
                    <button
                      onClick={() => copyToClipboard(sampleRequest)}
                      className="absolute top-4 right-4 p-2 text-gray-500 transition-colors hover:text-gray-700"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <pre className="overflow-x-auto pr-12 text-sm text-gray-800 dark:text-gray-200">
                      {sampleRequest}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Example Response
                  </h3>
                  <div className="relative rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
                    <button
                      onClick={() => copyToClipboard(sampleResponse)}
                      className="absolute top-4 right-4 p-2 text-gray-500 transition-colors hover:text-gray-700"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <pre className="overflow-x-auto pr-12 text-sm text-gray-800 dark:text-gray-200">
                      {sampleResponse}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    JavaScript Example
                  </h3>
                  <div className="relative rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
                    <button
                      onClick={() =>
                        copyToClipboard(`const response = await fetch('https://airouter.com/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A futuristic cityscape with flying cars',
    models: ['openai:dall-e-3'],
    imageCount: 1
  })
});

const data = await response.json();
console.log(data);`)
                      }
                      className="absolute top-4 right-4 p-2 text-gray-500 transition-colors hover:text-gray-700"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <pre className="overflow-x-auto pr-12 text-sm text-gray-800 dark:text-gray-200">
                      {`const response = await fetch('https://airouter.com/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A futuristic cityscape with flying cars',
    models: ['openai:dall-e-3'],
    imageCount: 1
  })
});

const data = await response.json();
console.log(data);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Error Handling
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                      <h4 className="mb-2 font-semibold text-red-900 dark:text-red-300">
                        401 Unauthorized
                      </h4>
                      <code className="text-sm text-red-700 dark:text-red-400">
                        {`{ "error": "Invalid API key" }`}
                      </code>
                    </div>

                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <h4 className="mb-2 font-semibold text-yellow-900 dark:text-yellow-300">
                        402 Payment Required
                      </h4>
                      <code className="text-sm text-yellow-700 dark:text-yellow-400">
                        {`{ "error": "Insufficient credits", "required": 8, "available": 2 }`}
                      </code>
                    </div>

                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                      <h4 className="mb-2 font-semibold text-orange-900 dark:text-orange-300">
                        400 Bad Request
                      </h4>
                      <code className="text-sm text-orange-700 dark:text-orange-400">
                        {`{ "error": "Invalid model: invalid:model" }`}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Ready to get started?
          </h2>
          <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
            Create your account and start generating images with our API today.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Key className="h-5 w-5" />
            Get Your API Key
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
