import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/appStyles';
import { LeaderboardEntry } from '../types/app';

type ProfileScreenProps = {
  firstName: string;
  displayName: string;
  email: string;
  workoutsCount: number;
  streak: number;
  waterProgress: number;
  latestWorkoutSummary: string;
  showNoAchievements: boolean;
  leaderboard: LeaderboardEntry[];
  onSignOut: () => void;
};

export function ProfileScreen(props: ProfileScreenProps) {
  const {
    firstName,
    displayName,
    email,
    workoutsCount,
    streak,
    waterProgress,
    latestWorkoutSummary,
    showNoAchievements,
    leaderboard,
    onSignOut,
  } = props;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.profileHero}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{firstName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
      </View>
      <View style={styles.scoreRow}>
        {[
          { value: workoutsCount, label: 'sessions' },
          { value: streak, label: 'streak days' },
          { value: `${Math.round(waterProgress)}%`, label: 'hydration' },
        ].map((item) => (
          <View key={item.label} style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{item.value}</Text>
            <Text style={styles.scoreLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Current mode</Text>
        <Text style={styles.profileBody}>{latestWorkoutSummary}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Achievements</Text>
        {streak >= 7 && <Text style={styles.achievement}>7 day streak warrior</Text>}
        {workoutsCount >= 10 && <Text style={styles.achievement}>10 workout club</Text>}
        {waterProgress >= 100 && <Text style={styles.achievement}>hydration master</Text>}
        {showNoAchievements && (
          <Text style={styles.profileBody}>Complete activities to unlock your first badge.</Text>
        )}
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Leaderboard</Text>
        {leaderboard.map((entry, index) => (
          <View key={entry.id} style={styles.leaderRow}>
            <View style={styles.leaderRank}>
              <Text style={styles.leaderRankText}>{index + 1}</Text>
            </View>
            <View style={styles.leaderMain}>
              <Text style={[styles.leaderName, entry.isCurrentUser && styles.leaderNameCurrent]}>
                {entry.isCurrentUser ? `${entry.name} (You)` : entry.name}
              </Text>
              <Text style={styles.leaderMeta}>{entry.subtitle}</Text>
            </View>
            <Text style={styles.leaderScore}>{entry.score}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
        <Text style={styles.signOutButtonText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
