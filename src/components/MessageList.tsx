"use client";

import Image from "next/image";
import { Bot, User, Loader, ImageIcon } from "lucide-react";
import { type Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
  selectedProviders: string[];
}

export function MessageList({
  messages,
  isGenerating,
  selectedProviders,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Welcome to AI Image Generator Chat
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-md mx-auto text-sm">
          Describe any image you&apos;d like me to create and I&apos;ll generate
          it for you using advanced AI models.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Select your preferred AI models below and start creating!
        </p>
      </div>
    );
  }

  return (
    <>
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
                                      providerResult.provider === "openai"
                                        ? "bg-gradient-to-r from-green-400 to-green-600"
                                        : providerResult.provider === "google"
                                        ? "bg-gradient-to-r from-blue-400 to-blue-600"
                                        : providerResult.provider ===
                                          "stability"
                                        ? "bg-gradient-to-r from-purple-400 to-purple-600"
                                        : "bg-gradient-to-r from-orange-400 to-orange-600"
                                    }`}
                                  >
                                    <span className="text-xs font-bold text-white">
                                      {providerResult.provider === "openai"
                                        ? "OAI"
                                        : providerResult.provider === "google"
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
                                      {providerResult.provider === "openai" &&
                                        "DALL-E"}
                                      {providerResult.provider === "google" &&
                                        "Imagen"}
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
                                          : providerResult.model.includes("4.0")
                                          ? "4.0"
                                          : providerResult.model.includes("3.0")
                                          ? "3.0"
                                          : providerResult.model}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Compact Status Indicator */}
                                <div className="flex items-center">
                                  {providerResult.status === "pending" && (
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  )}
                                  {providerResult.status === "generating" && (
                                    <Loader className="w-3 h-3 animate-spin text-blue-500" />
                                  )}
                                  {providerResult.status === "completed" && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}
                                  {providerResult.status === "failed" && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>

                              {/* Compact Content Area */}
                              <div className="min-h-[120px]">
                                {/* Images */}
                                {providerResult.displayUrls &&
                                  providerResult.displayUrls.length > 0 && (
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
                                                } - Image ${imageIndex + 1}`}
                                                width={200}
                                                height={200}
                                                className="w-full aspect-square object-cover rounded border border-gray-200 dark:border-gray-600 transition-transform hover:scale-[1.02]"
                                                unoptimized={needsUnoptimized}
                                                priority={imageIndex === 0}
                                              />

                                              {/* Compact overlay */}
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <button
                                                  onClick={() =>
                                                    window.open(url, "_blank")
                                                  }
                                                  className="bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium transition-colors shadow-lg"
                                                >
                                                  View
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                {/* Compact Loading State */}
                                {providerResult.status === "generating" && (
                                  <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-700/30 rounded border border-dashed border-gray-300 dark:border-gray-600">
                                    <div className="text-center">
                                      <Loader className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-1" />
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Generating...
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Compact Pending State */}
                                {providerResult.status === "pending" && (
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
                                      <p className="text-xs text-red-600 dark:text-red-400">
                                        Failed
                                      </p>
                                      {providerResult.error && (
                                        <p className="text-xs text-red-500 dark:text-red-300 mt-1">
                                          {providerResult.error}
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
                          url.startsWith("http") && !url.includes("localhost");
                        const needsUnoptimized = isDataUrl || isExternalUrl;

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

      {/* Loading state for new generation */}
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
    </>
  );
}
