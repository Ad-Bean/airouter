'use client';

import { ApiEndpointDoc } from '@/components/ApiEndpointDoc';
import { ModelDocumentation } from '@/components/ModelDocumentation';
import { ModelDocumentationPage } from '@/components/ModelDocumentationPage';
import { Section } from '@/components/ApiDocsContent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ENDPOINTS, MODEL_DOCUMENTATION, AUTH_DOCUMENTATION } from '@/lib/api-docs-data';
import { useStatus, ModelStatus } from '@/lib/status-context';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Provider } from '@/lib/api';
import { Tooltip } from '@/components/ui/tooltip';
import { ImageIcon } from '@radix-ui/react-icons';

// Model Status Indicator Component
interface ModelStatusIndicatorProps {
  provider: Provider;
  modelId: string;
}

function ModelStatusIndicator({ provider, modelId }: ModelStatusIndicatorProps) {
  const { getModelStatus } = useStatus();
  const status = getModelStatus(provider, modelId);

  // If no status is available, show a gray dot
  if (!status) {
    return (
      <Tooltip content="Status unknown">
        <span className="inline-flex h-2 w-2 rounded-full bg-gray-400"></span>
      </Tooltip>
    );
  }

  // Status-specific colors and tooltips
  const statusConfig: Record<ModelStatus, { color: string; tooltip: string }> = {
    available: { color: 'bg-green-500', tooltip: 'Available' },
    unavailable: { color: 'bg-red-500', tooltip: 'Unavailable' },
    limited: { color: 'bg-amber-500', tooltip: 'Limited availability' },
  };

  const config = statusConfig[status];

  return (
    <Tooltip content={config.tooltip}>
      <span className={`inline-flex h-2 w-2 rounded-full ${config.color}`}></span>
    </Tooltip>
  );
}

