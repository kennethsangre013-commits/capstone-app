import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { LinearGradient } from "expo-linear-gradient";
import * as Asset from "expo-asset";

const { width, height } = Dimensions.get("window");

const pages = [
  {
    image: require("../assets/images/onboarding1.jpg"),
    title: "Book with us today",
    subtitle: "Let's Make Every",
    description: "Moment Unforgettable",
  },
  {
    image: require("../assets/images/onboard2.png"),
    title: "",
    subtitle: "We Serve with Heart",
    description: "You Receive with Joy.",
  },
  {
    image: require("../assets/images/onboard3.png"),
    title: "",
    subtitle: "Cooking Memories One",
    description: "Dish at a time.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef();
  const [currentPage, setCurrentPage] = useState(0);
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold });
  const insets = useSafeAreaInsets(); // 👈 dynamically handles notches and bottom nav

  useEffect(() => {
    pages.forEach((page) => Asset.Asset.fromModule(page.image).downloadAsync());
  }, []);

  const handleNext = async () => {
    if (currentPage < pages.length - 1) {
      scrollViewRef.current.scrollTo({ x: width * (currentPage + 1), animated: true });
    } else {
      // Mark onboarding as completed
      await AsyncStorage.setItem("onboardingSeen", "true");
      router.replace(user ? "/(tabs)/home" : "/components/signin");
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed when skipped
    await AsyncStorage.setItem("onboardingSeen", "true");
    router.replace(user ? "/(tabs)/home" : "/components/signin");
  };

  const handleScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(index);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 10 }]} // 👈 respects notch area
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {pages.map((item, index) => (
          <View key={index} style={styles.pageContainer}>
            <ImageBackground
              source={item.image}
              style={styles.imageBackground}
              resizeMode="cover"
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.2)", "rgba(58,12,12,0.85)"]}
                style={styles.gradient}
              />

              <View style={[styles.textContainer, { paddingBottom: insets.bottom + 140 }]}>
                {/* 👆 pushes content up above the nav bar */}
                {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </ImageBackground>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={[styles.pagination, { bottom: insets.bottom + 100 }]}>
        {pages.map((_, i) => {
          const opacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          const scale = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Next / Get Started Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.nextButton, { bottom: insets.bottom + 30 }]} // 👈 adjusts dynamically
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>
          {currentPage === pages.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  pageContainer: {
    width,
    height,
    justifyContent: "center",
  },
  imageBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 30,
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 24,
    color: "#FFB200",
    fontFamily: "Poppins_400Regular",
    marginBottom: 6,
  },
  description: {
    fontSize: 22,
    color: "#f1f1f1",
    fontFamily: "Poppins_400Regular",
  },
  skipButton: {
    position: "absolute",
    right: 25,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 15,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  pagination: {
    position: "absolute",
    flexDirection: "row",
    alignSelf: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFB200",
  },
  nextButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#FFB200",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 25,
  },
  nextButtonText: {
    color: "#3B141C",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
});
