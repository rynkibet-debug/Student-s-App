// Returns the day index matching JS getDay() — 0=Sun,1=Mon...6=Sat
// Our schedule uses 1=Mon,2=Tue,3=Wed,4=Thu,5=Fri...used AI FOR ts 

export function getTodaysSchedule(weeklySchedule) {
  const jsDay = new Date().getDay(); // 0=Sun ... 6=Sat
  // Map JS day to our day keys (1–5), weekends return []
  const dayMap = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 0: null, 6: null };
  const today = dayMap[jsDay];
  if (!today) return [];

  return weeklySchedule
    .filter((item) => item.days.includes(today))
    .sort(
      (a, b) =>
        a.startHour * 60 +
        a.startMinute -
        (b.startHour * 60 + b.startMinute)
    );
}

export function getNextClass(todayClasses) {
  const now = new Date();
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const upcoming = todayClasses.find((item) => {
    const classStart =
      item.startHour * 60 + item.startMinute;
    return classStart > currentMinutes;
  });

  return upcoming || null;
}

export function getActiveClass(todayClasses) {
  const now = new Date();
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  return (
    todayClasses.find((item) => {
      const start =
        item.startHour * 60 + item.startMinute;
      const end =
        item.endHour * 60 + item.endMinute;
      return (
        currentMinutes >= start &&
        currentMinutes < end
      );
    }) || null
  );
}

export function getMinutesUntilClass(item) {
  const now = new Date();
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();
  const classStart =
    item.startHour * 60 + item.startMinute;
  return classStart - currentMinutes;
}

export function formatCountdown(minutes) {
  if (minutes <= 0) return 'Now';
  if (minutes < 60) return `Starts in ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0
    ? `Starts in ${h}h`
    : `Starts in ${h}h ${m}m`;
}

export function getMidnightTimeout(callback) {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;
  return setTimeout(callback, msUntilMidnight);
}

export function formatTimeLabel(hour, minute = 0) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute =
    minute === 0 ? '00' : String(minute).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}