import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function AboutUsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Banner Image */}
        <Image
          source={require("../../assets/images/banner.jpg")}
          style={styles.banner}
          resizeMode="cover"
        />
        {/* Logo Circle */}
        <View style={styles.logoCircle}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        {/* Title and Tagline */}
        <Text style={styles.title}>Ezekiel Ezaiah Event & Catering Service </Text>
        <Text style={styles.subtitle}>
          Provides quality and best for you events that will live on
        </Text>
        {/* About Text */}
        <Text style={styles.about}>
          Ezekiel Ezaiah Event & Catering Service  was here to provide you better service that allows you to enjoy and make memories that you will live on.
        </Text>
        {/* Highlights or Mission */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeading}>Why choose us</Text>
          <Text style={styles.listItem}>• Cozy atmosphere & beautiful décor</Text>
          <Text style={styles.listItem}>• Locally-sourced ingredients</Text>
          <Text style={styles.listItem}>• Friendly and caring service</Text>
          <Text style={styles.listItem}>• Event packages & catering available</Text>
        </View>
        {/* Location Image */} 
        <Image
          source={require("../../assets/images/maps.png")}
          style={styles.locationImage}
          resizeMode="cover"
        />
        {/* Location / Contact */}
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Visit or Contact Us:</Text>
          <Text style={styles.contactText}>📍 Ph 5 Blk 54 Lot 2 Centella Homes San Isidro, Rodriguez, Philippines, 1860</Text>
          <Text style={styles.contactText}>☎️ 0915 594 5329</Text>
          <Text style={styles.contactText}>🕗 Mon–Sun: 10am–9pm</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7F3" },
  scroll: { alignItems: "center", paddingBottom: 48 },
  banner: {
    width: width,
    height: width * 0.42,
  },
  logoCircle: {
    marginTop: -50,
    borderRadius: 55,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    width: 110,
    height: 110,
    borderWidth: 2,
    borderColor: "#EDC067",
    elevation: 4,
    shadowColor: "#EDC067",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#87651A",
    marginTop: 20,
    textAlign: "center",
    letterSpacing: 1.1,
  },
  subtitle: {
    fontSize: 15.5,
    color: "#C29434",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
    fontWeight: "600",
  },
  about: {
    fontSize: 16,
    color: "#5F4520",
    textAlign: "center",
    marginHorizontal: 19,
    marginBottom: 24,
    lineHeight: 23,
    letterSpacing: 0.16,
  },
  sectionBox: {
    backgroundColor: "#fff8e3",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    width: "90%",
    marginBottom: 18,
    elevation: 1,
    shadowColor: "#EDC067",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B89017",
    marginBottom: 7,
    textAlign: "center",
  },
  listItem: {
    fontSize: 14.5,
    color: "#533B07",
    marginLeft: 5,
    marginBottom: 3,
    textAlign: "left",
  },
  locationImage: {
    width: "93%",
    height: width * 0.45, // Responsive map/photo
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  contactBox: {
    backgroundColor: "#fff",
    marginTop: 11,
    borderRadius: 10,
    padding: 16,
    width: "90%",
    elevation: 1,
    alignItems: "center",
    shadowColor: "#e6c17e",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  contactTitle: {
    fontWeight: "700",
    fontSize: 15.2,
    color: "#A47B13",
    marginBottom: 2,
  },
  contactText: {
    fontSize: 14.2,
    color: "#493608",
    marginTop: 2,
    textAlign: "center",
    letterSpacing: 0.11,
  },
});
