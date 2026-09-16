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

export default function LoginScreen({ navigation }) {
  const { theme, mode: colorMode } = useAuthTheme();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'user_not_found' | 'wrong_password' | 'not_verified' | ''
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setErrorType('');

    if (!email.trim() || !password) {
      setError('Email and password required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Login failed');
        setErrorType(result.error || '');
        setLoading(false);
        return;
      }

      setLoading(false);
      await login({ token: result.token, ...result.user });

    } catch (err) {
      setLoading(false);
      setError('Network error — check your connection');
    }
  }

  function handleErrorAction() {
    if (errorType === 'user_not_found') {
      navigation.navigate('Signup');
    } else if (errorType === 'not_verified') {
      navigation.navigate('Otp', { email: email.trim(), mode: 'signup' });
    } else if (errorType === 'wrong_password') {
      navigation.navigate('ForgotPassword', { email: email.trim() });
    }
  }

  const errorActionLabel = {
    user_not_found: 'Sign up instead',
    not_verified: 'Verify your email',
    wrong_password: 'Forgot password?',
  }[errorType];

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
              Welcome Back
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 14 }}>
              Log in to continue
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
              borderColor: theme.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: theme.text,
              fontSize: 15,
              marginBottom: 16,
            }}
            placeholder="you@example.com"
            placeholderTextColor={theme.subtext}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) { setError(''); setErrorType(''); }
            }}
            autoCapitalize="none"
            keyboardType="email-address"
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
            }}
            placeholder="Your password"
            placeholderTextColor={theme.subtext}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) { setError(''); setErrorType(''); }
            }}
            secureTextEntry
          />

          {!!error && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#ef4444', fontSize: 12 }}>{error}</Text>
              {!!errorActionLabel && (
                <TouchableOpacity onPress={handleErrorAction} style={{ marginTop: 4 }}>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>
                    {errorActionLabel}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={handleLogin}
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
                Log In
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
            style={{ marginTop: 16, alignItems: 'center' }}
          >
            <Text style={{ color: theme.subtext, fontSize: 13 }}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={{ marginTop: 12, alignItems: 'center' }}
          >
            <Text style={{ color: theme.subtext, fontSize: 13 }}>
              Don't have an account?{' '}
              <Text style={{ color: theme.accent, fontWeight: '700' }}>
                Sign up
              </Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}