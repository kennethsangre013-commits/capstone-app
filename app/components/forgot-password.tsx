import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import React from "react";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = React.useState("");
    const [message, setMessage] = React.useState<string | null>(null);
    const { sendReset, loading, error } = useAuth();
    const router = useRouter();

    const handleSendReset = async () => {
        setMessage(null);
        try {
            await sendReset(email.trim());
            setMessage("Password reset email sent. Check your inbox or spam folder.");
        } catch {}
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="lock-reset" size={64} color="#FFA500" />
                    </View>

                    {/* Title & Subtitle */}
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        No worries! Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    {/* Input Field */}
                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="email-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={setEmail}
                            value={email}
                        />
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.messageContainer}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Success Message */}
                    {message && (
                        <View style={[styles.messageContainer, styles.successContainer]}>
                            <MaterialCommunityIcons name="check-circle" size={16} color="#059669" />
                            <Text style={styles.successText}>{message}</Text>
                        </View>
                    )}

                    {/* Send Button */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        disabled={loading || !email.trim()}
                        onPress={handleSendReset}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="email" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Send Reset Link</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Back Button */}
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={18} color="#6B7280" />
                        <Text style={styles.backText}>Back to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: "center",
        maxWidth: 440,
        width: "100%",
        alignSelf: "center",
    },
    iconContainer: {
        alignSelf: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
        paddingVertical: 16,
    },
    messageContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    successContainer: {
        backgroundColor: "#D1FAE5",
    },
    errorText: {
        color: "#DC2626",
        fontSize: 14,
        fontWeight: "500",
        flex: 1,
    },
    successText: {
        color: "#059669",
        fontSize: 14,
        fontWeight: "500",
        flex: 1,
    },
    button: {
        backgroundColor: "#FFA500",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 6,
    },
    backText: {
        color: "#6B7280",
        fontSize: 15,
        fontWeight: "500",
    },
});