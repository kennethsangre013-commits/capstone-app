import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  BackHandler,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { db, auth } from "../../src/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export default function SigninScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordIsVisible, setPasswordIsVisible] = React.useState(false);
  const router = useRouter();
  const { signIn, loading, error } = useAuth();
  const navigation = useNavigation();
  const exitingRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== "android") return;
      const onBackPress = () => {
        // Block going back into previous (possibly protected) screens
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [])
  );

  React.useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e: any) => {
      if (exitingRef.current) return;
      // Prevent leaving Sign In via back/gesture into prior stack
      e.preventDefault();
    });
    return sub;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Curve Background */}
          <View style={styles.curveBackground}>
            <Image
              source={require("../../assets/images/ellipse-5.png")}
              style={styles.curveImage}
              resizeMode="contain"
            />
          </View>

          {/* Chef image */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/chef.png")}
              style={styles.chefImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Login</Text>

            <View style={styles.registerButton}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => { exitingRef.current = true; router.push("/components/signup"); }}>
                <Text style={styles.registerButtonHighlight}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.icon}>
                <Feather name="mail" size={22} color="#000" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter email or phone number"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.icon}>
                <Feather name="lock" size={22} color="#000" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                secureTextEntry={!passwordIsVisible}
                onChangeText={setPassword}
                value={password}
              />
              <TouchableOpacity
                style={styles.passwordVisibleButton}
                onPress={() => setPasswordIsVisible(!passwordIsVisible)}
              >
                <Feather
                  name={passwordIsVisible ? "eye" : "eye-off"}
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => { exitingRef.current = true; router.push("/components/forgot-password"); }}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              disabled={loading}
              onPress={async () => {
                try {
                  await signIn(email.trim(), password);
                  const u = auth.currentUser;
                  if (u && !u.emailVerified) {
                    exitingRef.current = true;
                    router.replace("/components/verify-email" as any);
                    return;
                  }
                  const uid = u?.uid;
                  if (uid) {
                    try {
                      const ref = doc(db, "users", uid);
                      const snap = await getDoc(ref);
                      const data = snap.data();
                      const incomplete = !data || !data.address || !data.phone;
                      if (incomplete) {
                        exitingRef.current = true;
                        router.replace("/components/complete-profile");
                      } else {
                        exitingRef.current = true;
                        router.replace("/(tabs)/home");
                      }
                    } catch {
                      exitingRef.current = true;
                      router.replace("/components/complete-profile");
                    }
                  } else {
                    exitingRef.current = true;
                    router.replace("/(tabs)/home");
                  }
                } catch {}
              }}
            >
              <Text style={styles.loginText}>{loading ? "Loading..." : "Login"}</Text>
            </TouchableOpacity>

            {/* OAuth temporarily disabled for debugging */}
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
    marginTop: 100,
    zIndex: 3,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    marginBottom: 8,
    fontFamily: "Poppins_400Regular",
  },
  registerButton: {
    flexDirection: "row",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  registerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 20,
  },
  registerButtonHighlight: {
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
    flex: 1,
    paddingBottom: 10,
    borderBottomColor: "#eee",
    fontSize: 16,
  },
  passwordVisibleButton: {
    position: "absolute",
    right: 0,
  },
  errorText: {
    color: "#B00020",
    marginTop: -10,
    marginBottom: 8,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3662AA",
  },
  loginButton: {
    backgroundColor: "#DA8D00",
    padding: 12,
    alignSelf: "flex-end",
    borderRadius: 16,
    marginTop: 14,
    width: 130,
  },
  loginText: {
    fontFamily: "Poppins_400Regular",
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
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
    fontSize: 14,
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
  },
});
