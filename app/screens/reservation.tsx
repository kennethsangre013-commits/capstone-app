import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text, TouchableOpacity, Modal, Platform, ScrollView, KeyboardAvoidingView, TextInput, ActivityIndicator, BackHandler, Image, FlatList, ToastAndroid, TouchableWithoutFeedback, Alert, RefreshControl } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useReservation } from "../../src/context/ReservationContext";
import { useAuth } from "../../src/context/AuthContext";
import { useNotifications } from "../../src/context/NotificationContext";
import { db } from "../../src/firebase";
import { addDoc, collection, doc, serverTimestamp, setDoc, onSnapshot } from "firebase/firestore";
import { categories } from "../data/categories";
import { foods, type FoodItem } from "../data/foods";
import pkgData from "../data/data1.json";
import * as Notifications from "expo-notifications";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthDates(monthOffset: number, disabled: string[]) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: { date: Date; dateString: string; disabled: boolean }[] = [];
  const disabledSet = new Set(disabled);
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const ds = formatDate(d);
    const isPast = d < todayOnly;
    dates.push({ date: d, dateString: ds, disabled: disabledSet.has(ds) || isPast });
  }
  return dates;
}

// Get unique occasion types from data1.json
export const occasionOptions = Array.from(new Set(pkgData
  .filter(item => !['Inclusions', 'Freebies', 'Add-ons'].includes(item.name))
  .map(item => item.name)
));
const timeOptions: { label: string; h: number; m: number }[] = [
  { label: "10:00 AM", h: 10, m: 0 },
  { label: "11:00 AM", h: 11, m: 0 },
  { label: "1:00 PM", h: 13, m: 0 },
  { label: "4:00 PM", h: 16, m: 0 },
  { label: "6:00 PM", h: 18, m: 0 },
  { label: "7:00 PM", h: 19, m: 0 },
];
// Get pack options based on selected occasion
const getPackOptions = (occasion: string) => {
  const occasionData = pkgData.find(pkg => 
    occasion.toLowerCase().includes(pkg.name.toLowerCase()) || 
    pkg.name.toLowerCase().includes(occasion.toLowerCase())
  );
  
  // Default pack options if no matching occasion is found
  if (!occasionData) {
    return [
      { name: "100 Pax", price: "₱35,000" },
      { name: "70 Pax", price: "₱30,000" },
      { name: "50 Pax", price: "₱25,000" },
      { name: "30 Pax", price: "₱20,000" },
    ];
  }
  
  return occasionData.prices.map(priceStr => {
    const [pax, price] = priceStr.split(' = ');
    return { name: pax, price };
  });
};
const addOnOptions: { name: string; price: number }[] = [
  { name: "Personalized Cake", price: 500 },
  { name: "Event Coordinator", price: 1000 },
  { name: "Projector with slideshow", price: 800 },
  { name: "Smoke Machine", price: 350 },
  { name: "Chocolate Fountain", price: 1500 },
];

