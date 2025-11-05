import { Stack, usePathname, useRouter } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { ReservationProvider } from "../src/context/ReservationContext";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem("onboardingSeen");
        if (seen !== "true" && pathname !== "/onboarding") {
          router.replace("/onboarding");
          return;
        }
      } finally {
        if (!cancelled) setCheckingOnboarding(false);
      }
    })();
    return () => { cancelled = true };
  }, [pathname]);

  if (checkingOnboarding) return null;
  return (
    <AuthProvider>
      <ReservationProvider>
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
      </ReservationProvider>
    </AuthProvider>
  );
}