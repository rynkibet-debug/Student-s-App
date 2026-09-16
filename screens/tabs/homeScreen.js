import React, {
  useState,
  useEffect,
  useRef,
  useContext,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import ScreenWrapper
  from '../../components/screenWrapper';
import Header
  from '../../components/header';
import Card
  from '../../components/card';
import ClassCard
  from '../../components/classCard';
import NotificationCard
  from '../../components/notificationCard';
import PortalCard
  from '../../components/portalCard';

import { ThemeContext }
  from '../../context/themeContext';
import { AuthContext }
  from '../../context/authContext';
import { useTabNavigation }
  from '../../context/tabNavigationContext';

import { portals }
  from '../../constants/portals';
import { API_BASE }
  from '../../constants/apiConfig';

import { getCached, setCached }
  from '../../helpers/offlineCache';

import {
  getNextClass,
  getActiveClass,
  getMinutesUntilClass,
  formatCountdown,
  getMidnightTimeout,
  formatTimeLabel,
} from '../../helpers/timeHelpers';

import { scheduleTodaysLessonReminders }
  from '../../helpers/notificationScheduler';

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  important: '#f59e0b',
  info: '#3b82f6',
};

const STATUS_COLORS = {
  confirmed: '#22c55e',
  cancelled: '#ef4444',
  scheduled: '#9CA3AF',
};

function transformSchedule(apiSchedule) {
  return apiSchedule.map((item) => {
    const [startHour, startMinute] = item.start_time
      .split(':')
      .map(Number);
    const [endHour, endMinute] = item.end_time
      .split(':')
      .map(Number);

    return {
      id: item.timetable_id,
      title: `${item.unit_code} — ${item.unit_title}`,
      room: item.venue,
      status: item.status,
      startHour,
      startMinute,
      endHour,
      endMinute,
      time: `${formatTimeLabel(startHour, startMinute)} - ${formatTimeLabel(
        endHour,
        endMinute
      )}`,
      color: STATUS_COLORS[item.status] || STATUS_COLORS.scheduled,
    };
  });
}

