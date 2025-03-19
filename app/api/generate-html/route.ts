"use server";

import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured" },
        { status: 500 }
      );
    }

    const promptTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Apna SDK ESM Example</title>
  </head>
  <body>
    <h1>Active User Profile</h1>
    <div id="user-profile">Loading user profile...</div>

    <!-- Import Apna SDK as ESM -->
    
    <script type="module">
      import { ApnaApp } from 'https://cdn.jsdelivr.net/npm/@apna/sdk@0.1.39/+esm'

      async function init() {
        try {
          // Initialize Apna SDK
          const apna = new ApnaApp({ appId: "your-mini-app-id" });

          // Get active user profile
          const userProfile = await apna.nostr.getActiveUserProfile();


          // Display the profile
          const profileDiv = document.getElementById("user-profile");
          if (userProfile) {
            profileDiv.innerHTML = \`
              <p><strong>nProfile:</strong> \${userProfile.nprofile}</p>
              <p><strong>Name:</strong> \${userProfile.metadata.name}</p>
              <p><strong>About:</strong> \${userProfile.metadata.about}</p>
              <p><strong>Followers:</strong> \${userProfile.followers.length}</p>
              <p><strong>Following:</strong> \${userProfile.following.length}</p>
            \`;
          } else {
            profileDiv.textContent = "No active user profile found.";
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          document.getElementById("user-profile").textContent =
            "Failed to load user profile.";
        }
      };

      window.onload = init
    </script>
  </body>
</html>


Improve the above html template to be visually pleasing and more functional and also ${prompt}

`;

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
        messages: [
          {
            role: "user",
            content: promptTemplate,
          },
        ],
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

    return NextResponse.json({ html: htmlContent });
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