export interface StabilityGenerateParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  samples?: number;
}

export interface StabilityGenerateResponse {
  images: string[];
  usage?: {
    credits_consumed?: number;
  };
}

interface StabilityArtifact {
  base64: string;
  finishReason: string;
  seed: number;
}

interface StabilityResponse {
  artifacts: StabilityArtifact[];
}

export async function generateWithStabilityAI(
  params: StabilityGenerateParams
): Promise<StabilityGenerateResponse> {
  const {
    prompt,
    model = "stable-diffusion-xl-1024-v1-0",
    width = 1024,
    height = 1024,
    steps = 20,
    cfg_scale = 7,
    seed,
    samples = 1,
  } = params;

  if (!process.env.STABILITY_API_KEY) {
    throw new Error("Stability AI API key not configured");
  }

  try {
    const formData = new FormData();
    formData.append("text_prompts[0][text]", prompt);
    formData.append("text_prompts[0][weight]", "1");
    formData.append("width", width.toString());
    formData.append("height", height.toString());
    formData.append("steps", steps.toString());
    formData.append("cfg_scale", cfg_scale.toString());
    formData.append("samples", samples.toString());

    if (seed) {
      formData.append("seed", seed.toString());
    }

    const response = await fetch(
      `https://api.stability.ai/v1/generation/${model}/text-to-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Stability AI API error: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ""
        }`
      );
    }

    const data: StabilityResponse = await response.json();

    // Convert base64 images to data URLs
    const images =
      data.artifacts?.map(
        (artifact: StabilityArtifact) =>
          `data:image/png;base64,${artifact.base64}`
      ) || [];

    return {
      images,
      usage: {
        credits_consumed: data.artifacts?.length || 1,
      },
    };
  } catch (error) {
    console.error("Stability AI generation error:", error);
    throw new Error(
      `Stability AI generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
