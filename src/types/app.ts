export type Tab = 'dashboard' | 'workouts' | 'meals' | 'profile';
export type WorkoutType = 'strength' | 'cardio' | 'mobility';

export type User = {
  email: string;
  name: string;
};

export type Workout = {
  id: string;
  name: string;
  type: WorkoutType;
  duration: string;
  calories: string;
  date: string;
};

export type Meal = {
  id: string;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  date: string;
};

export type WorkoutDraft = {
  name: string;
  type: WorkoutType;
  duration: string;
  calories: string;
};

export type MealDraft = {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  streak: number;
  subtitle: string;
  isCurrentUser?: boolean;
};
