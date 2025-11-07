import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter, useSegments } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import PageHeader from "../../components/page/PageHeader";
import { useState, useEffect } from "react";

export default function PageLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [pageTitle, setPageTitle] = useState("Home");

  const isChatbot = segments.includes("chatbot");
  const isCommunityChat = segments.includes("communitychat");
  
  // Hide header on chatbot and community chat pages
  const showHeader = !isChatbot && !isCommunityChat;

  // Update page title based on current route
  useEffect(() => {
    const currentPage = segments[segments.length - 1];
    switch (currentPage) {
      case "home":
        setPageTitle("Welcome!");
        break;
      case "calendar":
        setPageTitle("Calendar");
        break;
      case "training":
        setPageTitle("Training");
        break;
      case "mealplan":
        setPageTitle("Nutrition");
        break;
      case "profile":
        setPageTitle("Profile");
        break;
      default:
        setPageTitle("Home");
    }
  }, [segments]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0B0B" }}>
      {showHeader && <PageHeader title={pageTitle} />}
      <Tabs
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          swipeEnabled: false,
          tabBarStyle: {
            height: 80,
            paddingTop: 10,
            paddingBottom: 10,
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
            marginBottom: 4,
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
              <View
                style={[
                  styles.tabIconContainer,
                  focused && styles.activeTabContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  color={color}
                  size={size + 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={[
                  styles.tabIconContainer,
                  focused && styles.activeTabContainer,
                ]}
              >
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
              <View
                style={[
                  styles.tabIconContainer,
                  focused && styles.activeTabContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "barbell" : "barbell-outline"}
                  color={color}
                  size={size + 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="mealplan"
          options={{
            title: "Nutrition",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={[
                  styles.tabIconContainer,
                  focused && styles.activeTabContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "restaurant" : "restaurant-outline"}
                  color={color}
                  size={size + 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={[
                  styles.tabIconContainer,
                  focused && styles.activeTabContainer,
                ]}
              >
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  color={color}
                  size={size + 2}
                />
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
        <Tabs.Screen
          name="communitychat"
          options={{
            href: null,
          }}
        />
      </Tabs>
      {!isChatbot && !isCommunityChat && (
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
    width: 40,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabContainer: {
    elevation: 4,
    shadowRadius: 4,
    shadowOpacity: 0.3,
    shadowColor: "#74B9FF",
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: "rgba(116, 185, 255, 0.15)",
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
    elevation: 8,
    shadowRadius: 6,
    borderRadius: 30,
    shadowOpacity: 0.3,
    alignItems: "center",
    shadowColor: "#74B9FF",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
  },
});
