import React, { useState, useRef } from 'react';
import { Send, Search, BookOpen, FileDown, FileText, File as FilePdf } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sources } from './Sources';
import { SearchResult } from '../types';
import { exportToPDF, exportToDocx } from '../utils/export';

interface EditorProps {
  onSubmit: (prompt: string, useWebSearch: boolean) => Promise<void>;
  content: string;
  isLoading: boolean;
  searchResults?: SearchResult[];
}

export const Editor: React.FC<EditorProps> = ({ onSubmit, content, isLoading, searchResults }) => {
  const [prompt, setPrompt] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    await onSubmit(prompt, useWebSearch);
    setPrompt('');
    
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!content) return;
    
    const title = prompt.slice(0, 50) + '...';
    if (format === 'pdf') {
      await exportToPDF(content, title);
    } else {
      await exportToDocx(content, title);
    }
  };

  const detectLanguage = (text: string): string => {
    const arabicPattern = /[\u0600-\u06FF]/;
    const frenchPattern = /[À-ÿ]|(\b(je|tu|il|nous|vous|ils|le|la|les|un|une|des|ce|cette|ces)\b)/i;
    
    if (arabicPattern.test(text)) return 'ar';
    if (frenchPattern.test(text)) return 'fr';
    return 'en';
  };

  const processContent = (text: string): string => {
    if (!searchResults) return text;

    return text.replace(/(\d+)/g, (match) => {
      const number = parseInt(match);
      if (number > 0 && number <= searchResults.length) {
        const source = searchResults[number - 1];
        return `[^${number}](${source.link})`;
      }
      return match;
    });
  };

  const contentLanguage = detectLanguage(content);
  const isRTL = contentLanguage === 'ar';

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-pulse"></div>
            <BookOpen className="absolute inset-0 m-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-serif font-semibold text-gray-900 dark:text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            Your Educational AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter your topic or question below for well-researched, educational content with proper citations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to explore? (e.g., 'Explain the impact of quantum computing on cryptography')"
                className="w-full p-4 min-h-[120px] border-2 border-blue-200 dark:border-blue-800 rounded-xl
                         bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         font-serif text-lg transition-all duration-200
                         group-hover:border-blue-300 dark:group-hover:border-blue-700"
                dir={detectLanguage(prompt) === 'ar' ? 'rtl' : 'ltr'}
                lang={detectLanguage(prompt)}
                disabled={isLoading}
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500
                           border-blue-300 rounded transition-colors"
                />
                <Search className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                Include Web Research
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg
                         hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
                         font-medium transition-all duration-200 min-w-[140px]
                         flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {content && (
          <div ref={contentRef} className="relative group">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border-2 border-blue-200 dark:border-blue-800 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors">
              <div className="flex justify-end gap-2 p-4 border-b border-blue-100 dark:border-blue-800">
                <button
                  onClick={() => handleExport('docx')}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Export DOCX
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <FilePdf className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
              
              <div className="p-8">
                <article 
                  className="prose dark:prose-invert prose-blue max-w-none
                            prose-headings:font-serif prose-headings:text-gray-900 dark:prose-headings:text-white
                            prose-p:text-gray-700 dark:prose-p:text-gray-300
                            prose-a:text-blue-600 dark:prose-a:text-blue-400
                            prose-strong:text-gray-900 dark:prose-strong:text-white
                            prose-code:text-blue-700 dark:prose-code:text-blue-300
                            prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  lang={contentLanguage}
                >
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p>{processContent(String(children))}</p>;
                      }
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
            {searchResults && <Sources sources={searchResults} />}
          </div>
        )}
      </div>
    </div>
  );
};