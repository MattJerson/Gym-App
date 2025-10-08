import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileMenuSection({ title, items, onItemPress, icon }) {
  return (
    <View style={styles.card}>
      {icon && (
        <View style={styles.sectionHeaderWithIcon}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      )}
      {!icon && <Text style={styles.cardTitle}>{title}</Text>}
      
      {items.map((item, index) => (
        <Pressable 
          key={index} 
          style={styles.menuRow} 
          onPress={() => onItemPress(item.path)}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon} size={20} color="#fff" />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={22} color="#555" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#eee",
    fontWeight: '500',
  },
});
