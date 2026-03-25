import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/appStyles';
import { Meal, Workout } from '../types/app';
import { accentForWorkout } from '../utils/appHelpers';

type WorkoutsScreenProps = {
  workouts: Workout[];
  onOpenCreate: () => void;
  onEdit: (workout: Workout) => void;
  onDelete: (id: string) => void;
};

type MealsScreenProps = {
  meals: Meal[];
  onOpenCreate: () => void;
  onEdit: (meal: Meal) => void;
  onDelete: (id: string) => void;
};

const renderHeaderCopy = (eyebrow: string, title: string, body: string) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionBody}>{body}</Text>
  </View>
);

const renderEmpty = (title: string, body: string) => (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyBody}>{body}</Text>
  </View>
);

export function WorkoutsScreen({ workouts, onOpenCreate, onEdit, onDelete }: WorkoutsScreenProps) {
  return (
    <View style={styles.listScreen}>
      {renderHeaderCopy('Training log', 'Session archive', 'Your completed work, surfaced with more clarity.')}
      <TouchableOpacity style={styles.primaryButton} onPress={onOpenCreate}>
        <Text style={styles.primaryButtonText}>Add workout</Text>
      </TouchableOpacity>
      <FlatList<Workout>
        data={[...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={[styles.entryStripe, { backgroundColor: accentForWorkout(item.type) }]} />
            <View style={styles.entryMain}>
              <Text style={styles.entryTitle}>{item.name}</Text>
              <Text style={styles.entryMeta}>{item.type} · {item.duration} min · {item.calories} cal</Text>
              <Text style={styles.entryDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.entryActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => onDelete(item.id)}>
                <Text style={styles.removeButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={renderEmpty('No workouts logged yet', 'Start with one session and your archive will begin to take shape.')}
      />
    </View>
  );
}

export function MealsScreen({ meals, onOpenCreate, onEdit, onDelete }: MealsScreenProps) {
  return (
    <View style={styles.listScreen}>
      {renderHeaderCopy('Nutrition log', 'Fuel archive', 'Meals, macros, and intake with a cleaner read.')}
      <TouchableOpacity style={styles.primaryButton} onPress={onOpenCreate}>
        <Text style={styles.primaryButtonText}>Add meal</Text>
      </TouchableOpacity>
      <FlatList<Meal>
        data={[...meals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={[styles.entryStripe, { backgroundColor: '#59d4a8' }]} />
            <View style={styles.entryMain}>
              <Text style={styles.entryTitle}>{item.name}</Text>
              <Text style={styles.entryMeta}>P {item.protein || 0}g · C {item.carbs || 0}g · F {item.fat || 0}g</Text>
              <Text style={styles.entryDate}>{item.calories} cal · {new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.entryActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => onDelete(item.id)}>
                <Text style={styles.removeButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={renderEmpty('No meals tracked yet', 'Log your first meal to build a clearer picture of your fuel.')}
      />
    </View>
  );
}
