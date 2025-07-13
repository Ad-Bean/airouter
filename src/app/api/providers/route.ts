import { NextResponse } from "next/server";
import { PROVIDER_CONFIGS, getEnabledProviders } from "@/config/providers";

export async function GET() {
  const enabledProviders = getEnabledProviders();

  return NextResponse.json({
    providers: PROVIDER_CONFIGS,
    enabled: enabledProviders.map((p) => p.name),
    count: enabledProviders.length,
  });
}
