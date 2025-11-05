import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

export default function AuthActionRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Forward Firebase deep links like ezkielcater://__/auth/action?... to our in-app verify screen
    router.replace("/components/verify-email" as any);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B141C" />
      <Text style={styles.text}>Redirecting…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { marginTop: 12, color: "#333" },
});
