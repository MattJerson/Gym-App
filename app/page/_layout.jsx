import { Tabs, useRouter, useSegments } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
            height: 85,
            paddingTop: 8,
            paddingBottom: 22,
            borderTopWidth: 0,
            backgroundColor: "#1E3A5F",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 20,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
            borderRadius: 16,
            marginHorizontal: 4,
            marginTop: -6,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
          tabBarActiveTintColor: "#74B9FF",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 0,
            marginBottom: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabContainer]}>
                <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size + 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabContainer]}>
                <FontAwesome5 name="calendar" color={color} size={size} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: "Training",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabContainer]}>
                <Ionicons name={focused ? "barbell" : "barbell-outline"} color={color} size={size + 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="mealplan"
          options={{
            title: "Nutrition",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabContainer]}>
                <Ionicons name={focused ? "restaurant" : "restaurant-outline"} color={color} size={size + 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabContainer]}>
                <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size + 2} />
              </View>
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
          <LinearGradient
            colors={["#74B9FF", "#1E3A5F"]}
            style={styles.fabGradient}
          >
            <Ionicons name="chatbubbles" color="#fff" size={28} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 34,
    borderRadius: 12,
    marginTop: -2,
  },
  activeTabContainer: {
    backgroundColor: "rgba(116, 185, 255, 0.15)",
    shadowColor: "#74B9FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fab: {
    right: 20,
    width: 60,
    height: 60,
    bottom: 105,
    elevation: 12,
    shadowRadius: 8,
    borderRadius: 30,
    shadowOpacity: 0.4,
    shadowColor: "#000",
    position: "absolute",
    shadowOffset: { width: 0, height: 6 },
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#74B9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
