export type Tab = 'dashboard' | 'workouts' | 'meals' | 'profile';
export type WorkoutType = 'strength' | 'cardio' | 'mobility';

export type User = {
  email: string;
  name: string;
  avatarUri?: string;
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
  photoUri?: string;
  estimateSource?: 'manual' | 'heuristic' | 'vision';
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
  photoUri?: string;
  estimateSource?: 'manual' | 'heuristic' | 'vision';
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  streak: number;
  subtitle: string;
  isCurrentUser?: boolean;
  avatarUri?: string;
};

export type FriendStatus = 'invited' | 'active';

export type FriendCircleMember = {
  id: string;
  name: string;
  score: number;
  streak: number;
  status: FriendStatus;
  inviteCode: string;
  createdAt: string;
};

export type GoalType = 'lose-weight' | 'improve-cardio' | 'recover' | 'build-strength';

export type ReminderSettings = {
  workoutTime: string;
  fuelTime: string;
  hydrationTime: string;
};

export type UserPreferences = {
  primaryGoal: GoalType;
  reminderSettings: ReminderSettings;
};

export type GoalProgress = {
  title: string;
  body: string;
  progress: number;
};

export type NutritionEstimate = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  label: string;
};

export type PhotoNutritionEstimate = NutritionEstimate & {
  confidence?: number;
  notes?: string;
};
