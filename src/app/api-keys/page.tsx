'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Activity,
  AlertTriangle,
  ArrowLeft,
  Power,
  PowerOff,
  BarChart3,
  Clock,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  lastUsed: string | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

interface ApiKeyUsage {
  name: string;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [selectedKeyUsage, setSelectedKeyUsage] = useState<ApiKeyUsage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchApiKeys();
  }, [session, status, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-key');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;

    setCreatingKey(true);
    try {
      const response = await fetch('/api/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKey(data.apiKey);
        setNewKeyName('');
        await fetchApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/api-key/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const toggleApiKeyStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/api-key/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        await fetchApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update API key status');
      }
    } catch (error) {
      console.error('Error updating API key status:', error);
      alert('Failed to update API key status');
    }
  };

  const viewUsage = async (id: string) => {
    setLoadingUsage(true);
    try {
      const response = await fetch(`/api/api-key/${id}/usage`);
      if (response.ok) {
        const data = await response.json();
        setSelectedKeyUsage(data);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to load usage data');
      }
    } catch (error) {
      console.error('Error loading usage:', error);
      alert('Failed to load usage data');
    } finally {
      setLoadingUsage(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onShowLogin={() => {}}
          onShowRegister={() => {}}
        />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-64 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
            onClick={() => router.push('/dashboard')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Keys</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Manage your API keys for programmatic access to AIRouter
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New API Key
            </button>
          </div>
        </div>

        {/* API Keys List */}
        <div className="space-y-4">
          {apiKeys.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Key className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                No API Keys
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                Create your first API key to start using the AIRouter API
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create API Key
              </button>
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${apiKey.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                    ></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {apiKey.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        apiKey.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleApiKeyStatus(apiKey.id, !apiKey.isActive)}
                      className={`rounded-lg p-2 transition-colors ${
                        apiKey.isActive
                          ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                      title={apiKey.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {apiKey.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => viewUsage(apiKey.id)}
                      className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="View Usage"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Key Preview:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="font-mono text-gray-900 dark:text-white">
                        {apiKey.keyPreview}
                      </code>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Usage Count:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-900 dark:text-white">{apiKey.usageCount}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Last Used:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-gray-900 dark:text-white">
                        {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Created: {formatDate(apiKey.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create API Key Modal */}
        {showCreateModal && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Create New API Key
              </h3>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., My App API Key"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createApiKey}
                  disabled={creatingKey || !newKeyName.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingKey ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New API Key Display Modal */}
        {newKey && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-800">
              <div className="mb-4 flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-300">
                    API Key Created Successfully
                  </h3>
                  <p className="mb-4 text-sm text-green-700 dark:text-green-300">
                    Copy this key now - it will not be shown again for security reasons.
                  </p>
                  <div className="mb-4 flex items-center gap-2">
                    <code className="flex-1 rounded border bg-gray-100 px-3 py-2 font-mono text-sm break-all text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                      {newKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKey)}
                      className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Copy API key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important:</strong> Store this key securely. It provides full access
                      to your AIRouter account via the API.
                    </p>
                  </div>
                  <button
                    onClick={() => setNewKey(null)}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    I&apos;ve Saved My API Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Details Modal */}
        {selectedKeyUsage && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usage Details: {selectedKeyUsage.name}
                </h3>
                <button
                  onClick={() => setSelectedKeyUsage(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>

              {/* Usage Summary */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {loadingUsage ? '...' : selectedKeyUsage.usageCount}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Uses</div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {loadingUsage ? '...' : selectedKeyUsage.transactions.length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Transactions</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {loadingUsage
                      ? '...'
                      : selectedKeyUsage.lastUsed
                        ? formatDate(selectedKeyUsage.lastUsed)
                        : 'Never'}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Last Used</div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h4 className="text-md mb-4 font-semibold text-gray-900 dark:text-white">
                  Recent Transactions
                </h4>
                {loadingUsage ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Loading transactions...</p>
                  </div>
                ) : selectedKeyUsage.transactions.length === 0 ? (
                  <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedKeyUsage.transactions.map((transaction: Transaction) => (
                      <div
                        key={transaction.id}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  transaction.amount < 0
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                }`}
                              >
                                {transaction.type}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(transaction.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {transaction.description}
                            </p>
                          </div>
                          <div
                            className={`text-lg font-semibold ${
                              transaction.amount < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
