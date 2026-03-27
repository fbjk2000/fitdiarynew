import { FriendCircleMember, GoalProgress, GoalType, Meal, MealDraft, NutritionEstimate, Workout, WorkoutType } from '../types/app';
import { palette } from '../theme/palette';

export const todayKey = () => new Date().toDateString();

export const accentForWorkout = (type: WorkoutType) =>
  type === 'cardio' ? palette.coral : type === 'mobility' ? palette.mint : palette.sky;

export const storageKeyForUser = (baseKey: string, userEmail?: string | null) =>
  userEmail ? `${baseKey}.${userEmail.toLowerCase()}` : baseKey;

const uniqueWorkoutDays = (items: Workout[]) =>
  Array.from(new Set(items.map((workout) => new Date(workout.date).toDateString())))
    .map((day) => new Date(day).getTime())
    .sort((a, b) => b - a);

export const calculateStreak = (items: Workout[]) => {
  const days = uniqueWorkoutDays(items);
  if (days.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const oneDay = 86400000;

  if (days[0] !== todayMs && days[0] !== todayMs - oneDay) return 0;

  let streakCount = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] === oneDay) {
      streakCount += 1;
    } else {
      break;
    }
  }

  return streakCount;
};

const normalizedSeed = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .split('')
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 7), 0);

export const buildInviteCode = (userName: string, friendName?: string) => {
  const seed = normalizedSeed(`${userName}-${friendName ?? 'friend'}-${todayKey()}`);
  return `FIT-${seed.toString(36).toUpperCase().slice(0, 6).padEnd(6, 'X')}`;
};

export const createFriendCircleMember = (name: string, ownerName: string, status: FriendCircleMember['status'] = 'invited') => {
  const trimmedName = name.trim();
  const seed = normalizedSeed(trimmedName || ownerName);

  return {
    id: `${Date.now()}-${seed}`,
    name: trimmedName,
    score: 900 + (seed % 1100),
    streak: 2 + (seed % 12),
    status,
    inviteCode: buildInviteCode(ownerName, trimmedName),
    createdAt: new Date().toISOString(),
  } satisfies FriendCircleMember;
};

const nutritionLibrary: Array<{ terms: string[]; estimate: NutritionEstimate }> = [
  {
    terms: ['egg', 'eggs', 'omelette', 'omelet'],
    estimate: { calories: '155', protein: '13', carbs: '1', fat: '11', label: '2 large eggs' },
  },
  {
    terms: ['banana'],
    estimate: { calories: '105', protein: '1', carbs: '27', fat: '0', label: '1 medium banana' },
  },
  {
    terms: ['chicken', 'chicken breast'],
    estimate: { calories: '165', protein: '31', carbs: '0', fat: '4', label: '100g grilled chicken breast' },
  },
  {
    terms: ['rice', 'white rice'],
    estimate: { calories: '205', protein: '4', carbs: '45', fat: '0', label: '1 cup cooked rice' },
  },
  {
    terms: ['oats', 'oatmeal', 'porridge'],
    estimate: { calories: '150', protein: '5', carbs: '27', fat: '3', label: '40g oats with water' },
  },
  {
    terms: ['yogurt', 'greek yogurt'],
    estimate: { calories: '120', protein: '15', carbs: '5', fat: '3', label: '150g Greek yogurt' },
  },
  {
    terms: ['salmon'],
    estimate: { calories: '208', protein: '20', carbs: '0', fat: '13', label: '100g salmon fillet' },
  },
  {
    terms: ['avocado'],
    estimate: { calories: '160', protein: '2', carbs: '9', fat: '15', label: '1/2 avocado' },
  },
];

export const estimateNutritionFromMealName = (mealName: string) => {
  const normalizedName = mealName.trim().toLowerCase();
  if (!normalizedName) return null;

  const match = nutritionLibrary.find((entry) => entry.terms.some((term) => normalizedName.includes(term)));
  return match?.estimate ?? null;
};

export const applyNutritionEstimate = (
  draft: MealDraft,
  estimate: NutritionEstimate,
  mode: 'fill-empty' | 'replace-all' = 'fill-empty',
  source: MealDraft['estimateSource'] = 'heuristic'
) => ({
  ...draft,
  calories: mode === 'replace-all' || !draft.calories.trim() ? estimate.calories : draft.calories,
  protein: mode === 'replace-all' || !draft.protein.trim() ? estimate.protein : draft.protein,
  carbs: mode === 'replace-all' || !draft.carbs.trim() ? estimate.carbs : draft.carbs,
  fat: mode === 'replace-all' || !draft.fat.trim() ? estimate.fat : draft.fat,
  estimateSource: source,
});

export const initialsFromName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'FD';

export const goalProgressForUser = (goal: GoalType, workouts: Workout[], meals: Meal[], waterProgress: number): GoalProgress => {
  const cardioCount = workouts.filter((workout) => workout.type === 'cardio').length;
  const strengthCount = workouts.filter((workout) => workout.type === 'strength').length;
  const mobilityCount = workouts.filter((workout) => workout.type === 'mobility').length;

  if (goal === 'lose-weight') {
    const progress = Math.min(((workouts.length * 9) + (meals.length * 5) + (waterProgress / 2)) / 2, 100);
    return {
      title: 'Lose weight',
      body: 'Consistency score built from training, meal logging, and hydration.',
      progress,
    };
  }

  if (goal === 'recover') {
    const progress = Math.min((mobilityCount * 16) + (waterProgress * 0.35), 100);
    return {
      title: 'Recover',
      body: 'Mobility sessions and hydration are driving your recovery arc.',
      progress,
    };
  }

  if (goal === 'build-strength') {
    const progress = Math.min((strengthCount * 12) + (workouts.length * 3), 100);
    return {
      title: 'Build strength',
      body: 'Strength sessions are weighted most heavily in this progress view.',
      progress,
    };
  }

  const progress = Math.min((cardioCount * 14) + (workouts.length * 2), 100);
  return {
    title: 'Improve cardio fitness',
    body: 'Cardio sessions and steady volume drive this goal forward.',
    progress,
  };
};

export const isValidTimeString = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
