import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Image, Animated, TouchableWithoutFeedback } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts, Italianno_400Regular } from "@expo-google-fonts/italianno";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../src/context/AuthContext";

const Index = () => {
  const [fontsLoaded] = useFonts({ Italianno_400Regular, });
  const router = useRouter();
  const { user, initializing } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = React.useState<boolean | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (initializing) return;
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem("onboardingSeen");
      const isSeen = seen === "true";
      setOnboardingSeen(isSeen);
      if (isSeen) {
        router.replace(user ? "/(tabs)/home" : "/components/signin");
      }
    };
    checkOnboarding();
  }, [initializing, user, router]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      if (onboardingSeen === false) {
        router.push("/onboarding");
      }
    });
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.content}>
          <Text style={styles.brandTitle}>
            Ezekiel Ezaiah Event & Catering Services
          </Text>

          <Image
            style={styles.introPic}
            source={require("../assets/images/intro-pic.png")}
          />

          <Text style={styles.subtitle}>Your Event, Our Passion</Text>

          <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          >
          <Animated.View style={[styles.customButton, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Animated.View>
          </TouchableWithoutFeedback>
        </View>
        </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3B141C",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  brandTitle: {
    color: "#fff",
    fontSize: 50,
    fontFamily: "Italianno_400Regular",
    marginBottom: 2,
    textAlign: "center",
  },
  introPic: {
    borderRadius: 6,
    marginVertical: 2,
  },
  subtitle: {
    color: "#ffffff",
    fontFamily: "Italianno_400Regular",
    fontSize: 64,
    textAlign: "center",
    marginBottom: 12,
  },
  customButton: {
    backgroundColor: "#DA8D00",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25, // Round Edge
    borderWidth: 1,
    borderColor: "#000", // Optional border edge
    shadowColor: "#000", // Optional shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android shadow
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default Index;