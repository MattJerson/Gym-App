import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function EmojiPicker({ value, onSelect, emojis, error, horizontal = false }) {
  const handleSelect = (emoji) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(emoji);
  };

  return (
    <View style={[styles.container, horizontal && styles.containerHorizontal]}>
      <ScrollView 
        horizontal={horizontal}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.scrollContentHorizontal : styles.scrollContent}
      >
        <View style={horizontal ? styles.emojiRow : styles.emojiGrid}>
          {emojis.map((emoji, index) => (
            <Pressable
              key={index}
              onPress={() => handleSelect(emoji)}
              style={[
                styles.emojiButton,
                value === emoji && styles.emojiButtonSelected
              ]}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
              {value === emoji && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  containerHorizontal: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  scrollContentHorizontal: {
    paddingRight: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emojiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiButtonSelected: {
    backgroundColor: 'rgba(247, 151, 30, 0.3)',
    borderColor: '#f7971e',
    borderWidth: 3,
  },
  emojiText: {
    fontSize: 32,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f7971e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
});
