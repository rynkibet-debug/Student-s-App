import React, {
  createContext,
  useState,
  useEffect,
} from 'react';

import { useColorScheme } from 'react-native';

import AsyncStorage
  from '@react-native-async-storage/async-storage';

import themes from '../theme/theme';

export const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'zentro-student_theme_mode';

export default function ThemeProvider({ children }) {
  const systemTheme = useColorScheme();
  const [mode, setModeState] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    async function loadPersistedTheme() {
      try {
        const saved = await AsyncStorage.getItem(
          THEME_STORAGE_KEY
        );
        if (saved) setModeState(saved);
      } catch (_) {}
      setIsThemeLoaded(true);
    }
    loadPersistedTheme();
  }, []);

  const setMode = async (newMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        newMode
      );
    } catch (_) {}
  };

  const activeMode =
    mode === 'auto'
      ? systemTheme || 'dark'
      : mode;

  const theme = themes[activeMode];

  if (!isThemeLoaded) return null;

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, theme, activeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}