import React, { useContext } from 'react';

import { StatusBar, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeContext } from '../context/themeContext';

export default function ScreenWrapper({
  children,
  padded = false,
}) {
  const { theme, activeMode } =
    useContext(ThemeContext);

  return (
    <>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={
          activeMode === 'light'
            ? 'dark-content'
            : 'light-content'
        }
      />

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{
          flex: 1,
          backgroundColor: theme.bg,
        }}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: theme.bg,
            paddingHorizontal: padded ? 20 : 0,
          }}
        >
          {children}
        </View>
      </SafeAreaView>
    </>
  );
}