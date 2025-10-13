import React from "react";
import { View, Text, StyleSheet } from "react-native";
import NotificationBar from "../NotificationBar";

const PageHeader = ({ title, showNotifications = true }) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>{title}</Text>
      {showNotifications && <NotificationBar />}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0B0B0B",
  },
  headerText: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default PageHeader;
