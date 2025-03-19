import { ChatMessage } from "@/lib/generatedAppsDB";
import { createInitialMessages } from "./htmlTemplates";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Interface for the OpenRouter API request parameters
 */
export interface OpenRouterRequestParams {
  prompt?: string;
  messages?: ChatMessage[];
  apiKey: string;
}

/**
 * Interface for the OpenRouter API response
 */
export interface OpenRouterResponse {
  html: string;
  messages: ChatMessage[];
}

/**
 * Extracts HTML content from the AI response
 */
function extractHtmlFromResponse(content: string): string {
  // Try to extract content between ```html and ``` tags
  const htmlMatch = content.match(/```html\n([\s\S]*?)```/);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1].trim();
  }

  // If no html tag, try to extract content between any ``` and ``` tags
  const codeMatch = content.match(/```(?:html)?\n([\s\S]*?)```/);
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1].trim();
  }

  // If no code blocks, try to extract content that looks like HTML
  const docTypeMatch = content.match(/<\!DOCTYPE html>[\s\S]*<\/html>/i);
  if (docTypeMatch) {
    return docTypeMatch[0].trim();
  }

  // If all else fails, return the entire content
  return content.trim();
}

/**
 * Client-side utility to call the OpenRouter API directly
 */
export async function callOpenRouterApi({
  prompt,
  messages,
  apiKey,
}: OpenRouterRequestParams): Promise<OpenRouterResponse> {
  // Check if either prompt or messages is provided
  if (!prompt && (!messages || messages.length === 0)) {
    throw new Error("Either prompt or messages is required");
  }

  if (!apiKey) {
    throw new Error("OpenRouter API key is not provided. Please add your API key in the settings.");
  }

  // Use provided messages or create initial messages from prompt
  const chatMessages = messages || createInitialMessages(prompt!);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://apna.app",
        "X-Title": "Apna App Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.7-sonnet",
        messages: chatMessages,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content;

    // Extract HTML content from the response
    const htmlContent = extractHtmlFromResponse(generatedContent);

    // Create updated messages array with the assistant's response
    // Preserve any system message at the beginning of the conversation
    let updatedMessages = [];
    
    // If the first message is a system message, keep it at the beginning
    if (chatMessages.length > 0 && chatMessages[0].role === 'system') {
      updatedMessages = [
        chatMessages[0],
        ...chatMessages.slice(1),
        {
          role: 'assistant' as const,
          content: generatedContent
        }
      ];
    } else {
      // Otherwise just append the new message
      updatedMessages = [
        ...chatMessages,
        {
          role: 'assistant' as const,
          content: generatedContent
        }
      ];
    }

    return {
      html: htmlContent,
      messages: updatedMessages
    };
  } catch (error) {
    console.error("Error generating HTML:", error);
    throw error;
  }
}