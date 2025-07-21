import { NextResponse } from 'next/server';
import { PROVIDER_CONFIGS } from '@/config/providers';
import { Provider } from '@/lib/api';

// This would typically connect to actual provider APIs to check status
// For now, we'll simulate status checks with mock data
async function checkProviderStatus(provider: Provider): Promise<{
  status: 'operational' | 'degraded' | 'outage';
  models: Record<string, 'available' | 'unavailable' | 'limited'>;
  lastChecked: string;
}> {
  // In a real implementation, this would make API calls to check actual status
  // For now, we'll return mock data with mostly operational services
  // and a few random issues to demonstrate the UI

  const models = PROVIDER_CONFIGS[provider].models.reduce(
    (acc, model) => {
      // Randomly assign status for demonstration purposes
      // In production, this would be based on actual API health checks
      const random = Math.random();
      let status: 'available' | 'unavailable' | 'limited';

      if (random > 0.9) {
        status = 'unavailable'; // 10% chance of being unavailable
      } else if (random > 0.7) {
        status = 'limited'; // 20% chance of being limited
      } else {
        status = 'available'; // 70% chance of being available
      }

      acc[model.id] = status;
      return acc;
    },
    {} as Record<string, 'available' | 'unavailable' | 'limited'>,
  );

  // Determine overall provider status based on model statuses
  const unavailableCount = Object.values(models).filter((s) => s === 'unavailable').length;
  const limitedCount = Object.values(models).filter((s) => s === 'limited').length;
  const totalModels = Object.keys(models).length;

  let status: 'operational' | 'degraded' | 'outage';

  if (unavailableCount > totalModels / 2) {
    status = 'outage';
  } else if (unavailableCount > 0 || limitedCount > totalModels / 3) {
    status = 'degraded';
  } else {
    status = 'operational';
  }

  return {
    status,
    models,
    lastChecked: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const providers = Object.keys(PROVIDER_CONFIGS) as Provider[];
    const statusPromises = providers.map(async (provider) => {
      const status = await checkProviderStatus(provider);
      return [provider, status];
    });

    const statusResults = await Promise.all(statusPromises);
    const statusMap = Object.fromEntries(statusResults);

    return NextResponse.json({
      providers: statusMap,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking provider status:', error);
    return NextResponse.json({ error: 'Failed to check provider status' }, { status: 500 });
  }
}
