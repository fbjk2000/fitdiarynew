import React from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { goalMetricOptions, goalOptions } from '../constants/appData';
import { styles } from '../styles/appStyles';
import {
  FriendCircleMember,
  GoalDraft,
  GoalFrameTone,
  GoalProgress,
  GoalType,
  LeaderboardEntry,
  ReminderSettings,
} from '../types/app';
import { goalFrameColor, initialsFromName } from '../utils/appHelpers';

type ProfileScreenProps = {
  firstName: string;
  displayName: string;
  email: string;
  workoutsCount: number;
  streak: number;
  waterProgress: number;
  avatarUri?: string;
  avatarFrameTone: GoalFrameTone;
  latestWorkoutSummary: string;
  primaryGoal: GoalType;
  goalProgress: GoalProgress;
  goalDraft: GoalDraft;
  reminderSettings: ReminderSettings;
  showNoAchievements: boolean;
  leaderboard: LeaderboardEntry[];
  inviteCode: string;
  friendName: string;
  setFriendName: (value: string) => void;
  friends: FriendCircleMember[];
  onPickProfileImage: () => void;
  onGoalChange: (goal: GoalType) => void;
  onGoalDraftChange: (field: keyof GoalDraft, value: string) => void;
  onSaveGoal: () => void;
  onReminderChange: (field: keyof ReminderSettings, value: string) => void;
  onSaveReminders: () => void;
  onShareInvite: () => void;
  onActivateFriend: (id: string) => void;
  onRemoveFriend: (id: string) => void;
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
    avatarUri,
    avatarFrameTone,
    latestWorkoutSummary,
    primaryGoal,
    goalProgress,
    goalDraft,
    reminderSettings,
    showNoAchievements,
    leaderboard,
    inviteCode,
    friendName,
    setFriendName,
    friends,
    onPickProfileImage,
    onGoalChange,
    onGoalDraftChange,
    onSaveGoal,
    onReminderChange,
    onSaveReminders,
    onShareInvite,
    onActivateFriend,
    onRemoveFriend,
    onSignOut,
  } = props;

  const activeFriends = friends.filter((friend) => friend.status === 'active');
  const invitedFriends = friends.filter((friend) => friend.status === 'invited');
  const avatarFrameStyle = avatarFrameTone === 'none'
    ? null
    : {
        borderColor: goalFrameColor(avatarFrameTone),
        shadowColor: goalFrameColor(avatarFrameTone),
      };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.profileHero}>
        <TouchableOpacity style={[styles.avatarCircleLarge, avatarFrameStyle]} onPress={onPickProfileImage}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarCircleImage} />
          ) : (
            <Text style={styles.avatarText}>{firstName.slice(0, 2).toUpperCase()}</Text>
          )}
          {avatarFrameTone !== 'none' && <View style={styles.avatarFrameBadge}><Text style={styles.avatarFrameBadgeText}>Reward</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity onPress={onPickProfileImage}>
          <Text style={styles.profilePhotoAction}>{avatarUri ? 'Change profile photo' : 'Add profile photo'}</Text>
        </TouchableOpacity>
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
        <View style={styles.panelRow}>
          <Text style={styles.panelTitle}>Goal path</Text>
          <Text style={styles.panelMeta}>{Math.round(goalProgress.progress)}%</Text>
        </View>
        <Text style={styles.profileBody}>{goalProgress.body}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(goalProgress.progress, 100)}%` }]} />
        </View>
        <View style={styles.goalSummaryRow}>
          <Text style={styles.goalSummaryValue}>
            {goalProgress.currentValue} / {goalProgress.targetValue} {goalProgress.unit}
          </Text>
          <Text style={styles.goalSummaryMeta}>{goalProgress.timeframeLabel}</Text>
        </View>
        <Text style={styles.goalMilestoneHint}>Next milestone: {goalProgress.nextMilestoneLabel}</Text>
        <View style={styles.goalChipRow}>
          {goalOptions.map((goal) => (
            <TouchableOpacity
              key={goal.key}
              style={[styles.goalChip, primaryGoal === goal.key && styles.goalChipActive]}
              onPress={() => onGoalChange(goal.key)}
            >
              <Text style={[styles.goalChipText, primaryGoal === goal.key && styles.goalChipTextActive]}>{goal.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Goal title"
          placeholderTextColor="#7c8aa5"
          value={goalDraft.title}
          onChangeText={(value) => onGoalDraftChange('title', value)}
        />
        <View style={styles.goalChipRow}>
          {goalMetricOptions.map((metric) => (
            <TouchableOpacity
              key={metric.key}
              style={[styles.goalChip, goalDraft.metric === metric.key && styles.goalChipActive]}
              onPress={() => onGoalDraftChange('metric', metric.key)}
            >
              <Text style={[styles.goalChipText, goalDraft.metric === metric.key && styles.goalChipTextActive]}>
                {metric.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.dualInputRow}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder={`Target (${goalMetricOptions.find((item) => item.key === goalDraft.metric)?.unit ?? 'value'})`}
            placeholderTextColor="#7c8aa5"
            keyboardType="numeric"
            value={goalDraft.targetValue}
            onChangeText={(value) => onGoalDraftChange('targetValue', value)}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Current progress"
            placeholderTextColor="#7c8aa5"
            keyboardType="numeric"
            value={goalDraft.currentValue}
            onChangeText={(value) => onGoalDraftChange('currentValue', value)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="End date YYYY-MM-DD"
          placeholderTextColor="#7c8aa5"
          value={goalDraft.endDate}
          onChangeText={(value) => onGoalDraftChange('endDate', value)}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={onSaveGoal}>
          <Text style={styles.primaryButtonText}>Save goal path</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Milestones and rewards</Text>
        <View style={styles.rewardHero}>
          <Text style={styles.rewardHeroEyebrow}>Reward track</Text>
          <Text style={styles.rewardHeroTitle}>{goalProgress.reward.title}</Text>
          <Text style={styles.rewardHeroBody}>{goalProgress.reward.subtitle}</Text>
          {goalProgress.reward.nextReward ? (
            <Text style={styles.rewardHeroMeta}>Next unlock: {goalProgress.reward.nextReward}</Text>
          ) : null}
        </View>
        {goalProgress.milestones.slice(0, 4).map((milestone) => (
          <View key={milestone.id} style={styles.milestoneCard}>
            <View style={styles.panelRow}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.panelMeta}>{Math.round(milestone.progress)}%</Text>
            </View>
            <Text style={styles.milestoneMeta}>
              {milestone.targetValue} {goalProgress.unit} by {new Date(milestone.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.milestoneReward}>{milestone.rewardTitle}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(milestone.progress, 100)}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Reminders</Text>
        <Text style={styles.profileBody}>Set daily reminder times in 24 hour format to keep your routine moving.</Text>
        <View style={styles.dualInputRow}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Workout 07:30"
            placeholderTextColor="#7c8aa5"
            value={reminderSettings.workoutTime}
            onChangeText={(value) => onReminderChange('workoutTime', value)}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Fuel 12:30"
            placeholderTextColor="#7c8aa5"
            value={reminderSettings.fuelTime}
            onChangeText={(value) => onReminderChange('fuelTime', value)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Hydration 09:00"
          placeholderTextColor="#7c8aa5"
          value={reminderSettings.hydrationTime}
          onChangeText={(value) => onReminderChange('hydrationTime', value)}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={onSaveReminders}>
          <Text style={styles.primaryButtonText}>Save reminders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Achievements</Text>
        {goalProgress.completedMilestones > 0 && (
          <Text style={styles.achievement}>{goalProgress.completedMilestones} milestone rewards unlocked</Text>
        )}
        {streak >= 7 && <Text style={styles.achievement}>7 day streak warrior</Text>}
        {workoutsCount >= 10 && <Text style={styles.achievement}>10 workout club</Text>}
        {waterProgress >= 100 && <Text style={styles.achievement}>hydration master</Text>}
        {showNoAchievements && (
          <Text style={styles.profileBody}>Complete activities to unlock your first badge.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelRow}>
          <Text style={styles.panelTitle}>Friend circle</Text>
          <Text style={styles.panelMeta}>{activeFriends.length} active</Text>
        </View>
        <Text style={styles.profileBody}>
          Invite people from WhatsApp or any share target, then move them into your active circle once they join.
        </Text>
        <View style={styles.inviteCodeCard}>
          <Text style={styles.inviteCodeLabel}>Invite code</Text>
          <Text style={styles.inviteCodeValue}>{inviteCode}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Friend name or nickname"
          placeholderTextColor="#7c8aa5"
          value={friendName}
          onChangeText={setFriendName}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={onShareInvite}>
          <Text style={styles.primaryButtonText}>Share invite</Text>
        </TouchableOpacity>
        {friends.length > 0 ? (
          <View style={styles.friendList}>
            {friends.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendMain}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendMeta}>
                    {friend.status === 'active'
                      ? `${friend.score} pts | ${friend.streak} day streak`
                      : `Invite sent | code ${friend.inviteCode}`}
                  </Text>
                </View>
                <View style={styles.friendActions}>
                  {friend.status === 'invited' && (
                    <TouchableOpacity style={styles.friendActivateButton} onPress={() => onActivateFriend(friend.id)}>
                      <Text style={styles.friendActivateText}>Activate</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.friendRemoveButton} onPress={() => onRemoveFriend(friend.id)}>
                    <Text style={styles.friendRemoveText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.profileBody}>
            No friend group yet. Add a name and share your invite to start a real rivalry circle.
          </Text>
        )}
        {invitedFriends.length > 0 && (
          <Text style={styles.inviteHint}>
            Pending invites stay out of the live leaderboard until you mark them active.
          </Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Leaderboard</Text>
        {leaderboard.map((entry, index) => (
          <View key={entry.id} style={styles.leaderRow}>
            <View style={styles.leaderRank}>
              <Text style={styles.leaderRankText}>{index + 1}</Text>
            </View>
            <View
              style={[
                styles.leaderAvatar,
                entry.avatarFrameTone && entry.avatarFrameTone !== 'none'
                  ? { borderColor: goalFrameColor(entry.avatarFrameTone) }
                  : null,
              ]}
            >
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
