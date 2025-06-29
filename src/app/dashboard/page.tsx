"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome, {session.user?.name || session.user?.email}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              This is your AI image generation dashboard. Start creating amazing
              images with AI!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Images Generated
                </h3>
                <p className="text-3xl font-bold text-indigo-600">0</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total images created
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Favorite Images
                </h3>
                <p className="text-3xl font-bold text-indigo-600">0</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Images you&apos;ve favorited
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Account Type
                </h3>
                <p className="text-lg font-semibold text-green-600">Free</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current plan
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                Generate Images
              </button>
              <button
                onClick={() => router.push("/gallery")}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                View Gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
