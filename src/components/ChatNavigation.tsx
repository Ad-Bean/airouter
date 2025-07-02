"use client";

import { Sun, Moon, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface ChatNavigationProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
}

export function ChatNavigation({
  isDark,
  onToggleTheme,
  onShowLogin,
  onShowRegister,
}: ChatNavigationProps) {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="relative z-50 h-12 px-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="h-full flex items-center justify-end">
        <div className="hidden md:flex items-center space-x-3">
          <Link
            href="/gallery"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
          <button
            onClick={onToggleTheme}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="max-w-20 truncate">
                  {session.user?.name || session.user?.email}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/chat"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    Chat
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/gallery"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    My Images
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={onShowLogin}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onShowRegister}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={onToggleTheme}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {session ? (
            <Link
              href="/dashboard"
              className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <User className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={onShowLogin}
              className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
