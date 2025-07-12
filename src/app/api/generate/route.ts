import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkCredits, deductCredits } from "@/lib/credits";
import { generateWithOpenAI } from "@/lib/providers/openai";
import { generateWithOpenAIMock } from "@/lib/providers/openai-mock";
import { generateWithStabilityAI } from "@/lib/providers/stability";
import { generateWithReplicateSD } from "@/lib/providers/replicate";
import { generateWithGoogle } from "@/lib/providers/google";
import { isProviderEnabled } from "@/lib/config";

export type Provider = "openai" | "stability" | "replicate" | "google";

interface GenerateRequest {
  prompt: string;
  provider?: Provider;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  n?: number; // For OpenAI models
  sampleCount?: number; // For Google Vertex AI models
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: GenerateRequest = await request.json();
    const {
      prompt,
      provider = "openai",
      model,
      width = 1024,
      height = 1024,
      steps = 20,
      n,
      sampleCount,
    } = body;
    console.log(
      `Generating image with provider: ${provider}, model: ${model}, size: ${width}x${height}, steps: ${steps}`
    );

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Check if the provider is enabled
    if (!isProviderEnabled(provider)) {
      return NextResponse.json(
        {
          error: `Provider ${provider} is not available. Please check your API configuration.`,
        },
        { status: 400 }
      );
    }

    // Calculate generation cost and check credits
    const size = `${width}x${height}`;
    const creditCheck = await checkCredits(session.user.email, provider, model, size);
    
    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        { 
          error: "Insufficient credits", 
          required: creditCheck.required,
          available: creditCheck.available,
          message: "You need more credits to generate this image. Please purchase credits in the billing section."
        },
        { status: 402 }
      );
    }

    let result;

    switch (provider) {
      case "openai":
        // Use mock for testing if enabled
        if (process.env.USE_OPENAI_MOCK === "true") {
          result = await generateWithOpenAIMock({
            prompt,
            model:
              (model as "gpt-image-1" | "dall-e-2" | "dall-e-3" | undefined) ||
              "dall-e-2",
            size: `${width}x${height}` as
              | "256x256"
              | "512x512"
              | "1024x1024"
              | "1792x1024"
              | "1024x1792",
            n: n || 1,
          });
        } else {
          result = await generateWithOpenAI({
            prompt,
            model:
              (model as "gpt-image-1" | "dall-e-2" | "dall-e-3" | undefined) ||
              "dall-e-2",
            size: `${width}x${height}` as
              | "256x256"
              | "512x512"
              | "1024x1024"
              | "1792x1024"
              | "1024x1792",
            n: n || 1,
          });
        }
        break;

      case "stability":
        result = await generateWithStabilityAI({
          prompt,
          model: model || "stable-diffusion-xl-1024-v1-0",
          width,
          height,
          steps,
        });
        break;

      case "replicate":
        result = await generateWithReplicateSD({
          prompt,
          width,
          height,
          num_inference_steps: steps,
        });
        break;

      case "google":
        result = await generateWithGoogle({
          prompt,
          model: model || "imagen-4.0-generate-preview-06-06", // Updated to latest model
          sampleCount: sampleCount || 1,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid provider" },
          { status: 400 }
        );
    }

    // Deduct credits after successful generation
    const deductResult = await deductCredits({
      userId: session.user.email,
      provider,
      model,
      size,
      description: `Generated image: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`,
    });

    if (!deductResult.success) {
      console.error("Failed to deduct credits:", deductResult.error);
      // Still return success since image was generated
    }

    return NextResponse.json({
      success: true,
      provider,
      model: model || "default",
      creditsDeducted: deductResult.creditsDeducted,
      remainingCredits: deductResult.remainingCredits,
      ...result,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
