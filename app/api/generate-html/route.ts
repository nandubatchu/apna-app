"use server";

import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/lib/generatedAppsDB";
import { createInitialMessages } from "@/lib/utils/htmlTemplates";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt, messages } = await request.json();

    // Check if either prompt or messages is provided
    if (!prompt && (!messages || messages.length === 0)) {
      return NextResponse.json(
        { error: "Either prompt or messages is required" },
        { status: 400 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured" },
        { status: 500 }
      );
    }

    // Use provided messages or create initial messages from prompt
    const chatMessages = messages || createInitialMessages(prompt);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://apna.app",
        "X-Title": "Apna App Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-sonnet-20240229",
        messages: chatMessages,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `OpenRouter API error: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
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
          role: 'assistant',
          content: generatedContent
        }
      ];
    } else {
      // Otherwise just append the new message
      updatedMessages = [
        ...chatMessages,
        {
          role: 'assistant',
          content: generatedContent
        }
      ];
    }

    return NextResponse.json({
      html: htmlContent,
      messages: updatedMessages
    });
  } catch (error) {
    console.error("Error generating HTML:", error);
    return NextResponse.json(
      { error: "Failed to generate HTML content" },
      { status: 500 }
    );
  }
}

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