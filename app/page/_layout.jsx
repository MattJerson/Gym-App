import { Tabs } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { TouchableOpacity, StyleSheet, View } from "react-native";

export default function PageLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 6,
          borderTopColor: "#333",
          backgroundColor: "#1a1a1a",
        },
        tabBarInactiveTintColor: "#aaa",
        tabBarActiveTintColor: "#ff4d4d",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "",
          tabBarButton: (props) => (
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                onPress={() => {/* Handle action press */}}
                style={styles.actionButton}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles" color="#1a1a1a" size={28} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  actionButtonContainer: {
    flex: 1,
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    elevation: 8,
    borderWidth: 3,
    shadowRadius: 6,
    borderRadius: 50,
    shadowOpacity: 0.5,
    alignItems: "center",
    shadowColor: "#000",
    borderColor: "#1a1a1a",
    justifyContent: "center",
    backgroundColor: "#ff4d4d",
    shadowOffset: { width: 0, height: 4 },
  },
});