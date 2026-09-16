import React, { useContext } from 'react';

import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';

import { ThemeContext }
  from '../context/themeContext';

export default function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  color,
  textColor = '#fff',
  style,
}) {
  const { theme } = useContext(ThemeContext);

  const bg = color || theme.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: bg,
          paddingVertical: 15,
          paddingHorizontal: 24,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontWeight: '700',
            fontSize: 16,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}