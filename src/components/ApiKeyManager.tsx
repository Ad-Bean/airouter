import { useState, useEffect } from 'react';
import { Key, Copy, Trash2, Plus, AlertTriangle } from 'lucide-react';

export function ApiKeyManager() {
  const [apiKeyInfo, setApiKeyInfo] = useState<{
    hasApiKey: boolean;
    createdAt: string | null;
    keyPreview: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchApiKeyInfo();
  }, []);

  const fetchApiKeyInfo = async () => {
    try {
      const response = await fetch('/api/api-key');
      if (response.ok) {
        const data = await response.json();
        setApiKeyInfo(data);
      }
    } catch (error) {
      console.error('Error fetching API key info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/api-key', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedKey(data.apiKey);
        await fetchApiKeyInfo();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      alert('Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteApiKey = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/api-key', {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiKeyInfo({ hasApiKey: false, createdAt: null, keyPreview: null });
        setShowDeleteConfirm(false);
        setGeneratedKey(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-20 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            API Key Management
          </h2>
        </div>
      </div>

      {/* Generated Key Display */}
      {generatedKey && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h3 className="mb-2 font-medium text-green-900 dark:text-green-300">
                Your API Key (Save this now!)
              </h3>
              <div className="mb-3 flex items-center gap-2">
                <code className="flex-1 rounded border bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                  {generatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Copy API key"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                This key will not be shown again. Make sure to save it in a secure location.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Key Status */}
      {apiKeyInfo?.hasApiKey ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-gray-900 dark:text-white">API Key Active</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>
                  Preview: <code className="font-mono">{apiKeyInfo.keyPreview}</code>
                </div>
                {apiKeyInfo.createdAt && (
                  <div>Created: {new Date(apiKeyInfo.createdAt).toLocaleDateString()}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 transition-colors hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <h3 className="mb-2 font-medium text-red-900 dark:text-red-300">
                    Delete API Key?
                  </h3>
                  <p className="mb-4 text-sm text-red-700 dark:text-red-300">
                    This action cannot be undone. Applications using this API key will stop working
                    immediately.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={deleteApiKey}
                      disabled={isDeleting}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete API Key'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-300">
              How to use your API key
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>Include your API key in the Authorization header:</p>
              <code className="block rounded border bg-white px-3 py-2 font-mono text-xs dark:bg-gray-800">
                Authorization: Bearer YOUR_API_KEY
              </code>
              <p>See the API documentation below for complete usage examples.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <Key className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No API Key Found
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Generate an API key to start using the AIRouter API in your applications.
          </p>
          <button
            onClick={generateApiKey}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate API Key'}
          </button>
        </div>
      )}
    </div>
  );
}
