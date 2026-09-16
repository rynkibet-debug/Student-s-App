import React, {
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  PanResponder,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ScreenWrapper from '../../components/screenWrapper';
import Header from '../../components/header';
import PrimaryButton from '../../components/primaryButton';

import { ThemeContext } from '../../context/themeContext';
import { AuthContext } from '../../context/authContext';
import { useTabNavigation } from '../../context/tabNavigationContext';

import { API_BASE } from '../../constants/apiConfig';
import { getCached, setCached } from '../../helpers/offlineCache';

import {
  getClassesByDayFromList,
  getWeekDays,
  getTodayDayIndex,
} from '../../helpers/classHelpers';

const PRESET_COLORS = [
  '#7C3AED',
  '#22c55e',
  '#f59e0b',
  '#06b6d4',
  '#f43f5e',
  '#8b5cf6',
];

const DAY_TO_INDEX = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

function getCurrentWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((now - start) / 86400000 + start.getDay() + 1) / 7
  );
  return `students-app_personal_${year}_W${weekNum}`;
}

function transformTimetable(apiTimetable) {
  return apiTimetable.map((item) => {
    const [startHour, startMinute] = item.start_time.split(':').map(Number);
    const [endHour, endMinute] = item.end_time.split(':').map(Number);

    return {
      id: item.timetable_id,
      unitId: item.unit_id,
      title: item.unit_title,
      code: item.unit_code,
      room: item.venue,
      lecturer: item.lecturer_name || '—',
      status: item.status,
      startHour,
      startMinute,
      endHour,
      endMinute,
      time: `${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}`,
      days: [DAY_TO_INDEX[item.day_of_week]],
      isPersonal: false,
    };
  });
}

function getCardStyle(item, theme) {
  if (item.isPersonal) {
    return { backgroundColor: theme.card, borderColor: theme.border };
  }
  if (item.status === 'confirmed') {
    return { backgroundColor: '#22c55e11', borderColor: '#22c55e' };
  }
  if (item.status === 'cancelled') {
    return { backgroundColor: '#ef444411', borderColor: '#ef4444' };
  }
  return { backgroundColor: theme.card, borderColor: theme.border };
}

function formatTimeInput(input) {
  const cleaned = input.toUpperCase().replace(/[^0-9APM]/g, '');
  const match = cleaned.match(/^(\d{1,4})(AM|PM)?$/);
  if (!match) return input;

  const digits = match[1];
  const period = match[2] || '';

  let hours = digits;
  let minutes = '';

  if (digits.length > 2) {
    hours = digits.slice(0, digits.length - 2);
    minutes = digits.slice(-2);
  }

  let formatted = hours;
  if (minutes) formatted += ':' + minutes;
  if (period) formatted += ' ' + period;

  return formatted;
}

