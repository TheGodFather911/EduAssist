import React from 'react';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export const Navbar: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-blue-100 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-pulse"></div>
              <BookOpen className="relative h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="ml-2 text-xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
              EduAssist
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              ) : (
                <Moon className="h-5 w-5 text-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};