import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getKeyPairFromLocalStorage() {
  if (typeof window === 'undefined') return null;
  const nsec = localStorage.getItem('nsec');
  const npub = localStorage.getItem('npub');
  if (!nsec || !npub) return null;
  return { nsec, npub };
}

export function saveKeyPairToLocalStorage(npub: string, nsec: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('npub', npub);
  localStorage.setItem('nsec', nsec);
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