export default function ClassesScreen({ goToAdjacentTab }) {
  const navigation = useNavigation();
  const { goToTabByName } = useTabNavigation();
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  const weekDays = getWeekDays();
  const todayIndex = getTodayDayIndex();

  const [selectedDay, setSelectedDay] = useState(todayIndex || 1);

  const [fullTimetable, setFullTimetable] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [personalSchedule, setPersonalSchedule] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formDay, setFormDay] = useState(todayIndex || 1);
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadInitial();
    loadPersonalSchedule();
  }, []);

  async function fetchTimetable() {
    try {
      const response = await fetch(`${API_BASE}/getTimetable.php`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        const transformed = transformTimetable(result.timetable);
        setFullTimetable(transformed);
        await setCached('timetable', transformed);
      }
    } catch (err) {
      const cached = await getCached('timetable');
      if (cached) setFullTimetable(cached);
    }
  }

  async function loadInitial() {
    setLoadingTimetable(true);
    await fetchTimetable();
    setLoadingTimetable(false);
  }

  async function loadPersonalSchedule() {
    try {
      const key = getCurrentWeekKey();
      const saved = await AsyncStorage.getItem(key);
      if (saved) setPersonalSchedule(JSON.parse(saved));
    } catch (err) {
      console.error('Error loading personal schedule:', err);
    }
  }

  async function savePersonalSchedule(list) {
    try {
      const key = getCurrentWeekKey();
      await AsyncStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
      console.error('Error saving personal schedule:', err);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchTimetable();
    await loadPersonalSchedule();
    setRefreshing(false);
  }

  function parseTimeToMinutes(timeStr) {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  async function handleAddPersonal() {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    const startMins = parseTimeToMinutes(formStartTime);
    const endMins = parseTimeToMinutes(formEndTime);
    if (startMins === null || endMins === null) {
      Alert.alert('Error', 'Use format: 10:00 AM or 2:00 PM');
      return;
    }
    if (endMins <= startMins) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    setFormLoading(true);

    const newItem = {
      id: `personal_${Date.now()}`,
      title: formTitle.trim(),
      room: formRoom.trim() || 'TBA',
      time: `${formStartTime} - ${formEndTime}`,
      startHour: Math.floor(startMins / 60),
      startMinute: startMins % 60,
      endHour: Math.floor(endMins / 60),
      endMinute: endMins % 60,
      days: [formDay],
      color: formColor,
      isPersonal: true,
      code: 'Personal',
      lecturer: '—',
    };

    const updated = [...personalSchedule, newItem];
    setPersonalSchedule(updated);
    await savePersonalSchedule(updated);

    setFormLoading(false);
    setModalVisible(false);
    resetForm();
  }

  async function handleDeletePersonal(id) {
    Alert.alert('Remove', 'Remove this personal class?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = personalSchedule.filter((i) => i.id !== id);
          setPersonalSchedule(updated);
          await savePersonalSchedule(updated);
        },
      },
    ]);
  }

  function resetForm() {
    setFormTitle('');
    setFormRoom('');
    setFormStartTime('');
    setFormEndTime('');
    setFormDay(todayIndex || 1);
    setFormColor(PRESET_COLORS[0]);
  }

  const presetClasses = getClassesByDayFromList(fullTimetable, selectedDay);

  const personalForDay = personalSchedule
    .filter((i) => i.days.includes(selectedDay))
    .sort(
      (a, b) =>
        a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
    );

  const allClasses = [...presetClasses, ...personalForDay].sort(
    (a, b) =>
      a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipedLeft = gestureState.dx < -50;
        const swipedRight = gestureState.dx > 50;
        if (!swipedLeft && !swipedRight) return;

        const hasClassesToday = allClasses.length > 0;

        if (hasClassesToday) {
          const currentIdx = weekDays.findIndex((d) => d.dayIndex === selectedDay);
          if (swipedLeft && currentIdx < weekDays.length - 1) {
            setSelectedDay(weekDays[currentIdx + 1].dayIndex);
          } else if (swipedRight && currentIdx > 0) {
            setSelectedDay(weekDays[currentIdx - 1].dayIndex);
          }
        } else if (goToAdjacentTab) {
          goToAdjacentTab(swipedLeft ? 1 : -1);
        }
      },
    })
  ).current;

  const inputStyle = {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    marginBottom: 12,
  };

  return (
    <ScreenWrapper>
      
      <View >
        <Header
          title="Classes"
          navigation={navigation}
          rightComponent={<View style={{ width: 24 }} />}
        />
      </View>

      
      <View>
      
      <ScrollView
  horizontal
  style={{ flexGrow: 0, height: 96 }}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  }}
