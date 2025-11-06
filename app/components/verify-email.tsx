import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { auth, db } from "../../src/firebase";
import { reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function VerifyEmailScreen() {
  const { user, sendVerification, loading, error } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) router.replace("/components/signin");
  }, [user]);

  useEffect(() => {
    if (error) showMessage(error, "error");
  }, [error]);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setMessage(null));
  };

  const handleResend = async () => {
    try {
      await sendVerification();
      showMessage("Verification email sent!", "success");
    } catch {
      showMessage("Failed to send email. Try again.", "error");
    }
  };

  const handleContinue = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const profileIncomplete = !userDoc.data()?.address || !userDoc.data()?.phone;
        router.replace(profileIncomplete ? "/components/complete-profile" : "/(tabs)/home");
      } else {
        Alert.alert("Email Not Verified", "Please check your inbox and spam folder.");
      }
    } catch {
      showMessage("Unable to verify status. Please try again.", "error");
    } finally {
      setChecking(false);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>✉️</Text>
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>A verification link was sent to</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.instruction}>Click the link in the email to continue</Text>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={checking || loading}
            style={[styles.primaryBtn, (checking || loading) && styles.disabledBtn]}
          >
            {checking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={checking || loading}
            style={[styles.secondaryBtn, (checking || loading) && styles.disabledBtn]}
          >
            <Text style={styles.secondaryBtnText}>Resend Email</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Didn't receive it? Check your spam or resend the verification email.
          </Text>
        </View>

        {message && (
          <Animated.View
            style={[
              styles.toast,
              message.type === "success" ? styles.success : styles.error,
              { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.toastText}>{message.text}</Text>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 30, paddingBottom: 30 },
  iconBox: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 8, color: "#222" },
  subtitle: { fontSize: 16, textAlign: "center", color: "#555" },
  email: { fontWeight: "600", fontSize: 16, textAlign: "center", marginVertical: 4, color: "#000" },
  instruction: { fontSize: 14, textAlign: "center", color: "#888", marginBottom: 30 },
  primaryBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#007bff", fontSize: 15, fontWeight: "600" },
  disabledBtn: { opacity: 0.5 },
  note: { fontSize: 13, textAlign: "center", color: "#666", marginTop: 20, lineHeight: 18 },
  toast: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 8,
  },
  success: { backgroundColor: "#4caf50" },
  error: { backgroundColor: "#f44336" },
  toastText: { color: "#fff", fontWeight: "600", textAlign: "center", fontSize: 14 },
});
