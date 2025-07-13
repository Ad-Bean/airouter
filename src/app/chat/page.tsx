'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { type Provider } from '@/lib/api';
import {
  Send,
  Image as ImageIcon,
  Bot,
  Loader,
  Plus,
  X,
  Edit2,
  Check,
  AlertCircle,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { ChatNavigation } from '@/components/ChatNavigation';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ModelSelectorModal } from '@/components/ModelSelectorModal';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageExpirationWarning } from '@/components/ImageExpirationWarning';
import { GeneratedImage } from '@/components/GeneratedImage';
import { type Message } from '@/types/chat';
import {
  AVAILABLE_PROVIDERS,
  PROVIDER_INFO,
  PROVIDER_CONFIGS,
  DEFAULT_PROVIDERS,
  DEFAULT_MODELS,
} from '@/config/providers';

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>(DEFAULT_PROVIDERS);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>(DEFAULT_MODELS);
  const [imageCount, setImageCount] = useState<Record<string, number>>({});
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        return saved === 'true';
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
  const [editPrompt, setEditPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        localStorage.setItem('sidebarCollapsed', 'true');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            }),
          );
          setMessages(loadedMessages);
          setCurrentSessionId(sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setErrorMessage('Failed to load chat session');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, []);

  // Handle URL session parameter
  useEffect(() => {
    const sessionId = searchParams.get('session');
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
        const response = await fetch(`/api/chat/messages?sessionId=${currentSessionId}`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
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
            }),
          );
          setMessages(updatedMessages);

          // Check if any message is still generating
          const stillGenerating = updatedMessages.some((msg) => msg.status === 'generating');
          if (!stillGenerating) {
            setIsGenerating(false);
          }
        } else {
          console.warn('Failed to poll messages:', response.status);
          // Don't stop polling on single failure, but log it
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Message polling request timed out');
        } else {
          console.error('Failed to poll messages:', error);
        }
        // Continue polling even on errors to maintain UI consistency
      }
    };

    const interval = setInterval(pollMessages, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [isGenerating, currentSessionId]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
    setErrorMessage(null);
    setIsGenerating(false);
    router.push('/chat', { scroll: false });
  };

  const handleSidebarToggle = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', newCollapsed.toString());
    }
  };

  const handleModelChange = (provider: string, model: string) => {
    setSelectedModels((prev) => ({
      ...prev,
      [provider]: model,
    }));
  };

  const handleImageCountChange = (provider: string, count: number) => {
    setImageCount((prev) => ({
      ...prev,
      [provider]: count,
    }));
  };

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (currentSessionId) {
      return currentSessionId;
    }

    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.trim().slice(0, 50) || 'New Chat',
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
      console.error('Failed to create session:', error);
    }

    return null;
  }, [currentSessionId, router, input]);

  const handleSendMessage = useCallback(
    async (messageText?: string, providers?: Provider[]) => {
      const text = messageText || input.trim();
      if (!text || isGenerating) return;

      setErrorMessage(null);
      const sessionId = await ensureSession();

      if (!sessionId) {
        setErrorMessage('Failed to create chat session. Please try again.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        type: 'text',
        timestamp: new Date(),
      };

      // Create immediate assistant message with generating status for smooth UI
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        type: 'image',
        status: 'generating',
        imageUrls: [],
        metadata: {
          providers: providers || selectedProviders,
          models: selectedModels,
          imageCount,
          prompt: text,
        },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput('');
      setIsGenerating(true);

      try {
        const userResponse = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            role: 'user',
            content: text,
            type: 'text',
          }),
        });

        if (!userResponse.ok) {
          throw new Error('Failed to save user message');
        }

        const generateResponse = await fetch('/api/chat/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            prompt: text,
            providers: providers || selectedProviders,
            models: selectedModels,
            imageCount,
            messageId: assistantMessage.id, // Pass the frontend message ID
          }),
        });

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(errorData.error || 'Failed to start image generation');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMsg = error instanceof Error ? error.message : 'An error occurred';
        setErrorMessage(errorMsg);
        setTimeout(() => setErrorMessage(null), 5000);
        setIsGenerating(false);

        // Update the assistant message to show error state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  status: 'failed' as const,
                  metadata: { ...msg.metadata, error: errorMsg },
                }
              : msg,
          ),
        );
      }
    },
    [input, isGenerating, ensureSession, selectedProviders, selectedModels, imageCount],
  );

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleEditImage = async (imageUrl: string, provider: string) => {
    if (!editPrompt.trim() || !currentSessionId) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/chat/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          prompt: editPrompt,
          providers: [provider],
          models: { [provider]: selectedModels[provider] },
          imageCount: { [provider]: imageCount[provider] || 1 },
          editImageUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit image');
      }

      setEditingImage(null);
      setEditPrompt('');
    } catch (error) {
      console.error('Error editing image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to edit image');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditingImage = (messageId: string, imageUrl: string, provider: string) => {
    setEditingImage({ messageId, imageUrl, provider });
    setEditPrompt('');
  };

  // Group images by provider for each message
  const groupImagesByProvider = (message: Message) => {
    const providers = (message.metadata?.providers as string[]) || [];
    const imageProviderMap = message.metadata?.imageProviderMap as Record<string, string>;
    const providerErrors = (message.metadata?.providerErrors as Record<string, string>) || {};
    const imageGroups: Record<string, string[]> = {};

    // Initialize empty arrays for all providers (including those with errors)
    providers.forEach((provider) => {
      imageGroups[provider] = [];
    });

    // Also include any providers that have errors but might not be in the original providers list
    Object.keys(providerErrors).forEach((provider) => {
      if (!imageGroups[provider]) {
        imageGroups[provider] = [];
      }
    });

    // If we have images, group them by provider
    if (message.imageUrls && message.imageUrls.length > 0) {
      // If we have a provider map, use it to group images correctly
      if (imageProviderMap && typeof imageProviderMap === 'object') {
        message.imageUrls.forEach((imageUrl) => {
          const provider = imageProviderMap[imageUrl];
          if (provider && imageGroups[provider] !== undefined) {
            imageGroups[provider].push(imageUrl);
          }
        });
      } else {
        // Fallback to old logic if imageProviderMap is not available
        let imageIndex = 0;
        providers.forEach((provider) => {
          const imagesPerProvider = Math.floor(message.imageUrls!.length / providers.length);
          const remainingImages = message.imageUrls!.length % providers.length;
          const currentProviderImages = imagesPerProvider + (imageIndex < remainingImages ? 1 : 0);

          const providerImages = message.imageUrls!.slice(
            imageIndex,
            imageIndex + currentProviderImages,
          );

          if (providerImages.length > 0) {
            imageGroups[provider] = providerImages;
          }

          imageIndex += currentProviderImages;
        });
      }
    }

    return imageGroups;
  };

  const handleShowLogin = () => {
    router.push('/?showLogin=true');
  };

  const handleShowRegister = () => {
    router.push('/?showRegister=true');
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle pending prompt and providers after successful authentication
  useEffect(() => {
    if (session && status === 'authenticated') {
      const pendingPrompt = localStorage.getItem('pendingPrompt');
      const pendingProviders = localStorage.getItem('pendingProviders');
      const shouldRedirect = localStorage.getItem('shouldRedirectToChat');

      if (shouldRedirect === 'true' || (pendingPrompt && !isGenerating)) {
        // Restore pending prompt
        if (pendingPrompt) {
          setInput(pendingPrompt);
          localStorage.removeItem('pendingPrompt');
        }

        // Restore pending providers
        if (pendingProviders) {
          try {
            const providers = JSON.parse(pendingProviders);
            if (Array.isArray(providers) && providers.length > 0) {
              setSelectedProviders(providers);
            }
          } catch (error) {
            console.warn('Failed to parse pending providers:', error);
          }
          localStorage.removeItem('pendingProviders');
        }

        // Clean up redirect flag
        localStorage.removeItem('shouldRedirectToChat');
      }
    }
  }, [session, status, isGenerating]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white transition-colors duration-300 dark:bg-gray-900">
      <div className="flex min-h-0 flex-1">
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
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Navigation */}
          <div className="flex-shrink-0">
            <ChatNavigation
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onShowLogin={handleShowLogin}
              onShowRegister={handleShowRegister}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {/* Error Message */}
            {errorMessage && (
              <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                    <X className="h-2 w-2 text-white" />
                  </div>
                  <p className="flex-1 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                  {errorMessage.includes('Insufficient credits') && (
                    <button
                      onClick={() => {
                        window.location.href = '/billing';
                      }}
                      className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                    >
                      <CreditCard className="h-3 w-3" />
                      Add Credits
                    </button>
                  )}
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 pb-6">
              {messages.length === 0 && (
                <div className="py-20 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                    <ImageIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                    Create Amazing Images with AI
                  </h3>
                  <p className="mx-auto mb-2 max-w-md text-gray-500 dark:text-gray-400">
                    Describe any image you&apos;d like me to create and I&apos;ll generate it for
                    you using advanced AI models.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Select your preferred AI models below and start creating!
                  </p>
                </div>
              )}

              {/* Generation Cards */}
              <div className="mx-auto max-w-7xl space-y-6">
                {messages
                  .filter(
                    (msg) =>
                      msg.role === 'assistant' &&
                      (msg.imageUrls?.length ||
                        msg.status === 'generating' ||
                        msg.status === 'failed' ||
                        msg.status === 'partial'),
                  )
                  .map((message) => {
                    const prompt = message.metadata?.prompt as string;
                    const providers = message.metadata?.providers as string[];
                    const models = message.metadata?.models as Record<string, string>;
                    const messageImageCount = message.metadata?.imageCount as Record<
                      string,
                      number
                    >;

                    return (
                      <div
                        key={message.id}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                      >
                        {/* Card Header */}
                        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="mb-2 text-base leading-relaxed font-semibold text-gray-900 dark:text-white">
                                {prompt}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Bot className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {providers
                                      ?.map((provider) => {
                                        const model = models?.[provider];
                                        const count = messageImageCount?.[provider];
                                        const modelName =
                                          PROVIDER_CONFIGS[provider as Provider]?.models.find(
                                            (m) => m.id === model,
                                          )?.name || model;
                                        let displayText =
                                          PROVIDER_INFO[provider as Provider]?.displayName ||
                                          provider;

                                        if (modelName) {
                                          displayText += ` (${modelName})`;
                                        }

                                        if (count && count > 1) {
                                          displayText += ` x${count}`;
                                        }

                                        return displayText;
                                      })
                                      .join(' + ') || 'AI Generated'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {message.timestamp.toLocaleDateString()}{' '}
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Image Expiration Warning */}
                          {message.metadata?.autoDeleteAt && (
                            <div className="mt-3">
                              <ImageExpirationWarning
                                autoDeleteAt={new Date(message.metadata.autoDeleteAt)}
                                userType={message.metadata?.userType || 'free'}
                              />
                            </div>
                          )}
                        </div>

                        {/* Generation Status */}
                        {message.status === 'generating' && (
                          <div className="border-b border-gray-200 bg-blue-50 px-4 py-3 dark:border-gray-700 dark:bg-blue-900/20">
                            <div className="flex items-center gap-3">
                              <Loader className="h-4 w-4 animate-spin text-blue-600" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Generating images with {providers?.join(', ')}
                                ...
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Failed Status */}
                        {(message.status === 'failed' || message.status === 'partial') && (
                          <div className="border-b border-gray-200 bg-red-50 px-4 py-3 dark:border-gray-700 dark:bg-red-900/20">
                            <div className="mb-2 flex items-center gap-3">
                              <X className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                {message.status === 'partial'
                                  ? 'Some images failed to generate'
                                  : message.imageUrls && message.imageUrls.length > 0
                                    ? 'Some images failed to generate'
                                    : 'Failed to generate images'}
                              </span>
                            </div>
                            {message.metadata?.providerErrors && (
                              <div className="ml-7 space-y-1">
                                {Object.entries(
                                  message.metadata.providerErrors as Record<string, string>,
                                ).map(([provider, error]) => (
                                  <div
                                    key={provider}
                                    className="text-xs text-red-600 dark:text-red-400"
                                  >
                                    <span className="font-medium capitalize">{provider}:</span>{' '}
                                    {error}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Images Grid */}
                        <div className="p-4">
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {Object.entries(groupImagesByProvider(message) || {}).map(
                              ([provider, images]) => {
                                const expectedCount = messageImageCount?.[provider] || 1;
                                const isGenerating = message.status === 'generating';
                                const providerErrors =
                                  (message.metadata?.providerErrors as Record<string, string>) ||
                                  {};
                                const hasProviderError = providerErrors[provider];

                                return (
                                  <div key={provider} className="space-y-3">
                                    {/* Provider Header */}
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                                        <Bot className="h-3 w-3 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {PROVIDER_INFO[provider as Provider]?.displayName ||
                                            provider}
                                          {models?.[provider] && (
                                            <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                                              (
                                              {PROVIDER_CONFIGS[provider as Provider]?.models.find(
                                                (m) => m.id === models[provider],
                                              )?.name || models[provider]}
                                              )
                                            </span>
                                          )}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {hasProviderError ? (
                                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                              <AlertCircle className="h-3 w-3" />
                                              Failed to generate
                                            </span>
                                          ) : isGenerating ? (
                                            <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                              <Loader className="h-3 w-3 animate-spin" />
                                              Generating {expectedCount} image
                                              {expectedCount > 1 ? 's' : ''}...
                                            </span>
                                          ) : (
                                            <>
                                              {images.length} image{images.length > 1 ? 's' : ''}
                                              {expectedCount > 1 && (
                                                <span className="ml-1">
                                                  (requested {expectedCount})
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Images/Loading/Error */}
                                    <div className="grid grid-cols-2 gap-3">
                                      {/* Show actual images */}
                                      {images.map((url, index) => (
                                        <div key={index} className="group relative">
                                          <GeneratedImage
                                            src={url}
                                            alt={`Generated by ${provider} - ${index + 1}`}
                                            width={200}
                                            height={200}
                                            className="aspect-square w-full cursor-pointer rounded-xl border border-gray-200 object-cover shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-gray-600"
                                            onClick={() => {
                                              const imageUrl =
                                                url.startsWith('http') || url.startsWith('/api/')
                                                  ? url
                                                  : `/api/images/${url}`;
                                              window.open(imageUrl, '_blank');
                                            }}
                                          />
                                          {/* Edit Button */}
                                          <div className="absolute top-2 right-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                startEditingImage(message.id, url, provider);
                                              }}
                                              className="rounded-lg bg-black/80 p-1.5 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black"
                                              title="Edit this image"
                                            >
                                              <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Show loading skeletons for remaining images */}
                                      {isGenerating &&
                                        Array.from({
                                          length: Math.max(0, expectedCount - images.length),
                                        }).map((_, index) => (
                                          <div key={`loading-${index}`} className="relative">
                                            <Skeleton className="aspect-square w-full rounded-xl" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <Loader className="h-6 w-6 animate-spin text-gray-400" />
                                            </div>
                                          </div>
                                        ))}

                                      {/* Show error placeholders for failed images */}
                                      {hasProviderError && !isGenerating && images.length === 0 && (
                                        <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/10">
                                          <AlertCircle className="mb-2 h-8 w-8 text-red-500 dark:text-red-400" />
                                          <p className="mb-3 text-center text-sm text-red-600 dark:text-red-400">
                                            {hasProviderError}
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => {
                                                if (prompt) {
                                                  handleSendMessage(prompt, [provider as Provider]);
                                                }
                                              }}
                                              className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                                            >
                                              <RefreshCw className="h-3 w-3" />
                                              Retry
                                            </button>
                                            {hasProviderError.includes('Insufficient credits') && (
                                              <button
                                                onClick={() => {
                                                  window.location.href = '/billing';
                                                }}
                                                className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                              >
                                                <CreditCard className="h-3 w-3" />
                                                Add Credits
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Show partial error for when some images failed */}
                                      {hasProviderError &&
                                        !isGenerating &&
                                        images.length > 0 &&
                                        images.length < expectedCount &&
                                        Array.from({ length: expectedCount - images.length }).map(
                                          (_, index) => (
                                            <div
                                              key={`error-${index}`}
                                              className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
                                            >
                                              <AlertCircle className="mb-1 h-6 w-6 text-red-500 dark:text-red-400" />
                                              <p className="text-center text-xs text-red-600 dark:text-red-400">
                                                Failed
                                              </p>
                                            </div>
                                          ),
                                        )}
                                    </div>

                                    {/* Always Visible Edit Interface */}
                                    {images.length > 0 && (
                                      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700/50">
                                        <div className="mb-1.5 flex items-center gap-2">
                                          <Edit2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Edit with{' '}
                                            {PROVIDER_INFO[provider as Provider]?.displayName ||
                                              provider}
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={
                                              editingImage?.provider === provider &&
                                              editingImage?.messageId === message.id
                                                ? editPrompt
                                                : ''
                                            }
                                            onChange={(e) => {
                                              if (
                                                editingImage?.provider === provider &&
                                                editingImage?.messageId === message.id
                                              ) {
                                                setEditPrompt(e.target.value);
                                              }
                                            }}
                                            placeholder="Describe your modifications..."
                                            className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (
                                                  editingImage?.provider === provider &&
                                                  editingImage?.messageId === message.id
                                                ) {
                                                  handleEditImage(editingImage.imageUrl, provider);
                                                } else if (images.length > 0) {
                                                  setEditingImage({
                                                    messageId: message.id,
                                                    imageUrl: images[0],
                                                    provider,
                                                  });
                                                  setEditPrompt(e.currentTarget.value);
                                                  handleEditImage(images[0], provider);
                                                }
                                              }
                                            }}
                                            onFocus={() => {
                                              if (images.length > 0) {
                                                setEditingImage({
                                                  messageId: message.id,
                                                  imageUrl: images[0],
                                                  provider,
                                                });
                                              }
                                            }}
                                          />
                                          <button
                                            onClick={() => {
                                              if (
                                                editingImage?.provider === provider &&
                                                editingImage?.messageId === message.id
                                              ) {
                                                handleEditImage(editingImage.imageUrl, provider);
                                              } else if (images.length > 0) {
                                                const inputElement = document.querySelector(
                                                  `input[placeholder="Describe your modifications..."]`,
                                                ) as HTMLInputElement;
                                                if (inputElement && inputElement.value.trim()) {
                                                  setEditingImage({
                                                    messageId: message.id,
                                                    imageUrl: images[0],
                                                    provider,
                                                  });
                                                  setEditPrompt(inputElement.value);
                                                  handleEditImage(images[0], provider);
                                                }
                                              }
                                            }}
                                            disabled={isGenerating}
                                            className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                          >
                                            {isGenerating &&
                                            editingImage?.provider === provider &&
                                            editingImage?.messageId === message.id ? (
                                              <Loader className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <Check className="h-3 w-3" />
                                            )}
                                            Edit
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
              {/* Provider Selection */}
              <div className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    AI Models
                  </span>
                  <button
                    onClick={() => setShowModelSelector(true)}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
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
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                          selectedProviders.includes(provider)
                            ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                            : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-600'
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
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isGenerating}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none"
                  >
                    {isGenerating ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
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
          imageCount={imageCount}
          onModelChange={handleModelChange}
          onImageCountChange={handleImageCountChange}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
