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