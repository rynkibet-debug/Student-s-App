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
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import ScreenWrapper from '../../components/screenWrapper';
import Header from '../../components/header';
import NotificationCard from '../../components/notificationCard';

import { ThemeContext } from '../../context/themeContext';
import { AuthContext } from '../../context/authContext';
import { useTabNavigation } from '../../context/tabNavigationContext';

import { API_BASE } from '../../constants/apiConfig';
import { getCached, setCached } from '../../helpers/offlineCache';

const PRIORITY_OPTIONS = [
  { label: 'Urgent', value: 'urgent', color: '#ef4444' },
  { label: 'Important', value: 'important', color: '#f59e0b' },
  { label: 'Info', value: 'info', color: '#3b82f6' },
];

export default function UpdatesScreen({ goToAdjacentTab, tabParams }) {
  const navigation = useNavigation();
  const { goToTabByName } = useTabNavigation();
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [priorityFilter, setPriorityFilter] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilterRow, setShowFilterRow] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  // Receives the priority filter from Home's chips/View-all via mainTabs.js's
  // goToTabByName, since real navigation params don't apply to PagerView tabs
  useEffect(() => {
    if (tabParams?.priority) {
      setPriorityFilter(tabParams.priority);
      setShowFilterRow(true);
    }
  }, [tabParams]);

  async function fetchAnnouncements() {
    try {
      const response = await fetch(`${API_BASE}/getAnnouncements.php`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        const transformed = result.announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          priority: a.category,
          createdAt: a.created_at,
          read: a.is_read === 1,
        }));
        setAnnouncements(transformed);
        await setCached('updatesAnnouncements', transformed);
      }
    } catch (err) {
      console.warn('fetchAnnouncements failed, falling back to cache:', err);
      try {
        const cached = await getCached('updatesAnnouncements');
        if (cached) setAnnouncements(cached);
      } catch (cacheErr) {
        console.warn('updatesAnnouncements cache read also failed:', cacheErr);
      }
    }
  }

  async function loadInitial() {
    setLoading(true);
    await fetchAnnouncements();
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  }

  async function markAsRead(id) {
    // Optimistic update — reverted below if the backend call fails,
    // so the UI never claims something is read when it isn't.
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    try {
      const response = await fetch(`${API_BASE}/markAnnouncementRead.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ announcement_id: id }),
      });
      if (!response.ok) {
        throw new Error(`markAnnouncementRead responded ${response.status}`);
      }
    } catch (err) {
      console.warn('markAsRead failed, reverting optimistic update:', err);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: false } : a))
      );
    }
  }

  const query = searchText.toLowerCase().trim();

  let filtered = [...announcements];

  if (priorityFilter) {
    filtered = filtered.filter((n) => n.priority === priorityFilter);
  }

  if (query) {
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query)
    );
  }

  function clearAll() {
    setPriorityFilter(null);
    setSearchText('');
    setShowFilterRow(false);
  }

  return (
    <ScreenWrapper>
      <Header
        title="Updates"
        navigation={navigation}
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowFilterRow((v) => !v)}
            style={{
              padding: 4,
              borderRadius: 8,
              backgroundColor: showFilterRow ? theme.accent + '22' : 'transparent',
            }}
          >
            <Ionicons
              name="filter-outline"
              size={24}
              color={showFilterRow ? theme.accent : theme.text}
            />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: searchFocused ? theme.accent : theme.border,
            paddingHorizontal: 14,
            paddingVertical: 11,
            gap: 10,
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={searchFocused ? theme.accent : theme.subtext}
          />
          <TextInput
            style={{ flex: 1, color: theme.text, fontSize: 15, padding: 0 }}
            placeholder="Search updates..."
            placeholderTextColor={theme.subtext}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Priority filter row */}
      {showFilterRow && (
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <Text
            style={{
              color: theme.subtext,
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            Filter by Priority
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PRIORITY_OPTIONS.map((opt) => {
              const isActive = priorityFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setPriorityFilter(isActive ? null : opt.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive ? opt.color : opt.color + '22',
                    borderWidth: 1,
                    borderColor: opt.color,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? '#fff' : opt.color,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Announcement list */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : filtered.length > 0 ? (
          filtered.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onPress={() => markAsRead(item.id)}
            />
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={theme.subtext}
            />
            <Text
              style={{
                color: theme.subtext,
                fontSize: 15,
                marginTop: 16,
                fontWeight: '600',
              }}
            >
              No updates found
            </Text>
            {(priorityFilter || query) && (
              <TouchableOpacity onPress={clearAll} style={{ marginTop: 12 }}>
                <Text
                  style={{ color: theme.accent, fontWeight: '600', fontSize: 14 }}
                >
                  Clear all filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}