import { NextResponse } from "next/server";
import { providerConfigs, getEnabledProviders } from "@/lib/config";

export async function GET() {
  const enabledProviders = getEnabledProviders();

  return NextResponse.json({
    providers: providerConfigs,
    enabled: enabledProviders.map((p) => p.name),
    count: enabledProviders.length,
  });
}
