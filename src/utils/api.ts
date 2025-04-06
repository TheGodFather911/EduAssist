import { SearchResult } from '../types';

// Get all available API keys from environment variables
const GEMINI_API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY_6,
].filter(Boolean);

const SERPER_API_KEYS = [
  import.meta.env.VITE_SERPER_API_KEY_1,
  import.meta.env.VITE_SERPER_API_KEY_2,
  import.meta.env.VITE_SERPER_API_KEY_3,
  import.meta.env.VITE_SERPER_API_KEY_4,
  import.meta.env.VITE_SERPER_API_KEY_5,
  import.meta.env.VITE_SERPER_API_KEY_6,
].filter(Boolean);

// Keep track of the current key index
let currentGeminiKeyIndex = 0;
let currentSerperKeyIndex = 0;

// Function to get the next available API key
const getNextKey = (keys: string[], currentIndex: number): [string, number] => {
  const nextIndex = (currentIndex + 1) % keys.length;
  return [keys[nextIndex], nextIndex];
};

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const initialKeyIndex = currentSerperKeyIndex;
  let attempts = 0;

  while (attempts < SERPER_API_KEYS.length) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': SERPER_API_KEYS[currentSerperKeyIndex],
        },
        body: JSON.stringify({ 
          q: query,
          num: 10,
          gl: 'us',
          hl: detectLanguage(query)
        }),
      });

      if (!response.ok) {
        // If we get a 429 (rate limit) or 403 (invalid key), try the next key
        if (response.status === 429 || response.status === 403) {
          const [, nextIndex] = getNextKey(SERPER_API_KEYS, currentSerperKeyIndex);
          currentSerperKeyIndex = nextIndex;
          attempts++;
          continue;
        }
        throw new Error('Search request failed');
      }
      
      const data = await response.json();
      return data.organic.map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        domain: new URL(result.link).hostname.replace('www.', '')
      }));
    } catch (error) {
      console.error('Search error:', error);
      
      // If we've tried all keys and are back to the initial one, throw the error
      if (attempts === SERPER_API_KEYS.length - 1 && currentSerperKeyIndex === initialKeyIndex) {
        throw error;
      }

      // Try the next key
      const [, nextIndex] = getNextKey(SERPER_API_KEYS, currentSerperKeyIndex);
      currentSerperKeyIndex = nextIndex;
      attempts++;
    }
  }

  throw new Error('All Serper API keys have failed');
}

function detectLanguage(text: string): string {
  const arabicPattern = /[\u0600-\u06FF]/;
  const frenchPattern = /[À-ÿ]|(\b(je|tu|il|nous|vous|ils|le|la|les|un|une|des|ce|cette|ces)\b)/i;
  
  if (arabicPattern.test(text)) return 'ar';
  if (frenchPattern.test(text)) return 'fr';
  return 'en';
}

