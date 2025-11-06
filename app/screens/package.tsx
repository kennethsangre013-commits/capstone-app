import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import packages from "../data/data1.json";

interface Package {
  name: string;
  prices: string[];
}

export default function PackagesScreen() {
  const renderPackage = ({ item }: { item: Package }) => (
    <View style={styles.packageCard}>
      <Text style={styles.packageName}>{item.name}</Text>
      <View style={styles.divider} />
      {item.prices.map((price, i) => (
        <Text key={i} style={styles.price}>
          {price}
        </Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Packages & Price List</Text>
      </View>

      <View style={styles.content}>
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
  header: {
    paddingVertical: 24,
    alignItems: "center",
  },
  title: {
    color: "#FFB200",
    fontWeight: "bold",
    fontSize: 20,
  },
  content: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  packageCard: {
    backgroundColor: "#FFF",
    flex: 1,
    margin: 6,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  packageName: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  divider: {
    height: 2,
    backgroundColor: "#FFB200",
    marginVertical: 10,
    width: "40%",
    borderRadius: 1,
  },
  price: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    width: "100%",
  },
});