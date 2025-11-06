import { Stack, usePathname, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ReservationProvider } from "../src/context/ReservationContext";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

function AppNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initializing } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const checkOnboardingStatus = async () => {
      try {
        // Wait for auth to initialize
        if (initializing) return;

        const onboardingSeen = await AsyncStorage.getItem("onboardingSeen");
        const hasAuthToken = await AsyncStorage.getItem("auth_id_token");
        
        // Mark onboarding as seen if user is authenticated or has used the app before
        if (user || hasAuthToken) {
          await AsyncStorage.setItem("onboardingSeen", "true");
          if (!cancelled) setCheckingOnboarding(false);
          return;
        }

        // Only redirect to onboarding if:
        // 1. User hasn't seen onboarding before
        // 2. User is on index page
        // 3. User is not authenticated
        if (onboardingSeen !== "true" && (pathname === "/" || pathname === "/index")) {
          router.replace("/onboarding");
        }
      } finally {
        if (!cancelled) setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
    return () => { cancelled = true };
  }, [pathname, router, user, initializing]);

  if (initializing || checkingOnboarding) return null;
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="screens/package" />
      <Stack.Screen name="screens/reservation" /> 
      <Stack.Screen name="screens/payment" />
      <Stack.Screen name="screens/receipt" />
      <Stack.Screen name="screens/menulist"/>
      <Stack.Screen name="screens/about" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ReservationProvider>
        <AppNavigator />
      </ReservationProvider>
    </AuthProvider>
  );
}