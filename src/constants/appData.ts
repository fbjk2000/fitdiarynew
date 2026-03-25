import { MealDraft, Tab, Workout, WorkoutDraft } from '../types/app';

export const STORAGE_KEYS = {
  user: 'fitdiary.user',
  workouts: 'fitdiary.workouts',
  meals: 'fitdiary.meals',
  waterIntake: 'fitdiary.waterIntake',
  waterDate: 'fitdiary.waterDate',
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
};

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
