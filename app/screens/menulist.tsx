import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { categories } from "../data/categories";
import { foods } from "../data/foods";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 100;

export default function MenuLists() {
  const [selectedCategory, setSelectedCategory] = useState<number>(1);

  const filteredFoods = foods.filter(
    (food) => food.categoryId === selectedCategory
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Our Menu</Text>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isActive = cat.id === selectedCategory;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={styles.categoryCard}
            >
              <Image source={cat.image} style={styles.categoryImage} />
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: isActive ? "#E48C0E" : "#444" },
                  ]}
                >
                  {cat.name}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Food List or "Coming Soon" Notice */}
      {filteredFoods.length === 0 ? (
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.foodCard}>
              <Image source={item.image} style={styles.foodImage} />
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.foodList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF8F2",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4a0d0d",
    marginTop: 20,
    marginBottom: 14,
    textAlign: "center",
  },
  categoryScroll: {
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  categoryCard: {
    alignItems: "center",
    marginRight: 14,
  },
  categoryImage: {
    width: 68,
    height: 68,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  labelContainer: {
    alignItems: "center",
    marginTop: 6,
    height: 24,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  activeIndicator: {
    marginTop: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E48C0E",
  },
  foodList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: "hidden",
  },
  foodImage: {
    width: CARD_HEIGHT,
    height: CARD_HEIGHT,
  },
  foodInfo: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  foodName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3b1b00",
  },
  foodSubtitle: {
    fontSize: 13,
    color: "#825d27",
    marginTop: 3,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30,
  },
  comingSoonText: {
    color: "#DA8B2E",
    fontSize: 22,
    fontWeight: "700",
    opacity: 0.8,
    letterSpacing: 0.6,
  },
});
