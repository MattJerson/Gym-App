import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader';

const ThemeOption = ({ label, iconName, isSelected, onPress }) => (
    <Pressable style={[styles.themeBox, isSelected && styles.themeBoxSelected]} onPress={onPress}>
        <Ionicons name={iconName} size={28} color={isSelected ? '#fff' : '#aaa'} />
        <Text style={[styles.themeLabel, isSelected && styles.themeLabelSelected]}>{label}</Text>
    </Pressable>
);

export default function Appearance() {
    const [selectedTheme, setSelectedTheme] = useState('dark');

    return (
        <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
            <SafeAreaView style={{ flex: 1 }}>
                <SettingsHeader title="Appearance" />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {/* Theme Section */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="color-palette-outline" size={24} color="#9b59b6" />
                            <Text style={styles.sectionTitle}>Theme</Text>
                        </View>
                        
                        <View style={styles.card}>
                            <View style={styles.themeContainer}>
                                <ThemeOption label="Light" iconName="sunny-outline" isSelected={selectedTheme === 'light'} onPress={() => setSelectedTheme('light')} />
                                <ThemeOption label="Dark" iconName="moon-outline" isSelected={selectedTheme === 'dark'} onPress={() => setSelectedTheme('dark')} />
                                <ThemeOption label="System" iconName="cog-outline" isSelected={selectedTheme === 'system'} onPress={() => setSelectedTheme('system')} />
                            </View>
                            
                            <Text style={styles.helperText}>
                                Dark theme is recommended for low-light gym sessions and reduces eye strain during late-night meal planning
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    card: { 
        padding: 20, 
        borderRadius: 24, 
        backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    themeContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
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
    helperText: {
        color: '#666',
        fontSize: 13,
        paddingLeft: 5,
        lineHeight: 18,
        marginTop: 4,
    },
});