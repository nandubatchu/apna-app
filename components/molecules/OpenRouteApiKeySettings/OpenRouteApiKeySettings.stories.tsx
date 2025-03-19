import React from 'react';
import OpenRouteApiKeySettings from './index';

export default {
  title: 'Molecules/OpenRouteApiKeySettings',
  component: OpenRouteApiKeySettings,
  parameters: {
    layout: 'centered',
  },
};

/**
 * Default story for OpenRouteApiKeySettings
 * 
 * Note: This component relies on the useOpenRouteApiKey hook which accesses localStorage.
 * In a real environment, it will display and manage the actual API key stored in localStorage.
 */
export const Default = () => (
  <div className="w-[600px] p-4 border rounded-lg">
    <h2 className="text-lg font-semibold mb-4">API Settings</h2>
    <OpenRouteApiKeySettings />
  </div>
);

Default.parameters = {
  docs: {
    description: {
      story: "The OpenRouteApiKeySettings component provides a user interface for managing the OpenRoute API key.\n\n" +
        "**Key Features:**\n" +
        "- Displays the current API key from localStorage (masked as password)\n" +
        "- Allows users to save a new API key\n" +
        "- Provides a clear button to remove the API key\n" +
        "- Shows success/error feedback when saving\n" +
        "- Includes helpful information about where to get an API key\n\n" +
        "**Usage:**\n" +
        "```jsx\n" +
        "<OpenRouteApiKeySettings />\n" +
        "```\n\n" +
        "This component is typically used in the settings page of the application."
    },
  },
};