export default function ReservationScreen() {
   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
   const [showCancelModal, setShowCancelModal] = useState(false);
   const [showFreebiesModal, setShowFreebiesModal] = useState(false);
   const [saving, setSaving] = useState(false);
   const [isHandlingBack, setIsHandlingBack] = useState(false);
   const router = useRouter();
   const { data, setDate, setOccasions, setFoods, setPack, setVenue, reset } = useReservation();
   const { addNotification } = useNotifications();
  
  // Track the current occasion for pack options
  const [currentOccasion, setCurrentOccasion] = useState<string>(occasionOptions[0]);
  
  // Update current occasion when occasions change
  useEffect(() => {
    if (data.occasions.length > 0) {
      setCurrentOccasion(data.occasions[0]);
    } else {
      setCurrentOccasion(occasionOptions[0]);
    }
  }, [data.occasions]);
  
  // Get pack options based on current occasion
  const packOptions = useMemo(() => {
    if (!currentOccasion) return [];
    
    // Find the occasion data that matches the current occasion
    // This handles case-insensitive matching and partial matches
    const occasionData = pkgData.find(item => 
      item.name.toLowerCase() === currentOccasion.toLowerCase() ||
      currentOccasion.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(currentOccasion.toLowerCase())
    );
    
    if (!occasionData || !occasionData.prices) return [];
    
    // Process the prices array to extract pax and price
    return occasionData.prices.map(priceStr => {
      // Handle different possible formats in the price string
      const [pax, ...priceParts] = priceStr.split('=').map(s => s.trim());
      const price = priceParts.join('=').trim();
      
      // Extract numeric value for calculations
      const numericValue = parseInt(price.replace(/[^0-9]/g, '')) || 0;
      
      return { 
        name: pax, 
        price: price.startsWith('₱') ? price : `₱${price.replace(/[^0-9]/g, '')}`,
        numericValue
      };
    });
  }, [currentOccasion]);
  const { user } = useAuth();
  const [mobile, setMobile] = useState<string>(data.venue?.mobile || "");
  const [address, setAddress] = useState<string>(data.venue?.address || "");
  const [activeCategoryId, setActiveCategoryId] = useState<number>(1);
  const [selectedFoodKeys, setSelectedFoodKeys] = useState<Set<string>>(new Set());
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);
  const [beefPorkSelection, setBeefPorkSelection] = useState<string | null>(null);
  const [pastaVeggiesSelection, setPastaVeggiesSelection] = useState<string | null>(null);
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string | null>(null);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [bookedDateSet, setBookedDateSet] = useState<Set<string>>(new Set());
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const lastBackPressRef = useRef<number>(0);
  const exitingRef = useRef<boolean>(false);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  
  const visibleDates = useMemo(() => getMonthDates(selectedMonthOffset, Array.from(bookedDateSet)), [selectedMonthOffset, bookedDateSet]);
  const MAX_MONTH_OFFSET = 12;
  const monthLabel = useMemo(() => {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth() + selectedMonthOffset, 1);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [selectedMonthOffset]);

  // Single selection for occasion
  const selectOccasion = useCallback((o: string) => {
    // If the same occasion is selected, deselect it
    if (data.occasions[0] === o) {
      setOccasions([]);
      setCurrentOccasion(occasionOptions[0]);
      setPack(null);
    } else {
      // Select the new occasion (single selection only)
      setOccasions([o]);
      setCurrentOccasion(o);
      setPack(null); // Reset pack when changing occasion
      
      // Force update the pack options by toggling the current occasion
      // This ensures the options are refreshed with the new occasion data
      const occasionData = pkgData.find(item => 
        item.name.toLowerCase() === o.toLowerCase() ||
        o.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(o.toLowerCase())
      );
      
      if (occasionData) {
        console.log('Selected occasion:', o);
        console.log('Available packages:', occasionData.prices);
      }
    }
  }, [data.occasions, setOccasions, setPack]);

  const showCancelAlert = useCallback(() => {
    if (exitingRef.current) return;
    Alert.alert(
      "Cancel Reservation?",
      "All your selections will be lost. Are you sure you want to cancel?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            if (exitingRef.current) return;
            exitingRef.current = true;
            reset();
            router.replace("/(tabs)/home");
          },
        },
      ]
    );
  }, [reset, router]);

  const selectPack = useCallback((p: { name: string; price: string }) => {
    setPack(data.pack?.name === p.name ? null : { name: p.name, price: p.price });
  }, [data.pack?.name, setPack]);

  const selectTime = useCallback((opt: { label: string; h: number; m: number }) => {
    const d = new Date(selectedDate);
    d.setHours(opt.h, opt.m, 0, 0);
    setSelectedDate(d);
    setSelectedTimeLabel(opt.label);
  }, [selectedDate]);

  const toggleAddOn = useCallback((addon: { name: string; price: number }) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find(a => a.name === addon.name);
      return exists ? prev.filter((a) => a.name !== addon.name) : [...prev, addon];
    });
  }, []);

  const foodKey = useCallback((item: FoodItem) => `${item.categoryId}:${item.name}`, []);
  
  const isFoodSelected = useCallback((item: FoodItem) => {
    return selectedFoodKeys.has(`${item.categoryId}:${item.name}`);
  }, [selectedFoodKeys]);
  
  const toggleFoodItem = useCallback((item: FoodItem) => {
    const key = `${item.categoryId}:${item.name}`;
    
    setSelectedFoodKeys((prev) => {
      const next = new Set<string>(prev);
      const wasSelected = prev.has(key);
      
      // Handle merged categories: Beef (1) & Pork (2) as one group
      if (item.categoryId === 1 || item.categoryId === 2) {
        // Remove any existing beef or pork selection
        for (const k of Array.from(next)) {
          if (k.startsWith('1:') || k.startsWith('2:')) next.delete(k);
        }
        // Add new selection if it wasn't already selected
        if (!wasSelected) {
          next.add(key);
        }
      }
      // Handle merged categories: Pasta (5) & Veggies (6) as one group
      else if (item.categoryId === 5 || item.categoryId === 6) {
        // Remove any existing pasta or veggies selection
        for (const k of Array.from(next)) {
          if (k.startsWith('5:') || k.startsWith('6:')) next.delete(k);
        }
        // Add new selection if it wasn't already selected
        if (!wasSelected) {
          next.add(key);
        }
      }
      // Handle other categories normally (one per category)
      else {
        const catPrefix = `${item.categoryId}:`;
        for (const k of Array.from(next)) {
          if (k.startsWith(catPrefix)) next.delete(k);
        }
        if (!wasSelected) next.add(key);
      }
      
      const names = Array.from(next).map((k) => k.slice(k.indexOf(":") + 1));
      setFoods(names);
      return next;
    });
    
    // Update selection labels after state update
    if (item.categoryId === 1 || item.categoryId === 2) {
      setBeefPorkSelection((prev) => {
        const wasSelected = selectedFoodKeys.has(key);
        return wasSelected ? null : item.name;
      });
    } else if (item.categoryId === 5 || item.categoryId === 6) {
      setPastaVeggiesSelection((prev) => {
        const wasSelected = selectedFoodKeys.has(key);
        return wasSelected ? null : item.name;
      });
    }
  }, [setFoods, selectedFoodKeys]);

  const filteredFoods = useMemo(() => foods.filter((f) => f.categoryId === activeCategoryId), [activeCategoryId]);

  const freebies = useMemo(() => {
    try {
      const entry = (pkgData as any[]).find((x: any) => x.name === "Freebies");
      return Array.isArray(entry?.prices) ? (entry.prices as string[]) : [];
    } catch {
      return [] as string[];
    }
  }, []);

  const isFormValid = useMemo(() => {
    const hasDate = !!data.date;
    const hasOccasion = data.occasions.length > 0;
    const hasPack = !!data.pack;
    const hasVenue = mobile.trim().length >= 8 && address.trim().length >= 5;
    return hasDate && hasOccasion && hasPack && hasVenue;
  }, [data.date, data.occasions, data.pack, mobile, address]);

  // Calculate package price as number
  const packagePrice = useMemo(() => {
    if (!data.pack?.price) return 0;
    const priceStr = data.pack.price.replace(/[^0-9]/g, '');
    return parseInt(priceStr) || 0;
  }, [data.pack?.price]);

  // Calculate add-ons total
  const addOnsTotal = useMemo(() => {
    return selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
  }, [selectedAddOns]);

  // Calculate downpayment (50% of package only)
  const downpayment = useMemo(() => {
    return Math.round(packagePrice * 0.5);
  }, [packagePrice]);

  // Calculate total (full package + add-ons)
  const totalAmount = useMemo(() => {
    return packagePrice + addOnsTotal;
  }, [packagePrice, addOnsTotal]);

  const handleConfirm = useCallback(async () => {
    if (!user) {
      router.push("/components/signin");
      return;
    }
    if (!data.date || !data.pack) return;
    try {
      setSaving(true);
      // Prepare reservation data to save to Firestore
      const reservationData = {
        userId: user.uid,
        userEmail: user.email || null,
        date: data.date.toISOString(),
        occasions: data.occasions || [],
        foods: data.foods || [],
        packName: data.pack?.name || null,
        packPrice: data.pack?.price || null,
        venue: { mobile, address },
        addons: selectedAddOns,
        timeLabel: selectedTimeLabel,
        packagePriceNum: packagePrice,
        addOnsTotal: addOnsTotal,
        downpayment: downpayment,
        totalAmount: totalAmount,
        paymentMethod: "GCash",
      };

      // Save user contact info
      if (mobile || address) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { phone: mobile || null, address: address || null, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save reservation to Firestore
      const reservationPayload = {
        ...reservationData,
        date: new Date(reservationData.date),
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "reservations"), reservationPayload);

      // Send push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Reservation Confirmed!",
          body: `Your booking for ${data.occasions[0]} on ${selectedDate.toLocaleDateString()} has been confirmed.`,
          data: { reservationId: docRef.id },
        },
        trigger: null, // Show immediately
      });

      // Add to local notifications
      addNotification({
        title: "Reservation Confirmed!",
        body: `Your booking for ${data.occasions[0]} on ${selectedDate.toLocaleDateString()} has been confirmed.`,
        data: { reservationId: docRef.id },
      });

      exitingRef.current = true;
      reset();
      // Pass only the document ID
      router.replace(`/screens/payment?rid=${docRef.id}`);
    } catch (e) {
      console.error("Error saving reservation:", e);
    } finally {
      setSaving(false);
    }
  }, [user, data.date, data.pack, data.occasions, data.foods, mobile, address, selectedAddOns, selectedTimeLabel, packagePrice, addOnsTotal, downpayment, totalAmount, router, reset]);

  const handleConfirmOverCounter = useCallback(async () => {
    if (!user) {
      router.push("/components/signin");
      return;
    }
    if (!data.date || !data.pack) return;
    try {
      setSaving(true);
      // Prepare reservation data to save to Firestore
      const reservationData = {
        userId: user.uid,
        userEmail: user.email || null,
        date: data.date.toISOString(),
        occasions: data.occasions || [],
        foods: data.foods || [],
        packName: data.pack?.name || null,
        packPrice: data.pack?.price || null,
        venue: { mobile, address },
        addons: selectedAddOns,
        timeLabel: selectedTimeLabel,
        paymentMethod: "Over the Counter",
        packagePriceNum: packagePrice,
        addOnsTotal: addOnsTotal,
        downpayment: downpayment,
        totalAmount: totalAmount,
      };

      // Save user contact info
      if (mobile || address) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { phone: mobile || null, address: address || null, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save reservation to Firestore
      const reservationPayload = {
        ...reservationData,
        date: new Date(reservationData.date),
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "reservations"), reservationPayload);

      // Send push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Reservation Confirmed!",
          body: `Your booking for ${data.occasions[0]} on ${selectedDate.toLocaleDateString()} has been confirmed.`,
          data: { reservationId: docRef.id },
        },
        trigger: null, // Show immediately
      });

      // Add to local notifications
      addNotification({
        title: "Reservation Confirmed!",
        body: `Your booking for ${data.occasions[0]} on ${selectedDate.toLocaleDateString()} has been confirmed.`,
        data: { reservationId: docRef.id },
      });

      exitingRef.current = true;
      reset();
      // Pass only the document ID
      router.replace(`/screens/receipt?rid=${docRef.id}`);
    } catch (e) {
      console.error("Error saving reservation:", e);
    } finally {
      setSaving(false);
    }
  }, [user, data.date, data.pack, data.occasions, data.foods, mobile, address, selectedAddOns, selectedTimeLabel, packagePrice, addOnsTotal, downpayment, totalAmount, router, reset]);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== "android") return;
      const onBackPress = () => {
        if (exitingRef.current) return true;
        // If modal is open, close it and consume the event
        if (showCancelModal) {
          setShowCancelModal(false);
          return true;
        }
        if (showFreebiesModal) {
          setShowFreebiesModal(false);
          return true;
        }
        if (showSummaryModal) {
          setShowSummaryModal(false);
          return true;
        }
        // Double press to open native confirm alert
        const now = Date.now();
        if (now - lastBackPressRef.current < 1500) {
          // Show native confirmation alert
          showCancelAlert();
          return true;
        }
        lastBackPressRef.current = now;
        ToastAndroid.show("Press back again to cancel", ToastAndroid.SHORT);
        return true; // consume event
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [showCancelModal, reset, router])
  );

  // Block default navigation (gesture/back) and show native alert instead
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e: any) => {
      if (exitingRef.current) return;
      // If any modal is visible, just close it and block leaving
      if (showCancelModal || showFreebiesModal || showSummaryModal) {
        e.preventDefault();
        setShowCancelModal(false);
        setShowFreebiesModal(false);
        setShowSummaryModal(false);
        return;
      }
      // Prevent leaving and show native alert
      e.preventDefault();
      showCancelAlert();
    });
    return sub;
  }, [navigation, showCancelModal, showFreebiesModal, showSummaryModal, showCancelAlert]);

  useEffect(() => {
    const selectedStr = formatDate(selectedDate);
    if (bookedDateSet.has(selectedStr)) {
      const list = getMonthDates(selectedMonthOffset, Array.from(bookedDateSet));
      const firstEnabled = list.find((d) => !d.disabled);
      if (firstEnabled) setSelectedDate(firstEnabled.date);
    }
  }, [bookedDateSet, selectedMonthOffset, selectedDate]);

  useEffect(() => { 
    setDate(selectedDate); 
  }, [selectedDate, setDate]);
  
  useEffect(() => { 
    setVenue({ mobile, address }); 
  }, [mobile, address, setVenue]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), (snapshot) => {
      const next = new Set<string>();
      snapshot.forEach((docSnap) => {
        const rd: any = docSnap.data();
        const status = (rd?.status ?? "pending").toString().toLowerCase();
        if (status === "cancelled" || status === "canceled") return;
        
        const val = rd?.date;
        let d: Date | null = null;
        if (val?.toDate) d = val.toDate();
        else if (val instanceof Date) d = val;
        else if (typeof val === "string") d = new Date(val);
        else if (typeof val === "number") d = new Date(val);
        else if (val?.seconds) d = new Date(val.seconds * 1000);
        
        if (d) next.add(formatDate(d));
      });
      setBookedDateSet(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const next = new Set<string>();
    const seen = new Set<number>();
    for (const item of foods) {
      if (data.foods.includes(item.name) && !seen.has(item.categoryId)) {
        next.add(`${item.categoryId}:${item.name}`);
        seen.add(item.categoryId);
      }
    }
    setSelectedFoodKeys(next);
  }, [data.foods]);

  useEffect(() => {
    const list = getMonthDates(selectedMonthOffset, Array.from(bookedDateSet));
    const selectedStr = formatDate(selectedDate);
    if (!list.some((d) => d.dateString === selectedStr)) {
      const firstEnabled = list.find((d) => !d.disabled) || list[0];
      if (firstEnabled) setSelectedDate(firstEnabled.date);
    }
  }, [selectedMonthOffset, bookedDateSet, selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      >
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (exitingRef.current) return;
            showCancelAlert();
          }} 
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Reservation</Text>
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
              try {
                // Reset form state and defaults
                setSelectedMonthOffset(0);
                setSelectedDate(new Date());
                setSelectedTimeLabel(null);
                setSelectedAddOns([]);
                setSelectedFoodKeys(new Set());
                setActiveCategoryId(1);
                setMobile("");
                setAddress("");
                reset();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
      >
        {/* Date Selection */}
        <Section title="Select Date" icon="calendar">
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => setSelectedMonthOffset((v) => Math.max(0, v - 1))}
              disabled={selectedMonthOffset <= 0}
              style={[styles.monthButton, selectedMonthOffset <= 0 && styles.monthButtonDisabled]}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color={selectedMonthOffset <= 0 ? "#D1D5DB" : "#111827"} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => setSelectedMonthOffset((v) => Math.min(MAX_MONTH_OFFSET, v + 1))}
              disabled={selectedMonthOffset >= MAX_MONTH_OFFSET}
              style={[styles.monthButton, selectedMonthOffset >= MAX_MONTH_OFFSET && styles.monthButtonDisabled]}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color={selectedMonthOffset >= MAX_MONTH_OFFSET ? "#D1D5DB" : "#111827"} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={visibleDates}
            keyExtractor={(item) => item.dateString}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
            renderItem={({ item }) => (
              <DateChip item={item} selectedDate={selectedDate} onPress={setSelectedDate} />
            )}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </Section>

        {/* Time Selection */}
        <MemoizedSection title="Select Time" icon="clock-outline">
          <View style={styles.chipContainer}>
            {timeOptions.map((t) => (
              <ChipButton 
                key={t.label} 
                label={t.label} 
                active={selectedTimeLabel === t.label}
                onPress={() => selectTime(t)}
              />
            ))}
          </View>
        </MemoizedSection>

        {/* Occasion */}
        <MemoizedSection title="Event Type" icon="party-popper">
          <View style={styles.chipContainer}>
            {occasionOptions.map((o) => (
              <ChipButton 
                key={o} 
                label={o} 
                active={data.occasions.includes(o)}
                onPress={() => selectOccasion(o)}
              />
            ))}
          </View>
        </MemoizedSection>

        {/* Food Selection */}
        <Section title="Menu Selection" icon="food">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {categories.map((cat) => {
              const active = activeCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setActiveCategoryId(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.foodGrid}>
            {filteredFoods.map((item) => {
              const selected = isFoodSelected(item);
              return (
                <TouchableOpacity
                  key={`${item.categoryId}-${item.name}`}
                  style={[styles.foodCard, selected && styles.foodCardSelected]}
                  onPress={() => toggleFoodItem(item)}
                  activeOpacity={0.9}
                >
                  <Image source={item.image} style={styles.foodImage} />
                  {selected && (
                    <View style={styles.foodCheck}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#FFA500" />
                    </View>
                  )}
                  <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                  {!!item.subtitle && <Text style={styles.foodSubtitle} numberOfLines={2}>{item.subtitle}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Package Selection */}
        <Section title="Select Package" icon="package-variant">
          {currentOccasion ? (
            <>
              <Text style={styles.selectedOccasionText}>
                Packages for: <Text style={styles.occasionName}>{currentOccasion}</Text>
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.packageList}
              >
                {packOptions.length > 0 ? (
                  packOptions.map((p) => (
                    <TouchableOpacity
                      key={p.name}
                      style={[styles.packageCard, data.pack?.name === p.name && styles.packageCardSelected]}
                      onPress={() => selectPack(p)}
                      activeOpacity={0.9}
                    >
                      {data.pack?.name === p.name && (
                        <View style={styles.packageCheck}>
                          <MaterialCommunityIcons name="check-circle" size={24} color="#FFA500" />
                        </View>
                      )}
                      <Text style={styles.packageName}>{p.name}</Text>
                      <Text style={styles.packagePrice}>{p.price}</Text>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setShowFreebiesModal(true);
                        }} 
                        style={styles.freebiesButton}
                      >
                        <Text style={styles.freebiesText}>View Inclusions</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noPackagesContainer}>
                    <Text style={styles.noPackagesText}>No packages available for this event type</Text>
                  </View>
                )}
              </ScrollView>
            </>
          ) : (
            <View style={styles.selectOccasionPrompt}>
              <Text style={styles.selectOccasionText}>Please select an event type first</Text>
            </View>
          )}
        </Section>

        {/* Add-ons */}
        <Section title="Add-ons (Optional)" icon="plus-circle-outline">
          <View style={styles.chipContainer}>
            {addOnOptions.map((o) => {
              const active = selectedAddOns.some(a => a.name === o.name);
              return (
                <TouchableOpacity
                  key={o.name}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleAddOn(o)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {o.name} • ₱{o.price.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Venue Details */}
        <Section title="Venue Details" icon="map-marker">
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="phone" size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={mobile}
              maxLength={13}
              onChangeText={setMobile}
            />
          </View>
          <View style={[styles.inputContainer, { alignItems: "flex-start", minHeight: 80 }]}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" style={{ marginTop: 12 }} />
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: "top", paddingTop: 12 }]}
              placeholder="Complete Address"
              placeholderTextColor="#9CA3AF"
              multiline
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </Section>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.reviewButton, !isFormValid && styles.buttonDisabled]}
          onPress={() => setShowSummaryModal(true)}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewButtonText}>Review Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCancelModal(true)} activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Summary Modal */}
      <Modal visible={showSummaryModal} transparent animationType="slide" onRequestClose={() => setShowSummaryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.summaryModalContent]}>
            <View style={styles.summaryModalHeader}>
              <Text style={styles.modalTitle}>Booking Summary</Text>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.summaryModalScroll} showsVerticalScrollIndicator={false}>
              <SummaryRow label="Date" value={selectedDate.toLocaleDateString()} />
              <SummaryRow label="Time" value={selectedTimeLabel || "Not selected"} />
              <SummaryRow label="Event Type" value={data.occasions.join(", ") || "Not selected"} />
              <SummaryRow label="Package" value={`${data.pack?.name || "Not selected"} - ${data.pack?.price || "₱0"}`} />
              {beefPorkSelection && <SummaryRow label="Beef/Pork Choice" value={beefPorkSelection} />}
              {pastaVeggiesSelection && <SummaryRow label="Pasta/Veggies Choice" value={pastaVeggiesSelection} />}
              <SummaryRow label="Menu Items" value={`${data.foods.length} selected`} />
              {selectedAddOns.length > 0 && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
                  <Text style={[styles.summaryLabel, { marginBottom: 8 }]}>Add-ons:</Text>
                  {selectedAddOns.map((addon, idx) => (
                    <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                      <Text style={styles.summaryLabel}>  • {addon.name}</Text>
                      <Text style={styles.summaryValue}>₱{addon.price.toLocaleString()}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
                    <Text style={styles.summaryLabel}>Add-ons Subtotal:</Text>
                    <Text style={styles.summaryValue}>₱{addOnsTotal.toLocaleString()}</Text>
                  </View>
                </View>
              )}
              <SummaryRow label="Mobile" value={mobile || "Not provided"} />
              <SummaryRow label="Address" value={address || "Not provided"} />
              
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: "#E5E7EB" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={styles.summaryLabel}>Downpayment:</Text>
                  <Text style={[styles.summaryValue, { color: "#059669", fontWeight: "700" }]}>₱{downpayment.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={styles.summaryLabel}>Remaining Balance:</Text>
                  <Text style={styles.summaryValue}>₱{(packagePrice - downpayment).toLocaleString()}</Text>
                </View>
                {addOnsTotal > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={styles.summaryLabel}>Add-ons:</Text>
                    <Text style={styles.summaryValue}>₱{addOnsTotal.toLocaleString()}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.summaryTotal}>
                <Text style={styles.totalLabel}>Total Event Cost</Text>
                <Text style={styles.totalValue}>₱{totalAmount.toLocaleString()}</Text>
              </View>
            </ScrollView>

            <View style={styles.summaryModalActions}>
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.buttonDisabled, { marginHorizontal: 0, marginTop: 0 }]}
                onPress={() => {
                  setShowSummaryModal(false);
                  handleConfirm();
                }}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continue to Payment</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, saving && styles.buttonDisabled, { marginHorizontal: 0, marginTop: 12 }]}
                onPress={() => {
                  setShowSummaryModal(false);
                  handleConfirmOverCounter();
                }}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFA500" size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Pay Over the Counter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal 
        visible={showCancelModal} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowCancelModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCancelModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Cancel Reservation?</Text>
                <Text style={styles.modalMessage}>All your selections will be lost. Are you sure you want to cancel?</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButtonSecondary} 
                    onPress={() => setShowCancelModal(false)} 
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={() => {
                      setShowCancelModal(false);
                      reset();
                      router.replace("/(tabs)/home");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Yes, Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Freebies Modal */}
      <Modal visible={showFreebiesModal} transparent animationType="fade" onRequestClose={() => setShowFreebiesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Package Inclusions</Text>
            <ScrollView style={styles.freebiesList}>
              {freebies.map((item, idx) => (
                <View key={`freebie-${idx}`} style={styles.freebieItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#059669" />
                  <Text style={styles.freebieText}>{item}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButtonClose} onPress={() => setShowFreebiesModal(false)} activeOpacity={0.7}>
              <Text style={styles.modalButtonCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#FFA500" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const MemoizedSection = memo(Section);

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const MemoizedSummaryRow = memo(SummaryRow);

const DateChip = memo(({ item, selectedDate, onPress }: { 
  item: { date: Date; dateString: string; disabled: boolean }; 
  selectedDate: Date; 
  onPress: (date: Date) => void;
}) => {
  const selected = formatDate(selectedDate) === item.dateString;
  return (
    <TouchableOpacity
      disabled={item.disabled}
      onPress={() => onPress(item.date)}
      style={[styles.dateChip, selected && styles.dateChipSelected, item.disabled && styles.dateChipDisabled]}
      activeOpacity={0.7}
    >
      <Text style={[styles.dateDay, selected && styles.dateDaySelected, item.disabled && styles.dateDayDisabled]}>
        {item.date.toLocaleDateString(undefined, { weekday: "short" })}
      </Text>
      <Text style={[styles.dateNumber, selected && styles.dateNumberSelected, item.disabled && styles.dateNumberDisabled]}>
        {item.date.getDate()}
      </Text>
    </TouchableOpacity>
  );
});

const ChipButton = memo(({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
});

const FoodCard = memo(({ item, selected, onPress }: { 
  item: FoodItem; 
  selected: boolean; 
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      style={[styles.foodCard, selected && styles.foodCardSelected]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={item.image} style={styles.foodImage} />
      {selected && (
        <View style={styles.foodCheck}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFA500" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
        {!!item.subtitle && <Text style={styles.foodSubtitle} numberOfLines={2}>{item.subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
});

const PackageCard = memo(({ pack, selected, onSelect, onViewFreebies }: { 
  pack: { name: string; price: string }; 
  selected: boolean; 
  onSelect: () => void;
  onViewFreebies: () => void;
}) => {
  return (
    <TouchableOpacity
      style={[styles.packageCard, selected && styles.packageCardSelected]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      {selected && (
        <View style={styles.packageCheck}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFA500" />
        </View>
      )}
      <Text style={styles.packageName}>{pack.name}</Text>
      <Text style={styles.packagePrice}>{pack.price}</Text>
      <TouchableOpacity onPress={onViewFreebies} style={styles.freebiesButton}>
        <Text style={styles.freebiesText}>View Inclusions</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  monthButtonDisabled: {
    opacity: 0.3,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  dateList: {
    paddingVertical: 4,
  },
  dateChip: {
    width: 60,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  dateChipSelected: {
    backgroundColor: "#FFA500",
    borderColor: "#FFA500",
  },
  dateChipDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    opacity: 0.5,
  },
  dateDay: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  dateDaySelected: {
    color: "#FFFFFF",
  },
  dateDayDisabled: {
    color: "#D1D5DB",
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  dateNumberSelected: {
    color: "#FFFFFF",
  },
  dateNumberDisabled: {
    color: "#D1D5DB",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: "#FFA500",
    borderColor: "#FFA500",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  categoryList: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#FFA500",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  foodGrid: {
    gap: 12,
  },
  foodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  foodCardSelected: {
    borderColor: "#FFA500",
    backgroundColor: "#FFF7ED",
  },
  foodImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  foodCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    flex: 1,
  },
  foodSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  packageList: {
    paddingVertical: 4,
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  selectedOccasionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
  },
  occasionName: {
    fontWeight: '600',
    color: '#333',
  },
  noPackagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minWidth: '100%',
  },
  noPackagesText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  selectOccasionPrompt: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectOccasionText: {
    color: '#666',
    fontStyle: 'italic',
  },
  packageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    minWidth: 140,
    marginRight: 12,
    position: "relative",
  },
  packageCardSelected: {
    borderColor: "#FFA500",
    backgroundColor: "#FFF7ED",
  },
  packageCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFA500",
    marginBottom: 12,
  },
  freebiesButton: {
    paddingVertical: 6,
  },
  freebiesText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 12,
    marginLeft: 12,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFA500",
  },
  reviewButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },
  reviewButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#FFA500",
  },
  secondaryButtonText: {
    color: "#FFA500",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  freebiesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  freebieItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  freebieText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  modalButtonClose: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCloseText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  summaryModalContent: {
    maxHeight: "85%",
    paddingBottom: 8,
  },
  summaryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryModalScroll: {
    maxHeight: 400,
    marginBottom: 20,
  },
  summaryModalActions: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});