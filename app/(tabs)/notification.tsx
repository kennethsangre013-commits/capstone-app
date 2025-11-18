import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNotifications } from "../../src/context/NotificationContext";
import { useState } from "react";

export default function NotificationScreen() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationDate}>
          {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.titleText}>Notifications</Text>
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={markAllAsRead} style={styles.actionButton}>
              <Text style={styles.actionText}>Mark All Read</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearNotifications} style={styles.actionButton}>
              <MaterialCommunityIcons name="delete-sweep" size={20} color="#DBB98E" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bell-outline" size={64} color="#DBB98E" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>You'll see your booking confirmations here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFB200"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: "#3B141C",
   },
   header: {
     flexDirection: "row",
     justifyContent: "space-between",
     alignItems: "center",
     paddingVertical: 16,
     paddingHorizontal: 20,
     backgroundColor: "#3B141C",
     borderBottomWidth: 1,
     borderBottomColor: "#4A1C24",
   },
   titleText: {
     fontWeight: "bold",
     color: "#FFB200",
     fontSize: 22,
   },
   headerActions: {
     flexDirection: "row",
     alignItems: "center",
     gap: 16,
   },
   actionButton: {
     padding: 8,
   },
   actionText: {
     color: "#DBB98E",
     fontSize: 14,
     fontWeight: "500",
   },
   emptyContainer: {
     flex: 1,
     justifyContent: "center",
     alignItems: "center",
     paddingHorizontal: 32,
   },
   emptyText: {
     color: "#DBB98E",
     fontSize: 18,
     fontWeight: "600",
     marginTop: 16,
     textAlign: "center",
   },
   emptySubtext: {
     color: "#9CA3AF",
     fontSize: 14,
     textAlign: "center",
     marginTop: 8,
   },
   listContainer: {
     padding: 16,
   },
   notificationItem: {
     backgroundColor: "#4A1C24",
     borderRadius: 12,
     padding: 16,
     marginBottom: 12,
     flexDirection: "row",
     alignItems: "center",
   },
   unreadItem: {
     backgroundColor: "#5A2C34",
     borderLeftWidth: 4,
     borderLeftColor: "#FFB200",
   },
   notificationContent: {
     flex: 1,
   },
   notificationTitle: {
     color: "#FFB200",
     fontSize: 16,
     fontWeight: "600",
     marginBottom: 4,
   },
   notificationBody: {
     color: "#DBB98E",
     fontSize: 14,
     lineHeight: 20,
     marginBottom: 8,
   },
   notificationDate: {
     color: "#9CA3AF",
     fontSize: 12,
   },
   unreadDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: "#FFB200",
     marginLeft: 12,
   },
});
