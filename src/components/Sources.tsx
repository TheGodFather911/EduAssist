import React from 'react';
import { BookOpen, Link as LinkIcon } from 'lucide-react';
import { SearchResult } from '../types';

interface SourcesProps {
  sources: SearchResult[];
}

export const Sources: React.FC<SourcesProps> = ({ sources }) => {
  if (!sources?.length) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-pulse"></div>
          <BookOpen className="relative h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
          References
        </h2>
      </div>

      <div className="grid gap-4">
        {sources.map((source, index) => {
          const domain = source.domain;
          const currentYear = new Date().getFullYear();
          
          return (
            <div
              key={source.link}
              className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
            >
              <div className="absolute -left-3 -top-3 w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-medium shadow-lg">
                {index + 1}
              </div>
              
              <div className="ml-4">
                <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {source.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-medium">{domain}</span>
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span>{currentYear}</span>
                </div>

                <a
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group-hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="break-all">{source.link}</span>
                </a>
              </div>

              {source.snippet && (
                <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {source.snippet}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};