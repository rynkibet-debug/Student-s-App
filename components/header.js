import React, { useContext } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemeContext } from '../context/themeContext';
import { AuthContext } from '../context/authContext';

function getInitials(user) {
  if (!user) return 'ZT';
  if (user.initials) return user.initials;
  if (user.name) {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return 'ZT';
}

export default function Header({
  title,
  navigation,
  showBack = false,
  rightComponent,
  onBellPress,
}) {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const initials = getInitials(user);

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
        )}

        <Text
          style={{
            color: theme.text,
            fontSize: 24,
            fontWeight: '800',
            letterSpacing: 1,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Custom right side */}
      {rightComponent && rightComponent}

      {/* Default right side — only on Home (no back, no custom) */}
      {!showBack && !rightComponent && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <TouchableOpacity onPress={onBellPress}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Profile')
            }
          >
            {user?.profilePic ? (
              <Image
                source={{ uri: user.profilePic }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                }}
              />
            ) : (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: theme.accent,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}