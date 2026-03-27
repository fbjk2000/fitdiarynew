import { GoalType, MealDraft, ReminderSettings, Tab, UserPreferences, Workout, WorkoutDraft } from '../types/app';

export const STORAGE_KEYS = {
  user: 'fitdiary.user',
  workouts: 'fitdiary.workouts',
  meals: 'fitdiary.meals',
  waterIntake: 'fitdiary.waterIntake',
  waterDate: 'fitdiary.waterDate',
  friends: 'fitdiary.friends',
  preferences: 'fitdiary.preferences',
} as const;

export const EMPTY_WORKOUT: WorkoutDraft = {
  name: '',
  type: 'strength',
  duration: '',
  calories: '',
};

export const EMPTY_MEAL: MealDraft = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  estimateSource: 'manual',
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  workoutTime: '07:30',
  fuelTime: '12:30',
  hydrationTime: '09:00',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  primaryGoal: 'improve-cardio',
  reminderSettings: DEFAULT_REMINDER_SETTINGS,
};

export const goalOptions: Array<{ key: GoalType; title: string; description: string }> = [
  { key: 'lose-weight', title: 'Lose weight', description: 'Focus on consistent movement, hydration, and cleaner fueling.' },
  { key: 'improve-cardio', title: 'Improve cardio fitness', description: 'Prioritize conditioning sessions and steady weekly output.' },
  { key: 'recover', title: 'Recover', description: 'Use mobility, hydration, and lighter fueling to rebuild rhythm.' },
  { key: 'build-strength', title: 'Build strength', description: 'Lean into strength sessions and recovery consistency.' },
];

export const workoutLibrary: Array<Omit<Workout, 'date'>> = [
  { id: '1', name: 'Velocity Run', type: 'cardio', duration: '30', calories: '300' },
  { id: '2', name: 'Upper Power', type: 'strength', duration: '45', calories: '410' },
  { id: '3', name: 'Lower Engine', type: 'strength', duration: '50', calories: '460' },
  { id: '4', name: 'Flow Reset', type: 'mobility', duration: '25', calories: '140' },
  { id: '5', name: 'Spin Session', type: 'cardio', duration: '40', calories: '360' },
  { id: '6', name: 'Pull Circuit', type: 'strength', duration: '45', calories: '420' },
];

export const tabMeta: Array<{ key: Tab; label: string; code: string }> = [
  { key: 'dashboard', label: 'Today', code: '01' },
  { key: 'workouts', label: 'Train', code: '02' },
  { key: 'meals', label: 'Fuel', code: '03' },
  { key: 'profile', label: 'Profile', code: '04' },
];
