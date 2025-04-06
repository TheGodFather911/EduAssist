import React, { useState, useRef } from 'react';
import { Send, Search, Bot, UserIcon, BookOpen, FileDown, FileText, File as FilePdf } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sources } from './Sources';
import { Chat } from './Chat';
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

    // First, clean up any [object Object] occurrences
    let cleanedText = text.replace(/\[object Object\]/g, '');

    // Then process citations
    return cleanedText.replace(/(\d+)/g, (match) => {
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
      <div className="max-w-[90rem] mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-pulse"></div>
            <BookOpen className="absolute inset-0 m-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-serif font-semibold text-blue-950 dark:text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            Your Educational AI Assistant
          </h1>
          <p className="text-sm text-blue-900 dark:text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Enter your topic or question below for well-researched, educational content with proper citations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 max-w-4xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to explore? (e.g., 'Explain the impact of quantum computing on cryptography')"
                className="w-full p-4 min-h-[120px] border-2 border-blue-200 dark:border-blue-800 rounded-xl
                         bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
                         text-blue-950 dark:text-white placeholder-blue-300 dark:placeholder-blue-500
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         font-serif text-lg transition-all duration-200
                         group-hover:border-blue-300 dark:group-hover:border-blue-700"
                dir={detectLanguage(prompt) === 'ar' ? 'rtl' : 'ltr'}
                lang={detectLanguage(prompt)}
                disabled={isLoading}
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <label className="flex items-center text-sm text-blue-900 dark:text-blue-100 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
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
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl
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
          <div ref={contentRef} className="flex gap-8">
            <div className="flex-1 space-y-8">
              <div className="relative group">
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border-2 border-blue-200 dark:border-blue-800 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors">
                  <div className="flex justify-end gap-3 p-4 border-b border-blue-100 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <button
                      onClick={() => handleExport('docx')}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Export DOCX
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    >
                      <FilePdf className="h-4 w-4" />
                      Export PDF
                    </button>
                  </div>
                  
                  <div className="p-8">
                    <article 
                      className="prose dark:prose-invert prose-blue max-w-none
                                prose-headings:font-serif prose-headings:text-blue-950 dark:prose-headings:text-white
                                prose-p:text-blue-900 dark:prose-p:text-blue-100 prose-p:font-normal prose-p:leading-relaxed
                                prose-a:text-blue-600 dark:prose-a:text-blue-400
                                prose-strong:text-blue-900 dark:prose-strong:text-white prose-strong:font-semibold
                                prose-code:text-blue-700 dark:prose-code:text-blue-300
                                prose-pre:bg-blue-950 dark:prose-pre:bg-blue-950
                                prose-li:text-blue-900 dark:prose-li:text-blue-100
                                [&_*:has(strong)]:font-normal"
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
                                className="rounded-xl"
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
            </div>

            <div className="w-[400px] sticky top-24 h-fit">
              <Chat generatedContent={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};