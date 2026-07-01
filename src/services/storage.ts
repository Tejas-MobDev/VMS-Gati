/**
 * MIGRATION NOTE:
 * Angular: StorageService using @capacitor/preferences (Preferences.set/get/remove/clear)
 * React Native: Same interface using @react-native-async-storage/async-storage.
 *
 * No behaviour change — all keys and values are preserved exactly.
 * Capacitor Preferences stores strings only; AsyncStorage also stores strings — identical.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const StorageService = {
    async set(keyID: string, key_value: string): Promise<boolean> {
        try {
            await AsyncStorage.setItem(keyID, key_value);
            return true;
        } catch {
            return false;
        }
    },

    async get(key_ID: string): Promise<string | null> {
        try {
            const value = await AsyncStorage.getItem(key_ID);
            return value ?? null;
        } catch {
            return null;
        }
    },

    async remove(key: string): Promise<void> {
        await AsyncStorage.removeItem(key);
    },

    async clear(): Promise<void> {
        await AsyncStorage.clear();
    },
};

export default StorageService;
