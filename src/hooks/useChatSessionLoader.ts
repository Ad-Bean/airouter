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

      if (Array.isArray(providerData)) {
        return (providerData as ProviderResult[]).map(
          (result: ProviderResult, index: number) => {
            // Try to get images from the result, or distribute from imageUrls
            let images = result.images || [];
            let displayUrls = result.displayUrls || result.images || [];

            // Convert all URLs to proper display URLs
            images = images.map(convertToDisplayUrl);
            displayUrls = displayUrls.map(convertToDisplayUrl);

            // If no images in provider data, try to use imageUrls as fallback
            if (
              (!images || images.length === 0) &&
              processedImageUrls &&
              processedImageUrls.length > 0
            ) {
              // For multiple providers, try to distribute images evenly
              const imagesPerProvider = Math.ceil(
                processedImageUrls.length /
                  (providerData as ProviderResult[]).length
              );
              const startIndex = index * imagesPerProvider;
              const endIndex = Math.min(
                startIndex + imagesPerProvider,
                processedImageUrls.length
              );
              const providerImages = processedImageUrls.slice(
                startIndex,
                endIndex
              );
              images = providerImages;
              displayUrls = providerImages;
            }

            return {
              provider: result.provider || "",
              model: result.model || null,
              images,
              displayUrls,
              // ChatGPT-like behavior: Mark any unfinished images as failed on session load
              status:
                result.status === "pending" || result.status === "generating"
                  ? ("failed" as const)
                  : result.status || "completed",
              error:
                result.status === "pending" || result.status === "generating"
                  ? "Image generation was interrupted"
                  : result.error,
              timestamp: result.timestamp
                ? new Date(result.timestamp)
                : undefined,
            };
          }
        );
      } else if (typeof providerData === "object") {
        // Handle single provider result or different format
        const singleResult = providerData as ProviderResult;
        let images = singleResult.images || processedImageUrls || [];
        let displayUrls =
          singleResult.displayUrls ||
          singleResult.images ||
          processedImageUrls ||
          [];

        // Convert all URLs to proper display URLs
        images = images.map(convertToDisplayUrl);
        displayUrls = displayUrls.map(convertToDisplayUrl);

        return [
          {
            provider: singleResult.provider || "",
            model: singleResult.model || null,
            images,
            displayUrls,
            // ChatGPT-like behavior: Mark any unfinished images as failed on session load
            status:
              singleResult.status === "pending" ||
              singleResult.status === "generating"
                ? ("failed" as const)
                : singleResult.status || "completed",
            error:
              singleResult.status === "pending" ||
              singleResult.status === "generating"
                ? "Image generation was interrupted"
                : singleResult.error,
            timestamp: singleResult.timestamp
              ? new Date(singleResult.timestamp)
              : undefined,
          },
        ];
      }

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
              "providerData:",
              msg.providerData,
              "imageUrls:",
              msg.imageUrls
            );

            // Convert imageUrls to proper display URLs
            const processedImageUrls = msg.imageUrls
              ? msg.imageUrls.map(convertToDisplayUrl)
              : [];
            console.log("Original imageUrls:", msg.imageUrls);
            console.log("Processed imageUrls:", processedImageUrls);

            // Process provider data
            let providerResults = processProviderData(
              msg.providerData,
              processedImageUrls
            );

            // If no provider results but we have imageUrls, create fallback provider results
            if (
              !providerResults &&
              processedImageUrls &&
              processedImageUrls.length > 0
            ) {
              providerResults = [
                {
                  provider: "unknown",
                  model: null,
                  images: processedImageUrls,
                  displayUrls: processedImageUrls,
                  status: "completed" as const,
                  timestamp: new Date(msg.createdAt),
                },
              ];
            }

            console.log(
              "Processed provider results for message",
              msg.id,
              ":",
              providerResults,
              "processed imageUrls:",
              processedImageUrls
            );

            return {
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              type: msg.type as "text" | "image",
              imageUrls: processedImageUrls,
              providerResults,
              timestamp: new Date(msg.createdAt),
            };
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
