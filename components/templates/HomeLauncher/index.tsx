import AppList from "@/components/organisms/AppList";
import SubmitApp from "@/components/organisms/SubmitApp";
import { useEffect } from "react";
import { getKeyPairFromLocalStorage, saveKeyPairToLocalStorage, getProfileFromLocalStorage, saveProfileToLocalStorage } from "@/lib/utils";
import { GenerateKeyPair, InitialiseProfile } from "@/lib/nostr";


const initialiseKeyPair = () => {
    // find the keys in local storage
    const existingKeyPair = getKeyPairFromLocalStorage();
    // if not found generate and set to local storage
    if (!existingKeyPair) {
        const { nsec, npub } = GenerateKeyPair();
        saveKeyPairToLocalStorage(npub, nsec);
    }
};

const initialiseProfile = async () => {
    // find the keys in local storage
    const existingProfile = getProfileFromLocalStorage();
    // if not found publish and set to local storage
    if (!existingProfile) {
        initialiseKeyPair();
        const existingKeyPair = getKeyPairFromLocalStorage();
        const profile = await InitialiseProfile(existingKeyPair!.nsec);
        saveProfileToLocalStorage(profile);
    }
}

export default function HomeLauncherComponent() {
    useEffect(() => {
        const init = async () => {
            await initialiseProfile();
            console.log('initialised')
        }
        init()

    })

    return (
        <div className="min-h-screen bg-gray-100 p-8 justify-center">
            <h1 className="text-3xl font-bold mb-8 text-center">Apna Apps</h1>
            <SubmitApp></SubmitApp>
            <br></br>
            <AppList></AppList>
        </div>

    )
}