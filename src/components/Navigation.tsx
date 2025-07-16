'use client';

import { ImageIcon, Sun, Moon, User, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface NavigationProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
  hideLogo?: boolean;
}

export function Navigation({
  isDark,
  onToggleTheme,
  onShowLogin,
  onShowRegister,
}: NavigationProps) {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="relative z-50 border-b border-gray-200 bg-white/90 px-6 py-4 backdrop-blur-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-900/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">AIRouter</span>
        </Link>

        <div className={`'ml-auto' hidden items-center space-x-8 md:flex`}>
          {status === 'authenticated' && (
            <Link
              href="/chat"
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Chat
            </Link>
          )}
          <Link
            href="/#features"
            className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Features
          </Link>
          <Link
            href="/models"
            className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Models
          </Link>
          <Link
            href="/models#pricing"
            className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Pricing
          </Link>
          <Link
            href="/api-docs"
            className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            API Docs
          </Link>
          <button
            onClick={onToggleTheme}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
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
                  <User className="h-5 w-5" />
                )}
                <span>{session.user?.name || session.user?.email}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-gray-800">
                  <Link
                    href="/chat"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    Chat
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/api-keys"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    API Keys
                  </Link>
                  <Link
                    href="/billing"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    Billing
                  </Link>
                  <Link
                    href="/gallery"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    Gallery
                  </Link>

                  <button
                    onClick={() => {
                      signOut();
                      setShowDropdown(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={onShowLogin}
                className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                Sign In
              </button>
              <button
                onClick={onShowRegister}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className={`flex items-center space-x-2 md:hidden`}>
          <button
            onClick={onToggleTheme}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {session ? (
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <button
              onClick={onShowLogin}
              className="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
