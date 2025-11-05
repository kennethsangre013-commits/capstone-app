import { Tabs, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function TabsLayout() {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (initializing) return;
      if (!user) {
        router.replace("/components/signin");
        return;
      }
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data = snap.data();
        const incomplete = !data || !data.address || !data.phone;
        if (incomplete) {
          router.replace("/components/complete-profile");
          return;
        }
      } catch (e) {
        // If we fail to read user profile, treat as incomplete and force completion
        router.replace("/components/complete-profile");
        return;
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    }
    run();
    return () => { cancelled = true };
  }, [initializing, user?.uid]);

  if (initializing || checkingProfile) return null;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#3B141C" },
        tabBarInactiveTintColor: "#FFB200",
        tabBarActiveTintColor: "#fff",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
      name="back"
      options={{
        title: "Back",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="keyboard-backspace" size={size} color={color} />
      ),
      }}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("home");
          }
        },
      })}
      />
      <Tabs.Screen
        name="message"
        options={{
          title: "Message",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Notification",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
      name="profile"
      options={{
        title: "Profile",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account-circle" size={size} color={color} />
        ),
      }}
      />
    </Tabs>
  );
}
