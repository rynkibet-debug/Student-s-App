import React, { useContext } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import { ThemeContext }
  from '../context/themeContext';

const CATEGORY_COLORS = {
  urgent: '#ef4444',
  important: '#f59e0b',
  info: '#3b82f6',
  announcement: '#7C3AED',
  memo: '#6B7280',
  deadline: '#ef4444',
};

const CATEGORY_LABELS = {
  urgent: 'Urgent',
  important: 'Important',
  info: 'Info',
  announcement: 'Announcement',
  memo: 'Memo',
  deadline: 'Deadline',
};

export default function NotificationCard({
  item,
  onPress,
  compact = false,
}) {
  const { theme } = useContext(ThemeContext);

  const color =
    CATEGORY_COLORS[item.priority] ||
    CATEGORY_COLORS[item.type] ||
    theme.accent;

  const label =
    CATEGORY_LABELS[item.priority] ||
    CATEGORY_LABELS[item.type] ||
    'Notice';

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
          gap: 10,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
          }}
        />
        <Text
          style={{
            color: color,
            fontSize: 13,
            fontWeight: '600',
            flex: 1,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        borderLeftWidth: 4,
        borderLeftColor: color,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
          gap: 8,
        }}
      >
        <View
          style={{
            backgroundColor: color + '22',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              color: color,
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
        </View>

        <Text
          style={{
            color: theme.subtext,
            fontSize: 11,
            marginLeft: 'auto',
          }}
        >
          {item.time}
        </Text>
      </View>

      <Text
        style={{
          color: theme.text,
          fontWeight: '700',
          fontSize: 14,
          marginBottom: 4,
        }}
      >
        {item.title}
      </Text>

      <Text
        style={{
          color: theme.subtext,
          fontSize: 13,
          lineHeight: 18,
        }}
        numberOfLines={2}
      >
        {item.body}
      </Text>
    </TouchableOpacity>
  );
}