import { ChatMessage } from "@/lib/generatedAppsDB";

// HTML template that will be used as the base for all generated apps
export const BASE_HTML_TEMPLATE = `
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
`;

// Helper function to create initial messages from a user prompt
export function createInitialMessages(userPrompt: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an expert web developer specializing in creating visually appealing and functional HTML applications.
Your task is to improve HTML templates by adding styling, functionality, and addressing specific user requirements.
Provide complete, valid HTML that can be directly rendered in a browser. Include all necessary CSS and JavaScript.
Focus on creating responsive, accessible, and modern designs.`
    },
    {
      role: 'user',
      content: `
Improve the following html template to be visually pleasing and more functional and also ${userPrompt}

${BASE_HTML_TEMPLATE}
      `.trim()
    }
  ];
}