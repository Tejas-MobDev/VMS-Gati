/**
 * MIGRATION NOTE:
 * Angular: app-routing.module.ts with lazy-loaded modules + AppComponent auth check
 * React Native: Root stack navigator that conditionally renders SignIn or MainTabs
 * based on session token in AppContext (mirrors AppComponent.initializeApp()).
 *
 * Splash screen strategy:
 *   - The native splash screen (react-native-bootsplash) is shown immediately
 *     by the OS before any JS runs (via MainActivity.kt / AppDelegate.swift).
 *   - We keep it visible while isAuthChecked is false (AsyncStorage read).
 *   - As soon as isAuthChecked flips true we call BootSplash.hide({ fade: true }),
 *     which smoothly transitions to whichever screen the user should land on.
 *   - The old ActivityIndicator spinner is removed — the native splash covers
 *     that loading gap instead, giving a seamless branded experience.
 */
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from './types';
import SignInScreen from '../screens/SignIn/SignInScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { sessionToken, isAuthChecked } = useAppContext();

    useEffect(() => {
        if (isAuthChecked) {
            // Auth check complete — hide the native splash with a smooth fade.
            // The correct screen (SignIn or Dashboard) is already mounted behind
            // the splash at this point, so there is zero blank-screen flash.
            BootSplash.hide({ fade: true });
        }
    }, [isAuthChecked]);

    // While isAuthChecked is false the native splash screen is still showing,
    // so we don't need to render anything here — returning null is safe.
    if (!isAuthChecked) {
        return null;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {sessionToken ? (
                <Stack.Screen name="MainTabs" component={TabNavigator} />
            ) : (
                <Stack.Screen name="SignIn" component={SignInScreen} />
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
