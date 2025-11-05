import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Animated, } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [sidebarAnim] = useState(new Animated.Value(width));

  const toggleSidebar = () => {
    const toValue = isSidebarVisible ? width : width * 0.3; 
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsSidebarVisible(!isSidebarVisible);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/components/signin");
    } catch (err) {
      console.error("Sign out failed", err);
      alert("Failed to sign out. Try again");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#444" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#777"
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <Feather name="menu" size={26} color="#4a0d0d" />
        </TouchableOpacity>
      </View>

      <Text style={styles.categoriesTitle}>Categories</Text>
      <View style={styles.categoryRow}>
        
        <TouchableOpacity style={styles.categoryButton} onPress={() => router.push("/screens/package")}>
          <MaterialCommunityIcons name="account-group" size={26} color="#4a0d0d" />
          <Text style={styles.categoryText}>Packages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton} onPress={() => router.push("/screens/menulist")}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={26} color="#4a0d0d" />
          <Text style={styles.categoryText}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton} onPress={() => router.push("/screens/schedule")}>
          <MaterialCommunityIcons name="calendar-edit" size={26} color="#4a0d0d" />
          <Text style={styles.categoryText}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryButton} onPress={() => router.push("/screens/reservation")}>
          <MaterialCommunityIcons name="text-box-check-outline" size={26} color="#4a0d0d" />
          <Text style={styles.categoryText}>Book Reservation</Text>
        </TouchableOpacity>
      </View>


      <LinearGradient
        colors={["#c0c0c0", "#6b262e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.feedBackground}
      >
        <ScrollView contentContainerStyle={styles.feedContent}>
          {[
            require("../../assets/images/image1.png"),
            require("../../assets/images/image2.png"),
            require("../../assets/images/image3.png"),
            require("../../assets/images/image4.png"),
          ].map((img, index) => (
            <View key={index} style={styles.postCard}>
              <Image source={img} style={styles.postImage} />
              <View style={styles.reactionBar}>
                <View style={styles.reactionGroup}>
                  <Feather name="heart" size={16} color="#FFB200" />
                  <Text style={styles.reactionText}>99</Text>
                </View>
                <View style={styles.reactionGroup}>
                  <Feather name="message-circle" size={16} color="#FFB200" />
                  <Text style={styles.reactionText}>99</Text>
                </View>
                <MaterialCommunityIcons
                  name="share-outline"
                  size={16}
                  color="#FFB200"
                  style={styles.shareIcon}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>

      <Animated.View
        style={[
          styles.sidebar,
          { left: sidebarAnim }, 
        ]}
      >
        <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
          <Feather name="x" size={20} color="#000" />
        </TouchableOpacity>

         <View style={styles.sideBarMenu}>
            <TouchableOpacity style={styles.sidebarLink} onPress={() => router.push("/(tabs)/home")}>
                 <Feather name="home" size={20} color="#fff" style={styles.sidebarIcon} />
                 <Text style={styles.sidebarLinkText}>Home</Text>
            </TouchableOpacity>

             <TouchableOpacity style={styles.sidebarLink} onPress={() => router.push("/screens/schedule")}>
                 <MaterialCommunityIcons name="file-document-outline" size={20} color="#fff" style={styles.sidebarIcon} />
                 <Text style={styles.sidebarLinkText}>My Reservation</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.sidebarLink} onPress={() => router.push("/(tabs)/profile")}>
                 <MaterialCommunityIcons name="account-circle-outline" size={20} color="#fff" style={styles.sidebarIcon} />
                 <Text style={styles.sidebarLinkText}>My Account</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.sidebarLink} onPress={() => router.push("/screens/about")}>
                 <MaterialCommunityIcons name="information-outline" size={20} color="#fff" style={styles.sidebarIcon} />
                 <Text style={styles.sidebarLinkText}>About us</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.sidebarLink} onPress={() => router.push("/(tabs)/profile")}>
                <Feather name="settings" size={20} color="#fff" style={styles.sidebarIcon} />
                <Text style={styles.sidebarLinkText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#3B141C" 
},
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 40,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 6, 
    color: "#000", 
    fontSize: 15 
},
  menuButton: {
    backgroundColor: "#FFB200",
    borderRadius: 20,
    padding: 8,
  },
  categoriesTitle: {
    color: "#FFB200",
    fontWeight: "bold",
    fontSize: 18,
    marginHorizontal: 20,
    marginTop: 20,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  categoryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB200",
    borderRadius: 20,
    width: 80,
    height: 80,
    padding: 10,
  },
  categoryText: {
    color: "#4a0d0d",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },
  feedBackground: { 
    flex: 1, 
    marginTop: 10, 
    paddingTop: 10 
  },
  feedContent: {
    paddingBottom: 40,
    paddingTop: 40,
    alignItems: "center",
    gap: 16,
  },
  postCard: { 
    width: "80%", 
    overflow: "hidden" 
},
  postImage: { 
    width: "100%", 
    height: 220, 
    borderRadius: 16 
},
  reactionBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 20,
  },
  reactionGroup: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4 
},
  reactionText: { 
    color: "#FFB200", 
    fontWeight: "600" 
},
  shareIcon: { 
    marginLeft: "auto" 
},
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: width * 0.7,
    backgroundColor: "#4a0d0d",
    paddingHorizontal: 25,
    paddingTop: 40,
    justifyContent: "flex-start",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
    borderRadius: 24,
    backgroundColor: "#FFB200"
  },
  sideBarMenu: {
    marginTop: 50,
    gap: 25,
  },
  sidebarLink: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 15,
  },
  sidebarIcon: {
   marginRight: 5,
   width: 22,
   height: 22,
  },
  sidebarLinkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: "#FFB200",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 300,
  },
  signoutText: {
    color: "4A0D0D",
    fontWeight: "700",
    fontSize: 16,
  },
});