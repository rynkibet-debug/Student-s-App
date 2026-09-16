import 'react-native-gesture-handler';

import React, { useContext } from 'react';

import { GestureHandlerRootView }
  from 'react-native-gesture-handler';

import { NavigationContainer, DefaultTheme }
  from '@react-navigation/native';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import * as Notifications from 'expo-notifications';

import ThemeProvider, { ThemeContext }
  from './context/themeContext';

import AuthProvider
  from './context/authContext';

import RootStack
  from './navigation/rootStack';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function Navigation() {
  const { theme } = useContext(ThemeContext);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.bg,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}