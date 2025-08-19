import { Tabs, useRouter, useSegments } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { TouchableOpacity, StyleSheet, View } from "react-native";

export default function PageLayout() {
  const router = useRouter();
  const segments = useSegments(); // gives current route segments

  // detect if current route is "chatbot"
  const isChatbot = segments.includes("chatbot");

  return (
    <View style={{ flex: 1 }}>
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
          name="training"
          options={{
            title: "",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="mealplan"
          options={{
            title: "",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant" color={color} size={size} />
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
        <Tabs.Screen
          name="chatbot"
          options={{
            href: null,
          }}
        />
      </Tabs>
      {!isChatbot && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => router.push("./chatbot")}
        >
          <Ionicons name="chatbubbles" color="#1a1a1a" size={28} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    right: 20,
    width: 56,
    height: 56,
    bottom: 90,
    elevation: 8,
    shadowRadius: 6,
    borderRadius: 28,
    shadowOpacity: 0.3,
    shadowColor: "#000",
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4d4d",
    shadowOffset: { width: 0, height: 4 },
  },
});
