const fs = require('fs');
const path = require('path');
const { db, usingFirebase } = require('../config/firebaseConfig');

const USERS_COLLECTION = 'users';
const ACTIVITY_COLLECTION = 'user_activities';
const usersFile = path.join(__dirname, '../data/users.json');
const activitiesFile = path.join(__dirname, '../data/activities.json');

const readJson = (filePath, fallback = []) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateUserId = (role, users) => {
  const prefix = role === 'Admin' ? 'ID2' : 'ID1';
  const matching = users
    .map((user) => user.id)
    .filter((id) => typeof id === 'string' && id.startsWith(prefix))
    .map((id) => Number(id.replace('ID', '')))
    .filter((num) => !Number.isNaN(num));

  const next = matching.length ? Math.max(...matching) + 1 : role === 'Admin' ? 200 : 100;
  return `ID${next}`;
};

const generateActivityId = (activities) => {
  const matching = activities
    .map((activity) => activity.id)
    .filter((id) => typeof id === 'string' && id.startsWith('ACT'))
    .map((id) => Number(id.replace('ACT', '')))
    .filter((num) => !Number.isNaN(num));
  const next = matching.length ? Math.max(...matching) + 1 : 1;
  return `ACT${String(next).padStart(3, '0')}`;
};

const getAllUsers = async () => {
  if (usingFirebase && db) {
    const snapshot = await db.collection(USERS_COLLECTION).orderBy('createdAt', 'desc').get();
    const users = [];
    snapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));
    return users;
  }

  const users = readJson(usersFile);
  return users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const createUser = async (userData) => {
  if (usingFirebase && db) {
    const newUser = {
      ...userData,
      active: userData.active !== undefined ? userData.active : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection(USERS_COLLECTION).add(newUser);
    await addActivity(`${newUser.role} account created for ${newUser.fullName}.`);
    return { id: docRef.id, ...newUser };
  }

  const users = readJson(usersFile);
  const now = new Date().toISOString();
  const newUser = {
    id: generateUserId(userData.role, users),
    fullName: userData.fullName,
    phone: userData.phone,
    email: userData.email,
    date: userData.date,
    role: userData.role,
    active: userData.active !== undefined ? userData.active : true,
    createdAt: now,
    updatedAt: now,
  };
  users.push(newUser);
  writeJson(usersFile, users);
  await addActivity(`${newUser.role} account created for ${newUser.fullName}.`);
  return newUser;
};

const getUserById = async (userId) => {
  if (usingFirebase && db) {
    const doc = await db.collection(USERS_COLLECTION).doc(userId).get();
    if (!doc.exists) throw new Error('User not found');
    return { id: doc.id, ...doc.data() };
  }

  const users = readJson(usersFile);
  const user = users.find((item) => item.id === userId);
  if (!user) throw new Error('User not found');
  return user;
};

const updateUser = async (userId, userData) => {
  if (usingFirebase && db) {
    const currentUser = await getUserById(userId);
    const updateData = {
      ...currentUser,
      ...userData,
      updatedAt: new Date(),
    };

    await db.collection(USERS_COLLECTION).doc(userId).set(updateData);

    if (Object.prototype.hasOwnProperty.call(userData, 'active')) {
      await addActivity(`User status ${userData.active ? 'activated' : 'disabled'} for ${currentUser.fullName}.`);
    } else {
      await addActivity(`User account updated for ${currentUser.fullName}.`);
    }

    return { id: userId, ...updateData };
  }

  const users = readJson(usersFile);
  const index = users.findIndex((item) => item.id === userId);
  if (index === -1) throw new Error('User not found');

  const currentUser = users[index];
  const updatedUser = {
    ...currentUser,
    ...userData,
    id: currentUser.id,
    updatedAt: new Date().toISOString(),
  };
  users[index] = updatedUser;
  writeJson(usersFile, users);

  if (Object.prototype.hasOwnProperty.call(userData, 'active')) {
    await addActivity(`User status ${userData.active ? 'activated' : 'disabled'} for ${currentUser.fullName}.`);
  } else {
    await addActivity(`User account updated for ${currentUser.fullName}.`);
  }

  return updatedUser;
};

const deleteUser = async (userId) => {
  if (usingFirebase && db) {
    const currentUser = await getUserById(userId);
    await db.collection(USERS_COLLECTION).doc(userId).delete();
    await addActivity(`User account removed for ${currentUser.fullName}.`);
    return { success: true, message: 'User deleted successfully' };
  }

  const users = readJson(usersFile);
  const user = users.find((item) => item.id === userId);
  const remainingUsers = users.filter((item) => item.id !== userId);
  writeJson(usersFile, remainingUsers);
  if (user) {
    await addActivity(`User account removed for ${user.fullName}.`);
  }
  return { success: true, message: 'User deleted successfully' };
};

const addActivity = async (message) => {
  if (usingFirebase && db) {
    await db.collection(ACTIVITY_COLLECTION).add({
      message,
      time: new Date(),
      createdAt: new Date(),
    });
    return;
  }

  const activities = readJson(activitiesFile);
  const now = new Date().toISOString();
  activities.unshift({
    id: generateActivityId(activities),
    message,
    time: now,
    createdAt: now,
  });
  writeJson(activitiesFile, activities.slice(0, 20));
};

const getDashboardSummary = async () => {
  if (usingFirebase && db) {
    const userSnapshot = await db.collection(USERS_COLLECTION).get();
    const activitySnapshot = await db.collection(ACTIVITY_COLLECTION).orderBy('createdAt', 'desc').limit(4).get();

    const users = [];
    userSnapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));

    const staffCount = users.filter((user) => user.role === 'Staff').length;
    const roles = new Set(users.map((user) => user.role));
    const activeUsers = users.filter((user) => user.active).length;
    const attendanceRate = users.length ? Math.round((activeUsers / users.length) * 100) : 0;

    const activities = [];
    activitySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        message: data.message,
        time: formatRelativeTime(data.time?.toDate ? data.time.toDate() : data.time),
      });
    });

    return {
      summary: {
        totalUsers: users.length,
        totalStaff: staffCount,
        activeRoles: roles.size,
        attendanceRate,
      },
      activities,
    };
  }

  const users = readJson(usersFile);
  const activities = readJson(activitiesFile)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      message: item.message,
      time: formatRelativeTime(item.time),
    }));

  const staffCount = users.filter((user) => user.role === 'Staff').length;
  const roles = new Set(users.map((user) => user.role));
  const activeUsers = users.filter((user) => user.active).length;
  const attendanceRate = users.length ? Math.round((activeUsers / users.length) * 100) : 0;

  return {
    summary: {
      totalUsers: users.length,
      totalStaff: staffCount,
      activeRoles: roles.size,
      attendanceRate,
    },
    activities,
  };
};

const formatRelativeTime = (dateValue) => {
  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
};

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardSummary,
};
