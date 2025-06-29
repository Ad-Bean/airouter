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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
  imageUrls?: string[];
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
        // Check if the message is asking for image generation
        if (isImageGenerationRequest()) {
          const providersToUse = providers || selectedProviders;

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I'll generate an image for you: "${text}"`,
            type: "image",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Try to generate with each provider
          let generatedImages: string[] = [];
          for (const provider of providersToUse) {
            try {
              const result = await generateImage({
                prompt: text,
                provider,
                model: selectedModels[provider], // Use selected model for this provider
                width: 1024,
                height: 1024,
                steps: 20,
              });

              if (result.success && result.images && result.images.length > 0) {
                generatedImages = result.images;

                // Save images to database
                for (const imageUrl of result.images) {
                  await fetch("/api/images/save", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      prompt: text,
                      imageUrl,
                      provider,
                      model: result.model,
                      width: 1024,
                      height: 1024,
                      steps: 20,
                    }),
                  });
                }
                break; // Success, stop trying other providers
              }
            } catch (providerError) {
              console.warn(`Provider ${provider} failed:`, providerError);
            }
          }

          // Update the assistant message with generated images
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    imageUrls: generatedImages,
                    content:
                      generatedImages.length > 0
                        ? `Here's your generated image for: "${text}"`
                        : "Sorry, I couldn't generate an image. Please try again.",
                  }
                : msg
            )
          );
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
    [input, isGenerating, selectedProviders, selectedModels]
  );

  // Restore pending prompt and auto-generate if exists
  useEffect(() => {
    if (session && status === "authenticated") {
      const pendingPrompt = localStorage.getItem("pendingPrompt");
      const pendingProviders = localStorage.getItem("pendingProviders");

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
    }
  }, [session, status]);

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
                    {message.imageUrls && message.imageUrls.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.imageUrls.map((url, index) => (
                          <Image
                            key={index}
                            src={url}
                            alt={`Generated image ${index + 1}`}
                            width={512}
                            height={512}
                            className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                        ))}
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
                        Generating your image...
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
                  AI Models:
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
