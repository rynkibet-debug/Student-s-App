import React, { useContext } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import Ionicons
  from '@expo/vector-icons/Ionicons';

import { ThemeContext }
  from '../context/themeContext';

export default function ClassCard({
  item,
  onPress,
  showDot = false,
}) {
  const { theme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <Text
        style={{
          width: 72,
          fontSize: 12,
          color: theme.subtext,
          fontWeight: '500',
        }}
      >
        {item.time.split(' - ')[0]}
      </Text>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.text,
            fontWeight: '700',
            fontSize: 14,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            color: theme.subtext,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {item.room}
        </Text>
      </View>

      {showDot && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: item.color || theme.accent,
          }}
        />
      )}
    </TouchableOpacity>
  );
}