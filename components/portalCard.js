import React, { useContext } from 'react';

import {
  TouchableOpacity,
  View,
  Text,
} from 'react-native';

import Ionicons
  from '@expo/vector-icons/Ionicons';

import { ThemeContext }
  from '../context/themeContext';

export default function PortalCard({
  item,
  onPress,
}) {
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        alignItems: 'center',
        width: 72,
      }}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          backgroundColor: item.color + '22',
          borderWidth: 1,
          borderColor: item.color + '44',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <Ionicons
          name={item.icon}
          size={26}
          color={item.color}
        />
      </View>

      <Text
        style={{
          color: theme.subtext,
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}