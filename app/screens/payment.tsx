import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function PaymentScreen() {
  const router = useRouter();
  const { rid } = useLocalSearchParams<{ rid?: string }>();
  const exitingRef = useRef(false);
  const navigation = useNavigation();

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== "android") return;
      const onBackPress = () => {
        if (exitingRef.current) return true;
        exitingRef.current = true;
        router.replace("/(tabs)/home");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  // Intercept any back (gesture/system) and route to home
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e: any) => {
      if (exitingRef.current) return;
      e.preventDefault();
      exitingRef.current = true;
      router.replace('/(tabs)/home');
    });
    return sub;
  }, [navigation, router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header / TabBar */}
      <View style={styles.header}>
        <Ionicons
          name="chevron-back"
          size={Math.round(screenWidth * 0.065)}
          color="#FFA500"
          style={styles.backButton}
          onPress={() => {
            if (exitingRef.current) return;
            exitingRef.current = true;
            router.replace("/(tabs)/home");
          }}
        />
        <Text style={styles.headerTitle}>Payment Confirmation</Text>
        <View style={{ width: Math.round(screenWidth * 0.065) }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Payment Info Card */}
        <View style={[styles.paymentCard, { maxWidth: Math.min(screenWidth * 0.95, 420) }]}>
          <Text style={styles.paymentTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <Ionicons name="wallet-outline" size={Math.round(screenWidth * 0.055)} color="#FFA500" />
            <Text style={styles.paymentType}>Gcash</Text>
          </View>
          <Text style={styles.paymentNumber}>09xxxxxxxxx</Text>
        </View>

        {/* QR Image Section */}
        <View style={styles.imageContainer}>
          <View style={styles.qrShadow}>
            <Image
              source={require("../../assets/images/qr-sample.jpg")}
              style={{
                width: Math.min(screenWidth * 0.55, 210),
                height: Math.min(screenWidth * 0.55, 210),
                borderRadius: 15,
                backgroundColor: "#FFFDFC",
              }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.scanText}>
            Scan this QR code with your Gcash app to pay your reservation fee
          </Text>
        </View>

        {/* Separator */}
        <View style={[styles.separator, { width: Math.max(screenWidth * 0.7, 240) }]} />

        {/* Note Section */}
        <View style={[styles.noteContainer, { maxWidth: Math.min(screenWidth * 0.93, 410) }]}>
          <Text style={styles.noteTitle}>Down Payment Confirmation Note:</Text>
          <Text style={styles.noteText}>
            To secure your catering reservation, a <Text style={styles.highlight}>30% down payment</Text> is required. Your booking will only be confirmed once payment is successfully processed.
            {"\n\n"}
            <Text style={styles.warning}>Unpaid reservations may be automatically cancelled.</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.doneButton,
            {
              paddingHorizontal: Math.max(screenWidth * 0.12, 36),
              maxWidth: Math.min(screenWidth * 0.8, 330),
            },
          ]}
          activeOpacity={0.88}
          onPress={() => router.push(rid ? `/screens/receipt?rid=${rid}` : "/screens/receipt")}
        >
          <Ionicons name="checkmark" size={Math.round(screenWidth * 0.055)} color="#fff" />
          <Text style={styles.doneText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F1",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    elevation: 3,
  },
  backButton: {
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFA500",
    letterSpacing: 0.15,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 26,
    position: "relative",
  },
  paymentCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 17,
    padding: 17,
    shadowColor: "#FFA500",
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 28,
    alignItems: "flex-start",
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#86582F",
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  paymentType: {
    fontSize: 16,
    color: "#FFA500",
    fontWeight: "600",
    marginLeft: 8,
  },
  paymentNumber: {
    fontSize: 15,
    color: "#987A50",
    marginLeft: 31,
    marginTop: 2,
    letterSpacing: 0.15,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 25,
    width: "100%",
  },
  qrShadow: {
    shadowColor: "#FFA500",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 17,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 13,
  },
  scanText: {
    fontSize: 14,
    color: "#86582F",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.07,
  },
  separator: {
    height: 1.4,
    backgroundColor: "#EED5AB",
    marginVertical: 22,
    marginTop: 15,
  },
  noteContainer: {
    backgroundColor: "#FFF7DD",
    padding: 15,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
    width: "100%",
    marginBottom: 40,
    marginTop: -10,
    elevation: 2,
  },
  noteTitle: {
    fontWeight: "700",
    color: "#86582F",
    marginBottom: 7,
    letterSpacing: 0.07,
    fontSize: 15,
  },
  highlight: {
    color: "#FFA500",
    fontWeight: "700",
  },
  warning: {
    color: "#E53935",
    fontWeight: "700",
  },
  noteText: {
    color: "#6C5B41",
    fontSize: 14,
    lineHeight: 20,
  },
  doneButton: {
    position: "relative",
    marginTop: -20,
    backgroundColor: "#FFA500",
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#FFA500",
    shadowOpacity: 0.13,
  },
  doneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 7,
    letterSpacing: 0.12,
    textAlign: "center",
  },
});
