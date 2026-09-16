import React, { useContext } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import ScreenWrapper
  from '../components/screenWrapper';
import Header from '../components/header';

import { ThemeContext }
  from '../context/themeContext';

import {
  weeklySchedule,
} from '../constants/fakeData';

import {
  getTodaysSchedule,
} from '../helpers/timeHelpers';

export default function TodaysScheduleScreen({
  navigation,
}) {
  const { theme } = useContext(ThemeContext);
  const classes =
    getTodaysSchedule(weeklySchedule);

  const dayName = new Date().toLocaleDateString(
    'en-KE',
    { weekday: 'long' }
  );

  const dateStr = new Date().toLocaleDateString(
    'en-KE',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <ScreenWrapper>
      <Header
        title="Today's Schedule"
        navigation={navigation}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 60,
        }}
      >
        <View
          style={{
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontWeight: '700',
              fontSize: 18,
            }}
          >
            {dayName}
          </Text>
          <Text
            style={{
              color: theme.subtext,
              fontSize: 13,
              marginTop: 2,
            }}
          >
            {dateStr}
          </Text>
        </View>

        {classes.length > 0 ? (
          classes.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                navigation.navigate(
                  'ClassDetails',
                  { classId: item.id }
                )
              }
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                borderLeftWidth: 4,
                borderLeftColor: item.color,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontWeight: '700',
                  fontSize: 15,
                  marginBottom: 4,
                }}
              >
                {item.title}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={theme.subtext}
                />
                <Text
                  style={{
                    color: theme.subtext,
                    fontSize: 13,
                  }}
                >
                  {item.time}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.subtext}
                />
                <Text
                  style={{
                    color: theme.subtext,
                    fontSize: 13,
                  }}
                >
                  {item.room}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={{
              alignItems: 'center',
              paddingTop: 60,
            }}
          >
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
              No classes today
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}