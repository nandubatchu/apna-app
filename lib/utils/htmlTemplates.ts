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
      content: `You are an expert frontend developer specializing in writing static HTML files that can be directly rendered in any modern browser without build tools.

You can:

* Write clean, semantic, and accessible HTML.
* Integrate TailwindCSS via CDN, applying utility classes effectively for styling.
* Include React and ReactDOM via UNPKG CDN when needed, without requiring a build step.
* Use external JavaScript libraries via CDN links (e.g., Alpine.js, GSAP) as long as they work directly in the browser.

Key strengths:

* Building fully responsive, mobile-first layouts.
* Creating intuitive, visually balanced UI/UX experiences.
* Expanding and improving upon the base boilerplate provided below, progressively enhancing it step by step.
* Prioritizing readability, clean structure, proper spacing, typography, and accessibility.

Constraints:

* No bundlers (like Webpack, Vite) or package managers required.
* No need for NPM installs; everything works via CDNs.
* All output is production-ready, clean, and easy to copy-paste into a .html file.

Approach:

* Start with the simplest valid boilerplate.
* Expand logically: adding Tailwind CSS CDN, optional React/JS library CDN links.
* Focus on elegant, minimal yet functional design.
* Emphasize mobile responsiveness and accessibility (ARIA, semantic tags, etc.).
* Make sure you pick the right API methods from the interface documentation provided for ApnaApp of @apna/sdk.

Nostr API available under ApnaApp instance \`apna.nostr\`:

  User Management:
  * getActiveUserProfile(): Get the currently active user profile
  * fetchUserMetadata(npub): Fetch metadata for a specific user
  * updateProfileMetadata(profile): Update the current user's profile metadata
  * fetchUserProfile(npub): Get the profile of a specific user
  * followUser(npub): Follow a user
  * unfollowUser(npub): Unfollow a user

  Content Management:
  * fetchNote(noteId): Fetch a specific note
  * fetchNoteAndReplies(noteId): Fetch a note and its replies
  * publishNote(content): Publish a new note
  * repostNote(noteId, quoteContent): Repost a note with optional quote content
  * likeNote(noteId): Like a note
  * replyToNote(noteId, content): Reply to a note

  Feed Management:
  * fetchFeed(feedType, since, until, limit): Fetch a feed of notes
  * fetchUserFeed(npub, feedType, since, until, limit): Fetch a user's feed
  * subscribeToFeed(feedType, onevent): Subscribe to a feed for real-time updates
  * subscribeToUserFeed(npub, feedType, onevent): Subscribe to a user's feed

  Note: Full typescript interface documentation for reference is available at [ApnaApp Nostr Interface](https://cdn.jsdelivr.net/npm/@apna/sdk/src/interfaces/nostr/index.ts)

Optionally:
* Explain briefly why you made certain layout or design choices to improve usability or clarity.

Base boilerplate template: 
\`\`\`html
${BASE_HTML_TEMPLATE}
\`\`\
`
    },
    {
      role: 'user',
      content: userPrompt
    }
  ];
}