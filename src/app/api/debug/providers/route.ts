import { NextResponse } from 'next/server';
import { PROVIDER_CONFIGS } from '@/config/providers';

export async function GET() {
  const providerDebug = Object.entries(PROVIDER_CONFIGS).map(([provider, config]) => ({
    provider,
    enabled: config.enabled,
    displayName: config.displayName,
    editingModels: config.models
      .filter((m) => m.supportsImageEditing)
      .map((m) => ({
        id: m.id,
        name: m.name,
        supportsImageEditing: m.supportsImageEditing,
      })),
    envVars: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      GOOGLE_CLOUD_PROJECT: !!process.env.GOOGLE_CLOUD_PROJECT,
      GOOGLE_CLOUD_LOCATION: !!process.env.GOOGLE_CLOUD_LOCATION,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    },
  }));

  return NextResponse.json({
    success: true,
    providers: providerDebug,
    editingProviders: Object.entries(PROVIDER_CONFIGS)
      .filter(
        ([, config]) => config.enabled && config.models.some((model) => model.supportsImageEditing),
      )
      .map(([provider]) => provider),
  });
}
