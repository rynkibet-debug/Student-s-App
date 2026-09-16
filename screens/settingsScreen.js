import React, {
  useState,
  useContext,
  useEffect,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage
  from '@react-native-async-storage/async-storage';

import ScreenWrapper
  from '../components/screenWrapper';
import Header from '../components/header';
import Card from '../components/card';

import { ThemeContext }
  from '../context/themeContext';
import { AuthContext }
  from '../context/authContext';

const NOTIFICATIONS_KEY = 'students-app_notifications_enabled';
const OFFLINE_MODE_KEY = 'students-app_offline_mode';

export default function SettingsScreen({
  navigation,
}) {
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 KB');

  useEffect(() => {
    loadPrefs();
    calculateCacheSize();
  }, []);

  async function loadPrefs() {
    try {
      const notif = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const offline = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
      if (notif !== null) setNotificationsOn(notif === 'true');
      if (offline !== null) setOfflineMode(offline === 'true');
    } catch (_) {}
  }

  async function toggleNotifications(value) {
    setNotificationsOn(value);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(value));
  }

  async function toggleOfflineMode(value) {
    setOfflineMode(value);
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, String(value));
  }

  async function calculateCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith('students-app_cache_'));
      const items = await AsyncStorage.multiGet(cacheKeys);
      const bytes = items.reduce(
        (sum, [, value]) => sum + (value ? value.length : 0),
        0
      );
      setCacheSize(
        bytes < 1024
          ? `${bytes} B`
          : `${(bytes / 1024).toFixed(1)} KB`
      );
    } catch (_) {}
  }

  async function handleClearCache() {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached offline data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter((k) =>
                k.startsWith('students-app_cache_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              await calculateCacheSize();
              Alert.alert('Done', 'Cache cleared.');
            } catch (_) {}
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  function Row({ icon, label, onPress, rightElement, danger = false, last = false }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 15,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: theme.border,
        }}
      >
        <Ionicons name={icon} size={20} color={danger ? '#ef4444' : theme.subtext} />
        <Text
          style={{
            flex: 1,
            color: danger ? '#ef4444' : theme.text,
            fontSize: 15,
            fontWeight: '600',
            marginLeft: 14,
          }}
        >
          {label}
        </Text>
        {rightElement ||
          (onPress && (
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          ))}
      </TouchableOpacity>
    );
  }

  function SectionTitle({ title }) {
    return (
      <Text
        style={{
          color: theme.subtext,
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          marginTop: 20,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
    );
  }

  function toggle(value, setter) {
    return (
      <Switch
        value={value}
        onValueChange={setter}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor="#fff"
      />
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Settings" navigation={navigation} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        <SectionTitle title="Appearance" />
        <Card padded={false}>
          <Row
            icon="color-palette-outline"
            label="Theme"
            onPress={() => navigation.navigate('Appearance')}
            last
          />
        </Card>

        <SectionTitle title="Notifications" />
        <Card padded={false}>
          <Row
            icon="notifications-outline"
            label="Enable Notifications"
            rightElement={toggle(notificationsOn, toggleNotifications)}
            last
          />
        </Card>

        <SectionTitle title="App Options" />
        <Card padded={false}>
          <Row
            icon="cloud-offline-outline"
            label="Offline Mode"
            rightElement={toggle(offlineMode, toggleOfflineMode)}
            last
          />
        </Card>

        <SectionTitle title="Privacy & Security" />
        <Card padded={false}>
          <Row
            icon="trash-outline"
            label="Clear Cache"
            onPress={handleClearCache}
            rightElement={
              <Text style={{ color: theme.subtext, fontSize: 13 }}>{cacheSize}</Text>
            }
          />
          <Row
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            last
          />
        </Card>

        <SectionTitle title="Help & Support" />
        <Card padded={false}>
          <Row
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => navigation.navigate('HelpSupport')}
            last
          />
        </Card>

        <SectionTitle title="About App" />
        <Card padded={false}>
          <Row
            icon="information-circle-outline"
            label="Version"
            rightElement={
              <Text style={{ color: theme.subtext, fontSize: 13 }}>1.0.0</Text>
            }
          />
          <Row
            icon="document-text-outline"
            label="Terms & Privacy Policy"
            onPress={() => navigation.navigate('Terms')}
            last
          />
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}