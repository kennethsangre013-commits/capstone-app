import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { db, storage } from "../../src/firebase";
import { doc, setDoc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { ref as storageRef, listAll, deleteObject } from "firebase/storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HeaderTitle } from "@react-navigation/elements";

const AVATAR_SIZE = 88;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [reauthVisible, setReauthVisible] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const deleteUserFirestoreDoc = useCallback(async (uid: string) => {
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch {}
  }, []);

  const deleteAllUserStorage = useCallback(async (uid: string) => {
    try {
      const root = storageRef(storage, `users/${uid}`);
      const walk = async (r: ReturnType<typeof storageRef>) => {
        const { items, prefixes } = await listAll(r);
        await Promise.all(items.map((it) => deleteObject(it).catch(() => {})));
        await Promise.all(prefixes.map((p) => walk(p)));
      };
      await walk(root);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/components/signin");
  }, [authLoading, user]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data = snap.data() as any;
        if (data) {
          setAddress(data.address ? String(data.address) : "");
          setPhone(data.phone ? String(data.phone) : "");
          setPhotoUrl(data.photoUrl ? String(data.photoUrl) : null);
        }
      } catch {}
    })();
  }, [user?.uid]);

  const pickAndUploadImage = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError("Permission required to select an image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets || !result.assets.length) return;
      setUploading(true);
      setPhotoUrl(result.assets[0].uri);
      setSuccessMessage("Photo updated");
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }, []);

  const onSave = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    if (!address || !phone) {
      setError("Address and phone are required.");
      return;
    }
    if (!user) return;
    try {
      setSaving(true);
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        { address, phone, email: user.email || null, photoUrl: photoUrl || null, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSuccessMessage("Profile updated successfully");
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }, [address, phone, photoUrl, user]);

  const onChangePassword = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!user) return;
    try {
      setChangingPassword(true);
      await updatePassword(user, newPassword);
      setNewPassword("");
      setSuccessMessage("Password changed successfully");
    } catch (e: any) {
      setError(e.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, user]);

  const onSignOut = useCallback(async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "default",
          onPress: async () => {
            await signOut();
            router.replace("/components/signin");
          },
        },
      ]
    );
  }, [signOut, router]);

  const onDeleteAccount = useCallback(async () => {
    if (!user) return;
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingAccount(true);
              await deleteUserFirestoreDoc(user.uid);
              await deleteAllUserStorage(user.uid);
              await deleteUser(user);
              await signOut();
              router.replace("/components/signin");
            } catch (e: any) {
              if (e?.code === "auth/requires-recent-login") {
                setReauthPassword("");
                setReauthVisible(true);
              } else {
                setError(e?.message || "Failed to delete account.");
              }
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  }, [user, deleteUserFirestoreDoc, deleteAllUserStorage, signOut, router]);

  const handleConfirmReauthAndDelete = useCallback(async () => {
    if (!user || !user.email) {
      setError("Unable to reauthenticate. No email associated with this account.");
      setReauthVisible(false);
      return;
    }
    try {
      setDeletingAccount(true);
      const cred = EmailAuthProvider.credential(user.email, reauthPassword);
      await reauthenticateWithCredential(user, cred);
      await deleteUserFirestoreDoc(user.uid);
      await deleteAllUserStorage(user.uid);
      await deleteUser(user);
      setReauthVisible(false);
      await signOut();
      router.replace("/components/signin");
    } catch (e: any) {
      setError(e?.message || "Reauthentication failed.");
    } finally {
      setDeletingAccount(false);
      setReauthPassword("");
    }
  }, [user, reauthPassword, deleteUserFirestoreDoc, deleteAllUserStorage, signOut, router]);

  if (authLoading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerText}>Profile</Text>
          </View>

          {/* Profile */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={48} color="#9CA3AF" />
                </View>
              )}
              <TouchableOpacity 
                style={styles.avatarEdit} 
                onPress={pickAndUploadImage} 
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* Messages */}
          {error && (
            <View style={styles.messageContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {successMessage && (
            <View style={styles.messageContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter your address" 
                  placeholderTextColor="#9CA3AF"
                  value={address} 
                  onChangeText={setAddress} 
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter your phone number" 
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad" 
                  value={phone} 
                  onChangeText={setPhone} 
                />
              </View>
              <TouchableOpacity 
                style={[styles.primaryButton, saving && styles.buttonDisabled]} 
                disabled={saving} 
                onPress={onSave}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  secureTextEntry
                  onChangeText={setNewPassword}
                />
              </View>
              <TouchableOpacity 
                style={[styles.primaryButton, changingPassword && styles.buttonDisabled]} 
                disabled={changingPassword} 
                onPress={onChangePassword}
                activeOpacity={0.8}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={onSignOut}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#374151" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.deleteButton, deletingAccount && styles.buttonDisabled]} 
              disabled={deletingAccount} 
              onPress={onDeleteAccount}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color="#DC2626" />
              <Text style={styles.deleteButtonText}>{deletingAccount ? "Deleting..." : "Delete Account"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={reauthVisible}
        onRequestClose={() => setReauthVisible(false)}
      >
        <View style={styles.reauthOverlay}>
          <View style={styles.reauthCard}>
            <Text style={styles.reauthTitle}>Confirm Your Password</Text>
            <Text style={styles.reauthSubtitle}>
              For security, please enter your current password to delete your account.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={reauthPassword}
              onChangeText={setReauthPassword}
            />
            <View style={styles.reauthActions}>
              <TouchableOpacity style={styles.reauthSecondary} onPress={() => setReauthVisible(false)}>
                <Text style={styles.reauthSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reauthPrimary, deletingAccount && styles.buttonDisabled]}
                disabled={deletingAccount || !reauthPassword}
                onPress={handleConfirmReauthAndDelete}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.reauthPrimaryText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerLogo: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "500",
    color: "#111827",
    textAlign: "left",
    marginLeft: 4,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A6EF6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  messageContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  successText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  primaryButton: {
    backgroundColor: "#2A6EF6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  signOutButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  reauthOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  reauthCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  reauthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  reauthSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
  reauthActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  reauthSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  reauthSecondaryText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  reauthPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#DC2626",
  },
  reauthPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});