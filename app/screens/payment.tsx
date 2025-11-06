import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export default function PaymentScreen() {
  const router = useRouter();
  const { rid } = useLocalSearchParams<{ rid?: string }>();
  const exitingRef = useRef(false);
  const navigation = useNavigation();

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (exitingRef.current) return;
            exitingRef.current = true;
            router.replace("/(tabs)/home");
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Method Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="wallet" size={24} color="#FFA500" />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>
          <Text style={styles.methodName}>GCash</Text>
          <Text style={styles.accountNumber}>09xxxxxxxxx</Text>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <Image
              source={require("../../assets/images/qr-sample.jpg")}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.qrInstruction}>
            Scan this QR code using your GCash app
          </Text>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <MaterialCommunityIcons name="information" size={20} color="#F59E0B" />
            <Text style={styles.noteTitle}>Important</Text>
          </View>
          <Text style={styles.noteText}>
            A <Text style={styles.boldText}>30% down payment</Text> is required to confirm your reservation.
          </Text>
          <Text style={[styles.noteText, { marginTop: 8 }]}>
            Your booking will be confirmed once payment is received.
          </Text>
          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.warningText}>
              Unpaid reservations may be cancelled
            </Text>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.8}
          onPress={() => router.push(rid ? `/screens/receipt?rid=${rid}` : "/screens/receipt")}
        >
          <Text style={styles.confirmButtonText}>I've Made the Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  methodName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrInstruction: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
  },
  noteText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: "#F59E0B",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    gap: 6,
  },
  warningText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});