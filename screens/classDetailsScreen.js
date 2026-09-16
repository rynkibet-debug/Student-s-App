import React, {
  useState,
  useEffect,
  useContext,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  ActivityIndicator,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import ScreenWrapper
  from '../components/screenWrapper';
import Header
  from '../components/header';
import Card from '../components/card';

import { ThemeContext }
  from '../context/themeContext';
import { AuthContext }
  from '../context/authContext';

import { API_BASE } from '../constants/apiConfig';

const STATUS_STYLES = {
  confirmed: { bg: '#22c55e22', color: '#22c55e', label: 'Confirmed' },
  cancelled: { bg: '#ef444422', color: '#ef4444', label: 'Cancelled' },
  scheduled: { bg: '#9CA3AF22', color: '#9CA3AF', label: 'Scheduled' },
};

export default function ClassDetailsScreen({
  navigation,
  route,
}) {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { classItem } = route.params || {};

  const [reminderOn, setReminderOn] =
    useState(false);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] =
    useState(true);

  useEffect(() => {
    if (classItem?.unitId) {
      fetchNotes();
    } else {
      setLoadingNotes(false);
    }
  }, []);

  async function fetchNotes() {
    setLoadingNotes(true);
    try {
      const response = await fetch(
        `${API_BASE}/getNotes.php?unit_id=${classItem.unitId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        setNotes(result.notes);
      }
    } catch (err) {
      // Silent fail — screen shows empty Files section
    } finally {
      setLoadingNotes(false);
    }
  }

  function openFile(filePath) {
    Linking.openURL(`${API_BASE}/${filePath}`);
  }

  if (!classItem) {
    return (
      <ScreenWrapper>
        <Header
          title="Class Details"
          navigation={navigation}
          showBack
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: theme.subtext,
              fontSize: 15,
            }}
          >
            Class not found
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const statusStyle =
    STATUS_STYLES[classItem.status] || STATUS_STYLES.scheduled;

  return (
    <ScreenWrapper>
      <Header
        title=""
        navigation={navigation}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
        {/* Class Icon + Title */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: statusStyle.bg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons
              name="book-outline"
              size={36}
              color={statusStyle.color}
            />
          </View>

          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {classItem.title}
          </Text>

          <Text
            style={{
              color: theme.subtext,
              fontSize: 14,
            }}
          >
            {classItem.code}
          </Text>

          {!classItem.isPersonal && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: statusStyle.bg,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: statusStyle.color,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {statusStyle.label}
              </Text>
            </View>
          )}
        </View>

        {/* Details Card */}
        <Card style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={theme.subtext}
            />
            <View>
              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 11,
                  fontWeight: '600',
                  marginBottom: 2,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Time
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
                {classItem.time}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              borderBottomWidth: classItem.isPersonal ? 0 : 1,
              borderBottomColor: theme.border,
            }}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={theme.subtext}
            />
            <View>
              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 11,
                  fontWeight: '600',
                  marginBottom: 2,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Venue
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
                {classItem.room}
              </Text>
            </View>
          </View>

          {!classItem.isPersonal && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.subtext}
              />
              <View>
                <Text
                  style={{
                    color: theme.subtext,
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 2,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Lecturer
                </Text>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {classItem.lecturer}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Reminder toggle */}
        {!classItem.isPersonal && (
          <Card style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 4,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={theme.subtext}
                />
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  Set Reminder
                </Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={setReminderOn}
                trackColor={{
                  false: theme.border,
                  true: theme.accent,
                }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        )}

        {/* Files */}
        {!classItem.isPersonal && (
          <>
            <Text
              style={{
                color: theme.text,
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 12,
              }}
            >
              Files
            </Text>

            {loadingNotes ? (
              <ActivityIndicator color={theme.accent} style={{ marginVertical: 20 }} />
            ) : notes.length > 0 ? (
              notes.map((file) => (
                <TouchableOpacity
                  key={file.id}
                  activeOpacity={0.8}
                  onPress={() => openFile(file.file_path)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: '#ef444422',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#ef4444"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: '600',
                        fontSize: 14,
                      }}
                    >
                      {file.title}
                    </Text>
                    <Text
                      style={{
                        color: theme.subtext,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {file.file_type?.toUpperCase()}
                    </Text>
                  </View>

                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={theme.subtext}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                No files uploaded yet for this unit
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}