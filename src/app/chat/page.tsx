"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { generateImage, type Provider, providerModels } from "@/lib/api";
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
import { Navigation } from "@/components/Navigation";

interface ProviderResult {
  provider: string;
  model: string | null;
  images: string[];
  displayUrls?: string[];
  status: "pending" | "generating" | "completed" | "failed";
  error?: string;
  timestamp?: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
  imageUrls?: string[];
  providerResults?: ProviderResult[];
  timestamp: Date;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    "openai",
  ]);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    google: "imagen-4.0-generate-preview-06-06", // Default to latest
  });
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldUseDark =
      savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (messageText?: string, providers?: Provider[]) => {
      const text = messageText || input.trim();
      if (!text || isGenerating) return;

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

      try {
        if (isImageGenerationRequest()) {
          const providersToUse = providers || selectedProviders;

          // Initialize provider results
          const initialProviderResults: ProviderResult[] = providersToUse.map(
            (provider) => ({
              provider,
              model: selectedModels[provider] || null,
              images: [],
              displayUrls: [],
              status: "pending",
            })
          );

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I'll generate images for you using ${
              providersToUse.length > 1
                ? `${providersToUse.length} AI models`
                : providersToUse[0]
            }: "${text}"`,
            type: "image",
            providerResults: initialProviderResults,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Update each provider's status to generating
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    providerResults: msg.providerResults?.map((result) => ({
                      ...result,
                      status: "generating" as const,
                    })),
                  }
                : msg
            )
          );

          // Generate images from each provider independently
          providersToUse.forEach(async (provider, providerIndex) => {
            try {
              const result = await generateImage({
                prompt: text,
                provider,
                model: selectedModels[provider],
                width: 1024,
                height: 1024,
                steps: 20,
              });

              if (result.success && result.images && result.images.length > 0) {
                // Process display URLs
                const displayUrls = result.images.map((imageData) => {
                  if (imageData.startsWith("data:")) {
                    return imageData;
                  } else {
                    return `data:image/png;base64,${imageData}`;
                  }
                });

                // Update this specific provider's result
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
                                    status: "completed" as const,
                                    timestamp: new Date(),
                                  }
                                : providerResult
                          ),
                        }
                      : msg
                  )
                );

                // Save images to database if user is authenticated
                if (session?.user && "id" in session.user && session.user.id) {
                  result.images?.forEach(async (imageData, imageIndex) => {
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
                          `Image from ${provider} saved successfully`
                        );

                        // Update display URL with saved image URL
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
                                            displayUrls:
                                              providerResult.displayUrls?.map(
                                                (url, urlIndex) =>
                                                  urlIndex === imageIndex &&
                                                  saveData.image?.displayUrl
                                                    ? saveData.image.displayUrl
                                                    : url
                                              ),
                                          }
                                        : providerResult
                                  ),
                                }
                              : msg
                          )
                        );
                      } else {
                        console.error(`Failed to save image from ${provider}`);
                      }
                    } catch (saveError) {
                      console.error(
                        `Error saving image from ${provider}:`,
                        saveError
                      );
                    }
                  });
                }
              } else {
                // Mark as failed
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
                                    error: "No images generated",
                                    timestamp: new Date(),
                                  }
                                : providerResult
                          ),
                        }
                      : msg
                  )
                );
              }
            } catch (providerError) {
              console.warn(`Provider ${provider} failed:`, providerError);

              // Mark as failed
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
                                    providerError instanceof Error
                                      ? providerError.message
                                      : "Unknown error",
                                  timestamp: new Date(),
                                }
                              : providerResult
                        ),
                      }
                    : msg
                )
              );
            }
          });
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
        }
      } catch {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          type: "text",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsGenerating(false);
      }
    },
    [input, isGenerating, selectedProviders, selectedModels, session]
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
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/30 dark:to-gray-900/30"></div>
      <div className="relative z-10">
        <Navigation
          isDark={isDark}
          mounted={mounted}
          onToggleTheme={toggleTheme}
          onShowLogin={handleShowLogin}
          onShowRegister={handleShowRegister}
        />

        <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <ImageIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Welcome to AI Image Generator Chat
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                  Describe any image you&apos;d like me to create and I&apos;ll
                  generate it for you using advanced AI models.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Select your preferred AI models below and start creating!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-xs lg:max-w-2xl ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-blue-500 ml-2"
                        : "bg-gray-500 mr-2"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>

                    {/* Provider Results Gallery */}
                    {message.providerResults &&
                      message.providerResults.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {message.providerResults.map(
                            (providerResult, providerIndex) => (
                              <div
                                key={`${providerResult.provider}-${providerIndex}`}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
                              >
                                {/* Provider Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                      <span className="text-xs font-bold text-white">
                                        {providerResult.provider
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                                        {providerResult.provider
                                          .charAt(0)
                                          .toUpperCase() +
                                          providerResult.provider.slice(1)}
                                        {providerResult.provider === "openai" &&
                                          " (DALL-E)"}
                                        {providerResult.provider ===
                                          "stability" && " (SDXL)"}
                                        {providerResult.provider === "google" &&
                                          " (Imagen)"}
                                      </div>
                                      {providerResult.model && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {providerResult.model}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status Indicator */}
                                  <div className="flex items-center gap-2">
                                    {providerResult.status === "pending" && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span className="text-xs text-gray-500">
                                          Pending
                                        </span>
                                      </div>
                                    )}
                                    {providerResult.status === "generating" && (
                                      <div className="flex items-center gap-1">
                                        <Loader className="w-3 h-3 animate-spin text-blue-500" />
                                        <span className="text-xs text-blue-500">
                                          Generating...
                                        </span>
                                      </div>
                                    )}
                                    {providerResult.status === "completed" && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-600 dark:text-green-400">
                                          Completed
                                        </span>
                                        {providerResult.timestamp && (
                                          <span className="text-xs text-gray-400">
                                            {providerResult.timestamp.toLocaleTimeString()}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {providerResult.status === "failed" && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-xs text-red-500">
                                          Failed
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Images Grid */}
                                {providerResult.displayUrls &&
                                  providerResult.displayUrls.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                                                } - Image ${imageIndex + 1}`}
                                                width={256}
                                                height={256}
                                                className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-600 transition-transform hover:scale-105"
                                                unoptimized={needsUnoptimized}
                                                priority={imageIndex === 0}
                                              />

                                              {/* Image overlay with download/view options */}
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <button
                                                  onClick={() =>
                                                    window.open(url, "_blank")
                                                  }
                                                  className="bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                                                >
                                                  View Full
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                {/* Error Message */}
                                {providerResult.status === "failed" &&
                                  providerResult.error && (
                                    <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                                      Error: {providerResult.error}
                                    </div>
                                  )}

                                {/* Loading placeholder for generating status */}
                                {providerResult.status === "generating" && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {[1, 2].map((i) => (
                                      <div
                                        key={i}
                                        className="w-full aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse flex items-center justify-center"
                                      >
                                        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* Legacy imageUrls support (for backward compatibility) */}
                    {message.imageUrls &&
                      message.imageUrls.length > 0 &&
                      !message.providerResults && (
                        <div className="mt-2 space-y-2">
                          {message.imageUrls.map((url, index) => {
                            const isDataUrl = url.startsWith("data:");
                            const isExternalUrl =
                              url.startsWith("http") &&
                              !url.includes("localhost");
                            const needsUnoptimized = isDataUrl || isExternalUrl;

                            return (
                              <Image
                                key={index}
                                src={url}
                                alt={`Generated image ${index + 1}`}
                                width={512}
                                height={512}
                                className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600"
                                unoptimized={needsUnoptimized}
                                priority={index === 0}
                              />
                            );
                          })}
                        </div>
                      )}

                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex justify-start">
                <div className="flex flex-row">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 mr-2 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
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
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
            {/* Provider Selection */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Models{" "}
                  {selectedProviders.length > 1 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      (Generate simultaneously)
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
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Configure Models
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  ["openai", "replicate", "stability", "google"] as Provider[]
                ).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => toggleProvider(provider)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
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
            <div className="p-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe the image you want to generate..."
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isGenerating}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Model Selector Modal */}
        {showModelSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configure AI Models
                </h3>
                <button
                  onClick={() => setShowModelSelector(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {/* Google Models Section */}
                {selectedProviders.includes("google") && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Google Imagen Models
                    </h4>
                    <div className="space-y-2">
                      {providerModels.google.map((model) => (
                        <label
                          key={model.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                            selectedModels.google === model.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name="google-model"
                            value={model.id}
                            checked={selectedModels.google === model.id}
                            onChange={(e) =>
                              setSelectedModels((prev) => ({
                                ...prev,
                                google: e.target.value,
                              }))
                            }
                            className="mt-1 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {model.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {model.description}
                            </div>
                            {model.id.includes("preview") && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                                Preview
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Model Information
                  </h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    • <strong>4.0 Ultra:</strong> Highest quality, slower
                    generation
                    <br />• <strong>4.0 Fast:</strong> Good quality, faster
                    generation
                    <br />• <strong>3.0:</strong> Stable and reliable
                    performance
                    <br />• <strong>Preview models:</strong> Latest features,
                    may have limitations
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModelSelector(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModelSelector(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
