import { SearchResult } from '../types';

const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': SERPER_API_KEY,
      },
      body: JSON.stringify({ 
        q: query,
        num: 10,
        gl: 'us',
        hl: detectLanguage(query)
      }),
    });

    if (!response.ok) throw new Error('Search request failed');
    
    const data = await response.json();
    return data.organic.map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      domain: new URL(result.link).hostname.replace('www.', '')
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

function detectLanguage(text: string): string {
  // Enhanced language detection based on character sets and patterns
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
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please check your environment variables.');
  }

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
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
      
      if (errorData?.error?.message) {
        throw new Error(`Gemini API error: ${errorData.error.message}`);
      } else if (response.status === 403) {
        throw new Error('Access denied. Please verify your Gemini API key has the correct permissions.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Generation request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while generating content');
  }
}