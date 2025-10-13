import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NotificationBar from "./NotificationBar";
import TypingText from "./TypingText";

const PageHeader = ({ 
  title, 
  userName = null, 
  showWelcomeAnimation = false 
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          {showWelcomeAnimation && !animationComplete ? (
            <TypingText
              firstMessage={`Let's get to work, ${userName}!`}
              secondMessage="Home"
              typingSpeed={80}
              pauseBetween={2500}
              onComplete={() => setAnimationComplete(true)}
              style={styles.headerText}
            />
          ) : userName && !showWelcomeAnimation ? (
            <Text style={styles.headerText}>Welcome, {userName}! 💪</Text>
          ) : (
            <Text style={styles.headerText}>{title || "Home"}</Text>
          )}
        </View>
        <NotificationBar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#0B0B0B",
    zIndex: 1000,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default PageHeader;
