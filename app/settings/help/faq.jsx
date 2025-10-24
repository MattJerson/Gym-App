import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SettingsHeader from "../../../components/SettingsHeader";

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create a workout plan?",
        answer: "Navigate to the Workouts tab and tap 'Create Workout'. Choose from pre-made templates or build your own custom workout by selecting exercises, sets, and reps."
      },
      {
        question: "How do I track my meals?",
        answer: "Go to the Nutrition tab and tap 'Log Meal'. You can search for foods, scan barcodes, or create custom meals. Your daily calorie and macro intake will be automatically calculated."
      },
      {
        question: "Can I use the app offline?",
        answer: "Yes! Most features work offline. Your workouts and meals are cached locally and will sync when you're back online."
      },
    ]
  },
  {
    category: "Workouts",
    questions: [
      {
        question: "How do I edit an active workout?",
        answer: "Tap on your active workout from the Home screen, then tap the edit icon (pencil) in the top right. You can modify exercises, sets, reps, and rest times."
      },
      {
        question: "Can I share my workouts with friends?",
        answer: "Yes! Tap the share icon on any workout to send it to friends. They can import it directly into their app."
      },
      {
        question: "What if I miss a workout day?",
        answer: "No worries! The app will adjust your schedule automatically. You can also manually reschedule or skip days in your workout calendar."
      },
    ]
  },
  {
    category: "Nutrition",
    questions: [
      {
        question: "How are my calorie goals calculated?",
        answer: "Your calorie goals are calculated based on your age, height, weight, activity level, and fitness goals. You can manually adjust them in Settings > Edit Profile."
      },
      {
        question: "Can I customize my meal plans?",
        answer: "Absolutely! You can modify any meal plan, swap meals, or create custom meal plans from scratch based on your preferences and restrictions."
      },
      {
        question: "How do I track water intake?",
        answer: "Tap the water drop icon on your Home screen. Each tap adds 8oz (250ml) to your daily total. You can also set custom water goals in your nutrition settings."
      },
    ]
  },
  {
    category: "Account & Subscription",
    questions: [
      {
        question: "How do I upgrade my subscription?",
        answer: "Go to Profile > My Subscription and tap 'Upgrade Plan'. Choose your desired plan and complete the payment process."
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel anytime. Go to Profile > My Subscription > Cancel Subscription. You'll retain access until your current billing period ends."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay through secure payment processing."
      },
    ]
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        question: "The app is running slowly, what should I do?",
        answer: "Try closing and reopening the app. If issues persist, go to Settings > App Information and tap 'Clear Cache'. Make sure you have the latest app version installed."
      },
      {
        question: "My data isn't syncing, help!",
        answer: "Check your internet connection. Go to Settings and pull down to refresh. If the problem continues, try logging out and back in."
      },
      {
        question: "I forgot my password, how do I reset it?",
        answer: "On the login screen, tap 'Forgot Password'. Enter your email and we'll send you a password reset link within a few minutes."
      },
    ]
  },
];

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="FAQ" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerText}>
            Find answers to commonly asked questions about the app
          </Text>

          {faqData.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Ionicons name="folder-open-outline" size={20} color="#00D4AA" />
                <Text style={styles.categoryTitle}>{category.category}</Text>
              </View>

              <View style={styles.card}>
                {category.questions.map((item, questionIndex) => {
                  const key = `${categoryIndex}-${questionIndex}`;
                  const isExpanded = expandedItems[key];

                  return (
                    <View key={questionIndex}>
                      <Pressable
                        style={styles.questionButton}
                        onPress={() => toggleItem(categoryIndex, questionIndex)}
                      >
                        <View style={styles.questionLeft}>
                          <Ionicons 
                            name={isExpanded ? "remove-circle-outline" : "add-circle-outline"} 
                            size={22} 
                            color={isExpanded ? "#00D4AA" : "#666"} 
                          />
                          <Text style={[styles.question, isExpanded && styles.questionExpanded]}>
                            {item.question}
                          </Text>
                        </View>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#666" 
                        />
                      </Pressable>

                      {isExpanded && (
                        <View style={styles.answerContainer}>
                          <Text style={styles.answer}>{item.answer}</Text>
                        </View>
                      )}

                      {questionIndex < category.questions.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.footerContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#666" />
            <Text style={styles.footerTitle}>Still need help?</Text>
            <Text style={styles.footerText}>
              Can't find what you're looking for? Contact our support team and we'll get back to you within 24 hours.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
  headerText: {
    fontSize: 15,
    color: "#999",
    lineHeight: 22,
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 28,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  categoryTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  questionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  questionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 12,
  },
  question: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
    lineHeight: 20,
  },
  questionExpanded: {
    color: "#00D4AA",
  },
  answerContainer: {
    paddingLeft: 34,
    paddingRight: 8,
    paddingBottom: 12,
    paddingTop: 4,
  },
  answer: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  footerContainer: {
    marginTop: 32,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  footerTitle: {
    fontSize: 20,
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
    textAlign: "center",
  },
});
