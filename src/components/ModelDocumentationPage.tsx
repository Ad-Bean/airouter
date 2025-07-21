'use client';

import { useState, useEffect } from 'react';
import { ModelDocumentation } from '@/components/ModelDocumentation';
import { Section } from '@/components/ApiDocsContent';
import { MODEL_DOCUMENTATION } from '@/lib/api-docs-data';
import { PROVIDER_CONFIGS } from '@/config/providers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useStatus } from '@/lib/status-context';
import { Provider } from '@/lib/api';

interface ModelDocumentationPageProps {
  providerId: string;
  modelId: string;
}

export function ModelDocumentationPage({ providerId, modelId }: ModelDocumentationPageProps) {
  // Get model data from documentation
  const modelData = MODEL_DOCUMENTATION[providerId]?.[modelId];
  const providerConfig = PROVIDER_CONFIGS[providerId as keyof typeof PROVIDER_CONFIGS];
  const modelConfig = providerConfig?.models.find((m) => m.id === modelId);

  // Get real-time status from context
  const { getModelStatus } = useStatus();
  const realTimeStatus = getModelStatus(providerId as Provider, modelId);

  // Use real-time status if available, otherwise fall back to default from documentation
  const modelStatus = realTimeStatus || modelData?.status || 'available';

  if (!modelData) {
    return (
      <Section id={`model-${providerId}-${modelId}`} title="Model Not Found">
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex items-center">
            <AlertCircle className="mr-3 h-5 w-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">
              The requested model documentation could not be found.
            </p>
          </div>
        </div>
      </Section>
    );
  }

  const getStatusBadge = () => {
    switch (modelStatus) {
      case 'available':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Available
            </Badge>
          </div>
        );
      case 'unavailable':
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Unavailable
            </Badge>
          </div>
        );
      case 'limited':
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Limited Availability
            </Badge>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Section id={`model-${providerId}-${modelId}`} title={modelData.name}>
      <div className="space-y-8">
        {/* Model Header with Status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {providerConfig?.displayName || providerId}
            </Badge>
            <p className="text-lg text-gray-600 dark:text-gray-300">{modelData.description}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Real-time Pricing and Credit Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pricing & Credits</CardTitle>
            <div className="flex items-center gap-2">{getStatusBadge()}</div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="mb-2 font-medium">Market Pricing</h4>
                <p className="text-gray-700 dark:text-gray-300">{modelData.pricing}</p>

                {/* Provider-specific pricing details */}
                {providerId === 'openai' && (
                  <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <h5 className="mb-2 text-sm font-medium">OpenAI Pricing Details</h5>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {modelId === 'dall-e-3' && (
                        <>
                          <p>• Standard quality: $0.04 per 1024×1024 image</p>
                          <p>• HD quality: $0.08 per image (all sizes)</p>
                          <p>• Rectangular formats: $0.08 per image</p>
                        </>
                      )}
                      {modelId === 'dall-e-2' && (
                        <>
                          <p>• 1024×1024: $0.02 per image</p>
                          <p>• 512×512: $0.018 per image</p>
                          <p>• 256×256: $0.016 per image</p>
                        </>
                      )}
                      {modelId === 'gpt-image-1' && (
                        <>
                          <p>• Low quality: $0.011 per image</p>
                          <p>• Medium quality: $0.042 per image</p>
                          <p>• High quality: $0.167 per image</p>
                          <p>• Additional token costs apply</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {providerId === 'google' && (
                  <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <h5 className="mb-2 text-sm font-medium">Google AI Pricing Details</h5>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {modelId.includes('ultra') && <p>• Premium tier: $0.06 per image</p>}
                      {modelId.includes('standard') && <p>• Standard tier: $0.04 per image</p>}
                      {modelId.includes('preview') && <p>• Preview tier: $0.04 per image</p>}
                      {modelId.includes('fast') && <p>• Fast tier: $0.02 per image</p>}
                      {modelId.includes('gemini') && (
                        <>
                          <p>• Base image cost: $0.04 per image</p>
                          <p>• Additional token costs may apply</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {modelData.creditCost && (
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                    AIRouter Credits
                  </h4>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-blue-700 dark:text-blue-300">
                      {modelData.creditCost} credits per image
                    </p>
                    <Badge
                      className={
                        modelStatus === 'available'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }
                    >
                      {modelStatus === 'available' ? 'Current Rate' : 'Rate may vary'}
                    </Badge>
                  </div>
                  <p className="mb-3 text-sm text-blue-600 dark:text-blue-400">
                    1 credit = $0.10 USD
                  </p>

                  {/* Credit package information */}
                  <div className="mt-3 border-t border-blue-200 pt-3 dark:border-blue-800">
                    <h5 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                      Credit Packages
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        50 credits: $4.99
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        100 credits: $9.99
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        150 credits: $14.99
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        500 credits: $45.99
                      </div>
                    </div>
                  </div>

                  {/* Dynamic rate limit information */}
                  <div className="mt-3 border-t border-blue-200 pt-3 dark:border-blue-800">
                    <h5 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                      Current Rate Limits
                    </h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                        <span>Requests per minute:</span>
                        <span className="font-medium">
                          {providerId === 'openai'
                            ? modelId === 'gpt-image-1'
                              ? '30'
                              : '50'
                            : modelId.includes('ultra')
                              ? '30'
                              : modelId.includes('fast')
                                ? '60'
                                : '40'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                        <span>Max images per request:</span>
                        <span className="font-medium">
                          {providerId === 'openai'
                            ? modelId === 'dall-e-3'
                              ? '1'
                              : '10'
                            : modelId.includes('gemini')
                              ? '1'
                              : '8'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                        <span>Concurrent requests:</span>
                        <span className="font-medium">
                          {providerId === 'openai'
                            ? modelId === 'dall-e-3'
                              ? '3'
                              : '5'
                            : modelId.includes('ultra')
                              ? '2'
                              : modelId.includes('fast')
                                ? '6'
                                : '4'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Full Model Documentation Component */}
        <ModelDocumentation
          providerId={providerId}
          modelId={modelId}
          name={modelData.name}
          description={modelData.description}
          capabilities={modelData.capabilities}
          pricing={modelData.pricing}
          creditCost={modelData.creditCost}
          parameters={modelData.parameters}
          limitations={modelData.limitations}
          examples={modelData.examples}
          status={modelStatus}
          usageLimits={modelData.usageLimits}
        />

        {/* Related Models Section */}
        {providerConfig?.models.length > 1 && (
          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold">
              Other {providerConfig.displayName} Models
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providerConfig.models
                .filter((model) => model.id !== modelId)
                .map((model) => (
                  <Card key={model.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{model.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        {model.description}
                      </p>
                      <a
                        href={`#model-${providerId}-${model.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View details →
                      </a>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