function timeAgo(dateString) {
  const then = new Date(dateString.replace(' ', 'T'));
  const now = new Date();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24)
    return `Today, ${then.toLocaleTimeString('en-KE', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function transformAnnouncements(apiAnnouncements) {
  return apiAnnouncements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    priority: a.category,
    time: timeAgo(a.created_at),
    read: a.is_read === 1,
  }));
}

export default function HomeScreen({ goToAdjacentTab }) {
  const navigation = useNavigation();
  const { goToTabByName } = useTabNavigation();
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  const [todayClasses, setTodayClasses] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [activeClass, setActiveClass] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const intervalRef = useRef(null);
  const midnightRef = useRef(null);

  function refreshAll(classes) {
    const liveClasses = classes.filter((c) => c.status !== 'cancelled');

    const next = getNextClass(liveClasses);
    const active = getActiveClass(liveClasses);
    setNextClass(next);
    setActiveClass(active);

    if (active) {
      setCountdown('In progress');
    } else if (next) {
      const mins = getMinutesUntilClass(next);
      setCountdown(formatCountdown(mins));
    } else {
      setCountdown('');
    }
  }

  async function fetchTodaysSchedule() {
    try {
      const response = await fetch(`${API_BASE}/getTodaysSchedule.php`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        const transformed = transformSchedule(result.schedule);
        setTodayClasses(transformed);
        refreshAll(transformed);
        await setCached('todaysSchedule', transformed);

        const upcoming = transformed.filter((c) => c.status !== 'cancelled');
        scheduleTodaysLessonReminders(
          upcoming.map((c) => ({
            unit_code: c.title.split(' — ')[0],
            start_time: `${String(c.startHour).padStart(2, '0')}:${String(
              c.startMinute
            ).padStart(2, '0')}:00`,
          }))
        );
      }
    } catch (err) {
      console.warn('fetchTodaysSchedule failed, falling back to cache:', err);
      try {
        const cached = await getCached('todaysSchedule');
        if (cached) {
          setTodayClasses(cached);
          refreshAll(cached);
        }
      } catch (cacheErr) {
        console.warn('todaysSchedule cache read also failed:', cacheErr);
      }
    }
  }

  async function fetchAnnouncements() {
    try {
      const response = await fetch(`${API_BASE}/getAnnouncements.php`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        const transformed = transformAnnouncements(result.announcements);
        setAnnouncements(transformed);
        await setCached('homeAnnouncements', transformed);
      }
    } catch (err) {
      console.warn('fetchAnnouncements failed, falling back to cache:', err);
      try {
        const cached = await getCached('homeAnnouncements');
        if (cached) setAnnouncements(cached);
      } catch (cacheErr) {
        console.warn('homeAnnouncements cache read also failed:', cacheErr);
      }
    }
  }

  async function loadAll() {
    setLoadingSchedule(true);
    setLoadingAnnouncements(true);
    await fetchTodaysSchedule();
    await fetchAnnouncements();
    setLoadingSchedule(false);
    setLoadingAnnouncements(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
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

  useEffect(() => {
    loadAll();

    intervalRef.current = setInterval(() => {
      setTodayClasses((current) => {
        refreshAll(current);
        return current;
      });
    }, 60000);

    midnightRef.current = getMidnightTimeout(() => {
      fetchTodaysSchedule();
    });

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(midnightRef.current);
    };
  }, []);

  const upcomingHighlights = announcements.slice(0, 3);

  const displayNextClass = activeClass || nextClass;

  return (
    <ScreenWrapper>
      <Header
        title={
          user?.name
            ? `HEY, ${user.name.split(' ')[0].toUpperCase()}`
            : 'HEY, STUDENT'
        }
        navigation={navigation}
        onBellPress={() => goToTabByName('Updates')}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Priority Chips */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {['urgent', 'important', 'info'].map((priority) => (
            <TouchableOpacity
              key={priority}
              onPress={() => goToTabByName('Updates', { priority })}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: PRIORITY_COLORS[priority],
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Class */}
        <Text
          style={{
            color: theme.text,
            fontWeight: '700',
            fontSize: 16,
            marginBottom: 12,
          }}
        >
          Next Class
        </Text>

        {displayNextClass ? (
          <Card style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: '800',
                    fontSize: 18,
                    marginBottom: 4,
                  }}
                >
                  {displayNextClass.title}
                </Text>

                <Text
                  style={{ color: theme.subtext, fontSize: 13, marginBottom: 2 }}
                >
                  {displayNextClass.time}
                </Text>

                <Text
                  style={{
                    color: theme.subtext,
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  {displayNextClass.room}
                </Text>

                {countdown ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name={activeClass ? 'radio-button-on' : 'time-outline'}
                      size={14}
                      color="#22c55e"
                    />
                    <Text
                      style={{
                        color: '#22c55e',
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      {countdown}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: displayNextClass.color + '22',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="book-outline"
                  size={24}
                  color={displayNextClass.color}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: theme.subtext,
                textAlign: 'center',
                paddingVertical: 8,
                fontSize: 14,
              }}
            >
              {loadingSchedule ? 'Loading...' : 'No more classes today'}
            </Text>
          </Card>
        )}

        {/* Today's Schedule */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
            Today's Schedule
          </Text>
          <TouchableOpacity onPress={() => goToTabByName('Classes')}>
            <Text
              style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}
            >
              View all
            </Text>
          </TouchableOpacity>
        </View>

        <Card padded={false} style={{ marginBottom: 24 }}>
          {todayClasses.length > 0 ? (
            todayClasses.map((item, index) => (
              <View
                key={item.id}
                style={{
                  paddingHorizontal: 16,
                  paddingTop: index === 0 ? 8 : 0,
                  opacity: item.status === 'cancelled' ? 0.5 : 1,
                }}
              >
                <ClassCard
                  item={item}
                  showDot
                  onPress={() =>
                    navigation.navigate('ClassDetails', { classItem: item })
                  }
                />
              </View>
            ))
          ) : (
            <Text
              style={{
                color: theme.subtext,
                textAlign: 'center',
                padding: 20,
                fontSize: 14,
              }}
            >
              {loadingSchedule ? 'Loading...' : 'No classes today'}
            </Text>
          )}
        </Card>

        {/* Upcoming */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
            Upcoming
          </Text>
          <TouchableOpacity onPress={() => goToTabByName('Updates')}>
            <Text
              style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}
            >
              View all
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={{ marginBottom: 24 }}>
          {loadingAnnouncements ? (
            <Text
              style={{ color: theme.subtext, textAlign: 'center', fontSize: 14 }}
            >
              Loading...
            </Text>
          ) : upcomingHighlights.length > 0 ? (
            upcomingHighlights.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                compact
                onPress={() => markAsRead(item.id)}
              />
            ))
          ) : (
            <Text
              style={{ color: theme.subtext, textAlign: 'center', fontSize: 14 }}
            >
              No upcoming alerts
            </Text>
          )}
        </Card>

        {/* Quick Actions */}
        <Text
          style={{
            color: theme.text,
            fontWeight: '700',
            fontSize: 16,
            marginBottom: 16,
          }}
        >
          Quick Actions
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16 }}
        >
          {portals.map((item) => (
            <PortalCard
              key={item.title}
              item={item}
              onPress={() =>
                navigation.navigate('WebView', {
                  title: item.title,
                  url: item.url,
                })
              }
            />
          ))}
        </ScrollView>
      </ScrollView>
    </ScreenWrapper>
  );
}