export async function generateContent(
  prompt: string,
  searchResults?: SearchResult[]
): Promise<string> {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured. Please check your environment variables.');
  }

  const initialKeyIndex = currentGeminiKeyIndex;
  let attempts = 0;

  while (attempts < GEMINI_API_KEYS.length) {
    try {
      let enhancedPrompt = prompt;
      const detectedLang = detectLanguage(prompt);
      
      if (searchResults?.length) {
        const context = searchResults
          .map((result, i) => `Source ${i + 1}:\nTitle: ${result.title}\nContent: ${result.snippet}\nURL: ${result.link}`)
          .join('\n\n');
        
        enhancedPrompt = `
          Context from web search:
          ${context}
          
          Using the above context where relevant, please provide a comprehensive and detailed response to:
          ${prompt}
          
          IMPORTANT INSTRUCTIONS:
          1. Provide an extensive, in-depth response of at least 10,000 characters
          2. Include multiple sections with detailed explanations
          3. Cover all relevant aspects of the topic thoroughly
          4. Use examples and detailed explanations where appropriate
          5. Break down complex concepts into digestible parts
          6. Include relevant statistics and data when available
          7. Consider multiple perspectives and viewpoints
          8. Discuss implications and applications
          9. Use proper markdown formatting for better readability
          10. Respond in the same language as the prompt (${detectedLang})
          11. For Arabic text, ensure proper RTL formatting
          
          CITATION FORMATTING INSTRUCTIONS:
          1. Use superscript numbers for in-text citations (e.g., "Studies show¹" or "Recent research²³ indicates")
          2. Do not include brackets around citation numbers
          3. Place citation numbers after punctuation marks
          4. Multiple citations should be separated by commas without spaces
          5. Citations should be in ascending order
          6. DO NOT include a References section at the end
          
          Please ensure the response is thorough, well-structured, and provides significant value to the reader.
        `;
      } else {
        enhancedPrompt = `
          Please provide a comprehensive and detailed response to:
          ${prompt}
          
          IMPORTANT INSTRUCTIONS:
          1. Provide an extensive, in-depth response of at least 10,000 characters
          2. Include multiple sections with detailed explanations
          3. Cover all relevant aspects of the topic thoroughly
          4. Use examples and detailed explanations where appropriate
          5. Break down complex concepts into digestible parts
          6. Include relevant statistics and data when available
          7. Consider multiple perspectives and viewpoints
          8. Discuss implications and applications
          9. Use proper markdown formatting for better readability
          10. Respond in the same language as the prompt (${detectedLang})
          11. For Arabic text, ensure proper RTL formatting
          
          Please ensure the response is thorough, well-structured, and provides significant value to the reader.
        `;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEYS[currentGeminiKeyIndex]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Gemini API error response:', errorData);
        
        // If we get a rate limit or invalid key error, try the next key
        if (response.status === 429 || response.status === 403) {
          const [, nextIndex] = getNextKey(GEMINI_API_KEYS, currentGeminiKeyIndex);
          currentGeminiKeyIndex = nextIndex;
          attempts++;
          continue;
        }

        throw new Error(`Generation request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      // Clean up any [object Object] occurrences in the response
      const cleanedText = data.candidates[0].content.parts[0].text.replace(/\[object Object\]/g, '');
      return cleanedText;
    } catch (error) {
      console.error('Generation error:', error);
      
      // If we've tried all keys and are back to the initial one, throw the error
      if (attempts === GEMINI_API_KEYS.length - 1 && currentGeminiKeyIndex === initialKeyIndex) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred while generating content');
      }

      // Try the next key
      const [, nextIndex] = getNextKey(GEMINI_API_KEYS, currentGeminiKeyIndex);
      currentGeminiKeyIndex = nextIndex;
      attempts++;
    }
  }

  throw new Error('All Gemini API keys have failed');
}

export async function analyzeContent(
  content: string,
  question: string
): Promise<string> {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured. Please check your environment variables.');
  }

  const initialKeyIndex = currentGeminiKeyIndex;
  let attempts = 0;

  while (attempts < GEMINI_API_KEYS.length) {
    try {
      const detectedLang = detectLanguage(question);
      const prompt = `
        You are an expert AI assistant helping a user analyze and discuss the following content. 
        The user's question or comment is: "${question}"
        
        Here's the content to analyze:
        ${content}
        
        Please provide a detailed, thoughtful response that:
        1. Directly addresses the user's question or comment
        2. References specific parts of the content when relevant
        3. Provides additional insights and explanations
        4. Uses clear examples when helpful
        5. Maintains the same language as the user's question (${detectedLang})
        6. Uses proper markdown formatting for better readability
        
        Keep the response focused and relevant to the user's specific query while drawing from the content provided.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEYS[currentGeminiKeyIndex]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Gemini API error response:', errorData);
        
        if (response.status === 429 || response.status === 403) {
          const [, nextIndex] = getNextKey(GEMINI_API_KEYS, currentGeminiKeyIndex);
          currentGeminiKeyIndex = nextIndex;
          attempts++;
          continue;
        }

        throw new Error(`Analysis request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      const cleanedText = data.candidates[0].content.parts[0].text.replace(/\[object Object\]/g, '');
      return cleanedText;
    } catch (error) {
      console.error('Analysis error:', error);
      
      if (attempts === GEMINI_API_KEYS.length - 1 && currentGeminiKeyIndex === initialKeyIndex) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred while analyzing the content');
      }

      const [, nextIndex] = getNextKey(GEMINI_API_KEYS, currentGeminiKeyIndex);
      currentGeminiKeyIndex = nextIndex;
      attempts++;
    }
  }

  throw new Error('All Gemini API keys have failed');
}