import React, {
  useContext,
  useState,
  useEffect,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';

import Ionicons
  from '@expo/vector-icons/Ionicons';

import * as ImagePicker
  from 'expo-image-picker';

import ScreenWrapper
  from '../components/screenWrapper'; 
import Header from '../components/header';
import Card from '../components/card';
import PrimaryButton
  from '../components/primaryButton';

import { ThemeContext }
  from '../context/themeContext';
import { AuthContext }
  from '../context/authContext';

import { API_BASE } from '../constants/apiConfig';

export default function ProfileScreen({
  navigation,
}) {
  const { theme } = useContext(ThemeContext);
  const { user, updateUser, logout } =
    useContext(AuthContext);

  const [pendingImage, setPendingImage] =
    useState(null);
  const [previewVisible, setPreviewVisible] =
    useState(false);
  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] =
    useState(true);

  useEffect(() => {
    fetchProfile();
    fetchUnits();
  }, []);

  async function fetchProfile() {
    try {
      const response = await fetch(`${API_BASE}/getProfile.php`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        await updateUser({
          ...result.user,
          token: user.token,
        });
      }
    } catch (err) {
      // Screen still shows cached data from context — logged so a
      // real backend/network problem doesn't go unnoticed silently.
      console.warn('fetchProfile failed, using cached context data:', err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function fetchUnits() {
    setLoadingUnits(true);
    try {
      const response = await fetch(`${API_BASE}/getUnits.php`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setUnits(result.units);
      }
    } catch (err) {
      console.warn('fetchUnits failed, Units card will show empty state:', err);
    } finally {
      setLoadingUnits(false);
    }
  }

  async function pickImage() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow access to your photo library.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          }
        );

      if (
        !result.canceled &&
        result.assets &&
        result.assets[0]
      ) {
        setPendingImage(result.assets[0].uri);
        setPreviewVisible(true);
      }
    } catch (e) {
      Alert.alert(
        'Error',
        'Could not open photo library.'
      );
    }
  }

  async function confirmImage() {
    if (!pendingImage) return;
    await updateUser({ profilePic: pendingImage });
    setPendingImage(null);
    setPreviewVisible(false);
  }

  function cancelImage() {
    setPendingImage(null);
    setPreviewVisible(false);
  }

  function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }

  function getInitials(name) {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  const initials = getInitials(user?.name);

  return (
    <ScreenWrapper>
      <Header
        title="Profile"
        navigation={navigation}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {user?.profilePic ? (
              <Image
                source={{ uri: user.profilePic }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                }}
              />
            ) : (
              <View
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor:
                    theme.accent,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 30,
                    fontWeight: '800',
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}

            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.accent,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: theme.bg,
              }}
            >
              <Ionicons
                name="pencil"
                size={12}
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          {loadingProfile ? (
            <ActivityIndicator
              color={theme.accent}
              style={{ marginTop: 14 }}
            />
          ) : (
            <>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: '800',
                  marginTop: 14,
                  marginBottom: 4,
                }}
              >
                {user?.name || 'Student'}
              </Text>

              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 13,
                  marginBottom: 2,
                }}
              >
                {user?.faculty || '—'}
              </Text>

              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 13,
                  textAlign: 'center',
                  paddingHorizontal: 24,
                }}
              >
                {user?.course || '—'}
              </Text>

              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {user?.year_of_study
                  ? `Year ${user.year_of_study}`
                  : '—'}
              </Text>
            </>
          )}
        </View>

        {/* Units */}
        <Text
          style={{
            color: theme.text,
            fontWeight: '700',
            fontSize: 16,
            marginBottom: 12,
          }}
        >
          Units Enrolled
        </Text>

        <Card
          padded={false}
          style={{ marginBottom: 24 }}
        >
          {loadingUnits ? (
            <ActivityIndicator
              color={theme.accent}
              style={{ paddingVertical: 20 }}
            />
          ) : units.length > 0 ? (
            units.map((unit, index) => (
              <TouchableOpacity
                key={unit.id}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth:
                    index < units.length - 1
                      ? 1
                      : 0,
                  borderBottomColor: theme.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    {unit.title}
                  </Text>
                  <Text
                    style={{
                      color: theme.subtext,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {unit.code} · Semester {unit.semester}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
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
                padding: 16,
              }}
            >
              No units found for your course/year
            </Text>
          )}
        </Card>

        {/* Options */}
        <Card
          padded={false}
          style={{ marginBottom: 24 }}
        >
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Settings')
            }
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
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
                name="settings-outline"
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
                Settings
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.subtext}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
              gap: 12,
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#ef4444"
            />
            <Text
              style={{
                color: '#ef4444',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelImage}
      >
        <View
          style={{
            flex: 1,
            backgroundColor:
              'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 24,
            }}
          >
            Use this photo?
          </Text>

          {pendingImage && (
            <Image
              source={{ uri: pendingImage }}
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                marginBottom: 32,
                borderWidth: 3,
                borderColor: theme.accent,
              }}
            />
          )}

          <PrimaryButton
            label="Use as Profile Photo"
            onPress={confirmImage}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <TouchableOpacity
            onPress={cancelImage}
            style={{
              paddingVertical: 14,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#aaa',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}