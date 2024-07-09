"use client";
// import Home from "@/components/templates/home";
import Social from "@/components/templates/Social";
import { GenerateKeyPair } from "@/lib/nostr";
import { getKeyPairFromLocalStorage, saveKeyPairToLocalStorage } from "@/lib/utils";
import { useEffect } from "react";

const initialiseKeyPair = () => {
  // find the keys in local storage
  const existingKeyPair = getKeyPairFromLocalStorage();
  // if not found generate and set to local storage
  if (!existingKeyPair) {
    const { nsec, npub } = GenerateKeyPair();
    saveKeyPairToLocalStorage(npub, nsec);
  }
};

export default function PageComponent() {
  useEffect(() => {
    initialiseKeyPair()
  }, []);
  return <Social></Social>;
}
