import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { db } from "../../src/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function ReceiptScreen() {
  const router = useRouter();
  const { rid, data: dataParam } = useLocalSearchParams<{ rid?: string; data?: string }>();
  const [reservation, setReservation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const exitingRef = useRef(false);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [savedToFirestore, setSavedToFirestore] = useState(false);
  
  const refetch = useCallback(async () => {
    if (rid) {
      const snap = await getDoc(doc(db, "reservations", String(rid)));
      setReservation(snap.exists() ? (snap.data() as any) : null);
    }
  }, [rid]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If we have dataParam, this is a new reservation - save it to Firestore
        if (dataParam && !savedToFirestore) {
          const parsedData = JSON.parse(decodeURIComponent(dataParam));
          
          // Convert date string back to Date object
          const reservationPayload = {
            ...parsedData,
            date: new Date(parsedData.date),
            status: "pending",
            createdAt: serverTimestamp(),
          };
          
          // Save to Firestore
          const docRef = await addDoc(collection(db, "reservations"), reservationPayload);
          console.log("Reservation saved with ID:", docRef.id);
          
          if (mounted) {
            setReservation(parsedData);
            setSavedToFirestore(true);
          }
        }
        // If we have rid, fetch existing reservation
        else if (rid) {
          const snap = await getDoc(doc(db, "reservations", String(rid)));
          if (mounted) setReservation(snap.exists() ? (snap.data() as any) : null);
        }
      } catch (error) {
        console.error("Error handling reservation:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [rid, dataParam, savedToFirestore]);

  const dateObj = useMemo(() => {
    const d = reservation?.date;
    if (!d) return null;
    // Handle Firestore Timestamp
    if (d?.toDate) return d.toDate();
    // Handle Date object
    if (d instanceof Date) return d;
    // Handle ISO string
    if (typeof d === 'string') return new Date(d);
    return null;
  }, [reservation?.date]);

  const dateText = useMemo(() => (dateObj ? new Date(dateObj).toLocaleDateString() : "–"), [dateObj]);
  const eventTypeText = useMemo(
    () => (Array.isArray(reservation?.occasions) && reservation?.occasions.length ? reservation.occasions.join(", ") : "–"),
    [reservation?.occasions]
  );
  const venueAddress = reservation?.venue?.address || "–";
  const venueMobile = reservation?.venue?.mobile || "–";
  const foods: string[] = Array.isArray(reservation?.foods) ? reservation.foods : [];
  const packName = reservation?.packName || "–";
  const packPrice = reservation?.packPrice || "–";
  const addons: Array<{ name: string; price: number }> = Array.isArray(reservation?.addons) ? reservation.addons : [];
  const packagePriceNum = reservation?.packagePriceNum || 0;
  const addOnsTotal = reservation?.addOnsTotal || 0;
  const downpayment = reservation?.downpayment || 0;
  const totalAmount = reservation?.totalAmount || 0;
  const paymentMethodText = useMemo(() => (reservation?.paymentMethod ? String(reservation.paymentMethod) : "GCash"), [reservation?.paymentMethod]);
  const timeText = useMemo(() => {
    if (typeof reservation?.timeLabel === "string" && reservation.timeLabel) return reservation.timeLabel as string;
    if (dateObj) return new Date(dateObj).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return "–";
  }, [reservation?.timeLabel, dateObj]);

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

  // Intercept any system/gesture back and route to home via replace
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
        <TouchableOpacity onPress={() => {
          if (exitingRef.current) return;
          exitingRef.current = true;
          router.replace("/(tabs)/home");
        }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={async () => {
              setRefreshing(true);
              try { await refetch(); } finally { setRefreshing(false); }
            }} 
          />
        }
      >
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={56} color="#059669" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your reservation has been successfully confirmed
          </Text>
        </View>

        {/* Event Information */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EVENT DETAILS</Text>
          <View style={styles.card}>
            <InfoRow icon="calendar-outline" label="Event Type" value={eventTypeText} />
            <InfoRow icon="time-outline" label="Date & Time" value={`${dateText}${timeText !== "–" ? ` • ${timeText}` : ""}`} />
            <InfoRow icon="location-outline" label="Venue" value={venueAddress} />
            <InfoRow icon="call-outline" label="Contact" value={venueMobile} last />
          </View>
        </View>

        {/* Package & Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PACKAGE</Text>
          <View style={styles.card}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{packName}</Text>
              <Text style={styles.packagePrice}>{packPrice}</Text>
            </View>
            
            {foods.length > 0 && (
              <View style={styles.menuSection}>
                <Text style={styles.menuLabel}>Menu Items</Text>
                {foods.map((food, idx) => (
                  <View key={`${food}-${idx}`} style={styles.menuItem}>
                    <View style={styles.menuDot} />
                    <Text style={styles.menuText}>{food}</Text>
                  </View>
                ))}
              </View>
            )}

            {addons.length > 0 && (
              <View style={styles.addonsSection}>
                <Text style={styles.menuLabel}>Add-ons</Text>
                {addons.map((addon, idx) => (
                  <View key={`${addon.name}-${idx}`} style={styles.addonRow}>
                    <View style={styles.addonLeft}>
                      <View style={styles.addonDot} />
                      <Text style={styles.menuText}>{addon.name}</Text>
                    </View>
                    <Text style={styles.addonPrice}>₱{addon.price?.toLocaleString() || '0'}</Text>
                  </View>
                ))}
                <View style={styles.addonTotalRow}>
                  <Text style={styles.addonTotalLabel}>Add-ons Total:</Text>
                  <Text style={styles.addonTotalValue}>₱{addOnsTotal.toLocaleString()}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT BREAKDOWN</Text>
          <View style={styles.card}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>{paymentMethodText}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Package Price</Text>
              <Text style={styles.paymentValue}>₱{packagePriceNum.toLocaleString()}</Text>
            </View>
            
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: "#059669", fontWeight: "700" }]}>Downpayment (50%)</Text>
              <Text style={[styles.paymentValue, { color: "#059669", fontWeight: "700" }]}>₱{downpayment.toLocaleString()}</Text>
            </View>
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Remaining Balance</Text>
              <Text style={styles.paymentValue}>₱{(packagePriceNum - downpayment).toLocaleString()}</Text>
            </View>
            
            {addOnsTotal > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Add-ons</Text>
                <Text style={styles.paymentValue}>₱{addOnsTotal.toLocaleString()}</Text>
              </View>
            )}
            
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Event Cost</Text>
              <Text style={styles.totalValue}>₱{totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.homeButton} onPress={() => {
          if (exitingRef.current) return;
          exitingRef.current = true;
          router.replace("/(tabs)/home");
        }} activeOpacity={0.8}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          Thank you for choosing Ezekiel Ezaiah Event & Catering Services
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color="#6B7280" style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  successBanner: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  packageName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFA500",
  },
  menuSection: {
    marginTop: 16,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  menuDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFA500",
    marginRight: 12,
  },
  addonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  addonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addonPrice: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 12,
  },
  addonTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  addonTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  addonTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  addonsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  paymentValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFA500",
  },
  homeButton: {
    backgroundColor: "#FFA500",
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerNote: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});