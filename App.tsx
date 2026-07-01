/**
 * MIGRATION NOTE:
 * Angular: AppComponent (app.component.ts) + IonicModule.forRoot()
 * React Native: App.tsx wraps NavigationContainer + AppProvider.
 *
 * The splash/status-bar Capacitor logic is replaced by React Native's
 * built-in status bar and a useEffect-based auth check inside AppNavigator.
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
