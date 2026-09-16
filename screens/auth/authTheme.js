import { useColorScheme } from 'react-native';

const themes = {
  light: {
    bg: '#f3f4f6',
    card: '#FFFFFF',
    text: '#111827',
    subtext: '#6B7280',
    accent: '#16bbce',
    border: '#E5E7EB',
    tab: '#FFFFFF',
  },
  dark: {
    bg: '#0B0F1A',
    card: '#111827',
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    accent: '#16bbce',
    border: '#1F2937',
    tab: '#111827',
  },
  amoled: {
    bg: '#000000',
    card: '#0A0A0A',
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    accent: '#16bbce',
    border: '#121212',
    tab: '#000000',
  },
};

export function useAuthTheme() {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null, no context needed
  const mode = systemScheme === 'light' ? 'light' : 'dark';
  return { theme: themes[mode], mode };
}

export default themes;