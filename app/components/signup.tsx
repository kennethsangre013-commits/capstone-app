import React from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, ScrollView, View, TextInput, Image, TouchableOpacity, Text, Platform, KeyboardAvoidingView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { useAuth } from "../../src/context/AuthContext";

export default function SignupScreen() {

    const [email, setEmail] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");

    const [passwordIsVisible, setPasswordIsVisible] = React.useState<boolean>(false);
    const router = useRouter();
    const { signUp, loading, error } = useAuth();
    const [localError, setLocalError] = useState<string | null>(null);
    const [passwordScore, setPasswordScore] = React.useState<number>(0);

    const getPasswordScore = (pwd: string) => {
        let score = 0;
        if (!pwd) return 0;
        if (pwd.length >= 8) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score++;
        return score;
    };

    const handlePasswordChange = (pwd: string) => {
        setPassword(pwd);
        setPasswordScore(getPasswordScore(pwd));
    };

    const getStrengthProps = (score: number) => {
        if (score === 0) return { text: "Too weak", color: "#B00020" };
        if (score === 1) return { text: "Weak", color: "#F59E0B" };
        if (score === 2) return { text: "Fair", color: "#EAB308" };
        if (score === 3) return { text: "Strong", color: "#10B981" };
        return { text: "Very strong", color: "#059669" };
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1,}}
            >
            <ScrollView
            contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
            }}>

                <View style={styles.curveBackground}>
                     <Image
                        source={require("../../assets/images/ellipse-5.png")}
                        style={styles.curveImage}
                        resizeMode="contain"
                      />
                </View>

                <View style={styles.imageContainer}>
                    <Image 
                    source={require("../../assets/images/chef.png")}
                    style={styles.chefImage}
                    resizeMode="contain"
                    >
                    </Image>
                </View>

                <View style={styles.content}>
                        <Text style={styles.title}>Create Account</Text>
                                      <TouchableOpacity style={styles.loginButton}>
                                          <Text style={styles.loginText}>Already have an account? </Text>
                                          <TouchableOpacity onPress={() => router.push("/components/signin")}>
                                              <Text style={styles.loginButtonHighlight}>Sign in</Text>
                                          </TouchableOpacity>
                                      </TouchableOpacity>
                    
                    <View style={styles.inputContainer}>
                        <View style={styles.icon}>
                            <Feather name="mail" size={22} color="#000" />
                        </View>
                        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} value={email} />
                    </View>
                    
                    <View style={[styles.inputContainer, { marginBottom: 8 }]}>
                        <View style={styles.icon}>
                            <Feather name="lock" size={22} color="#000" />
                        </View>
                        <TextInput style={styles.input} placeholder="Password" secureTextEntry={!passwordIsVisible} onChangeText={handlePasswordChange} value={password} />
                        <TouchableOpacity style={styles.passwordVisibleButton} onPress={() => setPasswordIsVisible(!passwordIsVisible)}>
                            <Feather name={passwordIsVisible ? "eye" : "eye-off"} size={20} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {password ? (
                      <View style={styles.strengthContainer}>
                        <View style={styles.strengthBar}>
                          {[0, 1, 2, 3].map((i) => {
                            const { color } = getStrengthProps(passwordScore);
                            return (
                              <View
                                key={i}
                                style={[
                                  styles.strengthSegment,
                                  { backgroundColor: i < passwordScore ? color : "#E5E7EB" },
                                  i === 3 && { marginRight: 0 },
                                ]}
                              />
                            );
                          })}
                        </View>
                        <Text style={[styles.strengthLabel, { color: getStrengthProps(passwordScore).color }]}>
                          {getStrengthProps(passwordScore).text}
                        </Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.signupButton, loading && { opacity: 0.7 }]}
                      disabled={loading}
                      onPress={async () => {
                        setLocalError(null);
                        if (!email || !password) {
                          setLocalError("Email and password are required.");
                          return;
                        }
                        try {
                          await signUp(email.trim(), password);
                          router.replace("/components/verify-email" as any);
                        } catch {}
                      }}
                    >
                        <Text style={styles.signupText}>{loading ? "Loading..." : "Sign Up"}</Text>
                    </TouchableOpacity>

                    {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    
                    {/* OAuth removed for stability */}
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EBE7E8",
        position: "relative",
    },
    curveBackground: {
        position: "absolute",
        top: -120,
        left: -195,
        width: 459,
        height: 450,
        borderRadius: 234.5,
        overflow: "hidden",
    },
    curveImage: {
        width: "100%",
        height: "100%",
    },
    imageContainer: {
        position: "absolute",
        top: 10,
        left: 130,
        right: 20,
        zIndex: 2,
    },
    chefImage: {
        width: 250,
        height: 250,
    },
    content: {
        paddingHorizontal: 30,
        marginTop: 225,
        zIndex: 2,
    },
    title: {
        fontSize: 40,
        fontWeight: "800",
        marginBottom: 0,
        fontFamily: "Poppins_400Regular",
    },
    loginButton: {
        flexDirection: "row",
        marginBottom: 2,
        alignSelf: "flex-start",
    },
    loginText: {
        fontFamily: "Poppins",
        fontSize: 20,
    },
    loginButtonHighlight: {
        color: "#DA8D00",
        fontSize: 16,
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        position: "relative",
    },
    icon: {
        marginRight: 15,
    },
    input: {
        borderBottomWidth: 1.5,
        borderBottomColor: "#eee",
        fontSize: 16,
        flex: 1,
    },
    passwordVisibleButton: {
        position: "absolute",
        right: 0,
    },
    strengthContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    strengthBar: {
        flex: 1,
        flexDirection: "row",
        marginRight: 10,
    },
    strengthSegment: {
        height: 8,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        flex: 1,
        marginRight: 6,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    errorText: {
        color: "#B00020",
        marginTop: 8,
        marginBottom: 8,
    },
    signupButton: {
        backgroundColor: "#DA8D00",
        padding: 12,
        alignSelf: "flex-end",
        borderRadius: 16,
        marginTop: 6,
        width: 130,
    },
    signupText: {
        fontFamily: "Poppins_400Regular",
        color: "#fff",
        textAlign: "center",
        fontSize: 20,
        fontWeight: "600",
    },
    orContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 12,
    },
    orLine: {
        height: 1,
        backgroundColor: "#797878",
        flex: 1,
    },
    orText: {
        color: "#797878",
        marginRight: 18,
        marginLeft: 18,
        fontSize: 16,
    },
    googleButton: {
        backgroundColor: "#3B141C",
        padding: 14,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    googleButtonText: {
        color: "#fff",
        fontWeight: "500",
        fontSize: 16,
    },
    socialIcon: {
        width: 20.03,
        height: 20.44,
        position: "absolute",
        left: 14,
    },
    facebookButton: {
        backgroundColor: "#3B141C",
        padding: 14,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        marginTop: 12,
    },
    facebookButtonText: {
        color: "#fff",
        fontWeight: "500",
        fontSize: 16,
    }
});