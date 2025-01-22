import { useEffect, useState } from 'react';
import { 
    getKeyPairFromLocalStorage, 
    saveKeyPairToLocalStorage, 
    getProfileFromLocalStorage, 
    saveProfileToLocalStorage 
} from '@/lib/utils';
import { GenerateKeyPair, InitialiseProfile } from '@/lib/nostr';

interface KeyPair {
    nsec: string;
    npub: string;
}

interface Profile {
    // Add profile fields based on your needs
    [key: string]: any;
}

const initialiseKeyPair = (): KeyPair => {
    const existingKeyPair = getKeyPairFromLocalStorage();
    if (!existingKeyPair) {
        const { nsec, npub } = GenerateKeyPair();
        saveKeyPairToLocalStorage(npub, nsec);
        return { nsec, npub };
    }
    return existingKeyPair;
};

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initProfile = async () => {
            try {
                setLoading(true);
                let existingProfile = getProfileFromLocalStorage();

                if (!existingProfile) {
                    const keyPair = initialiseKeyPair();
                    existingProfile = await InitialiseProfile(keyPair.nsec);
                    saveProfileToLocalStorage(existingProfile);
                }

                setProfile(existingProfile);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to initialize profile');
            } finally {
                setLoading(false);
            }
        };

        initProfile();
    }, []);

    const updateProfile = async (newProfile: Profile) => {
        try {
            setLoading(true);
            // Add profile update logic here if needed
            saveProfileToLocalStorage(newProfile);
            setProfile(newProfile);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        profile,
        loading,
        error,
        updateProfile
    };
}