import {
  FriendCircleMember,
  GoalDraft,
  GoalFrameTone,
  GoalMetric,
  GoalPlan,
  GoalProgress,
  GoalType,
  Meal,
  MealDraft,
  NutritionEstimate,
  Workout,
  WorkoutType,
} from '../types/app';
import { palette } from '../theme/palette';

export const todayKey = () => new Date().toDateString();

export const accentForWorkout = (type: WorkoutType) =>
  type === 'cardio' ? palette.coral : type === 'mobility' ? palette.mint : palette.sky;

export const storageKeyForUser = (baseKey: string, userEmail?: string | null) =>
  userEmail ? `${baseKey}.${userEmail.toLowerCase()}` : baseKey;

const dayInMs = 86_400_000;
const rewardFrames: GoalFrameTone[] = ['sky', 'mint', 'coral', 'sand'];

const goalBlueprint: Record<
  GoalType,
  { title: string; metric: GoalMetric; targetValue: number; durationDays: number; unit: string; body: string }
> = {
  'lose-weight': {
    title: 'Lose 6 kg in 12 weeks',
    metric: 'kg-lost',
    targetValue: 6,
    durationDays: 84,
    unit: 'kg',
    body: 'Steady loss built from weekly milestones and consistent habits.',
  },
  'improve-cardio': {
    title: '900 cardio minutes in 12 weeks',
    metric: 'cardio-minutes',
    targetValue: 900,
    durationDays: 84,
    unit: 'min',
    body: 'Progress is measured by total cardio minutes and weekly output.',
  },
  recover: {
    title: '18 recovery sessions in 8 weeks',
    metric: 'sessions',
    targetValue: 18,
    durationDays: 56,
    unit: 'sessions',
    body: 'Recovery milestones reward mobility, reset work, and hydration rhythm.',
  },
  'build-strength': {
    title: '1000 push-ups in 2026',
    metric: 'reps',
    targetValue: 1000,
    durationDays: 280,
    unit: 'reps',
    body: 'Strength progress is tracked against high-volume repetition targets.',
  },
};

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

  if (days[0] !== todayMs && days[0] !== todayMs - dayInMs) return 0;

  let streakCount = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] === dayInMs) {
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

const startOfDay = (value: string | Date) => {
  const nextDate = typeof value === 'string' ? new Date(value) : new Date(value);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * dayInMs);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const roundForMetric = (value: number, metric: GoalMetric) => (metric === 'kg-lost' ? Number(value.toFixed(1)) : Math.round(value));

const formatDateShort = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

const goalMetricLabel = (metric: GoalMetric) => {
  switch (metric) {
    case 'kg-lost':
      return 'kg lost';
    case 'cardio-minutes':
      return 'cardio min';
    case 'sessions':
      return 'sessions';
    default:
      return 'reps';
  }
};

export const goalUnitForMetric = (metric: GoalMetric) => {
  switch (metric) {
    case 'kg-lost':
      return 'kg';
    case 'cardio-minutes':
      return 'min';
    case 'sessions':
      return 'sessions';
    default:
      return 'reps';
  }
};

const milestoneTitle = (index: number, total: number) =>
  total <= 1 ? 'Final milestone' : index === total - 1 ? 'Finish line' : `Week ${index + 1}`;

const milestoneRewardTitle = (index: number, total: number, frame: GoalFrameTone) =>
  index === total - 1 ? 'Hero frame unlocked' : `${frame} avatar frame unlocked`;

const buildGoalMilestones = (plan: Omit<GoalPlan, 'milestones' | 'currentValue'> & { currentValue: number }) => {
  const start = startOfDay(plan.startDate);
  const end = startOfDay(plan.endDate);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / dayInMs));
  const milestoneCount = clamp(Math.ceil(totalDays / 7), 1, 52);

  return Array.from({ length: milestoneCount }, (_, index) => {
    const ratio = (index + 1) / milestoneCount;
    const targetValue = roundForMetric(plan.targetValue * ratio, plan.metric);
    const frame = rewardFrames[index % rewardFrames.length];
    const dueDate = addDays(start, Math.min(totalDays, Math.round(totalDays * ratio))).toISOString();
    const progress = clamp((plan.currentValue / Math.max(targetValue, 1)) * 100, 0, 100);

    return {
      id: `${plan.id}-milestone-${index + 1}`,
      title: milestoneTitle(index, milestoneCount),
      dueDate,
      targetValue,
      rewardTitle: milestoneRewardTitle(index, milestoneCount, frame),
      rewardFrame: frame,
      completed: plan.currentValue >= targetValue,
      progress,
    };
  });
};

export const defaultGoalDraftForType = (goalType: GoalType): GoalDraft => {
  const blueprint = goalBlueprint[goalType];
  const start = startOfDay(new Date());
  const end = addDays(start, blueprint.durationDays);

  return {
    title: blueprint.title,
    type: goalType,
    metric: blueprint.metric,
    targetValue: String(blueprint.targetValue),
    currentValue: '0',
    endDate: end.toISOString().slice(0, 10),
  };
};

