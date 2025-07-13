import Image from "next/image";

interface GeneratedImagesDisplayProps {
  images: string[];
  isGenerating: boolean;
  selectedProviders: string[];
}

export function GeneratedImagesDisplay({
  images,
  isGenerating,
  selectedProviders,
}: GeneratedImagesDisplayProps) {
  if (isGenerating) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Generating your image with{" "}
          {selectedProviders
            .map((p) =>
              p === "openai"
                ? "OpenAI DALL-E"
                : p === "google"
                ? "Google Imagen"
                : p
            )
            .join(", ")}
          ...
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          This may take 10-30 seconds
        </p>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Generated Images
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <Image
              src={imageUrl}
              alt={`Generated image ${index + 1}`}
              width={512}
              height={512}
              className="w-full h-auto rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
              <button
                onClick={() => window.open(imageUrl, "_blank")}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-2 bg-white bg-opacity-90 rounded-lg text-gray-900 font-medium hover:bg-opacity-100"
              >
                View Full Size
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
