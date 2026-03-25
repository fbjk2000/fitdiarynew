import { Workout, WorkoutType } from '../types/app';
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
