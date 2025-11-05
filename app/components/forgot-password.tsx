import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import React from "react";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = React.useState("");
    const [message, setMessage] = React.useState<string | null>(null);
    const { sendReset, loading, error } = useAuth();
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light"/>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.wrapper}>
                    <View style={styles.topBar}>
                        <Text style={styles.title}>Forgot Password</Text>
                    </View>
                    <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      value={email}
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {message ? <Text style={styles.success}>{message}</Text> : null}
                    <TouchableOpacity
                      style={[styles.button, loading && { opacity: 0.7 }]}
                      disabled={loading}
                      onPress={async () => {
                        try {
                          await sendReset(email.trim());
                          setMessage("Password reset email sent. Always check your spam");
                        } catch {}
                      }}
                    >
                      <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.back}>Back</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    wrapper: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
    },
    topBar: {
        alignItems: "center",
        marginBottom: 12,
    },
    title: {
        fontWeight: "bold",
        color: "#FFB200",
        fontSize: 22,
    },
    subtitle: {
        marginBottom: 12,
        color: "#333",
    },
    input: {
        borderBottomWidth: 1.5,
        borderBottomColor: "#ff7f50",
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 16,
    },
    button: {
        backgroundColor: "#3B141C",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 4,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    error: {
        color: "#B00020",
        marginBottom: 8,
    },
    success: {
        color: "#0E7C0E",
        marginBottom: 8,
    },
    back: {
        marginTop: 16,
        color: "#3662AA",
        textAlign: "center",
    }
})