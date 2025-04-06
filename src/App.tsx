import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Editor } from './components/Editor';
import { useThemeStore } from './stores/themeStore';
import { generateContent, searchWeb } from './utils/api';
import { SearchResult } from './types';

function App() {
  const { isDarkMode } = useThemeStore();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSubmit = async (prompt: string, useWebSearch: boolean) => {
    try {
      setIsLoading(true);
      let results: SearchResult[] | undefined;
      
      if (useWebSearch) {
        results = await searchWeb(prompt);
        setSearchResults(results);
      } else {
        setSearchResults(undefined);
      }
      
      const generatedContent = await generateContent(prompt, results);
      setContent(generatedContent);
    } catch (error) {
      console.error('Error:', error);
      setContent('An error occurred while generating content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Navbar />
      <Editor
        onSubmit={handleSubmit}
        content={content}
        isLoading={isLoading}
        searchResults={searchResults}
      />
    </div>
  );
}

export default App;