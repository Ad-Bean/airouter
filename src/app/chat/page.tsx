"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/chat"))
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            AI Chat Interface
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow min-h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat with AI Assistant
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome, {session.user?.name || session.user?.email}!
              </p>
            </div>
            
            {/* Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300">
                  👋 Welcome to the AI Chat! This is where you can have conversations with AI assistants.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                  This feature is coming soon. For now, you can generate images on the main page!
                </p>
              </div>
            </div>
            
            {/* Chat Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Type your message here... (Coming soon)"
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <button
                  disabled
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              ← Back to Image Generation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
