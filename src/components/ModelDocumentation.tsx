'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PROVIDER_CONFIGS } from '@/config/providers';
import { useStatus } from '@/lib/status-context';
import { Provider } from '@/lib/api';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Zap,
  Image as ImageIcon,
  Settings,
} from 'lucide-react';

interface ModelParameter {
  name: string;
  type: string;
  description: string;
  enum?: string[];
  default?: string | number | boolean;
  format?: string;
  required?: boolean;
}

interface ModelExample {
  prompt: string;
  settings: Record<string, unknown>;
  description?: string;
}

interface ModelDocumentationProps {
  providerId: string;
  modelId: string;
  name: string;
  description: string;
  capabilities: string[];
  pricing: string;
  creditCost?: number;
  parameters?: ModelParameter[];
  limitations?: string[];
  examples?: ModelExample[];
  status?: 'available' | 'unavailable' | 'limited';
  usageLimits?: {
    maxImages?: number;
    rateLimit?: string;
    concurrentRequests?: number;
  };
}

export function ModelDocumentation({
  providerId,
  modelId,
  name,
  description,
  capabilities,
  pricing,
  creditCost,
  parameters,
  limitations,
  examples,
  status: defaultStatus = 'available',
  usageLimits,
}: ModelDocumentationProps) {
  const provider = PROVIDER_CONFIGS[providerId as keyof typeof PROVIDER_CONFIGS];
  const modelConfig = provider?.models.find((m) => m.id === modelId);

  // Get real-time status from context
  const { getModelStatus } = useStatus();
  const realTimeStatus = getModelStatus(providerId as Provider, modelId);

  // Use real-time status if available, otherwise fall back to default
  const status = realTimeStatus || defaultStatus;

  const getStatusIcon = () => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unavailable':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'limited':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      case 'limited':
        return 'Limited Availability';
      default:
        return 'Available';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <Card id={`model-${providerId}-${modelId}`} className="scroll-mt-8">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">{name}</CardTitle>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {providerId}:{modelId}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>{getStatusText()}</Badge>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Capabilities and Pricing Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Capabilities */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold">Capabilities</h4>
              </div>
              <ul className="space-y-2">
                {capabilities.map((capability, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="mt-0.5 mr-2 h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{capability}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing and Credit Information */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold">Pricing & Credits</h4>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Market Pricing
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{pricing}</p>
                </div>
                {creditCost && (
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      AIRouter Credits
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {creditCost} credits per image
                      </p>
                      <Badge
                        className={
                          status === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }
                      >
                        {status === 'available' ? 'Current Rate' : 'Rate may vary'}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">1 credit = $0.10 USD</p>

                    {/* Dynamic pricing details based on model */}
                    {providerId === 'openai' && modelId === 'dall-e-3' && (
                      <div className="mt-2 border-t border-blue-200 pt-2 dark:border-blue-800">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                          Size-based pricing:
                        </p>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            1024×1024: 0.4 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            1792×1024: 0.8 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            1024×1792: 0.8 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            HD quality: 2× cost
                          </div>
                        </div>
                      </div>
                    )}

                    {providerId === 'openai' && modelId === 'dall-e-2' && (
                      <div className="mt-2 border-t border-blue-200 pt-2 dark:border-blue-800">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                          Size-based pricing:
                        </p>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            256×256: 0.16 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            512×512: 0.18 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            1024×1024: 0.2 credits
                          </div>
                        </div>
                      </div>
                    )}

                    {providerId === 'openai' && modelId === 'gpt-image-1' && (
                      <div className="mt-2 border-t border-blue-200 pt-2 dark:border-blue-800">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                          Quality-based pricing:
                        </p>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            Low: 0.11 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            Medium: 0.42 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            High: 1.67 credits
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            + token costs
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold">Usage Limits</h4>
              </div>
              <Badge
                className={
                  status === 'available'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : status === 'limited'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }
              >
                {status === 'available'
                  ? 'Normal Limits'
                  : status === 'limited'
                    ? 'Reduced Limits'
                    : 'Unavailable'}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Max Images */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Max Images</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {usageLimits?.maxImages || modelConfig?.maxImages || 1}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Per request</p>
              </div>

              {/* Rate Limit */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Rate Limit</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {usageLimits?.rateLimit ||
                    (status === 'limited'
                      ? '20 requests/minute'
                      : status === 'unavailable'
                        ? '0 requests/minute'
                        : providerId === 'openai'
                          ? '50 requests/minute'
                          : '40 requests/minute')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status === 'limited' && 'Temporarily reduced'}
                  {status === 'available' && 'Current limit'}
                  {status === 'unavailable' && 'Service unavailable'}
                </p>
              </div>

              {/* Concurrent Requests */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Concurrent</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {usageLimits?.concurrentRequests ||
                    (status === 'limited'
                      ? '1'
                      : status === 'unavailable'
                        ? '0'
                        : providerId === 'openai'
                          ? modelId === 'dall-e-3'
                            ? '3'
                            : '5'
                          : '4')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Parallel requests</p>
              </div>

              {/* Additional Rate Limit Info */}
              <div className="rounded-lg bg-purple-50 p-3 sm:col-span-3 dark:bg-purple-900/20">
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  <span className="font-medium">Note:</span> Rate limits are shared across all API
                  keys for your account.
                  {status === 'limited' &&
                    ' Current limits are temporarily reduced due to high demand.'}
                  {status === 'unavailable' &&
                    ' This model is currently unavailable. Please try again later or use an alternative model.'}
                </p>
              </div>
            </div>
          </div>

          {/* Limitations */}
          {limitations && limitations.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <h4 className="font-semibold">Limitations</h4>
              </div>
              <ul className="space-y-2">
                {limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="mt-0.5 mr-2 h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parameters */}
          {parameters && parameters.length > 0 && (
            <div>
              <h4 className="mb-3 font-semibold">Model Parameters</h4>
              <div className="space-y-4">
                {parameters.map((param, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800">
                        {param.name}
                      </code>
                      <Badge className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {param.type}
                      </Badge>
                      {param.required && (
                        <Badge className="bg-red-100 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                          required
                        </Badge>
                      )}
                      {param.default !== undefined && (
                        <span className="text-xs text-gray-500">
                          default: {JSON.stringify(param.default)}
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                      {param.description}
                    </p>
                    {param.format && (
                      <p className="mb-2 text-xs text-gray-500">Format: {param.format}</p>
                    )}
                    {param.enum && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500">Values:</span>
                        {param.enum.map((value, valueIndex) => (
                          <code
                            key={valueIndex}
                            className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-800"
                          >
                            {value}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Examples */}
          {examples && examples.length > 0 && (
            <div>
              <h4 className="mb-3 font-semibold">Usage Examples</h4>
              <div className="space-y-4">
                {examples.map((example, index) => (
                  <div key={index} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Example {index + 1}
                      </p>
                      {example.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {example.description}
                        </p>
                      )}
                    </div>
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                        Prompt:
                      </p>
                      <p className="rounded bg-white p-2 text-sm italic dark:bg-gray-900">
                        &quot;{example.prompt}&quot;
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                        Settings:
                      </p>
                      <pre className="overflow-x-auto rounded bg-white p-2 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                        <code>{JSON.stringify(example.settings, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Configuration Info */}
          {modelConfig && (
            <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4 dark:bg-blue-900/20">
              <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                AIRouter Configuration
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Supports Multiple Images:
                  </span>
                  <span className="font-medium">
                    {modelConfig.supportsImageCount ? 'Yes' : 'No'}
                  </span>
                </div>
                {modelConfig.maxImages && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Max Images per Request:
                    </span>
                    <span className="font-medium">{modelConfig.maxImages}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Supports Image Editing:</span>
                  <span className="font-medium">
                    {modelConfig.supportsImageEditing ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
