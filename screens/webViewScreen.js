import React, { useContext } from 'react';

import { View } from 'react-native';

import { WebView }
  from 'react-native-webview';

import ScreenWrapper
  from '../components/screenWrapper';
import Header from '../components/header';

import { ThemeContext }
  from '../context/themeContext';

export default function WebViewScreen({
  navigation,
  route,
}) {
  const { theme } = useContext(ThemeContext);
  const { title, url } = route.params;

  return (
    <ScreenWrapper>
      <Header
        title={title}
        navigation={navigation}
        showBack
      />
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
        }}
      >
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
        />
      </View>
    </ScreenWrapper>
  );
}