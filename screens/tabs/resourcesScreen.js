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
  TextInput,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import ScreenWrapper from '../../components/screenWrapper';
import Header from '../../components/header';

import { ThemeContext } from '../../context/themeContext';
import { AuthContext } from '../../context/authContext';
import { useTabNavigation } from '../../context/tabNavigationContext';

import { API_BASE } from '../../constants/apiConfig';
import { getCached, setCached } from '../../helpers/offlineCache';

import { quickLinks } from '../../constants/fakeData';

const UNIT_COLORS = [
  '#7C3AED',
  '#22c55e',
  '#f59e0b',
  '#06b6d4',
  '#f43f5e',
  '#8b5cf6',
];

function colorForUnit(unitId) {
  return UNIT_COLORS[unitId % UNIT_COLORS.length];
}

export default function ResourcesScreen({ goToAdjacentTab }) {
  const navigation = useNavigation();
  const { goToTabByName } = useTabNavigation();
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const [units, setUnits] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  async function fetchUnitsAndNotes() {
    try {
      const [unitsRes, notesRes] = await Promise.all([
        fetch(`${API_BASE}/getUnits.php`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        fetch(`${API_BASE}/getMyNotes.php`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      const unitsResult = await unitsRes.json();
      const notesResult = await notesRes.json();

      if (unitsRes.ok && unitsResult.success) {
        const transformedUnits = unitsResult.units.map((u) => ({
          ...u,
          color: colorForUnit(u.id),
        }));
        setUnits(transformedUnits);
        await setCached('resourceUnits', transformedUnits);
      }
      if (notesRes.ok && notesResult.success) {
        setNotes(notesResult.notes);
        await setCached('resourceNotes', notesResult.notes);
      }
    } catch (err) {
      console.warn('fetchUnitsAndNotes failed, falling back to cache:', err);
      try {
        const cachedUnits = await getCached('resourceUnits');
        const cachedNotes = await getCached('resourceNotes');
        if (cachedUnits) setUnits(cachedUnits);
        if (cachedNotes) setNotes(cachedNotes);
      } catch (cacheErr) {
        console.warn('resources cache read also failed:', cacheErr);
      }
    }
  }

  async function loadInitial() {
    setLoading(true);
    await fetchUnitsAndNotes();
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchUnitsAndNotes();
    setRefreshing(false);
  }

  function openFile(filePath) {
    Linking.openURL(`${API_BASE}/${filePath}`);
  }

  const query = searchText.toLowerCase().trim();

  const filteredUnits = query
    ? units.filter(
        (u) =>
          u.title.toLowerCase().includes(query) ||
          u.code.toLowerCase().includes(query)
      )
    : units;

  const filteredNotes = notes.filter((n) => {
    const matchesUnit = selectedUnit ? n.unit_id === selectedUnit : true;
    const matchesSearch = query
      ? n.title.toLowerCase().includes(query) ||
        n.unit_code.toLowerCase().includes(query)
      : true;
    return matchesUnit && matchesSearch;
  });

  return (
    <ScreenWrapper>
      <Header
        title="Resources"
        navigation={navigation}
        rightComponent={<View />}
      />

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
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
            placeholder="Search units or files..."
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
        {/* Quick Links */}
        {!query && (
          <>
            <Text
              style={{
                color: theme.text,
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 14,
              }}
            >
              Quick Links
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 28,
              }}
            >
              {quickLinks.map((link) => (
                <TouchableOpacity
                  key={link.title}
                  onPress={() =>
                    navigation.navigate('WebView', {
                      title: link.title,
                      url: link.url,
                    })
                  }
                  activeOpacity={0.8}
                  style={{ alignItems: 'center', width: 72 }}
                >
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 16,
                      backgroundColor: link.color + '22',
                      borderWidth: 1,
                      borderColor: link.color + '44',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <Ionicons name={link.icon} size={26} color={link.color} />
                  </View>
                  <Text
                    style={{
                      color: theme.subtext,
                      fontSize: 11,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    {link.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* My Units */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
            My Units
          </Text>
          {selectedUnit && (
            <TouchableOpacity onPress={() => setSelectedUnit(null)}>
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>
                Clear filter
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginVertical: 20 }} />
        ) : filteredUnits.length > 0 ? (
          filteredUnits.map((unit) => {
            const isSelected = selectedUnit === unit.id;
            return (
              <TouchableOpacity
                key={unit.id}
                activeOpacity={0.8}
                onPress={() => setSelectedUnit(isSelected ? null : unit.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isSelected ? unit.color : theme.border,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: unit.color + '22',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="book-outline" size={20} color={unit.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}
                  >
                    {unit.title}
                  </Text>
                  <Text
                    style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}
                  >
                    {unit.code}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.subtext}
                />
              </TouchableOpacity>
            );
          })
        ) : (
          <Text
            style={{ color: theme.subtext, fontSize: 14, marginBottom: 16 }}
          >
            No units match your search
          </Text>
        )}

        {/* Files */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
            Notes & Files
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginVertical: 20 }} />
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map((file) => (
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
                  style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}
                >
                  {file.title}
                </Text>
                <Text
                  style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}
                >
                  {file.unit_code} · {file.file_type?.toUpperCase()}
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
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Ionicons
              name="folder-open-outline"
              size={40}
              color={theme.subtext}
            />
            <Text
              style={{ color: theme.subtext, fontSize: 14, marginTop: 12 }}
            >
              No files found
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}