>
        {weekDays.map((day) => {
          const isSelected = selectedDay === day.dayIndex;
          return (
            <TouchableOpacity
              key={day.dayIndex}
              onPress={() => setSelectedDay(day.dayIndex)}
              activeOpacity={0.8}
              style={{
                width: 60,
                height: 76,
                borderRadius: 16,
                backgroundColor: isSelected ? theme.accent : theme.card,
                borderWidth: 1,
                borderColor: isSelected ? theme.accent : theme.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: isSelected ? '#fff' : theme.subtext,
                  fontSize: 11,
                  fontWeight: '600',
                }}
              >
                {day.label}
              </Text>
              <Text
                style={{
                  color: isSelected ? '#fff' : theme.text,
                  fontSize: 20,
                  fontWeight: '800',
                  marginTop: 2,
                }}
              >
                {day.date}
              </Text>
              {day.isToday && (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: isSelected ? '#fff' : theme.accent,
                    marginTop: 4,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>

      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 120,
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
          {loadingTimetable ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : allClasses.length > 0 ? (
            allClasses.map((item, index) => (
              <TouchableOpacity
                key={`${item.isPersonal ? 'personal' : 'unit'}-${item.id}-${index}`}
                onPress={() =>
                  item.isPersonal
                    ? handleDeletePersonal(item.id)
                    : navigation.navigate('ClassDetails', { classItem: item })
                }
                activeOpacity={0.8}
                style={{
                  ...getCardStyle(item, theme),
                  borderRadius: 16,
                  borderWidth: 1,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: '700',
                          fontSize: 15,
                        }}
                      >
                        {item.title}
                      </Text>
                      {item.isPersonal && (
                        <View
                          style={{
                            backgroundColor: item.color + '22',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: item.color,
                              fontSize: 10,
                              fontWeight: '700',
                            }}
                          >
                            Personal
                          </Text>
                        </View>
                      )}
                      {!item.isPersonal && item.status === 'confirmed' && (
                        <View
                          style={{
                            backgroundColor: '#22c55e22',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: '#22c55e',
                              fontSize: 10,
                              fontWeight: '700',
                            }}
                          >
                            Confirmed
                          </Text>
                        </View>
                      )}
                      {!item.isPersonal && item.status === 'cancelled' && (
                        <View
                          style={{
                            backgroundColor: '#ef444422',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: '#ef4444',
                              fontSize: 10,
                              fontWeight: '700',
                            }}
                          >
                            Cancelled
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={{
                        color: theme.subtext,
                        fontSize: 12,
                        marginBottom: 10,
                      }}
                    >
                      {item.code}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 5,
                      }}
                    >
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={theme.subtext}
                      />
                      <Text style={{ color: theme.subtext, fontSize: 12 }}>
                        {item.time}
                      </Text>
                    </View>

                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={theme.subtext}
                      />
                      <Text style={{ color: theme.subtext, fontSize: 12 }}>
                        {item.room}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={item.isPersonal ? 'trash-outline' : 'chevron-forward'}
                    size={18}
                    color={item.isPersonal ? '#ef4444' : theme.subtext}
                  />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons
                name="calendar-outline"
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
                No classes this day
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 90,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: theme.accent,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: theme.accent,
          shadowOpacity: 0.4,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Personal Class Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: theme.bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 40,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.border,
                  alignSelf: 'center',
                  marginBottom: 20,
                }}
              />

              <Text
                style={{
                  color: theme.text,
                  fontSize: 18,
                  fontWeight: '800',
                  marginBottom: 20,
                }}
              >
                Add Personal Class
              </Text>

              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                }}
              >
                CLASS TITLE
              </Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Study Group"
                placeholderTextColor={theme.subtext}
                value={formTitle}
                onChangeText={setFormTitle}
                autoCapitalize="words"
              />

              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 6,
                }}
              >
                ROOM / LOCATION
              </Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Library, Room A"
                placeholderTextColor={theme.subtext}
                value={formRoom}
                onChangeText={setFormRoom}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.subtext,
                      fontSize: 12,
                      fontWeight: '600',
                      marginBottom: 6,
                    }}
                  >
                    START TIME
                  </Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="e.g. 1000am"
                    placeholderTextColor={theme.subtext}
                    value={formStartTime}
                    onChangeText={(t) => setFormStartTime(formatTimeInput(t))}
                    autoCapitalize="characters"
                    maxLength={8}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.subtext,
                      fontSize: 12, 
                      fontWeight: '600',
                      marginBottom: 6,
                    }}
                  >
                    END TIME
                  </Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="e.g. 1200pm"
                    placeholderTextColor={theme.subtext}
                    value={formEndTime}
                    onChangeText={(t) => setFormEndTime(formatTimeInput(t))}
                    autoCapitalize="characters"
                    maxLength={8}
                  />
                </View>
              </View>

              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 10,
                }}
              >
                DAY
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {weekDays.map((d) => {
                  const sel = formDay === d.dayIndex;
                  return (
                    <TouchableOpacity
                      key={d.dayIndex}
                      onPress={() => setFormDay(d.dayIndex)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: sel ? theme.accent : theme.card,
                        borderWidth: 1,
                        borderColor: sel ? theme.accent : theme.border,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: sel ? '#fff' : theme.subtext,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 10,
                }}
              >
                COLOR
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setFormColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: c,
                      borderWidth: formColor === c ? 3 : 0,
                      borderColor: '#fff',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {formColor === c && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <PrimaryButton
                label="Add to Schedule"
                onPress={handleAddPersonal}
                loading={formLoading}
              />

              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                style={{ alignItems: 'center', marginTop: 14 }}
              >
                <Text
                  style={{ color: theme.subtext, fontSize: 14, fontWeight: '600' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}