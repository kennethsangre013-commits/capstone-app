import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { auth, db } from "../../src/firebase";
import { reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function VerifyEmailScreen() {
  const { user, sendVerification, loading, error } = useAuth();
  const router = useRouter();
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) {
      router.replace("/components/signin");
    }
  }, [user]);

  const onResend = React.useCallback(async () => {
    setMessage(null);
    try {
      await sendVerification();
      setMessage("Verification email sent.");
    } catch {}
  }, [sendVerification]);

  const onContinue = React.useCallback(async () => {
    setMessage(null);
    if (!auth.currentUser) return;
    try {
      await reload(auth.currentUser);
      const u = auth.currentUser;
      if (u && u.emailVerified) {
        try {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);
          const data = snap.data();
          const incomplete = !data || !data.address || !data.phone;
          if (incomplete) {
            router.replace("/components/complete-profile");
          } else {
            router.replace("/(tabs)/home");
          }
        } catch {
          router.replace("/components/complete-profile");
        }
      } else {
        setMessage("Not verified yet. Please check your inbox.");
      }
    } catch {
      setMessage("Failed to refresh status. Try again.");
    }
  }, [router]);

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.wrapper}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>We sent a verification link to</Text>
          <Text style={styles.email}>{user.email}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <TouchableOpacity style={[styles.primaryButton, loading && { opacity: 0.7 }]} disabled={loading} onPress={onContinue}>
            <Text style={styles.primaryText}>{loading ? "Loading..." : "I've verified, continue"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, loading && { opacity: 0.7 }]} disabled={loading} onPress={onResend}>
            <Text style={styles.secondaryText}>Resend verification email</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontWeight: "bold", color: "#FFB200", fontSize: 22, textAlign: "center", marginBottom: 8 },
  subtitle: { textAlign: "center", color: "#333" },
  email: { textAlign: "center", fontWeight: "600", marginBottom: 12, marginTop: 2 },
  error: { color: "#B00020", marginTop: 8, textAlign: "center" },
  success: { color: "#0E7C0E", marginTop: 8, textAlign: "center" },
  primaryButton: { backgroundColor: "#3B141C", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  primaryText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondaryButton: { alignSelf: "center", backgroundColor: "#DA8D00", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  secondaryText: { color: "#fff", fontWeight: "600" },
});
