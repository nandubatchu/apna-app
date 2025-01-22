import AppList from "@/components/organisms/AppList";
import SubmitApp from "@/components/organisms/SubmitApp";
import { useEffect } from "react";
import { getKeyPairFromLocalStorage, saveKeyPairToLocalStorage, getProfileFromLocalStorage, saveProfileToLocalStorage } from "@/lib/utils";
import { GenerateKeyPair, InitialiseProfile } from "@/lib/nostr";
import ImportNsecApp from "@/components/organisms/ImportNsec";


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
        <div className="min-h-screen bg-[#f8faf9] safe-top safe-bottom">
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-16 sm:px-6 sm:pt-12 lg:px-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center text-[#368564] mb-6 sm:mb-12">
                    Apna Apps
                </h1>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                    <SubmitApp />
                    <ImportNsecApp />
                </div>
                <AppList />
            </div>
        </div>

    )
}