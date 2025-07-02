"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { type Provider } from "@/lib/api";
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

  // Ensure session exists
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (currentSessionId) {
      return currentSessionId;
    }

    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Chat",
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
  }, [currentSessionId, router]);

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

      // Create and save user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        type: "text",
        timestamp: new Date(),
      };

      // Add user message to UI immediately
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsGenerating(true);

      try {
        // Save user message to backend
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

        // Add assistant message to UI
        setMessages((prev) => [...prev, assistantMessage]);

        // Start generation on backend
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

        if (!generateResponse.ok) {
          throw new Error("Failed to start image generation");
        }

        // The polling effect will handle updates
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
            <div className="flex-1 overflow-y-auto px-4 py-4">
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

              {/* ChatGPT-like message flow */}
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user"
                            ? "bg-blue-500"
                            : "bg-gray-600 dark:bg-gray-400"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      {/* Message text */}
                      {message.content && (
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-900 dark:text-gray-100 mb-2">
                            {message.content}
                          </p>
                        </div>
                      )}

                      {/* Generation status */}
                      {message.role === "assistant" &&
                        message.status === "generating" && (
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">
                              Generating images with{" "}
                              {message.metadata?.providers?.join(", ")}...
                            </span>
                          </div>
                        )}

                      {/* Generated Images */}
                      {message.imageUrls && message.imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                          {message.imageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <Image
                                src={
                                  url.startsWith("/api/")
                                    ? url
                                    : `/api/images/${url}`
                                }
                                alt={`Generated image ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                                onClick={() =>
                                  window.open(
                                    url.startsWith("/api/")
                                      ? url
                                      : `/api/images/${url}`,
                                    "_blank"
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Failed status */}
                      {message.role === "assistant" &&
                        message.status === "failed" && (
                          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 mb-2">
                            <X className="w-4 h-4" />
                            <span className="text-sm">
                              Failed to generate images. Please try again.
                            </span>
                          </div>
                        )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
              {/* Provider Selection */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-0">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI Models:
                  </span>
                  <button
                    onClick={() => setShowModelSelector(true)}
                    className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Configure
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PROVIDERS.map((provider) => {
                    const info = PROVIDER_INFO[provider];
                    return (
                      <button
                        key={provider}
                        onClick={() => toggleProvider(provider)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedProviders.includes(provider)
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {info.displayName}
                        {info.description && ` (${info.description})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-2">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Describe the image you want to generate..."
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isGenerating}
                    className="px-6 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
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
