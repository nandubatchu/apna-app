import { Event as NostrEvent } from 'nostr-tools';

export const APP_CATEGORIES = [
    "Productivity",
    "Social",
    "Entertainment",
    "Education",
    "Finance",
    "Health & Fitness",
    "Games",
    "Utilities",
    "Miscellaneous"
] as const;

export type AppCategory = typeof APP_CATEGORIES[number];

export interface AppDetails {
    appURL?: string;
    appName: string;
    htmlContent?: string;
    isGeneratedApp?: boolean;
    id: string;
    pubkey: string;
    reactions: NostrEvent[];
    avgRating: string;
    categories: AppCategory[];
    mode: "Full-page";
    description: string;
    authorMetadata: {
        name?: string;
    };
}

export interface ProcessedAppEvent extends NostrEvent {
    appURL?: string;
    appName: string;
    htmlContent?: string;
    isGeneratedApp?: boolean;
    categories: AppCategory[];
    mode: "Full-page";
    description: string;
}