import React, { useContext } from 'react';

import { View } from 'react-native';

import { ThemeContext }
  from '../context/themeContext';

export default function Card({
  children,
  style,
  padded = true,
}) {
  const { theme } = useContext(ThemeContext);

  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.border,
          padding: padded ? 16 : 0,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}