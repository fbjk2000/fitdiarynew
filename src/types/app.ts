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
  avatarFrameTone?: GoalFrameTone;
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
export type GoalMetric = 'sessions' | 'reps' | 'kg-lost' | 'cardio-minutes';
export type GoalFrameTone = 'none' | 'coral' | 'sky' | 'mint' | 'sand';

export type ReminderSettings = {
  workoutTime: string;
  fuelTime: string;
  hydrationTime: string;
};

export type GoalMilestone = {
  id: string;
  title: string;
  dueDate: string;
  targetValue: number;
  rewardTitle: string;
  rewardFrame: GoalFrameTone;
  completed: boolean;
  progress: number;
};

export type GoalPlan = {
  id: string;
  title: string;
  type: GoalType;
  metric: GoalMetric;
  unit: string;
  startDate: string;
  endDate: string;
  targetValue: number;
  currentValue: number;
  milestones: GoalMilestone[];
};

export type GoalDraft = {
  title: string;
  type: GoalType;
  metric: GoalMetric;
  targetValue: string;
  currentValue: string;
  endDate: string;
};

export type UserPreferences = {
  primaryGoal: GoalType;
  reminderSettings: ReminderSettings;
  activeGoal: GoalPlan;
};

export type GoalReward = {
  title: string;
  subtitle: string;
  frame: GoalFrameTone;
  completedMilestones: number;
  totalMilestones: number;
  nextReward?: string;
};

export type GoalProgress = {
  title: string;
  body: string;
  progress: number;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  timeframeLabel: string;
  nextMilestoneLabel: string;
  nextMilestoneProgress: number;
  completedMilestones: number;
  totalMilestones: number;
  reward: GoalReward;
  milestones: GoalMilestone[];
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
