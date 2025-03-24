import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Interface for user profiles
export interface IUserKeyPair {
  nsec: string;
  npub: string;
  alias?: string;
  isActive?: boolean;
  isRemoteSigner?: boolean;
}

// Constants for localStorage keys
const PROFILES_KEY = 'user_profiles';
const ACTIVE_PROFILE_KEY = 'active_profile_npub';

// Get all user profiles from localStorage
export function getAllUserProfilesFromLocalStorage(): IUserKeyPair[] {
  if (typeof window === 'undefined') return [];
  
  // Check if we have profiles in the new format
  const profilesJson = localStorage.getItem(PROFILES_KEY);
  if (profilesJson) {
    return JSON.parse(profilesJson);
  }
  
  // Migration: If we have old-style single profile, migrate it to the new format
  const nsec = localStorage.getItem('nsec');
  const npub = localStorage.getItem('npub');
  if (nsec && npub) {
    const profiles = [{ nsec, npub, isActive: true }];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    localStorage.setItem(ACTIVE_PROFILE_KEY, npub);
    return profiles;
  }
  
  return [];
}

// Get the active user profile from localStorage
export function getKeyPairFromLocalStorage(): IUserKeyPair | null {
  if (typeof window === 'undefined') return null;
  
  const profiles = getAllUserProfilesFromLocalStorage();
  if (profiles.length === 0) return null;
  
  const activeNpub = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (activeNpub) {
    const activeProfile = profiles.find(p => p.npub === activeNpub);
    if (activeProfile) return activeProfile;
  }
  
  // If no active profile is set, use the first one
  return profiles[0];
}

// Add a new user profile to localStorage
export function addUserProfileToLocalStorage(npub: string, nsec: string, setAsActive: boolean = true, alias?: string): void {
  if (typeof window === 'undefined') return;
  
  const profiles = getAllUserProfilesFromLocalStorage();
  
  // Check if profile already exists
  const existingIndex = profiles.findIndex(p => p.npub === npub);
  if (existingIndex >= 0) {
    // Update existing profile
    profiles[existingIndex] = { nsec, npub, alias: alias || profiles[existingIndex].alias };
  } else {
    // Add new profile
    profiles.push({ nsec, npub, alias });
  }
  
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  
  if (setAsActive) {
    setActiveUserProfile(npub);
  }
}

// Check if a profile with the given nsec already exists
export function profileExistsWithNsec(nsec: string): IUserKeyPair | null {
  if (typeof window === 'undefined') return null;
  
  const profiles = getAllUserProfilesFromLocalStorage();
  return profiles.find(p => p.nsec === nsec) || null;
}

// Remove a user profile from localStorage
export function removeUserProfileFromLocalStorage(npub: string): void {
  if (typeof window === 'undefined') return;
  
  let profiles = getAllUserProfilesFromLocalStorage();
  profiles = profiles.filter(p => p.npub !== npub);
  
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  
  // If we removed the active profile, set a new active profile
  const activeNpub = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (activeNpub === npub && profiles.length > 0) {
    setActiveUserProfile(profiles[0].npub);
  }
}

// Set the active user profile
export function setActiveUserProfile(npub: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(ACTIVE_PROFILE_KEY, npub);
  
  // Also update the old-style storage for backward compatibility
  const profiles = getAllUserProfilesFromLocalStorage();
  const profile = profiles.find(p => p.npub === npub);
  if (profile) {
    localStorage.setItem('npub', profile.npub);
    localStorage.setItem('nsec', profile.nsec);
  }
}

// Get a specific user profile by npub
export function getUserProfileByNpub(npub: string): IUserKeyPair | null {
  if (typeof window === 'undefined') return null;
  
  const profiles = getAllUserProfilesFromLocalStorage();
  return profiles.find(p => p.npub === npub) || null;
}

