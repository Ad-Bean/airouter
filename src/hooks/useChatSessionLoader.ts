import { useCallback } from "react";
import { type Message, type ProviderResult } from "@/types/chat";

interface UseChatSessionLoaderProps {
  onMessagesLoaded: (messages: Message[]) => void;
  onSessionIdSet: (sessionId: string) => void;
  onError: (error: string) => void;
}

interface SessionResponse {
  session: {
    id: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      type: string;
      imageUrls: string[];
      providerData: unknown;
      createdAt: string;
    }>;
  };
}

export function useChatSessionLoader({
  onMessagesLoaded,
  onSessionIdSet,
  onError,
}: UseChatSessionLoaderProps) {
  // Helper function to convert URLs to proper API endpoints
  const convertToDisplayUrl = useCallback((url: string): string => {
    if (!url) return url;

    // If it's already a data URL, keep it
    if (url.startsWith("data:")) return url;

    // If it's already an API endpoint, keep it
    if (url.startsWith("/api/images/")) return url;

    // If it's an HTTP URL, keep it
    if (url.startsWith("http")) return url;

    // If it looks like an image ID (alphanumeric string), convert to API endpoint
    if (/^[a-zA-Z0-9_-]+$/.test(url) && url.length > 10) {
      console.log(`Converting image ID ${url} to API endpoint`);
      return `/api/images/${url}`;
    }

    // For any other URL, keep as is
    return url;
  }, []);

  // Process provider data into ProviderResult format
  const processProviderData = useCallback(
    (
      providerData: unknown,
      processedImageUrls: string[]
    ): ProviderResult[] | undefined => {
      if (!providerData) return undefined;

      // Helper function to create a provider result with proper validation
      const createProviderResult = (
        data: Partial<ProviderResult>,
        fallbackImages: string[] = [],
        index: number = 0
      ): ProviderResult => {
        // Get images from the data or use fallback
        let images = data.images || [];
        let displayUrls = data.displayUrls || data.images || [];

        // If no images in provider data, use fallback images
        if ((!images || images.length === 0) && fallbackImages.length > 0) {
          images = fallbackImages;
          displayUrls = fallbackImages;
        }

        // Convert all URLs to proper display URLs
        images = images.map(convertToDisplayUrl);
        displayUrls = displayUrls.map(convertToDisplayUrl);

        return {
          provider: data.provider || `provider-${index}`,
          model: data.model || null,
          images,
          displayUrls,
          // Mark any unfinished images as failed on session load
          status:
            data.status === "pending" || data.status === "generating"
              ? ("failed" as const)
              : data.status || "completed",
          error:
            data.status === "pending" || data.status === "generating"
              ? "Image generation was interrupted"
              : data.error,
          timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
        };
      };

      // Handle array of provider results
      if (Array.isArray(providerData)) {
        // Validate that array items look like ProviderResult objects
        const isValidProviderArray = providerData.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            ("provider" in item || "images" in item || "displayUrls" in item)
        );

        if (isValidProviderArray) {
          const providerArray = providerData as Partial<ProviderResult>[];

          // If we have processedImageUrls and providers don't have images, distribute them
          if (
            processedImageUrls.length > 0 &&
            providerArray.every((p) => !p.images || p.images.length === 0)
          ) {
            // Distribute images evenly among providers
            const imagesPerProvider = Math.ceil(
              processedImageUrls.length / providerArray.length
            );

            return providerArray.map((result, index) => {
              const startIndex = index * imagesPerProvider;
              const endIndex = Math.min(
                startIndex + imagesPerProvider,
                processedImageUrls.length
              );
              const providerImages = processedImageUrls.slice(
                startIndex,
                endIndex
              );

              return createProviderResult(result, providerImages, index);
            });
          } else {
            // Use images from each provider result
            return providerArray.map((result, index) =>
              createProviderResult(result, [], index)
            );
          }
        }
      }

      // Handle single provider result object
      if (typeof providerData === "object" && providerData !== null) {
        const singleResult = providerData as Partial<ProviderResult>;

        // Check if it looks like a ProviderResult
        if (
          "provider" in singleResult ||
          "images" in singleResult ||
          "displayUrls" in singleResult
        ) {
          return [createProviderResult(singleResult, processedImageUrls, 0)];
        }
      }

      // If providerData doesn't match expected format, return undefined
      // The caller will handle creating fallback provider results if needed
      return undefined;
    },
    [convertToDisplayUrl]
  );

  // Main function to load a chat session
  const loadChatSession = useCallback(
    async (sessionId: string) => {
      try {
        console.log("Loading chat session:", sessionId);
        const response = await fetch(`/api/chat/sessions/${sessionId}`);

        if (response.ok) {
          const data: SessionResponse = await response.json();
          console.log("Loaded session data:", data);

          const chatMessages = data.session.messages.map((msg) => {
            console.log(
              "Processing message:",
              msg.id,
              "type:",
              msg.type,
              "providerData type:",
              typeof msg.providerData,
              "imageUrls count:",
              msg.imageUrls?.length || 0
            );

            // Convert imageUrls to proper display URLs
            const processedImageUrls = msg.imageUrls
              ? msg.imageUrls.map(convertToDisplayUrl).filter(Boolean)
              : [];

            // Process provider data
            let providerResults = processProviderData(
              msg.providerData,
              processedImageUrls
            );

            // Create fallback provider results for image messages without proper provider data
            if (msg.type === "image") {
              if (!providerResults && processedImageUrls.length > 0) {
                // Create a single provider result for legacy data
                providerResults = [
                  {
                    provider: "legacy",
                    model: null,
                    images: processedImageUrls,
                    displayUrls: processedImageUrls,
                    status: "completed" as const,
                    timestamp: new Date(msg.createdAt),
                  },
                ];
                console.log("Created fallback provider result for legacy data");
              } else if (!providerResults && processedImageUrls.length === 0) {
                // Create empty provider result for image messages without images
                providerResults = [
                  {
                    provider: "unknown",
                    model: null,
                    images: [],
                    displayUrls: [],
                    status: "failed" as const,
                    error: "No images found",
                    timestamp: new Date(msg.createdAt),
                  },
                ];
                console.log(
                  "Created empty provider result for image message without images"
                );
              }
            }

            const processedMessage = {
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              type: msg.type as "text" | "image",
              imageUrls: processedImageUrls,
              providerResults,
              timestamp: new Date(msg.createdAt),
            };

            console.log(
              "Processed message",
              msg.id,
              "- Provider results:",
              providerResults?.length || 0,
              "Image URLs:",
              processedImageUrls.length
            );

            return processedMessage;
          });

          console.log("Processed messages:", chatMessages);
          onMessagesLoaded(chatMessages);
          onSessionIdSet(sessionId);
        } else if (response.status === 503) {
          console.error("Database temporarily unavailable");
          onError(
            "Database is temporarily unavailable. Some chat history may not load properly."
          );
        } else {
          console.error(
            "Failed to load session:",
            response.status,
            response.statusText
          );
          onError("Failed to load chat session. Please try again.");
        }
      } catch (error) {
        console.error("Failed to load chat session:", error);
        onError(
          "Unable to load chat history. Please check your connection and try again."
        );
      }
    },
    [
      convertToDisplayUrl,
      processProviderData,
      onMessagesLoaded,
      onSessionIdSet,
      onError,
    ]
  );

  return {
    loadChatSession,
  };
}
