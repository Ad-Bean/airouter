import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, FileText, Key } from 'lucide-react';

export function ApiDocumentation() {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  if (!isExpanded) {
    return (
      <section className="bg-gray-50 py-16 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Developer API</h2>
            <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
              Integrate AI image generation into your applications with our simple REST API
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => router.push('/api-docs')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
              >
                <FileText className="h-5 w-5" />
                View Full Documentation
              </button>
              <button
                onClick={() => router.push('/api-keys')}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
              >
                <Key className="h-5 w-5" />
                Manage API Keys
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-16 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Developer API</h2>
          <p className="mb-4 text-xl text-gray-600 dark:text-gray-300">
            Integrate AI image generation into your applications with our simple REST API
          </p>
          <button
            onClick={() => setIsExpanded(false)}
            className="inline-flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-700"
          >
            <ChevronUp className="h-4 w-4" />
            Hide Quick Preview
          </button>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900">
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Start
                </h3>
                <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                  <pre className="overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                    {`curl -X POST "https://airouter.com/api/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A futuristic cityscape with flying cars",
    "models": ["openai:dall-e-3"],
    "imageCount": 1
  }'`}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
                    Authentication
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Use API keys for secure authentication. Generate multiple keys for different
                    environments.
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <h4 className="mb-2 font-semibold text-green-900 dark:text-green-300">
                    Credit System
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Pay per use with our credit system. 1 credit = $0.10. Different models have
                    different costs.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <button
                    onClick={() => router.push('/api-docs')}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
                  >
                    <FileText className="h-5 w-5" />
                    Full Documentation
                  </button>
                  <button
                    onClick={() => router.push('/api-keys')}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
                  >
                    <Key className="h-5 w-5" />
                    Get API Keys
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
