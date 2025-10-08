import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";

export default function MealTypeFilterChips({ 
  selectedMealType, 
  onSelect 
}) {
  const mealTypes = [
    { key: 'all', label: 'All', emoji: '🍽️' },
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { key: 'lunch', label: 'Lunch', emoji: '☀️' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
    { key: 'snack', label: 'Snack', emoji: '🍪' },
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {mealTypes.map((type) => (
        <Pressable
          key={type.key}
          style={[
            styles.chip,
            selectedMealType === type.key && styles.chipActive
          ]}
          onPress={() => onSelect(type.key)}
        >
          <Text style={styles.emoji}>{type.emoji}</Text>
          <Text style={[
            styles.chipText,
            selectedMealType === type.key && styles.chipTextActive
          ]}>
            {type.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderColor: '#00D4AA',
  },
  emoji: {
    fontSize: 16,
  },
  chipText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#00D4AA',
    fontWeight: '700',
  },
});
