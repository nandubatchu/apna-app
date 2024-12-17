import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function saveKeyPairToLocalStorage(npub: string, nsec: string) {
  localStorage.setItem('npub', npub);
  localStorage.setItem('nsec', nsec);
}

export function getKeyPairFromLocalStorage() {
  const npub = localStorage.getItem('npub');
  const nsec = localStorage.getItem('nsec');
  if (npub && nsec) {
    return { npub, nsec };
  }
  return null;
}

export function getProfileFromLocalStorage() {
  return localStorage.getItem('profile') && JSON.parse(localStorage.getItem('profile'));
}

export function saveProfileToLocalStorage(profile: any) {
  localStorage.setItem('profile', JSON.stringify(profile));
}