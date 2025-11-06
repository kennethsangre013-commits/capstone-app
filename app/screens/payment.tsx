import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { db } from "../../src/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PaymentScreen() {
  const router = useRouter();
  const { data: dataParam } = useLocalSearchParams<{ data?: string }>();
  const exitingRef = useRef(false);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [reservation, setReservation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (dataParam) {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setReservation(parsedData);
      }
    } catch (error) {
      console.error("Error parsing reservation data:", error);
    } finally {
      setLoading(false);
    }
  }, [dataParam]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-parse data if needed
      if (dataParam) {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setReservation(parsedData);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dataParam]);

  const downpayment = reservation?.downpayment || 0;
  const packagePriceNum = reservation?.packagePriceNum || 0;
  const addOnsTotal = reservation?.addOnsTotal || 0;
  const totalAmount = reservation?.totalAmount || 0;

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Payment Method Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="wallet" size={24} color="#FFA500" />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>
          <Text style={styles.methodName}>GCash</Text>
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
            Scan this QR code using your GCash or E-Wallet
          </Text>
        </View>

        {/* Payment Amount Card */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA500" />
          </View>
        ) : (
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Downpayment Amount (50%)</Text>
            <Text style={styles.amountValue}>₱{downpayment.toLocaleString()}</Text>
            <View style={styles.amountBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Package Price:</Text>
                <Text style={styles.breakdownValue}>₱{packagePriceNum.toLocaleString()}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Remaining Balance:</Text>
                <Text style={styles.breakdownValue}>₱{(packagePriceNum - downpayment).toLocaleString()}</Text>
              </View>
              {addOnsTotal > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Add-ons:</Text>
                  <Text style={styles.breakdownValue}>₱{addOnsTotal.toLocaleString()}</Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.totalBreakdownRow]}>
                <Text style={styles.totalBreakdownLabel}>Total Event Cost:</Text>
                <Text style={styles.totalBreakdownValue}>₱{totalAmount.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Important Note */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <MaterialCommunityIcons name="information" size={20} color="#F59E0B" />
            <Text style={styles.noteTitle}>Notice</Text>
          </View>
          <Text style={styles.noteText}>
            A <Text style={styles.boldText}>50% downpayment</Text> is required to confirm your reservation.
          </Text>
          <Text style={[styles.noteText, { marginTop: 8 }]}>
            Your booking will be confirmed once payment is received.
          </Text>
          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.warningText}>
              Unpaid reservations can't accommodate your event.
            </Text>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.8}
          onPress={() => {
            if (dataParam) {
              router.push(`/screens/receipt?data=${dataParam}`);
            } else {
              router.push("/screens/receipt");
            }
          }}
        >
          <Text style={styles.confirmButtonText}>Continue</Text>
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
    textAlign: "center",
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  amountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 16,
  },
  amountBreakdown: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  totalBreakdownRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalBreakdownLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  totalBreakdownValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFA500",
  },
  noteCard: {
    backgroundColor: "#fff",
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
    color: "#000",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: "green",
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
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "600",
  },
});