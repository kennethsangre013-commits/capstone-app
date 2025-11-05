import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text } from "react-native";

export default function NotificationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <Text style={styles.titleText}>Notifications</Text>
        <Text style={styles.infoText}>
          We are working on to provide best experience to you.{"\n"}
          Coming soon, check later!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3B141C",
  },
  topBar: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 12,
  },
  titleText: {
    fontWeight: "bold",
    color: "#FFB200",
    fontSize: 22,
    marginBottom: 16,
  },
  infoText: {
    color: "#DBB98E",
    fontSize: 15.5,
    textAlign: "center",
    lineHeight: 23,
    fontWeight: "500",
  },
});
