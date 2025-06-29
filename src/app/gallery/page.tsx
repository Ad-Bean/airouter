"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            My Generated Images
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              You haven&apos;t generated any images yet.
            </p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              Start creating amazing images with AI!
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Generate Your First Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
