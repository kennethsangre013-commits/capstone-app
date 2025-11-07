import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthDates(monthOffset: number) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: { date: Date; dateString: string }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    dates.push({ date: d, dateString: formatDate(d) });
  }
  return dates;
}

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const MIN_MONTH_OFFSET = -12;
  const MAX_MONTH_OFFSET = 12;
  const visibleDates = useMemo(() => getMonthDates(selectedMonthOffset), [selectedMonthOffset]);
  const monthLabel = useMemo(() => {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth() + selectedMonthOffset, 1);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [selectedMonthOffset]);

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "reservations"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(40)
    );
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [user?.uid]);

  const reservationDates: string[] = useMemo(
    () =>
      reservations
        .map((r) => {
          const d = r?.date?.toDate ? r.date.toDate() : r?.date instanceof Date ? r.date : null;
          return d ? formatDate(new Date(d)) : null;
        })
        .filter(Boolean) as string[],
    [reservations]
  );

  const selectedReservations = useMemo(
    () =>
      reservations.filter((r) => {
        const d = r?.date?.toDate ? r.date.toDate() : r?.date instanceof Date ? r.date : null;
        return d && selectedDate && formatDate(new Date(d)) === selectedDate;
      }),
    [reservations, selectedDate]
  );

  const handleSelectDate = (ds: string) => {
    setSelectedDate(ds);
  };

  const cancelReservation = (r: any) => {
    if (!r?.id) return;
    if (String(r?.status || "").toLowerCase().includes("cancel")) return;
    Alert.alert(
      "Cancel Reservation",
      "Are you sure you want to cancel this reservation?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelingId(r.id);
              await updateDoc(doc(db, "reservations", String(r.id)), {
                status: "cancelled",
                cancelledAt: serverTimestamp(),
              });
            } catch (e) {
              Alert.alert("Error", "Failed to cancel reservation.");
            } finally {
              setCancelingId(null);
            }
          },
        },
      ]
    );
  };

  const deleteReservation = (r: any) => {
    if (!r?.id) return;
    Alert.alert(
      "Delete Reservation",
      "Are you sure you want to permanently delete this reservation?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelingId(r.id);
              await deleteDoc(doc(db, "reservations", String(r.id)));
            } catch (e) {
              Alert.alert("Error", "Failed to delete reservation.");
            } finally {
              setCancelingId(null);
            }
          },
        },
      ]
    );
  };

  const parseTimeLabel = (label?: string) => {
    if (!label || typeof label !== "string") return { h: 9, m: 0 };
    const m = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return { h: 9, m: 0 };
    let h = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return { h, m: minutes };
  };

  const addReservationToCalendar = async (r: any) => {
    try {
      const perm = await Calendar.requestCalendarPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission Required", "Calendar permission is needed to add events.");
        return;
      }
      const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const target = cals.find((c) => (c as any).allowsModifications) || cals[0];
      if (!target) {
        Alert.alert("No Calendar Available", "No writable calendar found on device.");
        return;
      }
      let start: Date | null = r?.date?.toDate ? r.date.toDate() : r?.date instanceof Date ? r.date : null;
      if (!start) {
        Alert.alert("Invalid Reservation", "Cannot determine reservation date.");
        return;
      }
      start = new Date(start);
      const { h, m } = parseTimeLabel(r?.timeLabel);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const title = `Catering Reservation${r?.packName ? ` - ${r.packName}` : ""}`;
      const notesParts = [] as string[];
      if (Array.isArray(r?.occasions) && r.occasions.length) notesParts.push(`Occasions: ${r.occasions.join(", ")}`);
      if (Array.isArray(r?.foods) && r.foods.length) notesParts.push(`Foods: ${r.foods.join(", ")}`);
      const notes = notesParts.join("\n");
      await Calendar.createEventAsync(target.id, {
        title,
        startDate: start,
        endDate: end,
        location: r?.venue?.address || undefined,
        notes: notes || undefined,
        alarms: Platform.OS === "ios" ? [{ relativeOffset: -30 }] : undefined,
      });
      Alert.alert("Success", "The reservation has been added to your calendar.");
    } catch (e) {
      Alert.alert("Error", "Failed to add event to calendar.");
    }
  };

  const showReservationDetails = (r: any) => {
    const d = r?.date?.toDate ? r.date.toDate() : r?.date instanceof Date ? r.date : null;
    const dateText = d ? new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "–";
    const timeText = r?.timeLabel || "–";
    const packageName = r?.packName || "Package";
    const occasions = Array.isArray(r?.occasions) && r.occasions.length ? r.occasions.join(", ") : "None";
    const foods = Array.isArray(r?.foods) && r.foods.length ? r.foods.join(", ") : "None";
    const venue = r?.venue?.address || "Not specified";
    const status = r?.status || "Pending";

    Alert.alert(
      `${packageName} Details`,
      `Date: ${dateText}\nTime: ${timeText}\nOccasions: ${occasions}\nFoods: ${foods}\nVenue: ${venue}\nStatus: ${status}`,
      [{ text: "OK" }]
    );
  };

  const getStatusColor = (status?: string) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("cancel")) return "#DC2626";
    if (s.includes("confirm")) return "#059669";
    if (s.includes("pending")) return "#F59E0B";
    return "#6B7280";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => setSelectedMonthOffset((v) => Math.max(MIN_MONTH_OFFSET, v - 1))}
              style={styles.monthButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => setSelectedMonthOffset((v) => Math.min(MAX_MONTH_OFFSET, v + 1))}
              style={styles.monthButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={visibleDates}
            keyExtractor={(item) => item.dateString}
            contentContainerStyle={styles.dateList}
            renderItem={({ item }) => {
              const selected = selectedDate === item.dateString;
              const hasRes = reservationDates.includes(item.dateString);
              const dayOfWeek = item.date.toLocaleDateString(undefined, { weekday: "short" });
              const dayOfMonth = item.date.getDate();
              
              return (
                <TouchableOpacity
                  onPress={() => handleSelectDate(item.dateString)}
                  style={[styles.dateCard, selected && styles.dateCardSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayOfWeek, selected && styles.dayOfWeekSelected]}>
                    {dayOfWeek}
                  </Text>
                  <Text style={[styles.dayOfMonth, selected && styles.dayOfMonthSelected]}>
                    {dayOfMonth}
                  </Text>
                  {hasRes && <View style={[styles.indicator, selected && styles.indicatorSelected]} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Selected Date Reservations */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {new Date(selectedDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </Text>
            {selectedReservations.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No reservations for this date</Text>
              </View>
            ) : (
              selectedReservations.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onCancel={() => cancelReservation(r)}
                  onAddToCalendar={() => showReservationDetails(r)}
                  onDelete={() => deleteReservation(r)}
                  isCanceling={cancelingId === r.id}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </View>
        )}

        {/* All Reservations */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL RESERVATIONS</Text>
          {reservations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-remove-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No reservations yet</Text>
            </View>
          ) : (
            reservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onCancel={() => cancelReservation(r)}
                onAddToCalendar={() => showReservationDetails(r)}
                onDelete={() => deleteReservation(r)}
                isCanceling={cancelingId === r.id}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReservationCard({
  reservation,
  onCancel,
  onAddToCalendar,
  onDelete,
  isCanceling,
  getStatusColor
}: {
  reservation: any;
  onCancel: () => void;
  onAddToCalendar: () => void;
  onDelete: () => void;
  isCanceling: boolean;
  getStatusColor: (status?: string) => string;
}) {
  const d = reservation?.date?.toDate ? reservation.date.toDate() : reservation?.date instanceof Date ? reservation.date : null;
  const dateText = d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "–";
  const isCancelled = String(reservation?.status || "").toLowerCase().includes("cancel");
  const statusColor = getStatusColor(reservation?.status);

  return (
    <View style={styles.reservationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.packageName}>{reservation.packName || "Package"}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {reservation.status || "Pending"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{dateText}</Text>
        </View>
        {Array.isArray(reservation.occasions) && reservation.occasions.length > 0 && (
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="party-popper" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{reservation.occasions.join(", ")}</Text>
          </View>
        )}
        {reservation.venue?.address && (
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{reservation.venue.address}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAddToCalendar}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="eye" size={18} color="#FFA500" />
          <Text style={styles.actionButtonText}>See Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, (isCanceling || isCancelled) && styles.actionButtonDisabled]}
          onPress={isCancelled ? onDelete : onCancel}
          disabled={isCanceling}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isCancelled ? "close" : isCancelled ? "close-circle" : "close-circle-outline"}
            size={18}
            color="#DC2626"
          />
          <Text style={[styles.actionButtonText, { color: "#DC2626" }]}>
            {isCancelled ? "Delete" : isCanceling ? "Cancelling..." : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  calendarSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  dateList: {
    paddingHorizontal: 16,
  },
  dateCard: {
    width: 56,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dateCardSelected: {
    backgroundColor: "#FFA500",
    borderColor: "#FFA500",
  },
  dayOfWeek: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  dayOfWeekSelected: {
    color: "#FFFFFF",
  },
  dayOfMonth: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  dayOfMonthSelected: {
    color: "#FFFFFF",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 3,
    backgroundColor: "green",
    marginTop: 4,
  },
  indicatorSelected: {
    backgroundColor: "#FFFFFF",
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
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 12,
  },
  reservationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFA500",
  },
});