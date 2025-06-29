import Replicate from "replicate";

let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!replicateClient) {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("Replicate API token not configured");
    }
    replicateClient = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }
  return replicateClient;
}

export interface ReplicateSDParams {
  prompt: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  scheduler?: string;
}

export interface ReplicateSDResponse {
  images: string[];
  usage?: {
    prediction_id?: string;
  };
}

export async function generateWithReplicateSD(
  params: ReplicateSDParams
): Promise<ReplicateSDResponse> {
  const {
    prompt,
    width = 1024,
    height = 1024,
    num_inference_steps = 20,
    guidance_scale = 7.5,
    seed,
    scheduler = "DPMSolverMultistep",
  } = params;

  const replicate = getReplicateClient();

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt,
          width,
          height,
          num_inference_steps,
          guidance_scale,
          scheduler,
          seed: seed || Math.floor(Math.random() * 1000000),
        },
      }
    );

    const images = Array.isArray(output) ? output : [output].filter(Boolean);

    return {
      images: images as string[],
      usage: {
        prediction_id: "generated_with_sdk",
      },
    };
  } catch (error) {
    console.error("Replicate generation error:", error);
    throw new Error(
      `Replicate generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
