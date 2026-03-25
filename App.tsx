import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModalShell } from './src/components/ModalShell';
import { EMPTY_MEAL, EMPTY_WORKOUT, STORAGE_KEYS, tabMeta } from './src/constants/appData';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { MealsScreen, WorkoutsScreen } from './src/screens/LogsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { styles } from './src/styles/appStyles';
import { Meal, MealDraft, LeaderboardEntry, Tab, User, Workout, WorkoutDraft, WorkoutType } from './src/types/app';
import { calculateStreak, storageKeyForUser, todayKey } from './src/utils/appHelpers';
import { palette } from './src/theme/palette';

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
  const [newWorkout, setNewWorkout] = useState<WorkoutDraft>(EMPTY_WORKOUT);
  const [newMeal, setNewMeal] = useState<MealDraft>(EMPTY_MEAL);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

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

    const [savedWorkouts, savedMeals, savedWater, savedWaterDate] = await Promise.all([
      AsyncStorage.getItem(workoutsKey),
      AsyncStorage.getItem(mealsKey),
      AsyncStorage.getItem(waterKey),
      AsyncStorage.getItem(waterDateKey),
    ]);

    const parsedWorkouts = savedWorkouts ? (JSON.parse(savedWorkouts) as Workout[]) : [];
    const parsedMeals = savedMeals ? (JSON.parse(savedMeals) as Meal[]) : [];

    setWorkouts(parsedWorkouts);
    setMeals(parsedMeals);
    setStreak(calculateStreak(parsedWorkouts));

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
  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
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

  const resetLocalActivityState = () => {
    setWorkouts([]);
    setMeals([]);
    setWaterIntake(0);
    setStreak(0);
  };

  const openWorkoutCreate = () => {
    setEditingWorkoutId(null);
    setNewWorkout(EMPTY_WORKOUT);
    setShowAddWorkout(true);
  };

  const openMealCreate = () => {
    setEditingMealId(null);
    setNewMeal(EMPTY_MEAL);
    setShowAddMeal(true);
  };

  const openWorkoutEdit = (workout: Workout) => {
    setEditingWorkoutId(workout.id);
    setNewWorkout({ name: workout.name, type: workout.type, duration: workout.duration, calories: workout.calories });
    setShowAddWorkout(true);
  };

  const openMealEdit = (meal: Meal) => {
    setEditingMealId(meal.id);
    setNewMeal({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat });
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

    if (editingMealId) {
      const updatedMeals = meals.map((meal) =>
        meal.id === editingMealId ? { ...meal, ...draft, name: draft.name.trim() } : meal
      );
      await persistMeals(updatedMeals);
      closeMealModal();
      Alert.alert('Meal updated', 'Your meal changes have been saved.');
      return;
    }

    const meal: Meal = { ...draft, id: Date.now().toString(), name: draft.name.trim(), date: new Date().toISOString() };
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
                latestWorkoutSummary={
                  latestWorkout
                    ? `Latest session: ${latestWorkout.name} · ${latestWorkout.duration} min · ${latestWorkout.calories} cal.`
                    : 'No session logged yet. Your next workout sets the tone for the week.'
                }
                showNoAchievements={workouts.length === 0 && streak === 0}
                leaderboard={leaderboard}
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

      <Modal visible={showAddWorkout} animationType="slide" transparent>
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
              placeholder="Duration"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newWorkout.duration}
              onChangeText={(text) => setNewWorkout({ ...newWorkout, duration: text })}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Calories"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newWorkout.calories}
              onChangeText={(text) => setNewWorkout({ ...newWorkout, calories: text })}
            />
          </View>
        </ModalShell>
      </Modal>

      <Modal visible={showAddMeal} animationType="slide" transparent>
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
          <View style={styles.dualInputRow}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Calories"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.calories}
              onChangeText={(text) => setNewMeal({ ...newMeal, calories: text })}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Protein"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.protein}
              onChangeText={(text) => setNewMeal({ ...newMeal, protein: text })}
            />
          </View>
          <View style={styles.dualInputRow}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Carbs"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.carbs}
              onChangeText={(text) => setNewMeal({ ...newMeal, carbs: text })}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Fat"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              value={newMeal.fat}
              onChangeText={(text) => setNewMeal({ ...newMeal, fat: text })}
            />
          </View>
        </ModalShell>
      </Modal>
    </SafeAreaView>
  );
}
