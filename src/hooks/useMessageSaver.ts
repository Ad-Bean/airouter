import { useCallback } from "react";
import { type Message } from "@/types/chat";

interface UseMessageSaverProps {
  currentSessionId: string | null;
  onSessionIdSet: (sessionId: string) => void;
  onError?: (error: string) => void;
}

interface SaveMessageOptions {
  sessionId?: string;
}

export function useMessageSaver({
  currentSessionId,
  onSessionIdSet,
  onError,
}: UseMessageSaverProps) {
  // Helper function to extract image URLs from provider results
  const extractImageUrls = useCallback((message: Message): string[] => {
    const allImageUrls: string[] = [];

    if (message.providerResults) {
      message.providerResults.forEach((result) => {
        if (result.displayUrls) {
          // Extract image IDs from API endpoints and store those
          const imageIds = result.displayUrls
            .filter((url) => url && url.startsWith("/api/images/"))
            .map((url) => {
              const match = url.match(/\/api\/images\/(.+)$/);
              if (match) {
                console.log(`Extracting image ID ${match[1]} from URL ${url}`);
                return match[1]; // Store just the ID
              }
              return url; // Fallback to full URL
            })
            .filter(Boolean);

          if (imageIds.length > 0) {
            allImageUrls.push(...imageIds);
          } else {
            // Fallback: filter out base64 URLs but keep others
            const nonBase64Urls = result.displayUrls.filter(
              (url) => url && !url.startsWith("data:")
            );
            allImageUrls.push(...nonBase64Urls);
          }
        }
      });
    }

    // If we have explicit imageUrls, include them too (but prefer image IDs)
    if (message.imageUrls) {
      const messageUrls = message.imageUrls
        .filter((url) => url && !url.startsWith("data:")) // Filter out base64
        .map((url) => {
          // If it's an API endpoint, extract the ID
          if (url.startsWith("/api/images/")) {
            const match = url.match(/\/api\/images\/(.+)$/);
            return match ? match[1] : url;
          }
          return url;
        });

      // Only add if we don't already have URLs from provider results
      if (allImageUrls.length === 0) {
        allImageUrls.push(...messageUrls);
      }
    }

    return allImageUrls;
  }, []);

  // Main save message function
  const saveMessage = useCallback(
    async (message: Message, options?: SaveMessageOptions) => {
      try {
        console.log(
          "Saving message:",
          message.id,
          "with providerResults:",
          message.providerResults
        );

        const effectiveSessionId = options?.sessionId || currentSessionId;
        const allImageUrls = extractImageUrls(message);

        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: effectiveSessionId,
            role: message.role,
            content: message.content,
            type: message.type,
            imageUrls: allImageUrls,
            providerData: message.providerResults,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Message saved successfully:", data);

          // If we provided a sessionId explicitly, update our current session state
          const returnedSessionId = options?.sessionId || data.sessionId;
          if (!currentSessionId && returnedSessionId) {
            onSessionIdSet(returnedSessionId);
            // Update URL without reloading
            window.history.pushState(
              {},
              "",
              `/chat?session=${returnedSessionId}`
            );
          }

          return {
            success: true,
            data,
            sessionId: returnedSessionId,
          };
        } else {
          const errorText = await response.text();
          console.error("Failed to save message:", response.status, errorText);

          if (response.status === 503) {
            console.warn(
              "Database temporarily unavailable - message not saved"
            );
            // Don't show alert for every message save failure, just log it
            return {
              success: false,
              error: "Database temporarily unavailable",
              isTemporary: true,
            };
          }

          const errorMessage = `Failed to save message: ${response.status}`;
          onError?.(errorMessage);

          return {
            success: false,
            error: errorMessage,
            isTemporary: false,
          };
        }
      } catch (error) {
        console.error("Failed to save message:", error);
        const errorMessage =
          "Unable to save message. Please check your connection.";
        onError?.(errorMessage);

        return {
          success: false,
          error: errorMessage,
          isTemporary: false,
        };
      }
    },
    [currentSessionId, extractImageUrls, onSessionIdSet, onError]
  );

  return {
    saveMessage,
    extractImageUrls,
  };
}
