import React from 'react';
import { ChatMessage } from '@/lib/generatedAppsDB';
import GenerateAppFab from './index';

export default {
  title: 'Molecules/GenerateAppFab',
  component: GenerateAppFab,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ height: '400px', width: '100%', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};

// Mock handler function
const handleGenerateApp = (
  htmlContent: string,
  appId: string,
  messages: ChatMessage[],
  appName: string
) => {
  console.log('Generated app:', { htmlContent, appId, messages, appName });
};

/**
 * Default story for GenerateAppFab
 *
 * Note: This component relies on the useOpenRouteApiKey hook which accesses localStorage.
 * In a real environment, the FAB will only be visible when an API key is present in localStorage.
 *
 * For testing in Storybook:
 * 1. The FAB will be visible if you have an API key in localStorage
 * 2. If no API key is present, you'll need to add one in the Settings page first
 */
export const Default = () => (
  <GenerateAppFab onGenerateApp={handleGenerateApp} />
);

Default.parameters = {
  docs: {
    description: {
      story: `
        The GenerateAppFab component displays a floating action button that allows users to generate new HTML apps.
        
        **Key Features:**
        - Only visible when an OpenRoute API key is available in localStorage
        - Opens a dialog to input app name and functionality description
        - Sends the request to the API with the user's API key
        - Displays appropriate error messages if the API key is missing
        - Provides a direct link to the Settings page to add an API key
        
        **Usage:**
        \`\`\`jsx
        <GenerateAppFab onGenerateApp={handleGenerateApp} />
        \`\`\`
        
        Where \`handleGenerateApp\` is a function that receives the generated HTML content, app ID, messages history, and app name.
      `,
    },
  },
};