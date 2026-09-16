import React, { useState, useEffect, useContext } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';

import ScreenWrapper from '../../components/screenWrapper';
import Header from '../../components/header';
import Card from '../../components/card';
import PrimaryButton from '../../components/primaryButton';
import DropdownSelect from '../../components/dropdownSelect';

import { ThemeContext } from '../../context/themeContext';
import { AuthContext } from '../../context/authContext';

import { API_BASE } from '../../constants/apiConfig';

const SECTIONS = ['Announcements', 'Lessons', 'Notes'];

const CATEGORIES = ['urgent', 'important', 'info'];

const STATUS_COLORS = {
  confirmed: '#22c55e',
  cancelled: '#ef4444',
  scheduled: '#9CA3AF',
};

export default function AdminScreen({ goToAdjacentTab }) {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState('Announcements');

  return (
    <ScreenWrapper>
      <Header title="Manage" navigation={navigation} rightComponent={<View />} />

      {/* Section switcher */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginBottom: 16,
          gap: 8,
        }}
      >
        {SECTIONS.map((section) => {
          const isActive = activeSection === section;
          return (
            <TouchableOpacity
              key={section}
              onPress={() => setActiveSection(section)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: isActive ? theme.accent : theme.card,
                borderWidth: 1,
                borderColor: isActive ? theme.accent : theme.border,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: isActive ? '#fff' : theme.subtext,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                {section}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeSection === 'Announcements' && <AnnouncementsPanel theme={theme} user={user} />}
      {activeSection === 'Lessons' && <LessonsPanel theme={theme} user={user} />}
      {activeSection === 'Notes' && <NotesPanel theme={theme} user={user} />}
    </ScreenWrapper>
  );
}

// ─────────────────────────────────────────────────────────────
// Announcements panel
// ─────────────────────────────────────────────────────────────

function AnnouncementsPanel({ theme, user }) {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    marginBottom: 16,
  };

  async function handlePost() {
    if (!category) {
      Alert.alert('Error', 'Select a category');
      return;
    }
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Title and body are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/postAnnouncement.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          category,
          title: title.trim(),
          body: body.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        Alert.alert('Error', result.message || result.error || 'Failed to post');
        setLoading(false);
        return;
      }

      Alert.alert('Posted', 'Announcement sent to your course/year.');
      setCategory('');
      setTitle('');
      setBody('');
    } catch (err) {
      Alert.alert('Error', 'Network error — check your connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: theme.subtext, fontSize: 13, marginBottom: 16 }}>
        This will be sent to students in your faculty, course, and year.
      </Text>

      <DropdownSelect
        label="Category"
        value={category ? category.charAt(0).toUpperCase() + category.slice(1) : ''}
        options={['Urgent', 'Important', 'Info']}
        placeholder="Select category"
        onSelect={(val) => setCategory(val.toLowerCase())}
      />

      <View style={{ height: 16 }} />

      <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
        Title
      </Text>
      <TextInput
        style={inputStyle}
        placeholder="e.g. Exam Venue Change"
        placeholderTextColor={theme.subtext}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
        Body
      </Text>
      <TextInput
        style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Details students should know..."
        placeholderTextColor={theme.subtext}
        value={body}
        onChangeText={setBody}
        multiline
      />

      <PrimaryButton label="Post Announcement" onPress={handlePost} loading={loading} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Lessons panel — confirm/cancel this week's lessons
// ─────────────────────────────────────────────────────────────

function LessonsPanel({ theme, user }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editVenue, setEditVenue] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  async function fetchTimetable() {
    try {
      const response = await fetch(`${API_BASE}/getTimetable.php`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setTimetable(result.timetable);
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
    }
  }

  async function loadInitial() {
    setLoading(true);
    await fetchTimetable();
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchTimetable();
    setRefreshing(false);
  }

  async function setStatus(item, status) {
    setUpdatingId(item.timetable_id);
    try {
      const response = await fetch(`${API_BASE}/updateLessonStatus.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          timetable_id: item.timetable_id,
          lesson_date: item.lesson_date,
          status,
        }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setTimetable((prev) =>
          prev.map((t) =>
            t.timetable_id === item.timetable_id ? { ...t, status } : t
          )
        );
      } else {
        Alert.alert('Error', result.message || result.error || 'Failed to update');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error — check your connection');
    } finally {
      setUpdatingId(null);
    }
  }

  function openEditModal(item) {
    setEditingItem(item);
    setEditVenue(item.venue);
    setEditStartTime(item.start_time.slice(0, 5));
    setEditEndTime(item.end_time.slice(0, 5));
    setEditModalVisible(true);
  }

  function formatTimeInput(input) {
    const cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
  }

  async function saveEdit() {
    if (!/^\d{2}:\d{2}$/.test(editStartTime) || !/^\d{2}:\d{2}$/.test(editEndTime)) {
      Alert.alert('Error', 'Enter times as HH:MM, e.g. 10:00');
      return;
    }
    if (!editVenue.trim()) {
      Alert.alert('Error', 'Venue is required');
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`${API_BASE}/updateLessonDetails.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          timetable_id: editingItem.timetable_id,
          venue: editVenue.trim(),
          start_time: editStartTime,
          end_time: editEndTime,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        Alert.alert('Error', result.message || result.error || 'Failed to update');
        setEditLoading(false);
        return;
      }

      setTimetable((prev) =>
        prev.map((t) =>
          t.timetable_id === editingItem.timetable_id
            ? { ...t, venue: editVenue.trim(), start_time: editStartTime + ':00', end_time: editEndTime + ':00' }
            : t
        )
      );

      setEditModalVisible(false);
      setEditingItem(null);
    } catch (err) {
      Alert.alert('Error', 'Network error — check your connection');
    } finally {
      setEditLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    marginBottom: 14,
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        <Text style={{ color: theme.subtext, fontSize: 13, marginBottom: 16 }}>
          Confirm or cancel this week's lessons, or edit venue/time permanently.
        </Text>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : timetable.length > 0 ? (
          timetable.map((item) => (
            <Card key={item.timetable_id} style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                    {item.unit_code} — {item.unit_title}
                  </Text>
                  <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}>
                    {item.day_of_week}, {item.lesson_date} · {item.start_time.slice(0, 5)}-
                    {item.end_time.slice(0, 5)} · {item.venue}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 4 }}>
                  <Ionicons name="pencil-outline" size={18} color={theme.subtext} />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: (STATUS_COLORS[item.status] || STATUS_COLORS.scheduled) + '22',
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: STATUS_COLORS[item.status] || STATUS_COLORS.scheduled,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {item.status}
                </Text>
              </View>

              {updatingId === item.timetable_id ? (
                <ActivityIndicator color={theme.accent} />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setStatus(item, 'confirmed')}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 10,
                      backgroundColor: '#22c55e22',
                      borderWidth: 1,
                      borderColor: '#22c55e',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 13 }}>
                      Confirm
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStatus(item, 'cancelled')}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 10,
                      backgroundColor: '#ef444422',
                      borderWidth: 1,
                      borderColor: '#ef4444',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          ))
        ) : (
          <Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 40 }}>
            No lessons found for your course/year
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
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
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }}>
              Edit Lesson
            </Text>

            <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
              VENUE
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. A-03"
              placeholderTextColor={theme.subtext}
              value={editVenue}
              onChangeText={setEditVenue}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                  START (24h)
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder="10:00"
                  placeholderTextColor={theme.subtext}
                  value={editStartTime}
                  onChangeText={(t) => setEditStartTime(formatTimeInput(t))}
                  maxLength={5}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                  END (24h)
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder="13:00"
                  placeholderTextColor={theme.subtext}
                  value={editEndTime}
                  onChangeText={(t) => setEditEndTime(formatTimeInput(t))}
                  maxLength={5}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <PrimaryButton label="Save Changes" onPress={saveEdit} loading={editLoading} />

            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={{ alignItems: 'center', marginTop: 14 }}
            >
              <Text style={{ color: theme.subtext, fontSize: 14, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}



function NotesPanel({ theme, user }) {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [title, setTitle] = useState('');
  const [pickedFile, setPickedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const inputStyle = {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    marginBottom: 16,
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  async function fetchUnits() {
    setLoadingUnits(true);
    try {
      const response = await fetch(`${API_BASE}/getUnits.php`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setUnits(result.units);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoadingUnits(false);
    }
  }

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPickedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open file picker');
    }
  }

  async function handleUpload() {
    if (!selectedUnit) {
      Alert.alert('Error', 'Select a unit');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!pickedFile) {
      Alert.alert('Error', 'Pick a file to upload');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('unit_id', String(selectedUnit.id));
      formData.append('title', title.trim());
      formData.append('file', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: pickedFile.mimeType || 'application/octet-stream',
      });

      const response = await fetch(`${API_BASE}/uploadNotes.php`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          // Note: do NOT set Content-Type manually here — fetch sets the
          // correct multipart boundary automatically when body is FormData
        },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        Alert.alert('Error', result.message || result.error || 'Upload failed');
        setLoading(false);
        return;
      }

      Alert.alert('Uploaded', 'File is now available to students.');
      setTitle('');
      setPickedFile(null);
      setSelectedUnit(null);
    } catch (err) {
      Alert.alert('Error', 'Network error — check your connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {loadingUnits ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <DropdownSelect
            label="Unit"
            value={selectedUnit ? `${selectedUnit.code} — ${selectedUnit.title}` : ''}
            options={units.map((u) => `${u.code} — ${u.title}`)}
            placeholder="Select a unit"
            onSelect={(val) => {
              const unit = units.find((u) => `${u.code} — ${u.title}` === val);
              setSelectedUnit(unit || null);
            }}
          />

          <View style={{ height: 16 }} />

          <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
            Title
          </Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Week 1 Notes"
            placeholderTextColor={theme.subtext}
            value={title}
            onChangeText={setTitle}
          />

          <TouchableOpacity
            onPress={pickFile}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: pickedFile ? theme.accent : theme.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 14,
              gap: 10,
              marginBottom: 24,
            }}
          >
            <Ionicons
              name={pickedFile ? 'document-text' : 'attach-outline'}
              size={20}
              color={pickedFile ? theme.accent : theme.subtext}
            />
            <Text
              style={{ color: pickedFile ? theme.text : theme.subtext, fontSize: 14, flex: 1 }}
              numberOfLines={1}
            >
              {pickedFile ? pickedFile.name : 'Choose a file (PDF, DOC, PPT)'}
            </Text>
          </TouchableOpacity>

          <PrimaryButton label="Upload File" onPress={handleUpload} loading={loading} />
        </>
      )}
    </ScrollView>
  );
}