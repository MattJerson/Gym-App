import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader'; // Adjust path if needed

const ThemeOption = ({ label, iconName, isSelected, onPress }) => (
    <Pressable style={[styles.themeBox, isSelected && styles.themeBoxSelected]} onPress={onPress}>
        <Ionicons name={iconName} size={28} color={isSelected ? '#fff' : '#aaa'} />
        <Text style={[styles.themeLabel, isSelected && styles.themeLabelSelected]}>{label}</Text>
    </Pressable>
);

export default function Appearance() {
    const [selectedTheme, setSelectedTheme] = useState('dark');

    return (
        <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <SettingsHeader title="Appearance" />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Theme</Text>
                        <View style={styles.themeContainer}>
                            <ThemeOption label="Light" iconName="sunny-outline" isSelected={selectedTheme === 'light'} onPress={() => setSelectedTheme('light')} />
                            <ThemeOption label="Dark" iconName="moon-outline" isSelected={selectedTheme === 'dark'} onPress={() => setSelectedTheme('dark')} />
                            <ThemeOption label="System" iconName="cog-outline" isSelected={selectedTheme === 'system'} onPress={() => setSelectedTheme('system')} />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { padding: 20, borderRadius: 24, backgroundColor: "rgba(255, 255, 255, 0.05)" },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
    themeContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    themeBox: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 10,
    },
    themeBoxSelected: {
        borderColor: '#f7971e',
        backgroundColor: 'rgba(247, 151, 30, 0.2)',
    },
    themeLabel: { fontSize: 14, color: '#aaa', fontWeight: '600' },
    themeLabelSelected: { color: '#fff' },
});