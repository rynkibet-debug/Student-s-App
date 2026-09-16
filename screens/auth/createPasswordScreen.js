import React, { useState, useContext } from 'react';
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
import { AuthContext } from '../../context/authContext';

export default function CreatePasswordScreen({ route, navigation }) {
  const { theme, mode: colorMode } = useAuthTheme();
  const { login } = useContext(AuthContext);
  const { email, mode, resetToken } = route.params; // mode: 'signup' | 'reset'

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        mode === 'reset' ? 'resetPassword.php' : 'setPassword.php';

      const body =
        mode === 'reset'
          ? { email, password, reset_token: resetToken }
          : { email, password };

      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setLoading(false);

      if (mode === 'reset') {
        // Password reset done — replace (not navigate) so back button
        // can't return to this screen or the consumed OTP screen
        navigation.replace('Login');
      } else {
        // Signup complete — token comes back, log them in directly.
        // RootStack's conditional render handles the screen swap;
        // no manual navigation needed here.
        await login({ token: result.token, ...result.user });
      }
    } catch (err) {
      setLoading(false);
      setError('Network error — check your connection');
    }
  }

  return (
    <>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={colorMode === 'light' ? 'dark-content' : 'light-content'}
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
              {mode === 'reset' ? 'New Password' : 'Create Password'}
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {mode === 'reset'
                ? 'Choose a new password for your account'
                : 'Almost done — set a password to finish signing up'}
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
            Password
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
              marginBottom: 16,
            }}
            placeholder="At least 6 characters"
            placeholderTextColor={theme.subtext}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError('');
            }}
            secureTextEntry
            autoFocus
          />

          <Text
            style={{
              color: theme.subtext,
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 6,
            }}
          >
            Confirm Password
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
            placeholder="Re-enter password"
            placeholderTextColor={theme.subtext}
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              if (error) setError('');
            }}
            secureTextEntry
          />
          {!!error && (
            <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
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
                {mode === 'reset' ? 'Reset Password' : 'Finish Signup'}
              </Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}