import React, { useContext } from 'react';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { AuthContext }
  from '../context/authContext';
import { ThemeContext }
  from '../context/themeContext';

import AuthChoiceScreen
  from '../screens/auth/authChoiceScreen';
import SignupScreen
  from '../screens/auth/signupScreen';
import OtpScreen
  from '../screens/auth/otpScreen';
import CreatePasswordScreen
  from '../screens/auth/createPasswordScreen';
import LoginScreen
  from '../screens/auth/loginScreen';
import ForgotPasswordScreen
  from '../screens/auth/forgotPasswordScreen';

import ProfileSetupScreen
  from '../screens/profileSetupScreen';

import MainTabs from './mainTabs';
import ClassDetailsScreen
  from '../screens/classDetailsScreen';
import ProfileScreen
  from '../screens/profileScreen';
import SettingsScreen
  from '../screens/settingsScreen';
import AppearanceScreen
  from '../screens/appearanceScreen';
import TodaysScheduleScreen
  from '../screens/todaysSchedule';
import WebViewScreen
  from '../screens/webViewScreen';
import HelpSupportScreen
  from '../screens/helpSupportScreen';
import TermsScreen
  from '../screens/termsScreen';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const { isLoggedIn, user } =
    useContext(AuthContext);
  const { theme } =
    useContext(ThemeContext);

  const needsProfileSetup =
    isLoggedIn && user?.profile_completed !== 1;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      {!isLoggedIn ? (
        <>
          <Stack.Screen
            name="AuthChoice"
            component={AuthChoiceScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
          />
          <Stack.Screen
            name="Otp"
            component={OtpScreen}
          />
          <Stack.Screen
            name="CreatePassword"
            component={CreatePasswordScreen}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </>
      ) : needsProfileSetup ? (
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{ animation: 'fade' }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ animation: 'fade', freezeOnBlur: true }}
          />
          <Stack.Screen
            name="ClassDetails"
            component={ClassDetailsScreen}
            options={{ freezeOnBlur: true }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ freezeOnBlur: true }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ freezeOnBlur: true }}
          />
          <Stack.Screen
            name="Appearance"
            component={AppearanceScreen}
            options={{ freezeOnBlur: true }}
          />
          <Stack.Screen
            name="TodaysSchedule"
            component={TodaysScheduleScreen}
            options={{ freezeOnBlur: true }}
          />
          <Stack.Screen
            name="WebView"
            component={WebViewScreen}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
          />
          <Stack.Screen
            name="Terms"
            component={TermsScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}