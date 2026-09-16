import React, { useContext } from 'react';
import { View, Text, ScrollView } from 'react-native';

import ScreenWrapper from '../components/screenWrapper';
import Header from '../components/header';

import { ThemeContext } from '../context/themeContext';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By using Students App, you agree to these terms. This app is an independent student project built to support MMU students and is not an official university system.',
  },
  {
    title: '2. Your Account',
    body: 'You are responsible for keeping your login credentials secure. Course and faculty information is used to show you relevant timetables, units, and announcements.',
  },
  {
    title: '3. Content Accuracy',
    body: 'Timetable, lesson status, and announcement information is maintained by class representatives and administrators. While we aim for accuracy, always confirm critical details (exam venues, deadlines) through official university channels.',
  },
  {
    title: '4. Privacy',
    body: 'We store your name, email, faculty, course, and year of study to provide the app\'s features. We do not sell or share your data with third parties. Uploaded files are visible only to students in your course and year.',
  },
  {
    title: '5. Notifications',
    body: 'Lesson reminders are generated locally on your device based on your timetable. We do not track your location or device usage beyond what\'s needed for these reminders.',
  },
  {
    title: '6. Changes',
    body: 'These terms may be updated as the app evolves. Continued use after changes means you accept the updated terms.',
  },
];

export default function TermsScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  return (
    <ScreenWrapper>
      <Header title="Terms & Privacy Policy" navigation={navigation} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        <Text
          style={{
            color: theme.subtext,
            fontSize: 12,
            marginBottom: 20,
            marginTop: 8,
          }}
        >
          Last updated: September 2026
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: '700',
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              {section.title}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 13, lineHeight: 20 }}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}