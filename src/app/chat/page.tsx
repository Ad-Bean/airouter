"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { type Provider } from "@/lib/api";
import {
  Send,
  Image as ImageIcon,
  Bot,
  Loader,
  Plus,
  X,
  Edit2,
  Check,
} from "lucide-react";
import Image from "next/image";
import { ChatNavigation } from "@/components/ChatNavigation";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ModelSelectorModal } from "@/components/ModelSelectorModal";
import { type Message } from "@/types/chat";
import {
  AVAILABLE_PROVIDERS,
  PROVIDER_INFO,
  DEFAULT_PROVIDERS,
  DEFAULT_MODELS,
} from "@/config/providers";

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProviders, setSelectedProviders] =
    useState<Provider[]>(DEFAULT_PROVIDERS);
  const [selectedModels, setSelectedModels] =
    useState<Record<string, string>>(DEFAULT_MODELS);
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
  const [editingImage, setEditingImage] = useState<{
    messageId: string;
    imageUrl: string;
    provider: string;
  } | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
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

  // Load session messages
  const loadChatSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.session?.messages) {
          const loadedMessages: Message[] = data.session.messages.map(
            (msg: {
              id: string;
              role: string;
              content: string;
              type: string;
              status?: string;
              imageUrls?: string[];
              metadata?: Record<string, unknown>;
              createdAt: string;
            }) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              type: msg.type,
              status: msg.status,
              imageUrls: msg.imageUrls || [],
              metadata: msg.metadata,
              timestamp: new Date(msg.createdAt),
            })
          );
          setMessages(loadedMessages);
          setCurrentSessionId(sessionId);
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setErrorMessage("Failed to load chat session");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, []);

  // Handle URL session parameter
  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (sessionId && sessionId !== currentSessionId) {
      loadChatSession(sessionId);
    } else if (!sessionId && currentSessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [searchParams, currentSessionId, loadChatSession]);

  // Polling for message updates during generation
  useEffect(() => {
    if (!isGenerating || !currentSessionId) return;

    const pollMessages = async () => {
      try {
        const response = await fetch(
          `/api/chat/messages?sessionId=${currentSessionId}`
        );
        if (response.ok) {
          const data = await response.json();
          const updatedMessages: Message[] = data.messages.map(
            (msg: {
              id: string;
              role: string;
              content: string;
              type: string;
              status?: string;
              imageUrls?: string[];
              metadata?: Record<string, unknown>;
              createdAt: string;
            }) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              type: msg.type,
              status: msg.status,
              imageUrls: msg.imageUrls || [],
              metadata: msg.metadata,
              timestamp: new Date(msg.createdAt),
            })
          );
          setMessages(updatedMessages);

          // Check if any message is still generating
          const stillGenerating = updatedMessages.some(
            (msg) => msg.status === "generating"
          );
          if (!stillGenerating) {
            setIsGenerating(false);
          }
        }
      } catch (error) {
        console.error("Failed to poll messages:", error);
      }
    };

    const interval = setInterval(pollMessages, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [isGenerating, currentSessionId]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput("");
    setErrorMessage(null);
    setIsGenerating(false);
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

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (currentSessionId) {
      return currentSessionId;
    }

    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.trim().slice(0, 50) || "New Chat",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session?.id) {
          const newSessionId = data.session.id;
          setCurrentSessionId(newSessionId);
          router.push(`/chat?session=${newSessionId}`, { scroll: false });
          return newSessionId;
        }
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }

    return null;
  }, [currentSessionId, router, input]);

  // Handle sending messages - ChatGPT-like flow
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

      try {
        const userResponse = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            role: "user",
            content: text,
            type: "text",
          }),
        });

        if (!userResponse.ok) {
          throw new Error("Failed to save user message");
        }

        // Create assistant message with generating status
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          type: "image",
          status: "generating",
          imageUrls: [],
          metadata: {
            providers: providers || selectedProviders,
            models: selectedModels,
            prompt: text,
          },
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const generateResponse = await fetch("/api/chat/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            prompt: text,
            providers: providers || selectedProviders,
            models: selectedModels,
          }),
        });
        console.log("Image generation response:", generateResponse);

        if (!generateResponse.ok) {
          throw new Error("Failed to start image generation");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "An error occurred"
        );
        setTimeout(() => setErrorMessage(null), 5000);
        setIsGenerating(false);
      }
    },
    [input, isGenerating, ensureSession, selectedProviders, selectedModels]
  );

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleEditImage = async (imageUrl: string, provider: string) => {
    if (!editPrompt.trim() || !currentSessionId) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/chat/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          prompt: editPrompt,
          providers: [provider],
          models: { [provider]: selectedModels[provider] },
          editImageUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit image");
      }

      setEditingImage(null);
      setEditPrompt("");
    } catch (error) {
      console.error("Error editing image:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to edit image"
      );
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditingImage = (
    messageId: string,
    imageUrl: string,
    provider: string
  ) => {
    setEditingImage({ messageId, imageUrl, provider });
    setEditPrompt("");
  };

  const cancelEditing = () => {
    setEditingImage(null);
    setEditPrompt("");
  };

  // Group images by provider for each message
  const groupImagesByProvider = (message: Message) => {
    if (!message.imageUrls || !message.metadata?.providers) return {};

    const providers = message.metadata.providers as string[];
    const imageGroups: Record<string, string[]> = {};

    // Assuming images are returned in the same order as providers
    // Each provider typically returns 1-2 images
    let imageIndex = 0;
    providers.forEach((provider) => {
      const imagesPerProvider = Math.floor(
        message.imageUrls!.length / providers.length
      );
      const remainingImages = message.imageUrls!.length % providers.length;
      const currentProviderImages =
        imagesPerProvider + (imageIndex < remainingImages ? 1 : 0);

      const providerImages = message.imageUrls!.slice(
        imageIndex,
        imageIndex + currentProviderImages
      );

      if (providerImages.length > 0) {
        imageGroups[provider] = providerImages;
      }

      imageIndex += currentProviderImages;
    });

    return imageGroups;
  };

  const handleShowLogin = () => {
    router.push("/?showLogin=true");
  };

  const handleShowRegister = () => {
    router.push("/?showRegister=true");
  };

  const toggleProvider = (provider: Provider) => {
    setSelectedProviders((prev) => {
      if (prev.includes(provider)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== provider);
      } else {
        return [...prev, provider];
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle pending prompt and providers after successful authentication
  useEffect(() => {
    if (session && status === "authenticated") {
      const pendingPrompt = localStorage.getItem("pendingPrompt");
      const pendingProviders = localStorage.getItem("pendingProviders");
      const shouldRedirect = localStorage.getItem("shouldRedirectToChat");

      if (shouldRedirect === "true" || (pendingPrompt && !isGenerating)) {
        // Restore pending prompt
        if (pendingPrompt) {
          setInput(pendingPrompt);
          localStorage.removeItem("pendingPrompt");
        }

        // Restore pending providers
        if (pendingProviders) {
          try {
            const providers = JSON.parse(pendingProviders);
            if (Array.isArray(providers) && providers.length > 0) {
              setSelectedProviders(providers);
            }
          } catch (error) {
            console.warn("Failed to parse pending providers:", error);
          }
          localStorage.removeItem("pendingProviders");
        }

        // Clean up redirect flag
        localStorage.removeItem("shouldRedirectToChat");
      }
    }
  }, [session, status, isGenerating]);

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
          {/* Navigation */}
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
              <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Create Amazing Images with AI
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-md mx-auto">
                    Describe any image you&apos;d like me to create and
                    I&apos;ll generate it for you using advanced AI models.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Select your preferred AI models below and start creating!
                  </p>
                </div>
              )}

              {/* Generation Cards */}
              <div className="max-w-7xl mx-auto space-y-6">
                {messages
                  .filter(
                    (msg) =>
                      msg.role === "assistant" &&
                      (msg.imageUrls?.length || msg.status === "generating")
                  )
                  .map((message) => {
                    const prompt = message.metadata?.prompt as string;
                    const providers = message.metadata?.providers as string[];

                    return (
                      <div
                        key={message.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 leading-relaxed">
                                {prompt}
                              </h3>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-3.5 h-3.5 text-gray-500" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {providers?.join(" + ") || "AI Generated"}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {message.timestamp.toLocaleDateString()}{" "}
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Generation Status */}
                        {message.status === "generating" && (
                          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <Loader className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Generating images with {providers?.join(", ")}
                                ...
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Failed Status */}
                        {message.status === "failed" && (
                          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <X className="w-4 h-4 text-red-600" />
                              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                Failed to generate images. Please try again.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Images Grid */}
                        {message.imageUrls && message.imageUrls.length > 0 && (
                          <div className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {Object.entries(
                                groupImagesByProvider(message)
                              ).map(([provider, images]) => (
                                <div key={provider} className="space-y-3">
                                  {/* Provider Header */}
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                      <Bot className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {PROVIDER_INFO[provider as Provider]
                                          ?.displayName || provider}
                                      </h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {images.length} image
                                        {images.length > 1 ? "s" : ""}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Images */}
                                  <div className="grid grid-cols-2 gap-3">
                                    {images.map((url, index) => (
                                      <div
                                        key={index}
                                        className="relative group"
                                      >
                                        <Image
                                          src={
                                            url.startsWith("/api/")
                                              ? url
                                              : `/api/images/${url}`
                                          }
                                          alt={`Generated by ${provider} - ${
                                            index + 1
                                          }`}
                                          width={200}
                                          height={200}
                                          className="w-full aspect-square object-cover rounded-xl border border-gray-200 dark:border-gray-600 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl"
                                          onClick={() =>
                                            window.open(
                                              url.startsWith("/api/")
                                                ? url
                                                : `/api/images/${url}`,
                                              "_blank"
                                            )
                                          }
                                        />

                                        {/* Edit Button */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingImage(
                                                message.id,
                                                url,
                                                provider
                                              );
                                            }}
                                            className="p-2 bg-black/80 hover:bg-black text-white rounded-lg transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
                                            title="Edit this image"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Edit Interface */}
                                  {editingImage &&
                                    editingImage.provider === provider &&
                                    editingImage.messageId === message.id && (
                                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Edit with{" "}
                                            {PROVIDER_INFO[provider as Provider]
                                              ?.displayName || provider}
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={editPrompt}
                                            onChange={(e) =>
                                              setEditPrompt(e.target.value)
                                            }
                                            placeholder="Describe your modifications..."
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            onKeyDown={(e) => {
                                              if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                              ) {
                                                e.preventDefault();
                                                handleEditImage(
                                                  editingImage.imageUrl,
                                                  provider
                                                );
                                              }
                                              if (e.key === "Escape") {
                                                cancelEditing();
                                              }
                                            }}
                                            autoFocus
                                          />
                                          <button
                                            onClick={() =>
                                              handleEditImage(
                                                editingImage.imageUrl,
                                                provider
                                              )
                                            }
                                            disabled={
                                              !editPrompt.trim() || isGenerating
                                            }
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium shadow-sm"
                                          >
                                            {isGenerating ? (
                                              <Loader className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <Check className="w-3.5 h-3.5" />
                                            )}
                                            Edit
                                          </button>
                                          <button
                                            onClick={cancelEditing}
                                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
              {/* Provider Selection */}
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    AI Models
                  </span>
                  <button
                    onClick={() => setShowModelSelector(true)}
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Configure
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_PROVIDERS.map((provider) => {
                    const info = PROVIDER_INFO[provider];
                    return (
                      <button
                        key={provider}
                        onClick={() => toggleProvider(provider)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-200 font-medium ${
                          selectedProviders.includes(provider)
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      >
                        {info.displayName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Input */}
              <div className="px-4 py-3">
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Describe the image you want to generate..."
                    disabled={isGenerating}
                    className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all duration-200 text-sm"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isGenerating}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl disabled:shadow-none text-sm"
                  >
                    {isGenerating ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Generate</span>
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
