import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthTheme } from './authTheme';

export default function AuthChoiceScreen({ navigation }) {
  const { theme, mode } = useAuthTheme();

  return (
    <>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={mode === 'light' ? 'dark-content' : 'light-content'}
      />
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ flex: 1, backgroundColor: theme.bg }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          {/* Logo */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: 48,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: theme.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 28,
                  fontWeight: '900',
                  letterSpacing: 1,
                }}
              >
                S
              </Text>
            </View>

            <Text
              style={{
                color: theme.text,
                fontSize: 30,
                fontWeight: '900',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              STUDENTS APP
            </Text>

            <Text
              style={{
                color: theme.subtext,
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Everything MMU, in one place
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontWeight: '700',
                fontSize: 15,
              }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontWeight: '700',
                fontSize: 15,
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}