import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Layout() {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (initializing) return;

      // Only guard when signed in
      if (user) {
        // Determine if profile is complete and whether email is verified
        try {
          const isVerifyEmailRoute = pathname?.endsWith("/components/verify-email");
          if (!user.emailVerified) {
            if (!isVerifyEmailRoute) {
              router.replace("/components/verify-email" as any);
              return;
            }
            return;
          }
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          const data = snap.data();
          const incomplete = !data || !data.address || !data.phone;

          const isCompleteProfileRoute = pathname?.endsWith("/components/complete-profile");
          const isAuthPage = pathname?.includes("/components/signin") || pathname?.includes("/components/signup") || pathname?.includes("/components/forgot-password") || pathname?.includes("/components/verify-email");

          if (incomplete) {
            // Allow complete-profile, redirect other public pages to it
            if (!isCompleteProfileRoute) {
              router.replace("/components/complete-profile");
              return;
            }
          } else {
            // Profile complete: redirect any public route (including complete-profile) to home
            router.replace("/(tabs)/home");
            return;
          }
        } catch {
          // If profile fetch fails, force completion flow
          if (!pathname?.endsWith("/components/complete-profile")) {
            router.replace("/components/complete-profile");
            return;
          }
        } finally {
          if (!cancelled) setChecking(false);
        }
      } else {
        if (!cancelled) setChecking(false);
      }
    }
    run();
    return () => { cancelled = true };
  }, [initializing, user?.uid, user?.emailVerified, pathname]);

  if (initializing || checking) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}