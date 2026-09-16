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

export default function OtpScreen({ route, navigation }) {
  const { theme, mode: colorMode } = useAuthTheme();
  const { email, mode } = route.params; // mode: 'signup' | 'reset'

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  async function handleVerify() {
    setError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verifyCode.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim(), purpose: mode }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Invalid code');
        setLoading(false);
        return;
      }

      setLoading(false);
      // replace, not navigate — a consumed/expired code can't be
      // revisited by pressing back into this screen again
      navigation.replace('CreatePassword', {
        email,
        mode,
        // Only present when mode === 'reset' — resetPassword.php requires
        // this token, so the OTP step can no longer be skipped.
        resetToken: result.reset_token,
      });
    } catch (err) {
      setLoading(false);
      setError('Network error — check your connection');
    }
  }

  async function handleResend() {
    setResendMsg('');
    setResending(true);
    try {
      const endpoint = mode === 'reset' ? 'forgotPassword.php' : 'signup.php';
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      setResending(false);
      setResendMsg(
        response.ok ? 'New code sent' : result.message || 'Failed to resend'
      );
    } catch (err) {
      setResending(false);
      setResendMsg('Network error');
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
              Enter Code
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              We sent a 6-digit code to{' '}
              <Text style={{ color: theme.text, fontWeight: '600' }}>
                {email}
              </Text>
            </Text>
          </View>

          <TextInput
            style={{
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: error ? '#ef4444' : theme.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: theme.text,
              fontSize: 22,
              letterSpacing: 8,
              textAlign: 'center',
            }}
            placeholder="------"
            placeholderTextColor={theme.subtext}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/[^0-9]/g, '').slice(0, 6));
              if (error) setError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          {!!error && (
            <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleVerify}
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
                Verify
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={resending}
            style={{ marginTop: 20, alignItems: 'center' }}
          >
            <Text style={{ color: theme.subtext, fontSize: 13 }}>
              {resending ? (
                'Sending...'
              ) : (
                <>
                  Didn't get it?{' '}
                  <Text style={{ color: theme.accent, fontWeight: '700' }}>
                    Resend code
                  </Text>
                </>
              )}
            </Text>
          </TouchableOpacity>

          {!!resendMsg && (
            <Text
              style={{
                color: theme.subtext,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {resendMsg}
            </Text>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}