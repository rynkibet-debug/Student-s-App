export function getByPriority(notifications, priority) {
  return notifications.filter(
    (n) => n.priority === priority
  );
}

export function getByType(notifications, type) {
  return notifications.filter(
    (n) => n.type === type
  );
}

// Returns top N unread first, then read, from a given priority
export function getTopByPriority(
  notifications,
  priority,
  limit = 1
) {
  const filtered = notifications
    .filter((n) => n.priority === priority)
    .sort((a, b) => {
      // unread first
      if (a.read === b.read) return 0;
      return a.read ? 1 : -1;
    });
  return filtered.slice(0, limit);
}

// Returns 1 most recent from each priority for Home Upcoming section
export function getUpcomingHighlights(notifications) {
  const urgent = getTopByPriority(
    notifications,
    'urgent',
    1
  );
  const important = getTopByPriority(
    notifications,
    'important',
    1
  );
  const info = getTopByPriority(
    notifications,
    'info',
    1
  );
  return [...urgent, ...important, ...info];
}

export function getUnreadCount(notifications) {
  return notifications.filter((n) => !n.read).length;
}

export function markAllRead(notifications) {
  return notifications.map((n) => ({
    ...n,
    read: true,
  }));
}

export function markOneRead(notifications, id) {
  return notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
}