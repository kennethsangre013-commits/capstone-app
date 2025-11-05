import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import packages from "../data/data1.json"; // JSON data

// Define the structure of a package item
interface Package {
  name: string;
  prices: string[];
}

export default function PackagesScreen() {
  const renderPackage = ({ item }: { item: Package }) => (
    <View style={styles.packageCard}>
      <Text style={styles.packageCategoryTitle}>{item.name}</Text>
      <View style={styles.divider} />
      {item.prices.map((price, i) => (
        <Text key={i} style={styles.packagePriceText}>
          {price}
        </Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <Text style={styles.packagesTitle}>Packages & Price List</Text>
      </View>

      <View style={styles.scrollWrapper}>
        <FlatList
          data={packages}
          renderItem={renderPackage}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingVertical: 40,
    alignItems: "center",
  },
  packagesTitle: {
    color: "#FFB200",
    fontWeight: "bold",
    fontSize: 20,
  },
  scrollWrapper: {
    flex: 1,
    backgroundColor: "#FAF6F1", // softer off-white for a modern feel
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 15,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 44,
  },
  row: {
    justifyContent: "space-around",
    marginBottom: 12,
  },
  packageCard: {
    backgroundColor: "#FFF",
    flex: 1,
    margin: 8,
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#FFE6B7",
    minHeight: 130,
    transitionDuration: "0.18s", // for web, optional
  },
  packageCategoryTitle: {
    color: "#86582F",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.05,
  },
  divider: {
    height: 3,
    backgroundColor: "#FFB200",
    marginVertical: 11,
    width: "35%",
    alignSelf: "center",
    borderRadius: 2,
  },
  packagePriceText: {
    color: "#4a0d0d",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 3,
    backgroundColor: "#FFF7E1",
    padding: 8,
    borderRadius: 8,
    width: "92%",
    marginHorizontal: 2,
  },
});
