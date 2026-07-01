/**
 * MIGRATION NOTE:
 * Angular: app-routing.module.ts with lazy-loaded modules + AppComponent auth check
 * React Native: Root stack navigator that conditionally renders SignIn or MainTabs
 * based on session token in AppContext (mirrors AppComponent.initializeApp()).
 *
 * The isAuthChecked flag ensures we don't flash the wrong screen on startup.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from './types';
import SignInScreen from '../screens/SignIn/SignInScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { sessionToken, isAuthChecked } = useAppContext();

    // Show spinner while reading AsyncStorage on first launch
    if (!isAuthChecked) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#3880ff" />
            </View>
        );
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

const styles = StyleSheet.create({
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});

export default AppNavigator;