export function ApiOverviewSection() {
  const { status, isLoading, error, refreshStatus } = useStatus();

  // Format the last updated time
  const formatLastUpdated = (isoString?: string) => {
    if (!isoString) return 'Never';

    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
      }).format(date);
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <Section id="overview" title="API Overview">
      <div className="space-y-6">
        <div>
          <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
            The AIRouter API provides access to multiple AI image generation providers through a
            unified interface. Generate high-quality images using models from OpenAI, Google, and
            other leading AI providers with automatic fallback and smart routing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block rounded bg-gray-100 px-4 py-2 text-lg dark:bg-gray-800">
              https://api.airouter.io
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rate Limits</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isLoading
                  ? 'Updating...'
                  : status?.lastUpdated
                    ? `Updated ${formatLastUpdated(status.lastUpdated)}`
                    : 'Not updated'}
              </span>
              <button
                onClick={() => refreshStatus()}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title="Refresh rate limits"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Global Rate Limits */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Global Limits
                </h4>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Requests per minute:</span>
                  <Badge>60 requests</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Images per hour:</span>
                  <Badge>200 images</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Concurrent requests:</span>
                  <Badge>5 requests</Badge>
                </div>
              </div>

              {/* Provider-specific Rate Limits */}
              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Provider-Specific Limits
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* OpenAI Rate Limits */}
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">OpenAI</span>
                      {status?.providers?.openai && (
                        <Badge
                          className={
                            status.providers.openai.status === 'operational'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : status.providers.openai.status === 'degraded'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }
                        >
                          {status.providers.openai.status === 'operational'
                            ? 'Normal'
                            : status.providers.openai.status === 'degraded'
                              ? 'Degraded'
                              : 'Outage'}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>DALL-E 3:</span>
                        <span className="font-medium">50 req/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>DALL-E 2:</span>
                        <span className="font-medium">50 req/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>GPT Image 1:</span>
                        <span className="font-medium">30 req/min</span>
                      </div>
                    </div>
                  </div>

                  {/* Google Rate Limits */}
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">Google AI</span>
                      {status?.providers?.google && (
                        <Badge
                          className={
                            status.providers.google.status === 'operational'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : status.providers.google.status === 'degraded'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }
                        >
                          {status.providers.google.status === 'operational'
                            ? 'Normal'
                            : status.providers.google.status === 'degraded'
                              ? 'Degraded'
                              : 'Outage'}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Imagen 4 Ultra:</span>
                        <span className="font-medium">30 req/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Imagen 4 Standard:</span>
                        <span className="font-medium">40 req/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Imagen 4 Fast:</span>
                        <span className="font-medium">60 req/min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Rate Limit Note */}
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="flex items-start">
                  <div className="mt-0.5 mr-2 text-blue-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Rate limits are subject to change based on provider availability and service
                    status. Check individual model documentation for the most current limits.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-medium">Request Format</h4>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  JSON
                </Badge>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Response Format</h4>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  JSON
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Service Status</CardTitle>
            <button
              onClick={() => refreshStatus()}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="Refresh status"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Error loading status information. Please try again.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {formatLastUpdated(status?.lastUpdated)}
                </div>

                <div className="space-y-3">
                  {status?.providers &&
                    Object.entries(status.providers).map(([provider, providerStatus]) => (
                      <div
                        key={provider}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center">
                            {providerStatus.status === 'operational' && (
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            )}
                            {providerStatus.status === 'degraded' && (
                              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                            )}
                            {providerStatus.status === 'outage' && (
                              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium capitalize">{provider}</span>
                          </div>
                          <Badge
                            className={
                              providerStatus.status === 'operational'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : providerStatus.status === 'degraded'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            }
                          >
                            {providerStatus.status}
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {
                            Object.values(providerStatus.models).filter((s) => s === 'available')
                              .length
                          }{' '}
                          of {Object.keys(providerStatus.models).length} models available
                        </div>
                      </div>
                    ))}

                  {!status?.providers && !isLoading && (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      No status information available
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

export function AuthenticationSection() {
  return (
    <Section id="authentication" title="Authentication">
      <div className="space-y-8">
        <div>
          <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
            {AUTH_DOCUMENTATION.overview.description}
          </p>
        </div>

        {/* API Key Authentication */}
        <Card>
          <CardHeader>
            <CardTitle>API Key Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium">Header Format</h4>
                <pre className="rounded bg-gray-100 p-3 text-sm dark:bg-gray-800">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </pre>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Example Request</h4>
                <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm dark:bg-gray-800">
                  <code>{`curl -X POST https://api.airouter.io/api/v1/generate \\
  -H "Authorization: Bearer sk-1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A beautiful sunset"}'`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card>
          <CardHeader>
            <CardTitle>{AUTH_DOCUMENTATION.keyManagement.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                {AUTH_DOCUMENTATION.keyManagement.description}
              </p>

              {AUTH_DOCUMENTATION.keyManagement.steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{step.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>

                  <div className="mt-2 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <ul className="list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      {step.instructions &&
                        step.instructions.map((instruction, idx) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                      {step.benefits &&
                        step.benefits.map((benefit, idx) => <li key={idx}>{benefit}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Examples */}
        <Card>
          <CardHeader>
            <CardTitle>{AUTH_DOCUMENTATION.implementation.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {AUTH_DOCUMENTATION.implementation.examples.map((example, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{example.language}</h4>
                  <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm dark:bg-gray-800">
                    <code>{example.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {AUTH_DOCUMENTATION.security.practices.map((practice, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">{practice}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Authentication Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>{AUTH_DOCUMENTATION.bestPractices.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {AUTH_DOCUMENTATION.bestPractices.practices.map((practice, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                    {practice.title}
                  </h4>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                    {practice.description}
                  </p>
                  <p className="text-xs text-gray-500 italic dark:text-gray-400">
                    <span className="font-medium">Benefit:</span> {practice.benefits}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Common Authentication Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Common Authentication Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {AUTH_DOCUMENTATION.errors.common.map((error, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {error.code}
                    </Badge>
                    <span className="font-medium">{error.message}</span>
                  </div>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">{error.solution}</p>
                  {error.details && (
                    <p className="text-xs text-gray-500 italic dark:text-gray-400">
                      {error.details}
                    </p>
                  )}
                  {error.example && (
                    <div className="mt-2">
                      <h5 className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        Example:
                      </h5>
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                        {error.example}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {AUTH_DOCUMENTATION.errors.troubleshooting.map((item, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.issue}</h4>
                  <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                    <ol className="list-inside list-decimal space-y-1 text-sm text-amber-700 dark:text-amber-300">
                      {item.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

export function EndpointsSection() {
  return (
    <Section id="endpoints" title="API Endpoints">
      <div className="space-y-8">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Complete reference for all available API endpoints with detailed parameters,
          request/response formats, and examples.
        </p>

        {API_ENDPOINTS.map((endpoint) => (
          <ApiEndpointDoc key={endpoint.id} endpoint={endpoint} />
        ))}
      </div>
    </Section>
  );
}

export function ModelsSection() {
  return (
    <Section id="models" title="AI Models">
      <div className="space-y-8">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Detailed information about available AI models, their capabilities, pricing, credit costs,
          and usage parameters. Each model has specific strengths and limitations to help you choose
          the best option for your use case.
        </p>

        {/* Model Selection Guide */}
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-6 dark:bg-blue-900/20">
          <h3 className="mb-4 text-xl font-semibold text-blue-900 dark:text-blue-100">
            Model Selection Guide
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-200">
                For High Quality
              </h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• DALL-E 3 - Best overall quality</li>
                <li>• Imagen 4 Ultra - Exceptional detail</li>
                <li>• Imagen 4 Preview - Latest features</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-200">
                For Speed & Cost
              </h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Imagen 4 Fast - Quick generation</li>
                <li>• DALL-E 2 - Multiple images</li>
                <li>• Imagen 3 Fast - Budget-friendly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Provider Sections */}
        {Object.entries(MODEL_DOCUMENTATION).map(([provider, models]) => (
          <div key={provider} className="space-y-6">
            <h3
              className="text-2xl font-semibold text-gray-900 capitalize dark:text-white"
              id={`models-${provider}`}
            >
              {provider === 'openai' ? 'OpenAI Models' : 'Google AI Models'}
            </h3>

            {/* Provider Model Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(models).map(([modelId, model]) => (
                <div
                  key={modelId}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">{model.name}</h4>
                    <ModelStatusIndicator provider={provider as any} modelId={modelId} />
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {model.description}
                  </p>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {model.creditCost && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {model.creditCost} credits
                      </span>
                    )}
                    {model.capabilities && model.capabilities.length > 0 && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        {model.capabilities.length} capabilities
                      </span>
                    )}
                    {/* Dynamic rate limit badge */}
                    {(() => {
                      const { getModelStatus } = useStatus();
                      const status = getModelStatus(provider as any, modelId);
                      if (status === 'limited') {
                        return (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            Limited availability
                          </span>
                        );
                      }
                      if (status === 'unavailable') {
                        return (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                            Unavailable
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Dynamic pricing and rate limit info */}
                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {provider === 'openai'
                          ? modelId === 'gpt-image-1'
                            ? '30 req/min'
                            : '50 req/min'
                          : modelId.includes('ultra')
                            ? '30 req/min'
                            : modelId.includes('fast')
                              ? '60 req/min'
                              : '40 req/min'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      <span>
                        {provider === 'openai'
                          ? modelId === 'dall-e-3'
                            ? 'Max 1'
                            : 'Max 10'
                          : modelId.includes('gemini')
                            ? 'Max 1'
                            : 'Max 8'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`#model-${provider}-${modelId}`}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View details →
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
// Individual Model Documentation Pages
export function ModelPages() {
  return (
    <>
      {Object.entries(MODEL_DOCUMENTATION).map(([provider, models]) =>
        Object.entries(models).map(([modelId, _]) => (
          <ModelDocumentationPage
            key={`${provider}-${modelId}`}
            providerId={provider}
            modelId={modelId}
          />
        )),
      )}
    </>
  );
}
