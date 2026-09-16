import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthTheme } from './authTheme';
import { API_BASE } from './apiConfig';

export default function SignupScreen({ navigation }) {
  const { theme, mode } = useAuthTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/signup.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setLoading(false);
      // replace, not navigate — prevents back button from returning
      // here and re-triggering signup with a code already sent
      navigation.replace('Otp', {
        email: email.trim(),
        mode: 'signup',
      });
    } catch (err) {
      setLoading(false);
      setError('Network error — check your connection');
    }
  }

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
        <KeyboardAvoidingView
          style={{ flex: 1, paddingHorizontal: 24 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ marginTop: 80, marginBottom: 32 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: 26,
                fontWeight: '900',
                marginBottom: 8,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              We'll send a verification code to your email
            </Text>
          </View>

          <Text
            style={{
              color: theme.subtext,
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 6,
            }}
          >
            Email
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: error ? '#ef4444' : theme.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: theme.text,
              fontSize: 15,
            }}
            placeholder="you@example.com"
            placeholderTextColor={theme.subtext}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />
          {!!error && (
            <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 24,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                Send Code
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 20, alignItems: 'center' }}
          >
            <Text style={{ color: theme.subtext, fontSize: 13 }}>
              Already have an account?{' '}
              <Text style={{ color: theme.accent, fontWeight: '700' }}>
                Log in
              </Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}