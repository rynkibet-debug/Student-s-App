import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHEDULED_DATE_KEY = 'students-app_notifications_scheduled_date';

export async function scheduleTodaysLessonReminders(todaysSchedule) {
  const today = new Date().toISOString().split('T')[0]; // "2026-09-14"

  // Avoid re-scheduling if we've already done today's batch
  const lastScheduledDate = await AsyncStorage.getItem(SCHEDULED_DATE_KEY);
  if (lastScheduledDate === today) return;

  // Clear out anything stale from a previous day first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const lesson of todaysSchedule) {
    const [hours, minutes] = lesson.start_time.split(':').map(Number);

    const lessonStart = new Date();
    lessonStart.setHours(hours, minutes, 0, 0);

    const triggerTime = new Date(lessonStart.getTime() - 30 * 60 * 1000);

    // Skip lessons whose 30-min-before mark has already passed today
    if (triggerTime <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${lesson.unit_code} starting in 30 mins`,
        body: 'Check the app for the latest lesson status.',
        sound: true,
      },
      trigger: {
        channelId: 'lesson-reminders',
        date: triggerTime,
      },
    });
  }

  await AsyncStorage.setItem(SCHEDULED_DATE_KEY, today);
}