import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { analyzeContent } from '../utils/api';

interface ChatProps {
  generatedContent: string;
}

export const Chat: React.FC<ChatProps> = ({ generatedContent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await analyzeContent(generatedContent, input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
      <div className="p-4 border-b border-blue-100 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
        <h2 className="text-lg font-serif font-semibold text-blue-950 dark:text-white flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Discuss with AI
        </h2>
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Ask questions or discuss the generated content with AI
        </p>
      </div>

      <div className="h-[400px] overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-4 ${
              message.role === 'assistant' ? 'flex-row pr-12' : 'flex-row-reverse pl-12'
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'assistant'
                  ? 'bg-blue-100 dark:bg-blue-900/50'
                  : 'bg-green-100 dark:bg-green-900/50'
              }`}
            >
              {message.role === 'assistant' ? (
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            
            <div
              className={`flex-1 rounded-2xl p-4 ${
                message.role === 'assistant'
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'bg-green-50 dark:bg-green-900/30'
              }`}
            >
              <div className="prose dark:prose-invert prose-sm max-w-none [&_p]:text-blue-900 dark:[&_p]:text-blue-100 [&_p:has(strong)]:font-normal [&_p]:leading-relaxed">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-blue-100 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the content..."
            className="flex-1 px-4 py-2 rounded-xl border-2 border-blue-200 dark:border-blue-800
                     bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
                     text-blue-900 dark:text-white placeholder-blue-300 dark:placeholder-blue-500
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl
                     hover:bg-blue-700 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
                     flex items-center gap-2 transition-all duration-200
                     shadow-lg shadow-blue-500/20"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};