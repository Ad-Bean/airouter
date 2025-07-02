"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { generateImage, type Provider } from "@/lib/api";
import {
  Send,
  Image as ImageIcon,
  User,
  Bot,
  Loader,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import { ChatNavigation } from "@/components/ChatNavigation";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ModelSelectorModal } from "@/components/ModelSelectorModal";
import { type Message, type ProviderResult } from "@/types/chat";
import { useChatSessionLoader } from "@/hooks/useChatSessionLoader";
import { useMessageSaver } from "@/hooks/useMessageSaver";

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    "openai",
  ]);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    google: "imagen-4.0-generate-preview-06-06",
  });
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        return saved === "true";
      }
      return window.innerWidth < 768;
    }
    return false;
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldUseDark =
      savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        localStorage.setItem("sidebarCollapsed", "true");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { loadChatSession } = useChatSessionLoader({
    onMessagesLoaded: (messages) => setMessages(messages),
    onSessionIdSet: (sessionId) => setCurrentSessionId(sessionId),
    onError: (error) => {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const { saveMessage } = useMessageSaver({
    currentSessionId,
    onSessionIdSet: (sessionId) => setCurrentSessionId(sessionId),
    onError: (error) => {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (sessionId && sessionId !== currentSessionId) {
      loadChatSession(sessionId);
    } else if (!sessionId && currentSessionId) {
      // If no session in URL but we have a current session, it means we're starting a new chat
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [searchParams, currentSessionId, loadChatSession]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session");
      if (sessionId && sessionId !== currentSessionId) {
        loadChatSession(sessionId);
      } else if (!sessionId && currentSessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentSessionId, loadChatSession]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput("");
    setErrorMessage(null);
    setIsGenerating(false); // Ensure generating state is reset
    router.push("/chat", { scroll: false });
  };

  const handleSidebarToggle = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", newCollapsed.toString());
    }
  };

  const handleModelChange = (provider: string, model: string) => {
    setSelectedModels((prev) => ({
      ...prev,
      [provider]: model,
    }));
  };

  // Function to reload current session messages from backend
  const reloadCurrentSession = useCallback(async () => {
    if (currentSessionId) {
      try {
        const response = await fetch(`/api/chat/sessions/${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.session?.messages) {
            // Convert backend messages to frontend format
            const loadedMessages: Message[] = data.session.messages.map(
              (msg: {
                id: string;
                role: string;
                content: string;
                type: string;
                imageUrls: string[];
                createdAt: string;
                providerData?: unknown;
              }) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                type: msg.type,
                imageUrls: msg.imageUrls || [],
                timestamp: new Date(msg.createdAt),
                // Reconstruct providerResults from providerData if available
                providerResults: msg.providerData
                  ? Array.isArray(msg.providerData)
                    ? msg.providerData
                    : [msg.providerData]
                  : undefined,
              })
            );
            setMessages(loadedMessages);
            console.log(
              `Reloaded ${loadedMessages.length} messages from backend for session ${currentSessionId}`
            );
          }
        }
      } catch (error) {
        console.error("Failed to reload session:", error);
      }
    }
  }, [currentSessionId]);

  // Periodic reload during image generation to ensure UI stays in sync
  const startPeriodicReload = useCallback(() => {
    const interval = setInterval(async () => {
      if (isGenerating && currentSessionId) {
        await reloadCurrentSession();
      }
    }, 3000); // Reload every 3 seconds during generation

    return () => clearInterval(interval);
  }, [isGenerating, currentSessionId, reloadCurrentSession]);

  // Start periodic reload when generation begins
  useEffect(() => {
    if (isGenerating) {
      const cleanup = startPeriodicReload();
      return cleanup;
    }
  }, [isGenerating, startPeriodicReload]);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (currentSessionId) {
      return currentSessionId;
    }

    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Chat", // Default title
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session?.id) {
          const newSessionId = data.session.id;
          setCurrentSessionId(newSessionId);
          // Update URL without reloading
          router.push(`/chat?session=${newSessionId}`, { scroll: false });
          return newSessionId;
        }
      } else {
        console.error(
          "Failed to create session:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }

    return null;
  }, [currentSessionId, router]);

  const handleSendMessage = useCallback(
    async (messageText?: string, providers?: Provider[]) => {
      const text = messageText || input.trim();
      if (!text || isGenerating) return;

      setErrorMessage(null);
      const sessionId = await ensureSession();
      if (!sessionId) {
        setErrorMessage("Failed to create chat session. Please try again.");
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        type: "text",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsGenerating(true);

      // Save user message and get the result
      const saveResult = await saveMessage(userMessage, { sessionId });

      // If message save failed, reload from backend to ensure consistency
      if (!saveResult.success) {
        await reloadCurrentSession();
      }

      try {
        if (isImageGenerationRequest()) {
          const providersToUse = providers || selectedProviders;
          const initialProviderResults: ProviderResult[] = providersToUse.map(
            (provider) => ({
              provider,
              model: selectedModels[provider] || null,
              images: [],
              displayUrls: [],
              status: "generating",
            })
          );
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "",
            type: "image",
            providerResults: initialProviderResults,
            timestamp: new Date(),
          };

          // Add message to UI immediately for responsiveness
          setMessages((prev) => [...prev, assistantMessage]);

          // Save the initial assistant message to backend
          const initialSaveResult = await saveMessage(assistantMessage, {
            sessionId,
          });
          if (!initialSaveResult.success) {
            console.error("Failed to save initial assistant message");
            await reloadCurrentSession();
            return;
          }

          // Generate images for each provider
          const providerPromises = providersToUse.map(
            async (provider, providerIndex) => {
              try {
                const result = await generateImage({
                  prompt: text,
                  provider,
                  model: selectedModels[provider],
                  width: 1024,
                  height: 1024,
                  steps: 20,
                });

                if (
                  result.success &&
                  result.images &&
                  result.images.length > 0
                ) {
                  console.log(
                    `${provider} generated ${result.images.length} images`
                  );

                  // Update UI with generated images (optimistic update)
                  const displayUrls = result.images.map((imageData) => {
                    if (imageData.startsWith("data:")) {
                      return imageData;
                    } else {
                      return `data:image/png;base64,${imageData}`;
                    }
                  });

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? {
                            ...msg,
                            providerResults: msg.providerResults?.map(
                              (providerResult, index) =>
                                index === providerIndex
                                  ? {
                                      ...providerResult,
                                      images: result.images || [],
                                      displayUrls,
                                      status: "saving" as const,
                                      timestamp: new Date(),
                                    }
                                  : providerResult
                            ),
                          }
                        : msg
                    )
                  );

                  // Save images to backend
                  if (
                    session?.user &&
                    "id" in session.user &&
                    session.user.id
                  ) {
                    const imagePromises =
                      result.images?.map(async (imageData) => {
                        try {
                          const saveResponse = await fetch("/api/images/save", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({
                              prompt: text,
                              imageData: imageData,
                              provider,
                              model: result.model,
                              width: 1024,
                              height: 1024,
                              steps: 20,
                            }),
                          });

                          if (saveResponse.ok) {
                            const saveData = await saveResponse.json();
                            console.log(
                              `Image from ${provider} saved successfully:`,
                              saveData
                            );

                            // Update display URL with saved image URL (optimistic update)
                            setMessages((prev) =>
                              prev.map((msg) =>
                                msg.id === assistantMessage.id
                                  ? {
                                      ...msg,
                                      providerResults: msg.providerResults?.map(
                                        (providerResult, index) =>
                                          index === providerIndex &&
                                          saveData.image?.displayUrl
                                            ? {
                                                ...providerResult,
                                                displayUrls:
                                                  providerResult.displayUrls?.map(
                                                    (url, urlIndex) => {
                                                      if (
                                                        urlIndex === 0 &&
                                                        saveData.image
                                                          ?.displayUrl
                                                      ) {
                                                        return saveData.image
                                                          .displayUrl;
                                                      }
                                                      return url;
                                                    }
                                                  ),
                                              }
                                            : providerResult
                                      ),
                                    }
                                  : msg
                              )
                            );
                          } else {
                            console.error(
                              `Failed to save image from ${provider}:`,
                              await saveResponse.text()
                            );
                          }
                        } catch (error) {
                          console.error(
                            `Error saving image from ${provider}:`,
                            error
                          );
                        }
                      }) || [];

                    await Promise.all(imagePromises);

                    // Mark provider as completed (optimistic update)
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? {
                              ...msg,
                              providerResults: msg.providerResults?.map(
                                (providerResult, index) =>
                                  index === providerIndex
                                    ? {
                                        ...providerResult,
                                        status: "completed" as const,
                                        timestamp: new Date(),
                                      }
                                    : providerResult
                              ),
                            }
                          : msg
                      )
                    );
                  }
                } else {
                  // Handle generation failure
                  console.error(
                    `${provider} generation failed:`,
                    result.error || "Unknown error"
                  );
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? {
                            ...msg,
                            providerResults: msg.providerResults?.map(
                              (providerResult, index) =>
                                index === providerIndex
                                  ? {
                                      ...providerResult,
                                      status: "failed" as const,
                                      error:
                                        result.error || "Generation failed",
                                    }
                                  : providerResult
                            ),
                          }
                        : msg
                    )
                  );
                }
              } catch (error) {
                // Handle provider error
                console.error(`Error with ${provider}:`, error);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          providerResults: msg.providerResults?.map(
                            (providerResult, index) =>
                              index === providerIndex
                                ? {
                                    ...providerResult,
                                    status: "failed" as const,
                                    error:
                                      error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                                  }
                                : providerResult
                          ),
                        }
                      : msg
                  )
                );
              }
            }
          );

          // Wait for all providers to complete
          await Promise.allSettled(providerPromises);

          // Save the final message state to backend
          setMessages((prev) => {
            const finalMessage = prev.find((m) => m.id === assistantMessage.id);
            if (finalMessage) {
              // Extract all image URLs from provider results
              const allImageUrls: string[] = [];
              if (finalMessage.providerResults) {
                finalMessage.providerResults.forEach((result) => {
                  if (result.displayUrls) {
                    allImageUrls.push(...result.displayUrls);
                  }
                });
              }

              const messageWithUrls = {
                ...finalMessage,
                imageUrls: allImageUrls,
              };

              // Save to backend asynchronously
              saveMessage(messageWithUrls, { sessionId }).catch(console.error);
            }
            return prev;
          });

          // Reload session from backend to ensure UI consistency
          await reloadCurrentSession();
        } else {
          // Regular text response (you can integrate with OpenAI's chat API here)
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "I'm currently specialized in generating images. Please describe an image you'd like me to create for you!",
            type: "text",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Save the text assistant message
          const textSaveResult = await saveMessage(assistantMessage, {
            sessionId,
          });

          // Reload from backend to ensure consistency
          if (!textSaveResult.success) {
            await reloadCurrentSession();
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "An error occurred"
        );
        // Clear error after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);

        // Reload session to ensure consistency after error
        await reloadCurrentSession();
      } finally {
        setIsGenerating(false);
      }
    },
    [
      input,
      isGenerating,
      ensureSession,
      saveMessage,
      selectedProviders,
      selectedModels,
      session?.user,
      reloadCurrentSession,
    ]
  );

  // Restore pending prompt and auto-generate if exists
  useEffect(() => {
    if (session && status === "authenticated") {
      const pendingPrompt = localStorage.getItem("pendingPrompt");
      const pendingProviders = localStorage.getItem("pendingProviders");
      const savedModels = localStorage.getItem("selectedModels");

      if (pendingPrompt) {
        setInput(pendingPrompt);
        localStorage.removeItem("pendingPrompt");
        // Note: We don't auto-send anymore, just restore the input
      }

      if (pendingProviders) {
        try {
          const providers = JSON.parse(pendingProviders);
          setSelectedProviders(providers);
          localStorage.removeItem("pendingProviders");
        } catch (error) {
          console.warn("Failed to parse pending providers:", error);
        }
      }

      // Restore saved model selections
      if (savedModels) {
        try {
          const models = JSON.parse(savedModels);
          setSelectedModels(models);
        } catch (error) {
          console.warn("Failed to parse saved models:", error);
        }
      }
    }
  }, [session, status]);

  // Save model selections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("selectedModels", JSON.stringify(selectedModels));
  }, [selectedModels]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleShowLogin = () => {
    // Redirect to home page to show login modal
    router.push("/?showLogin=true");
  };

  const handleShowRegister = () => {
    // Redirect to home page to show register modal
    router.push("/?showRegister=true");
  };

  const toggleProvider = (provider: Provider) => {
    setSelectedProviders((prev) => {
      if (prev.includes(provider)) {
        // Don't allow removing the last provider
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== provider);
      } else {
        return [...prev, provider];
      }
    });
  };

  const isImageGenerationRequest = (): boolean => {
    // In chat mode, we treat any prompt as an image generation request
    // since this is specifically an AI Image Generator Chat
    return true;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex">
      {/* Chat Sidebar */}
      <div className="flex-shrink-0">
        <ChatSidebar
          currentSessionId={currentSessionId || undefined}
          onNewChat={handleNewChat}
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative z-10 flex flex-col h-screen">
          {/* Navigation aligned with content area */}
          <div className="flex-shrink-0">
            <ChatNavigation
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onShowLogin={handleShowLogin}
              onShowRegister={handleShowRegister}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Error Message */}
            {errorMessage && (
              <div className="mx-2 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-2 h-2 text-white" />
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {errorMessage}
                  </p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Welcome to AI Image Generator Chat
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-md mx-auto text-sm">
                    Describe any image you&apos;d like me to create and
                    I&apos;ll generate it for you using advanced AI models.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Select your preferred AI models below and start creating!
                  </p>
                </div>
              )}

              {/* Chat Grid Layout */}
              <div className="space-y-3 px-1">
                {messages.map((message) => (
                  <div key={message.id} className="w-full">
                    {/* User Message */}
                    {message.role === "user" && (
                      <div className="flex justify-end mb-2">
                        <div className="flex flex-row-reverse max-w-2xl">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 ml-2 flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <div className="px-3 py-2 rounded-lg bg-blue-500 text-white">
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message with Provider Grid */}
                    {message.role === "assistant" && (
                      <div className="w-full">
                        {/* Provider Results Grid */}
                        {message.providerResults &&
                          message.providerResults.length > 0 && (
                            <div className="mb-2">
                              {/* Generation Header */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
                                  <Bot className="w-2.5 h-2.5 text-white" />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {message.providerResults.length > 1
                                    ? `${message.providerResults.length} AI models`
                                    : `${message.providerResults[0].provider}`}
                                  • {message.timestamp.toLocaleTimeString()}
                                </div>
                              </div>

                              <div
                                className="grid gap-2"
                                style={{
                                  gridTemplateColumns: `repeat(${Math.min(
                                    message.providerResults.length,
                                    4
                                  )}, 1fr)`,
                                }}
                              >
                                {message.providerResults.map(
                                  (providerResult, providerIndex) => (
                                    <div
                                      key={`${providerResult.provider}-${providerIndex}`}
                                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                      {/* Compact Provider Header */}
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <div
                                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                              providerResult.provider ===
                                              "openai"
                                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                                : providerResult.provider ===
                                                  "google"
                                                ? "bg-gradient-to-r from-blue-400 to-blue-600"
                                                : providerResult.provider ===
                                                  "stability"
                                                ? "bg-gradient-to-r from-purple-400 to-purple-600"
                                                : "bg-gradient-to-r from-orange-400 to-orange-600"
                                            }`}
                                          >
                                            <span className="text-xs font-bold text-white">
                                              {providerResult.provider ===
                                              "openai"
                                                ? "OAI"
                                                : providerResult.provider ===
                                                  "google"
                                                ? "IMG"
                                                : providerResult.provider ===
                                                  "stability"
                                                ? "STB"
                                                : providerResult.provider
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                          </div>
                                          <div>
                                            <div className="font-medium text-xs text-gray-900 dark:text-white">
                                              {providerResult.provider ===
                                                "openai" && "DALL-E"}
                                              {providerResult.provider ===
                                                "google" && "Imagen"}
                                              {providerResult.provider ===
                                                "stability" && "Stability"}
                                              {providerResult.provider ===
                                                "replicate" && "Replicate"}
                                            </div>
                                            {providerResult.model && (
                                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60px]">
                                                {providerResult.model.includes(
                                                  "4.0-fast"
                                                )
                                                  ? "Fast"
                                                  : providerResult.model.includes(
                                                      "4.0-ultra"
                                                    )
                                                  ? "Ultra"
                                                  : providerResult.model.includes(
                                                      "4.0"
                                                    )
                                                  ? "4.0"
                                                  : providerResult.model.includes(
                                                      "3.0"
                                                    )
                                                  ? "3.0"
                                                  : providerResult.model}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Compact Status Indicator */}
                                        <div className="flex items-center">
                                          {providerResult.status ===
                                            "pending" && (
                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          )}
                                          {providerResult.status ===
                                            "generating" && (
                                            <Loader className="w-3 h-3 animate-spin text-blue-500" />
                                          )}
                                          {providerResult.status ===
                                            "saving" && (
                                            <Loader className="w-3 h-3 animate-spin text-yellow-500" />
                                          )}
                                          {providerResult.status ===
                                            "completed" && (
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          )}
                                          {providerResult.status ===
                                            "failed" && (
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Compact Content Area */}
                                      <div className="min-h-[120px] relative">
                                        {/* Images */}
                                        {providerResult.displayUrls &&
                                          providerResult.displayUrls.length >
                                            0 && (
                                            <div className="space-y-1">
                                              {providerResult.displayUrls.map(
                                                (url, imageIndex) => {
                                                  const isDataUrl =
                                                    url.startsWith("data:");
                                                  const isExternalUrl =
                                                    url.startsWith("http") &&
                                                    !url.includes("localhost");
                                                  const needsUnoptimized =
                                                    isDataUrl || isExternalUrl;

                                                  return (
                                                    <div
                                                      key={imageIndex}
                                                      className="relative group"
                                                    >
                                                      <Image
                                                        src={url}
                                                        alt={`Generated by ${
                                                          providerResult.provider
                                                        } - Image ${
                                                          imageIndex + 1
                                                        }`}
                                                        width={200}
                                                        height={200}
                                                        className={`w-full aspect-square object-cover rounded border border-gray-200 dark:border-gray-600 transition-transform hover:scale-[1.02] ${
                                                          providerResult.status ===
                                                          "saving"
                                                            ? "opacity-75"
                                                            : ""
                                                        }`}
                                                        unoptimized={
                                                          needsUnoptimized
                                                        }
                                                        priority={
                                                          imageIndex === 0
                                                        }
                                                      />

                                                      {/* Saving overlay */}
                                                      {providerResult.status ===
                                                        "saving" && (
                                                        <div className="absolute inset-0 bg-yellow-100/50 dark:bg-yellow-900/30 rounded flex items-center justify-center">
                                                          <div className="text-center">
                                                            <Loader className="w-4 h-4 text-yellow-600 animate-spin mx-auto mb-1" />
                                                            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                                                              Saving...
                                                            </p>
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Compact overlay */}
                                                      {providerResult.status !==
                                                        "saving" && (
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                          <button
                                                            onClick={() =>
                                                              window.open(
                                                                url,
                                                                "_blank"
                                                              )
                                                            }
                                                            className="bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium transition-colors shadow-lg"
                                                          >
                                                            View
                                                          </button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          )}

                                        {/* Compact Loading State */}
                                        {providerResult.status ===
                                          "generating" && (
                                          <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-700/30 rounded border border-dashed border-gray-300 dark:border-gray-600">
                                            <div className="text-center">
                                              <Loader className="w-5 h-5 text-blue-500 animate-spin mx-auto mb-1" />
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Generating...
                                              </p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Compact Pending State */}
                                        {providerResult.status ===
                                          "pending" && (
                                          <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-700/30 rounded border border-dashed border-gray-300 dark:border-gray-600">
                                            <div className="text-center">
                                              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-1 animate-pulse"></div>
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Waiting...
                                              </p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Compact Error State */}
                                        {providerResult.status === "failed" && (
                                          <div className="flex items-center justify-center h-32 bg-red-50 dark:bg-red-900/20 rounded border border-dashed border-red-200 dark:border-red-800">
                                            <div className="text-center px-2">
                                              <div className="w-5 h-5 bg-red-200 dark:bg-red-800 rounded-full mx-auto mb-1 flex items-center justify-center">
                                                <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                              </div>
                                              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                Failed
                                              </p>
                                              {providerResult.error && (
                                                <p className="text-xs text-red-500 dark:text-red-400 mt-1 truncate">
                                                  {providerResult.error.length >
                                                  20
                                                    ? providerResult.error.substring(
                                                        0,
                                                        20
                                                      ) + "..."
                                                    : providerResult.error}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Text message fallback */}
                        {message.content && message.content.trim() && (
                          <div className="flex items-start mb-2">
                            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-500 mr-2 flex items-center justify-center">
                              <Bot className="w-2.5 h-2.5 text-white" />
                            </div>
                            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Legacy imageUrls support */}
                        {message.imageUrls &&
                          message.imageUrls.length > 0 &&
                          !message.providerResults && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {message.imageUrls.map((url, index) => {
                                const isDataUrl = url.startsWith("data:");
                                const isExternalUrl =
                                  url.startsWith("http") &&
                                  !url.includes("localhost");
                                const needsUnoptimized =
                                  isDataUrl || isExternalUrl;

                                return (
                                  <Image
                                    key={index}
                                    src={url}
                                    alt={`Generated image ${index + 1}`}
                                    width={250}
                                    height={250}
                                    className="w-full aspect-square object-cover rounded border border-gray-200 dark:border-gray-600"
                                    unoptimized={needsUnoptimized}
                                    priority={index === 0}
                                  />
                                );
                              })}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isGenerating && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center">
                      <Bot className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Setting up generation with{" "}
                      {selectedProviders.length > 1
                        ? `${selectedProviders.length} AI models`
                        : selectedProviders
                            .map((p) =>
                              p === "openai"
                                ? "OpenAI DALL-E"
                                : p === "stability"
                                ? "Stability AI"
                                : p === "google"
                                ? "Google Imagen"
                                : "Replicate"
                            )
                            .join(", ")}
                      ...
                    </div>
                  </div>
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(
                        selectedProviders.length,
                        4
                      )}, 1fr)`,
                    }}
                  >
                    {selectedProviders.map((provider) => (
                      <div
                        key={provider}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 animate-pulse"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                          </div>
                        </div>
                        <div className="h-40 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
              {/* Provider Selection */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    AI Models{" "}
                    {selectedProviders.length > 1 && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        (Simultaneous)
                      </span>
                    )}
                    :
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedProviders.length} selected
                    </span>
                    <button
                      onClick={() => setShowModelSelector(true)}
                      className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Configure
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    ["openai", "replicate", "stability", "google"] as Provider[]
                  ).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => toggleProvider(provider)}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                        selectedProviders.includes(provider)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      {provider === "openai" && " (DALL-E)"}
                      {provider === "stability" && " (SDXL)"}
                      {provider === "google" && " (Imagen)"}
                      {selectedModels[provider] && provider === "google" && (
                        <span className="ml-1 text-xs opacity-75">
                          {selectedModels[provider].includes("4.0-fast")
                            ? "Fast"
                            : selectedModels[provider].includes("4.0-ultra")
                            ? "Ultra"
                            : selectedModels[provider].includes("4.0")
                            ? "4.0"
                            : selectedModels[provider].includes("3.0")
                            ? "3.0"
                            : ""}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe the image you want to generate..."
                    disabled={isGenerating}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isGenerating}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm">Generate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Selector Modal */}
        <ModelSelectorModal
          isOpen={showModelSelector}
          onClose={() => setShowModelSelector(false)}
          selectedProviders={selectedProviders}
          selectedModels={selectedModels}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