// Legacy functions for backward compatibility
export function saveKeyPairToLocalStorage(npub: string, nsec: string) {
  if (typeof window === 'undefined') return;
  
  // Update both the old and new storage formats
  localStorage.setItem('npub', npub);
  localStorage.setItem('nsec', nsec);
  
  // Also update in the new format
  addUserProfileToLocalStorage(npub, nsec, true);
}

export function getProfileFromLocalStorage() {
  if (typeof window === 'undefined') return null;
  const profile = localStorage.getItem('profile');
  return profile ? JSON.parse(profile) : null;
}

export function saveProfileToLocalStorage(profile: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('profile', JSON.stringify(profile));
}

export function getFaviconUrl(appUrl: string): string {
  try {
    const url = new URL(appUrl);
    return `${url.protocol}//${url.hostname}/favicon.ico`;
  } catch (e) {
    return '';
  }
}

// Remove all user profiles from localStorage
export function removeAllUserProfilesFromLocalStorage(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(PROFILES_KEY);
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
  localStorage.removeItem('npub');
  localStorage.removeItem('nsec');
}

// Add a remote signer profile to localStorage
export function addRemoteSignerProfileToLocalStorage(pubkey: string, bunkerUrl: string, setAsActive: boolean = true, alias?: string): void {
  if (typeof window === 'undefined') return;
  
  // Import nip19 dynamically since it's not available in server-side rendering
  const nip19 = require('nostr-tools/nip19');
  
  // Ensure we have an encoded npub
  const npub = pubkey.startsWith('npub') ? pubkey : nip19.npubEncode(pubkey);
  
  const profiles = getAllUserProfilesFromLocalStorage();
  
  // Check if profile already exists
  const existingIndex = profiles.findIndex(p => p.npub === npub);
  if (existingIndex >= 0) {
    // Update existing profile
    profiles[existingIndex] = {
      nsec: '', // Remote signers don't have nsec stored locally
      npub,
      alias: alias || profiles[existingIndex].alias,
      isRemoteSigner: true
    };
  } else {
    // Add new profile
    profiles.push({
      nsec: '', // Remote signers don't have nsec stored locally
      npub,
      alias,
      isRemoteSigner: true
    });
  }
  
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  
  if (setAsActive) {
    setActiveUserProfile(npub);
  }
}

// Check if a profile is a remote signer
export function isRemoteSignerProfile(pubkeyOrNpub: string): boolean {
  if (typeof window === 'undefined') return false;
  
  // Import nip19 dynamically since it's not available in server-side rendering
  const nip19 = require('nostr-tools/nip19');
  
  // Convert raw pubkey to npub if needed
  const npub = pubkeyOrNpub.startsWith('npub') ? pubkeyOrNpub : nip19.npubEncode(pubkeyOrNpub);
  
  const profile = getUserProfileByNpub(npub);
  return profile?.isRemoteSigner === true;
}

// Get all remote signer profiles
export function getRemoteSignerProfiles(): IUserKeyPair[] {
  if (typeof window === 'undefined') return [];
  
  const profiles = getAllUserProfilesFromLocalStorage();
  return profiles.filter(p => p.isRemoteSigner === true);
}

// Get all local profiles (non-remote signer)
export function getLocalProfiles(): IUserKeyPair[] {
  if (typeof window === 'undefined') return [];
  
  const profiles = getAllUserProfilesFromLocalStorage();
  return profiles.filter(p => p.isRemoteSigner !== true);
}

export function sendMessageToServiceWorker(message: any) {
  return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
          reject('No active Service Worker');
          return;
      }
      const messageChannel = new MessageChannel(); // Create the channel
      messageChannel.port1.onmessage = (event) => { // Listen for response
          resolve(event.data);
      };
      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]); // Send message and transfer port2
  });
}

export async function registerPeriodicSync(tag: string, minInterval: Number) {
  const registration = await navigator.serviceWorker.ready;
  try {
    // @ts-ignore
    await registration.periodicSync.register(tag, {
      minInterval
    });
  } catch {
    console.log("Periodic Sync could not be registered!");
  }
}