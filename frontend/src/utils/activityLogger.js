export const ACTIVITY_STORAGE_KEY = 'roots_recent_activities';

export const getRecentActivities = () => {
  try {
    const saved = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading recent activities:', error);
    return [];
  }
};

export const logActivity = (message) => {
  try {
    const existing = getRecentActivities();

    const newActivity = {
      id: Date.now(),
      message,
      createdAt: new Date().toISOString(),
    };

    const updated = [newActivity, ...existing].slice(0, 5);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent activity:', error);
  }
};

export const clearActivities = () => {
  localStorage.removeItem(ACTIVITY_STORAGE_KEY);
};

export const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};