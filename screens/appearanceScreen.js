import React, { useContext } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import ScreenWrapper
  from '../components/screenWrapper';
import Header from '../components/header';

import { ThemeContext }
  from '../context/themeContext';

const THEME_OPTIONS = [
  {
    key: 'light',
    label: 'Light Mode',
    icon: 'sunny-outline',
    description: 'Bright and clear',
  },
  {
    key: 'dark',
    label: 'Dark Mode',
    icon: 'moon-outline',
    description: 'Reduces eye strain',
  },
  {
    key: 'amoled',
    label: 'AMOLED Black',
    icon: 'phone-portrait-outline',
    description:
      'Saves battery',
  },
  {
    key: 'auto',
    label: 'Follow System',
    icon: 'contrast-outline',
    description: 'automatically switches',
  },
];

export default function AppearanceScreen({
  navigation,
}) {
  const { theme, mode, setMode } =
    useContext(ThemeContext);

  return (
    <ScreenWrapper>
      <Header
        title="Appearance"
        navigation={navigation}
        showBack
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: theme.subtext,
            fontSize: 14,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Choose how zentro-student looks on your
          device. Your preference is saved
          automatically.
        </Text>

        {THEME_OPTIONS.map((option) => {
          const isSelected =
            mode === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() =>
                setMode(option.key)
              }
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.card,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: isSelected
                  ? theme.accent
                  : theme.border,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: isSelected
                    ? theme.accent + '22'
                    : theme.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={
                    isSelected
                      ? theme.accent
                      : theme.subtext
                  }
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: '700',
                    fontSize: 15,
                    marginBottom: 3,
                  }}
                >
                  {option.label}
                </Text>
                <Text
                  style={{
                    color: theme.subtext,
                    fontSize: 13,
                  }}
                >
                  {option.description}
                </Text>
              </View>

              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.accent}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}