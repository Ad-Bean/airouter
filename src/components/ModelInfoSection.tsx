'use client';

export function ModelInfoSection() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
      <h5 className="mb-1 font-medium text-blue-900 dark:text-blue-100">Model Information</h5>
      <p className="text-sm text-blue-700 dark:text-blue-300">
        • <strong>GPT Image 1:</strong> OpenAI&apos;s latest image generation model (up to 10
        images)
        <br />• <strong>DALL-E 3:</strong> Highest quality, single image generation
        <br />• <strong>DALL-E 2:</strong> Faster generation, supports multiple images
        <br />• <strong>Imagen 4.0:</strong> Google&apos;s latest with configurable sample count
        <br />• <strong>Gemini 2.0:</strong> Google&apos;s model with image generation and editing
        <br />• <strong>Preview models:</strong> Latest features, may have limitations
      </p>
      <div className="mt-3">
        <h6 className="font-medium text-blue-900 dark:text-blue-100">Model Options:</h6>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          • <strong>Quality:</strong> Controls output quality (OpenAI models)
          <br />• <strong>Style:</strong> Vivid or natural style (DALL-E 3)
          <br />• <strong>Moderation:</strong> Content filtering level (GPT Image 1)
          <br />• <strong>Safety Setting:</strong> Content filtering strictness (Google)
          <br />• <strong>Person Generation:</strong> Allow adult person generation (Google)
          <br />• <strong>Enhance Prompt:</strong> Automatically improve prompts (Google)
          <br />• <strong>Add Watermark:</strong> Add Google watermark to images (Google)
        </p>
      </div>
    </div>
  );
}
