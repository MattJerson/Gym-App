import { Tabs } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

export default function PageLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#333",
          height: 70,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: "#ff4d4d",
        tabBarInactiveTintColor: "#aaa",
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
        name="add"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" color="#ff4d4d" size={size + 10} /> // Larger red "+" button
          ),
          tabBarButton: (props) => (
            <Ionicons name="add-circle" color="#ff4d4d" size={50} {...props} /> // Custom button styling
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
