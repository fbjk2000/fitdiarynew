import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, SafeAreaView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModalShell } from './src/components/ModalShell';
import { DEFAULT_PREFERENCES, EMPTY_MEAL, EMPTY_WORKOUT, STORAGE_KEYS, tabMeta } from './src/constants/appData';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { MealsScreen, WorkoutsScreen } from './src/screens/LogsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { analyzeFuelPhoto, fuelVisionConfigured } from './src/services/fuelVision';
import { styles } from './src/styles/appStyles';
import {
  FriendCircleMember,
  GoalType,
  Meal,
  MealDraft,
  LeaderboardEntry,
  Tab,
  User,
  UserPreferences,
  Workout,
  WorkoutDraft,
  WorkoutType,
} from './src/types/app';
import {
  applyNutritionEstimate,
  buildInviteCode,
  calculateStreak,
  createFriendCircleMember,
  estimateNutritionFromMealName,
  goalProgressForUser,
  isValidTimeString,
  storageKeyForUser,
  todayKey,
} from './src/utils/appHelpers';
import { palette } from './src/theme/palette';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [friends, setFriends] = useState<FriendCircleMember[]>([]);
  const [friendName, setFriendName] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [newWorkout, setNewWorkout] = useState<WorkoutDraft>(EMPTY_WORKOUT);
  const [newMeal, setNewMeal] = useState<MealDraft>(EMPTY_MEAL);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [isAnalyzingMealPhoto, setIsAnalyzingMealPhoto] = useState(false);
  const [mealPhotoHint, setMealPhotoHint] = useState('');

  const activeUserEmail = user?.email ?? null;

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!hydrated || !activeUserEmail) return;
    void loadUserScopedData(activeUserEmail);
  }, [activeUserEmail, hydrated]);

  const loadData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        setIsLoggedIn(true);
        await loadUserScopedData(parsedUser.email);
      } else {
        resetLocalActivityState();
      }
    } catch (error) {
      console.error('Error loading FitDiary data', error);
    } finally {
      setHydrated(true);
    }
  };

  const loadUserScopedData = async (userEmail: string) => {
    const workoutsKey = storageKeyForUser(STORAGE_KEYS.workouts, userEmail);
    const mealsKey = storageKeyForUser(STORAGE_KEYS.meals, userEmail);
    const waterKey = storageKeyForUser(STORAGE_KEYS.waterIntake, userEmail);
    const waterDateKey = storageKeyForUser(STORAGE_KEYS.waterDate, userEmail);
    const friendsKey = storageKeyForUser(STORAGE_KEYS.friends, userEmail);
    const preferencesKey = storageKeyForUser(STORAGE_KEYS.preferences, userEmail);

    const [savedWorkouts, savedMeals, savedWater, savedWaterDate, savedFriends, savedPreferences] = await Promise.all([
      AsyncStorage.getItem(workoutsKey),
      AsyncStorage.getItem(mealsKey),
      AsyncStorage.getItem(waterKey),
      AsyncStorage.getItem(waterDateKey),
      AsyncStorage.getItem(friendsKey),
      AsyncStorage.getItem(preferencesKey),
    ]);

    const parsedWorkouts = savedWorkouts ? (JSON.parse(savedWorkouts) as Workout[]) : [];
    const parsedMeals = savedMeals ? (JSON.parse(savedMeals) as Meal[]) : [];

    setWorkouts(parsedWorkouts);
    setMeals(parsedMeals);
    setStreak(calculateStreak(parsedWorkouts));
    setFriends(savedFriends ? (JSON.parse(savedFriends) as FriendCircleMember[]) : []);
    setPreferences(savedPreferences ? ({ ...DEFAULT_PREFERENCES, ...(JSON.parse(savedPreferences) as UserPreferences) }) : DEFAULT_PREFERENCES);

    if (savedWater && savedWaterDate === todayKey()) {
      setWaterIntake(Number(savedWater) || 0);
    } else {
      setWaterIntake(0);
      await Promise.all([
        AsyncStorage.setItem(waterKey, '0'),
        AsyncStorage.setItem(waterDateKey, todayKey()),
      ]);
    }
  };

  const persistWorkouts = async (items: Workout[]) => {
    setWorkouts(items);
    setStreak(calculateStreak(items));
    if (!activeUserEmail) return;
    await AsyncStorage.setItem(storageKeyForUser(STORAGE_KEYS.workouts, activeUserEmail), JSON.stringify(items));
  };

  const persistMeals = async (items: Meal[]) => {
    setMeals(items);
    if (!activeUserEmail) return;
    await AsyncStorage.setItem(storageKeyForUser(STORAGE_KEYS.meals, activeUserEmail), JSON.stringify(items));
  };

  const persistWater = async (amount: number) => {
    setWaterIntake(amount);
    if (!activeUserEmail) return;
    await Promise.all([
      AsyncStorage.setItem(storageKeyForUser(STORAGE_KEYS.waterIntake, activeUserEmail), String(amount)),
      AsyncStorage.setItem(storageKeyForUser(STORAGE_KEYS.waterDate, activeUserEmail), todayKey()),
    ]);
  };

  const persistFriends = async (items: FriendCircleMember[]) => {
    setFriends(items);
    if (!activeUserEmail) return;
    await AsyncStorage.setItem(storageKeyForUser(STORAGE_KEYS.friends, activeUserEmail), JSON.stringify(items));
  };

  const persistPreferences = async (nextPreferences: UserPreferences) => {
    setPreferences(nextPreferences);
    if (!activeUserEmail) return;
    await AsyncStorage.setItem(storageKeyForUser(STORAGE_KEYS.preferences, activeUserEmail), JSON.stringify(nextPreferences));
  };

  const persistUser = async (nextUser: User) => {
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
  };

  const todayWorkoutCalories = workouts
    .filter((workout) => new Date(workout.date).toDateString() === todayKey())
    .reduce((sum, workout) => sum + (parseInt(workout.calories, 10) || 0), 0);
  const todayMealCalories = meals
    .filter((meal) => new Date(meal.date).toDateString() === todayKey())
    .reduce((sum, meal) => sum + (parseInt(meal.calories, 10) || 0), 0);

  const waterProgress = useMemo(() => Math.min((waterIntake / 2500) * 100, 100), [waterIntake]);
  const netCalories = todayWorkoutCalories - todayMealCalories;
  const firstName = user?.name?.split(' ')[0] ?? 'Athlete';
  const latestWorkout = workouts.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const activeFriends = friends.filter((friend) => friend.status === 'active');
  const inviteCode = buildInviteCode(user?.name ?? 'Athlete');
  const mealEstimate = estimateNutritionFromMealName(newMeal.name);
  const goalProgress = useMemo(
    () => goalProgressForUser(preferences.primaryGoal, workouts, meals, waterProgress),
    [meals, preferences.primaryGoal, waterProgress, workouts]
  );
  const starterLeaderboard = useMemo<LeaderboardEntry[]>(() => {
    const currentUserScore = workouts.length * 120 + meals.length * 45 + Math.round(waterProgress) * 3 + streak * 150;
    return [
      { id: 'ava', name: 'Ava Stone', score: 2320, streak: 11, subtitle: 'Strength block' },
      { id: 'milo', name: 'Milo Hart', score: 2190, streak: 9, subtitle: 'Hybrid conditioning' },
      { id: 'june', name: 'June Park', score: 1985, streak: 8, subtitle: 'Recovery and mobility' },
      {
        id: 'you',
        name: user?.name ?? 'You',
        score: currentUserScore,
        streak,
        subtitle: `${workouts.length} workouts · ${meals.length} meals · ${waterIntake}ml`,
        isCurrentUser: true,
      },
    ].sort((a, b) => b.score - a.score);
  }, [meals.length, streak, user?.name, waterIntake, waterProgress, workouts.length]);
  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    if (activeFriends.length === 0) {
      return starterLeaderboard.map((entry) =>
        entry.isCurrentUser
          ? { ...entry, subtitle: `${workouts.length} workouts | ${meals.length} meals | ${waterIntake}ml`, avatarUri: user?.avatarUri }
          : entry
      );
    }

    const currentUserScore = workouts.length * 120 + meals.length * 45 + Math.round(waterProgress) * 3 + streak * 150;
    return [
      ...activeFriends.map((friend) => ({
        id: friend.id,
        name: friend.name,
        score: friend.score,
        streak: friend.streak,
        subtitle: 'Friend circle rival',
      })),
      {
        id: 'you',
        name: user?.name ?? 'You',
        score: currentUserScore,
        streak,
        subtitle: `${workouts.length} workouts | ${meals.length} meals | ${waterIntake}ml`,
        isCurrentUser: true,
        avatarUri: user?.avatarUri,
      },
    ].sort((a, b) => b.score - a.score);
  }, [activeFriends, meals.length, starterLeaderboard, streak, user?.avatarUri, user?.name, waterIntake, waterProgress, workouts.length]);

  const resetLocalActivityState = () => {
    setWorkouts([]);
    setMeals([]);
    setWaterIntake(0);
    setStreak(0);
    setFriends([]);
    setFriendName('');
    setPreferences(DEFAULT_PREFERENCES);
  };

  const openWorkoutCreate = () => {
    setEditingWorkoutId(null);
    setNewWorkout(EMPTY_WORKOUT);
    setShowAddWorkout(true);
  };

  const openMealCreate = () => {
    setEditingMealId(null);
    setNewMeal(EMPTY_MEAL);
    setMealPhotoHint('');
    setShowAddMeal(true);
  };

  const openWorkoutEdit = (workout: Workout) => {
    setEditingWorkoutId(workout.id);
    setNewWorkout({ name: workout.name, type: workout.type, duration: workout.duration, calories: workout.calories });
    setShowAddWorkout(true);
  };

  const openMealEdit = (meal: Meal) => {
    setEditingMealId(meal.id);
    setNewMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      photoUri: meal.photoUri,
      estimateSource: meal.estimateSource ?? 'manual',
    });
    setMealPhotoHint(meal.photoUri ? 'Photo already attached to this meal.' : '');
    setShowAddMeal(true);
  };

  const closeWorkoutModal = () => {
    setShowAddWorkout(false);
    setEditingWorkoutId(null);
    setNewWorkout(EMPTY_WORKOUT);
  };

  const closeMealModal = () => {
    setShowAddMeal(false);
    setEditingMealId(null);
    setNewMeal(EMPTY_MEAL);
    setMealPhotoHint('');
    setIsAnalyzingMealPhoto(false);
  };

  const saveWorkout = async (draft: WorkoutDraft) => {
    if (!draft.name.trim() || !draft.duration.trim() || !draft.calories.trim()) {
      Alert.alert('Missing details', 'Please add a workout name, duration, and calories.');
      return;
    }

    if (editingWorkoutId) {
      const updatedWorkouts = workouts.map((workout) =>
        workout.id === editingWorkoutId ? { ...workout, ...draft, name: draft.name.trim() } : workout
      );
      await persistWorkouts(updatedWorkouts);
      closeWorkoutModal();
      Alert.alert('Workout updated', 'Your session changes have been saved.');
      return;
    }

    const workout: Workout = { ...draft, id: Date.now().toString(), name: draft.name.trim(), date: new Date().toISOString() };
    const updatedWorkouts = [...workouts, workout];
    await persistWorkouts(updatedWorkouts);
    closeWorkoutModal();
    Alert.alert('Workout added', `You are on a ${calculateStreak(updatedWorkouts)}-day streak.`);
  };

  const saveMeal = async (draft: MealDraft) => {
    if (!draft.name.trim() || !draft.calories.trim()) {
      Alert.alert('Missing details', 'Please add a meal name and calories.');
      return;
    }

    const normalizedDraft =
      mealEstimate && (!draft.protein.trim() || !draft.carbs.trim() || !draft.fat.trim())
        ? applyNutritionEstimate(draft, mealEstimate, 'fill-empty')
        : { ...draft, estimateSource: draft.estimateSource ?? 'manual' };

    if (editingMealId) {
      const updatedMeals = meals.map((meal) =>
        meal.id === editingMealId ? { ...meal, ...normalizedDraft, name: normalizedDraft.name.trim() } : meal
      );
      await persistMeals(updatedMeals);
      closeMealModal();
      Alert.alert('Meal updated', 'Your meal changes have been saved.');
      return;
    }

    const meal: Meal = {
      ...normalizedDraft,
      id: Date.now().toString(),
      name: normalizedDraft.name.trim(),
      date: new Date().toISOString(),
    };
    await persistMeals([...meals, meal]);
    closeMealModal();
    Alert.alert('Meal logged', 'Nutrition captured for today.');
  };

  const addWater = async (amount: number) => {
    const nextAmount = waterIntake + amount;
    await persistWater(nextAmount);
    if (nextAmount >= 2500 && waterIntake < 2500) {
      Alert.alert('Hydration goal reached', 'You hit your daily water target.');
    }
  };

  const deleteWorkout = (id: string) => {
    Alert.alert('Delete workout?', 'This will permanently remove the workout from your history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void persistWorkouts(workouts.filter((item) => item.id !== id)) },
    ]);
  };

  const deleteMeal = (id: string) => {
    Alert.alert('Delete meal?', 'This will permanently remove the meal from your nutrition log.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void persistMeals(meals.filter((item) => item.id !== id)) },
    ]);
  };

  const addFriendLocally = async (status: FriendCircleMember['status']) => {
    const trimmedName = friendName.trim();
    if (!trimmedName) {
      Alert.alert('Add a name', 'Enter a friend name before inviting them to your circle.');
      return null;
    }

    const existingFriend = friends.find((friend) => friend.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingFriend) {
      Alert.alert('Already in your circle', `${trimmedName} is already tracked in your friend group.`);
      return null;
    }

    const nextFriend = createFriendCircleMember(trimmedName, user?.name ?? 'Athlete', status);
    await persistFriends([nextFriend, ...friends]);
    setFriendName('');
    return nextFriend;
  };

  const shareInvite = async () => {
    const typedName = friendName.trim();
    const createdFriend = typedName ? await addFriendLocally('invited') : null;
    const targetName = createdFriend?.name || typedName || 'your crew';
    const nextInviteCode = createdFriend?.inviteCode ?? inviteCode;

    try {
      await Share.share({
        title: 'Join my FitDiary circle',
        message: `${user?.name ?? 'Your friend'} invited ${targetName} to join FitDiary.\n\nInvite code: ${nextInviteCode}\n\nOnce they are in, you can track your friend circle and compete on the leaderboard.`,
      });
    } catch (error) {
      console.error('Error sharing invite', error);
      Alert.alert('Share failed', 'We could not open the share sheet right now. Please try again.');
    }
  };

  const activateFriend = async (id: string) => {
    await persistFriends(
      friends.map((friend) => (friend.id === id ? { ...friend, status: 'active' as const } : friend))
    );
  };

  const removeFriend = async (id: string) => {
    await persistFriends(friends.filter((friend) => friend.id !== id));
  };

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri || !user) {
      return;
    }

    await persistUser({ ...user, avatarUri: result.assets[0].uri });
  };

  const selectMealPhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow ${source === 'camera' ? 'camera' : 'photo library'} access to add fuel photos.`);
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    setNewMeal((currentMeal) => ({
      ...currentMeal,
      photoUri: result.assets[0].uri,
    }));
    setMealPhotoHint(fuelVisionConfigured() ? 'Photo ready. Analyze to prefill nutrition.' : 'Photo attached. Add a vision endpoint to enable AI prefills.');
  };

  const analyzeMealPhoto = async () => {
    if (!newMeal.photoUri) {
      Alert.alert('No photo yet', 'Add a meal photo first and then run the estimate.');
      return;
    }

    if (!fuelVisionConfigured()) {
      Alert.alert(
        'Vision endpoint missing',
        'Set EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT to connect the meal photo estimator.'
      );
      return;
    }

    try {
      setIsAnalyzingMealPhoto(true);
      setMealPhotoHint('Analyzing your fuel photo...');
      const estimate = await analyzeFuelPhoto(newMeal.photoUri);
      setNewMeal((currentMeal) => ({
        ...applyNutritionEstimate(currentMeal, estimate, 'replace-all', 'vision'),
        name: currentMeal.name.trim() ? currentMeal.name : estimate.label,
        photoUri: currentMeal.photoUri,
      }));
      setMealPhotoHint(
        estimate.notes
          ? `${estimate.label} estimate ready. ${estimate.notes}`
          : `${estimate.label} estimate ready${estimate.confidence ? ` (${Math.round(estimate.confidence * 100)}% confidence)` : ''}.`
      );
    } catch (error) {
      console.error('Error analyzing meal photo', error);
      setMealPhotoHint('Photo analysis failed. You can still log the meal manually.');
      Alert.alert(
        'Analysis failed',
        error instanceof Error && error.message.includes('unreachable')
          ? 'The meal photo service is not reachable right now. You can still log the meal manually or use the text-based estimate.'
          : 'We could not estimate this meal from the photo right now.'
      );
    } finally {
      setIsAnalyzingMealPhoto(false);
    }
  };

  const updateGoal = async (goal: GoalType) => {
    await persistPreferences({ ...preferences, primaryGoal: goal });
  };

  const saveReminders = async () => {
    const { hydrationTime, fuelTime, workoutTime } = preferences.reminderSettings;
    const timeValues = [workoutTime, fuelTime, hydrationTime];
    if (!timeValues.every(isValidTimeString)) {
      Alert.alert('Invalid time', 'Use 24 hour time in the format HH:MM for every reminder.');
      return;
    }

    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow notifications so FitDiary can remind you.');
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const reminderEntries = [
      { time: workoutTime, title: 'Workout cue', body: 'Your planned session is coming up. Show up for the block.' },
      { time: fuelTime, title: 'Fuel check', body: 'Log your next meal and keep your nutrition rhythm tight.' },
      { time: hydrationTime, title: 'Hydration cue', body: 'Top up your water intake and keep recovery moving.' },
    ];

    for (const reminder of reminderEntries) {
      const [hour, minute] = reminder.time.split(':').map((value) => Number(value));
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }

    await persistPreferences({ ...preferences });
    Alert.alert('Reminders saved', 'Daily reminders are now scheduled for your selected times.');
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please fill in your email and password.');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Missing details', 'Please enter your name.');
      return;
    }
    const nextUser: User = { email: email.trim().toLowerCase(), name: (name.trim() || email.split('@')[0] || 'Athlete').trim() };
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    setUser(nextUser);
    setIsLoggedIn(true);
    setPassword('');
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
    setIsLoggedIn(false);
    resetLocalActivityState();
    setEmail('');
    setPassword('');
    setName('');
    setIsLogin(true);
    setActiveTab('dashboard');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.orbTop} />
        <View style={styles.orbLeft} />
        <View style={styles.orbBottom} />
        <View style={styles.centered}>
          <Text style={styles.loadingEyebrow}>Preparing your space</Text>
          <Text style={styles.loadingTitle}>FitDiary</Text>
          <Text style={styles.loadingText}>Loading your dashboard and saved progress.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.orbTop} />
      <View style={styles.orbLeft} />
      <View style={styles.orbBottom} />

      {!isLoggedIn ? (
        <AuthScreen
          isLogin={isLogin}
          email={email}
          password={password}
          name={name}
          setEmail={setEmail}
          setPassword={setPassword}
          setName={setName}
          onSubmit={() => void handleAuth()}
          onToggleMode={() => setIsLogin(!isLogin)}
        />
      ) : (
        <View style={styles.appShell}>
          <View style={styles.appHeader}>
            <View>
              <Text style={styles.appDate}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={styles.appTitle}>FitDiary</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <View style={styles.content}>
            {activeTab === 'dashboard' && (
              <DashboardScreen
                firstName={firstName}
                streak={streak}
                workoutsCount={workouts.length}
                mealsCount={meals.length}
                netCalories={netCalories}
                waterProgress={waterProgress}
                waterIntake={waterIntake}
                todayWorkoutCalories={todayWorkoutCalories}
                todayMealCalories={todayMealCalories}
                goalProgress={goalProgress}
                leaderboard={leaderboard}
                onAddWater={(amount) => void addWater(amount)}
                onOpenWorkoutCreate={openWorkoutCreate}
                onOpenMealCreate={openMealCreate}
                onQuickAddWorkout={(workout) => void saveWorkout({ ...workout })}
              />
            )}
            {activeTab === 'workouts' && (
              <WorkoutsScreen
                workouts={workouts}
                onOpenCreate={openWorkoutCreate}
                onEdit={openWorkoutEdit}
                onDelete={deleteWorkout}
              />
            )}
            {activeTab === 'meals' && (
              <MealsScreen meals={meals} onOpenCreate={openMealCreate} onEdit={openMealEdit} onDelete={deleteMeal} />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen
                firstName={firstName}
                displayName={user?.name ?? 'Athlete'}
                email={user?.email ?? ''}
                workoutsCount={workouts.length}
                streak={streak}
                waterProgress={waterProgress}
                avatarUri={user?.avatarUri}
                primaryGoal={preferences.primaryGoal}
                goalProgress={goalProgress}
                reminderSettings={preferences.reminderSettings}
                latestWorkoutSummary={
                  latestWorkout
                    ? `Latest session: ${latestWorkout.name} · ${latestWorkout.duration} min · ${latestWorkout.calories} cal.`
                    : 'No session logged yet. Your next workout sets the tone for the week.'
                }
                showNoAchievements={workouts.length === 0 && streak === 0}
                leaderboard={leaderboard}
                inviteCode={inviteCode}
                friendName={friendName}
                setFriendName={setFriendName}
                friends={friends}
                onPickProfileImage={() => void pickProfileImage()}
                onGoalChange={(goal) => void updateGoal(goal)}
                onReminderChange={(field, value) =>
                  setPreferences({
                    ...preferences,
                    reminderSettings: { ...preferences.reminderSettings, [field]: value },
                  })
                }
                onSaveReminders={() => void saveReminders()}
                onShareInvite={() => void shareInvite()}
                onActivateFriend={(id) => void activateFriend(id)}
                onRemoveFriend={(id) => void removeFriend(id)}
                onSignOut={() => void handleSignOut()}
              />
            )}
          </View>

          <View style={styles.tabBar}>
            {tabMeta.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabCode, isActive && styles.tabCodeActive]}>{tab.code}</Text>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Modal visible={showAddWorkout} animationType="slide" transparent onRequestClose={closeWorkoutModal}>
        <ModalShell
          eyebrow={editingWorkoutId ? 'Refine session' : 'Create session'}
          title={editingWorkoutId ? 'Edit workout' : 'Log workout'}
          onClose={closeWorkoutModal}
          onSave={() => void saveWorkout(newWorkout)}
        >
          <TextInput
            style={styles.input}
            placeholder="Workout name"
            placeholderTextColor={palette.muted}
            value={newWorkout.name}
            onChangeText={(text) => setNewWorkout({ ...newWorkout, name: text })}
          />
          <View style={styles.segmentRow}>
            {(['strength', 'cardio', 'mobility'] as WorkoutType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.segmentButton, newWorkout.type === type && styles.segmentButtonActive]}
                onPress={() => setNewWorkout({ ...newWorkout, type })}
              >
                <Text style={[styles.segmentText, newWorkout.type === type && styles.segmentTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dualInputRow}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Duration (min)"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newWorkout.duration}
              onChangeText={(text) => setNewWorkout({ ...newWorkout, duration: text })}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Calories burned (kcal)"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newWorkout.calories}
              onChangeText={(text) => setNewWorkout({ ...newWorkout, calories: text })}
            />
          </View>
        </ModalShell>
      </Modal>

      <Modal visible={showAddMeal} animationType="slide" transparent onRequestClose={closeMealModal}>
        <ModalShell
          eyebrow={editingMealId ? 'Update nutrition' : 'Capture nutrition'}
          title={editingMealId ? 'Edit meal' : 'Log meal'}
          onClose={closeMealModal}
          onSave={() => void saveMeal(newMeal)}
        >
          <TextInput
            style={styles.input}
            placeholder="Meal name"
            placeholderTextColor={palette.muted}
            value={newMeal.name}
            onChangeText={(text) => setNewMeal({ ...newMeal, name: text })}
          />
          <View style={styles.photoPanel}>
            <View style={styles.photoPanelHeader}>
              <Text style={styles.photoPanelTitle}>Fuel photo</Text>
              <Text style={styles.photoPanelMeta}>{newMeal.photoUri ? 'Attached' : 'Optional'}</Text>
            </View>
            {newMeal.photoUri ? (
              <Image source={{ uri: newMeal.photoUri }} style={styles.mealPhotoPreview} />
            ) : (
              <View style={styles.mealPhotoPlaceholder}>
                <Text style={styles.mealPhotoPlaceholderText}>Take or choose a meal photo to prefill this entry.</Text>
              </View>
            )}
            <View style={styles.photoActionRow}>
              <TouchableOpacity style={styles.photoActionButton} onPress={() => void selectMealPhoto('camera')}>
                <Text style={styles.photoActionButtonText}>Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoActionButton} onPress={() => void selectMealPhoto('library')}>
                <Text style={styles.photoActionButtonText}>Choose photo</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, styles.photoAnalyzeButton, isAnalyzingMealPhoto && styles.photoAnalyzeButtonDisabled]}
              onPress={() => void analyzeMealPhoto()}
              disabled={isAnalyzingMealPhoto}
            >
              <Text style={styles.primaryButtonText}>{isAnalyzingMealPhoto ? 'Analyzing...' : 'Analyze photo'}</Text>
            </TouchableOpacity>
            {!!mealPhotoHint && <Text style={styles.photoHintText}>{mealPhotoHint}</Text>}
          </View>
          <View style={styles.dualInputRow}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Calories (kcal)"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.calories}
              onChangeText={(text) => setNewMeal({ ...newMeal, calories: text })}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Protein (g)"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.protein}
              onChangeText={(text) => setNewMeal({ ...newMeal, protein: text })}
            />
          </View>
          <View style={styles.dualInputRow}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Carbs (g)"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.carbs}
              onChangeText={(text) => setNewMeal({ ...newMeal, carbs: text })}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Fat (g)"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.fat}
              onChangeText={(text) => setNewMeal({ ...newMeal, fat: text })}
            />
          </View>
          {mealEstimate && (
            <View style={styles.estimateCard}>
              <Text style={styles.estimateEyebrow}>Estimated from common values</Text>
              <Text style={styles.estimateTitle}>{mealEstimate.label}</Text>
              <Text style={styles.estimateBody}>
                {mealEstimate.calories} kcal | P {mealEstimate.protein}g | C {mealEstimate.carbs}g | F {mealEstimate.fat}g
              </Text>
              <TouchableOpacity
                style={styles.estimateButton}
                onPress={() => setNewMeal(applyNutritionEstimate(newMeal, mealEstimate, 'fill-empty'))}
              >
                <Text style={styles.estimateButtonText}>Use estimate for empty fields</Text>
              </TouchableOpacity>
            </View>
          )}
        </ModalShell>
      </Modal>
    </SafeAreaView>
  );
}
