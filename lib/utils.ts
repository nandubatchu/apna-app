import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function saveKeyPairToLocalStorage(npub: string, nsec: string) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem('npub', npub);
    localStorage.setItem('nsec', nsec);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function getKeyPairFromLocalStorage() {
  if (!isBrowser()) return null;
  try {
    const npub = localStorage.getItem('npub');
    const nsec = localStorage.getItem('nsec');
    if (npub && nsec) {
      return { npub, nsec };
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return null;
}

export function getProfileFromLocalStorage() {
  if (!isBrowser()) return null;
  try {
    const profile = localStorage.getItem('profile');
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error reading profile from localStorage:', error);
    return null;
  }
}

export function saveProfileToLocalStorage(profile: any) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem('profile', JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile to localStorage:', error);
  }
}