import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import ScreenWrapper from '../components/screenWrapper';
import Header from '../components/header';
import Card from '../components/card';

import { ThemeContext } from '../context/themeContext';

const FAQS = [
  {
    q: 'How do I know if a lesson is cancelled?',
    a: 'Cancelled lessons show a red highlight in Classes and Class Details. Your class rep updates this after confirming with the lecturer.',
  },
  {
    q: 'Why can\'t I change my course or year?',
    a: 'These are locked after setup since they control your timetable and announcements. Contact your class rep or admin if this needs correcting.',
  },
  {
    q: 'Where do I find notes for a unit?',
    a: 'Open a class from Classes or Home, then check the Files section — or browse all your units\' files from the Resources tab.',
  },
  {
    q: 'How do lesson reminders work?',
    a: 'The app schedules a local notification 30 minutes before each lesson, prompting you to check the app for the latest status.',
  },
];

export default function HelpSupportScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  function contactSupport() {
    Linking.openURL(
      'mailto:ryannropkibet@gmail.com?subject=Support%20Request'
    );
  }

  function reportBug() {
    Linking.openURL(
      'mailto:ryannropkibet@gmail.com?subject=Bug%20Report'
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Help & Support" navigation={navigation} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        <Text
          style={{
            color: theme.text,
            fontWeight: '700',
            fontSize: 16,
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          Frequently Asked Questions
        </Text>

        {FAQS.map((item, i) => (
          <Card key={i} style={{ marginBottom: 12 }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: '700',
                fontSize: 14,
                marginBottom: 6,
              }}
            >
              {item.q}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 13, lineHeight: 19 }}>
              {item.a}
            </Text>
          </Card>
        ))}

        <Text
          style={{
            color: theme.text,
            fontWeight: '700',
            fontSize: 16,
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          Still need help?
        </Text>

        <Card padded={false}>
          <TouchableOpacity
            onPress={contactSupport}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 15,
              gap: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Ionicons name="headset-outline" size={20} color={theme.subtext} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
              Contact Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={reportBug}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 15,
              gap: 14,
            }}
          >
            <Ionicons name="bug-outline" size={20} color={theme.subtext} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
              Report a Bug
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}