export const createGoalPlan = (draft: GoalDraft, startDate = new Date()): GoalPlan => {
  const start = startOfDay(startDate);
  const safeEnd = startOfDay(draft.endDate || start);
  const end = safeEnd.getTime() <= start.getTime() ? addDays(start, 7) : safeEnd;
  const unit = goalUnitForMetric(draft.metric);
  const targetValue = Math.max(Number(draft.targetValue) || 0, 1);
  const currentValue = Math.max(Number(draft.currentValue) || 0, 0);
  const title = draft.title.trim() || goalBlueprint[draft.type].title;

  const basePlan = {
    id: `${Date.now()}`,
    title,
    type: draft.type,
    metric: draft.metric,
    unit,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    targetValue,
    currentValue,
  };

  return {
    ...basePlan,
    milestones: buildGoalMilestones(basePlan),
  };
};

export const goalDraftFromPlan = (plan: GoalPlan): GoalDraft => ({
  title: plan.title,
  type: plan.type,
  metric: plan.metric,
  targetValue: String(plan.targetValue),
  currentValue: String(plan.currentValue),
  endDate: plan.endDate.slice(0, 10),
});

const deriveGoalCurrentValue = (plan: GoalPlan, workouts: Workout[]) => {
  if (plan.metric === 'reps' || plan.metric === 'kg-lost') {
    return plan.currentValue;
  }

  if (plan.metric === 'cardio-minutes') {
    return Math.max(
      plan.currentValue,
      workouts
      .filter((workout) => workout.type === 'cardio')
      .reduce((sum, workout) => sum + (parseInt(workout.duration, 10) || 0), 0)
    );
  }

  if (plan.type === 'recover') {
    return Math.max(plan.currentValue, workouts.filter((workout) => workout.type === 'mobility').length);
  }
  if (plan.type === 'improve-cardio') {
    return Math.max(plan.currentValue, workouts.filter((workout) => workout.type === 'cardio').length);
  }
  if (plan.type === 'build-strength') {
    return Math.max(plan.currentValue, workouts.filter((workout) => workout.type === 'strength').length);
  }
  return Math.max(plan.currentValue, workouts.length);
};

const timeframeLabelForPlan = (plan: GoalPlan) => {
  const totalDays = Math.max(1, Math.ceil((startOfDay(plan.endDate).getTime() - startOfDay(plan.startDate).getTime()) / dayInMs));
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
  return `${totalWeeks} week rhythm | ends ${formatDateShort(plan.endDate)}`;
};

const rewardForMilestones = (milestones: GoalPlan['milestones']) => {
  const completedMilestones = milestones.filter((milestone) => milestone.completed);
  const latestCompleted = completedMilestones[completedMilestones.length - 1];
  const nextMilestone = milestones.find((milestone) => !milestone.completed);

  return {
    title: latestCompleted ? latestCompleted.rewardTitle : 'First reward loading',
    subtitle: latestCompleted
      ? `${completedMilestones.length} milestone reward${completedMilestones.length === 1 ? '' : 's'} unlocked.`
      : 'Hit your first milestone to unlock a custom avatar frame.',
    frame: latestCompleted?.rewardFrame ?? 'none',
    completedMilestones: completedMilestones.length,
    totalMilestones: milestones.length,
    nextReward: nextMilestone?.rewardTitle,
  };
};

export const goalFrameColor = (frame: GoalFrameTone) => {
  switch (frame) {
    case 'coral':
      return palette.coral;
    case 'mint':
      return palette.mint;
    case 'sand':
      return palette.sand;
    case 'sky':
      return palette.sky;
    default:
      return 'rgba(255,255,255,0.12)';
  }
};

export const goalProgressForUser = (plan: GoalPlan, workouts: Workout[], meals: Meal[], waterProgress: number): GoalProgress => {
  const effectiveCurrentValue = deriveGoalCurrentValue(plan, workouts);
  const effectivePlan = {
    ...plan,
    currentValue: effectiveCurrentValue,
    milestones: buildGoalMilestones({ ...plan, currentValue: effectiveCurrentValue }),
  };
  const progress = clamp((effectiveCurrentValue / Math.max(effectivePlan.targetValue, 1)) * 100, 0, 100);
  const nextMilestone = effectivePlan.milestones.find((milestone) => !milestone.completed) ?? effectivePlan.milestones[effectivePlan.milestones.length - 1];
  const reward = rewardForMilestones(effectivePlan.milestones);
  const habitSignal = meals.length > 0 || waterProgress > 0
    ? `Meals logged: ${meals.length} | hydration ${Math.round(waterProgress)}%.`
    : 'Add fuel and hydration logs to support this goal path.';
  const blueprintBody = goalBlueprint[effectivePlan.type].body;

  return {
    title: effectivePlan.title,
    body: `${blueprintBody} ${habitSignal}`,
    progress,
    metricLabel: goalMetricLabel(effectivePlan.metric),
    currentValue: effectiveCurrentValue,
    targetValue: effectivePlan.targetValue,
    unit: effectivePlan.unit,
    timeframeLabel: timeframeLabelForPlan(effectivePlan),
    nextMilestoneLabel: `${nextMilestone.title} | ${roundForMetric(nextMilestone.targetValue, effectivePlan.metric)} ${effectivePlan.unit} by ${formatDateShort(nextMilestone.dueDate)}`,
    nextMilestoneProgress: nextMilestone.progress,
    completedMilestones: reward.completedMilestones,
    totalMilestones: reward.totalMilestones,
    reward,
    milestones: effectivePlan.milestones,
  };
};

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

export const isValidTimeString = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
