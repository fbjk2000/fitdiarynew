import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { workoutLibrary } from '../constants/appData';
import { styles } from '../styles/appStyles';
import { GoalProgress, LeaderboardEntry, Workout } from '../types/app';
import { accentForWorkout, initialsFromName } from '../utils/appHelpers';

type DashboardScreenProps = {
  firstName: string;
  streak: number;
  workoutsCount: number;
  mealsCount: number;
  netCalories: number;
  waterProgress: number;
  waterIntake: number;
  todayWorkoutCalories: number;
  todayMealCalories: number;
  goalProgress: GoalProgress;
  leaderboard: LeaderboardEntry[];
  onAddWater: (amount: number) => void;
  onOpenWorkoutCreate: () => void;
  onOpenMealCreate: () => void;
  onQuickAddWorkout: (workout: Omit<Workout, 'date'>) => void;
};

export function DashboardScreen(props: DashboardScreenProps) {
  const {
    firstName,
    streak,
    workoutsCount,
    mealsCount,
    netCalories,
    waterProgress,
    waterIntake,
    todayWorkoutCalories,
    todayMealCalories,
    goalProgress,
    leaderboard,
    onAddWater,
    onOpenWorkoutCreate,
    onOpenMealCreate,
    onQuickAddWorkout,
  } = props;

  const renderHeaderCopy = (eyebrow: string, title: string, body: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Daily pulse</Text>
            <Text style={styles.heroTitle}>Move with intention, {firstName}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakLabel}>Streak</Text>
            <Text style={styles.streakValue}>{streak}</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          {streak > 0 ? `${streak} day streak active.` : 'Fresh start ready.'} Balance training, fuel, and recovery with a cleaner rhythm.
        </Text>
        <View style={styles.metricBar}>
          {[
            { label: 'sessions', value: String(workoutsCount) },
            { label: 'meals', value: String(mealsCount) },
            { label: 'net cal', value: String(netCalories) },
          ].map((item) => (
            <View key={item.label} style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelRow}>
          <Text style={styles.panelTitle}>{goalProgress.title}</Text>
          <Text style={styles.panelMeta}>{Math.round(goalProgress.progress)}%</Text>
        </View>
        <Text style={styles.profileBody}>{goalProgress.body}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(goalProgress.progress, 100)}%` }]} />
        </View>
      </View>

      {renderHeaderCopy('Overview', 'Performance snapshot', 'A tighter glance at output, fuel, and recovery.')}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
        {[
          { title: 'Hydration', value: `${Math.round(waterProgress)}%`, body: `${waterIntake}ml today`, accentStyle: { backgroundColor: '#69c8ff' } },
          { title: 'Burn', value: `${todayWorkoutCalories}`, body: 'calories burned', accentStyle: { backgroundColor: '#ff7a59' } },
          { title: 'Fuel', value: `${todayMealCalories}`, body: 'calories eaten', accentStyle: { backgroundColor: '#59d4a8' } },
        ].map((card) => (
          <View key={card.title} style={styles.highlightCard}>
            <View style={[styles.highlightAccent, card.accentStyle]} />
            <Text style={styles.highlightTitle}>{card.title}</Text>
            <Text style={styles.highlightValue}>{card.value}</Text>
            <Text style={styles.highlightBody}>{card.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.panel}>
        <View style={styles.panelRow}>
          <Text style={styles.panelTitle}>Hydration track</Text>
          <Text style={styles.panelMeta}>{waterIntake} / 2500ml</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${waterProgress}%` }]} />
        </View>
        <View style={styles.waterButtons}>
          {[250, 500, 750].map((amount) => (
            <TouchableOpacity key={amount} style={styles.waterButton} onPress={() => onAddWater(amount)}>
              <Text style={styles.waterButtonText}>+{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.dualRow}>
        <TouchableOpacity style={[styles.actionCard, styles.actionWarm]} onPress={onOpenWorkoutCreate}>
          <Text style={styles.actionKicker}>Log training</Text>
          <Text style={styles.actionTitle}>Build today's session</Text>
          <Text style={styles.actionBody}>Strength, cardio, or mobility in one move.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, styles.actionCool]} onPress={onOpenMealCreate}>
          <Text style={styles.actionKicker}>Log fuel</Text>
          <Text style={styles.actionTitle}>Capture your intake</Text>
          <Text style={styles.actionBody}>Calories and macros with less friction.</Text>
        </TouchableOpacity>
      </View>

      {renderHeaderCopy('Shortcut library', 'Fast starts', 'Reusable sessions designed for speed.')}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
        {workoutLibrary.map((workout) => (
          <TouchableOpacity key={workout.id} style={styles.libraryCard} onPress={() => onQuickAddWorkout(workout)}>
            <View style={[styles.libraryAccent, { backgroundColor: accentForWorkout(workout.type) }]} />
            <Text style={styles.libraryType}>{workout.type}</Text>
            <Text style={styles.libraryName}>{workout.name}</Text>
            <Text style={styles.libraryMeta}>{workout.duration} min</Text>
            <Text style={styles.libraryMeta}>{workout.calories} cal burn</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderHeaderCopy('Leaderboard', 'Momentum ranking', 'A quick pulse on how your consistency stacks up.')}
      <View style={styles.panel}>
        {leaderboard.slice(0, 4).map((entry, index) => (
          <View key={entry.id} style={styles.leaderRow}>
            <View style={styles.leaderRank}>
              <Text style={styles.leaderRankText}>{index + 1}</Text>
            </View>
            <View style={styles.leaderAvatar}>
              {entry.avatarUri ? (
                <Image source={{ uri: entry.avatarUri }} style={styles.leaderAvatarImage} />
              ) : (
                <Text style={styles.leaderAvatarFallback}>{initialsFromName(entry.name)}</Text>
              )}
            </View>
            <View style={styles.leaderMain}>
              <Text style={[styles.leaderName, entry.isCurrentUser && styles.leaderNameCurrent]}>
                {entry.isCurrentUser ? `${entry.name} (You)` : entry.name}
              </Text>
              <Text style={styles.leaderMeta}>{entry.subtitle} | {entry.streak} day streak</Text>
            </View>
            <Text style={styles.leaderScore}>{entry.score}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
