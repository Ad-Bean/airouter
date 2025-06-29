"use client";

import { ImageIcon, Sun, Moon, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface NavigationProps {
  isDark: boolean;
  mounted: boolean;
  onToggleTheme: () => void;
}

export function Navigation({
  isDark,
  mounted,
  onToggleTheme,
}: NavigationProps) {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="relative z-50 px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            AIRouter
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#models"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Models
          </a>
          <a
            href="#pricing"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Pricing
          </a>
          <button
            onClick={onToggleTheme}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {mounted ? (
              isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span>{session.user?.name || session.user?.email}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
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
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={onToggleTheme}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {mounted ? (
              isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {session ? (
            <Link
              href="/dashboard"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
