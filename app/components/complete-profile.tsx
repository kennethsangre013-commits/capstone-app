import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import * as DocumentPicker from "expo-document-picker";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/components/signin");
    }
  }, [authLoading, user]);

  React.useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data = snap.data() as any;
        if (data) {
          if (data.address) setAddress(String(data.address));
          if (data.phone) setPhone(String(data.phone));
          if (data.photoUrl) setPhotoUrl(String(data.photoUrl));
        }
      } catch {}
    })();
  }, [user?.uid]);

  const pickAndUploadImage = React.useCallback(async () => {
    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets.length) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const name = asset.name || "photo.jpg";
      const size = asset.size ?? 0;
      const MAX = 5 * 1024 * 1024;

      if (size > MAX) {
        setError("Image must be 5MB or smaller.");
        return;
      }

      setPhotoUrl(uri);

      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        setError("Cloudinary config is missing.");
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("file", {
        uri,
        name,
        type: "image/jpeg",
      } as any);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "users");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Upload failed.");
      
      setPhotoUrl(json.secure_url);
    } catch (e) {
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }, []);

  const onSave = React.useCallback(async () => {
    setError(null);
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
        {
          address,
          phone,
          email: user.email || null,
          photoUrl: photoUrl || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.replace("/(tabs)/home");
    } catch (e) {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [address, phone, photoUrl, user]);

  if (authLoading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.wrapper}>
          <Text style={styles.title}>Complete Profile</Text>

          <View style={styles.avatarRow}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.secondaryButton, uploading && { opacity: 0.7 }]} disabled={uploading} onPress={pickAndUploadImage}>
            <Text style={styles.secondaryButtonText}>{uploading ? "Uploading..." : "Choose Photo"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={[styles.button, (saving) && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
            <Text style={styles.buttonText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1, padding: 24 },
  title: {
    fontWeight: "bold",
    color: "#FFB200",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 16,
  },
  label: {
    color: "#666",
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    fontSize: 16,
  },
  error: { color: "#B00020", marginTop: 12 },
  button: {
    backgroundColor: "#3B141C",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  avatarRow: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#eee" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarPlaceholderText: { color: "#666", fontSize: 12 },
  secondaryButton: {
    alignSelf: "center",
    backgroundColor: "#DA8D00",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  secondaryButtonText: { color: "#fff", fontWeight: "600" },
});
