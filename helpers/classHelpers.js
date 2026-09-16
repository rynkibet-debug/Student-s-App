export function getClassesByDayFromList(list, dayIndex) {
  return list
    .filter((item) => item.days.includes(dayIndex))
    .sort(
      (a, b) =>
        a.startHour * 60 +
        a.startMinute -
        (b.startHour * 60 + b.startMinute)
    );
}

export function getWeekDays() {
  const today = new Date();
  const jsDay = today.getDay();

  let diffToMonday;
  if (jsDay === 0) {
    diffToMonday = 1;
  } else if (jsDay === 6) {
    diffToMonday = 2;
  } else {
    diffToMonday = 1 - jsDay;
  }

  return [1, 2, 3, 4, 5].map((dayIndex) => {
    const date = new Date(today);
    date.setDate(today.getDate() + diffToMonday + (dayIndex - 1));
    return {
      dayIndex,
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dayIndex - 1],
      date: date.getDate(),
      fullDate: date,
      isToday: date.toDateString() === today.toDateString(),
    };
  });
}

export function getTodayDayIndex() {
  const jsDay = new Date().getDay();
  const map = { 0: null, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: null };
  return map[jsDay];
}

export function formatClassHours(item) {
  return `${item.startHour}:${
    item.startMinute === 0 ? '00' : item.startMinute
  } - ${item.endHour}:${
    item.endMinute === 0 ? '00' : item.endMinute
  }`;
}