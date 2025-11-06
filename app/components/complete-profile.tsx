import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Image,
  ScrollView,
  Animated
} from "react-native";
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
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<"success" | "error">("success");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  const pickAndUploadImage = React.useCallback(async () => {
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
        showToast("Image must be 5MB or smaller.", "error");
        return;
      }

      setPhotoUrl(uri);

      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        showToast("Configuration error.", "error");
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
      showToast("Photo uploaded!", "success");
    } catch (e) {
      showToast("Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }, []);

  const onSave = React.useCallback(async () => {
    if (!address.trim() || !phone.trim()) {
      showToast("Please fill all fields.", "error");
      return;
    }
    if (!user) return;
    
    try {
      setSaving(true);
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        {
          address: address.trim(),
          phone: phone.trim(),
          email: user.email || null,
          photoUrl: photoUrl || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.replace("/(tabs)/home");
    } catch (e) {
      showToast("Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }, [address, phone, photoUrl, user]);

  if (authLoading) return null;

  const isLoading = saving || uploading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.flex}
      >
        <ScrollView 
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Complete Profile</Text>

          <TouchableOpacity 
            onPress={pickAndUploadImage}
            disabled={uploading}
            activeOpacity={0.8}
            style={styles.photoButton}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>+</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address"
                placeholderTextColor="#AAA"
                value={address}
                onChangeText={setAddress}
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#AAA"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : uploading ? "Uploading..." : "Save"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {toastMessage && (
          <Animated.View 
            style={[
              styles.toast,
              toastType === "success" ? styles.toastSuccess : styles.toastError,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 40,
  },
  photoButton: {
    marginBottom: 40,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  photoIcon: {
    fontSize: 36,
    color: "#999",
    fontWeight: "300",
  },
  form: {
    width: "100%",
    gap: 24,
    marginBottom: 32,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    color: "#000",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  button: {
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  toast: {
    position: "absolute",
    bottom: 80,
    left: 32,
    right: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: "#000",
  },
  toastError: {
    backgroundColor: "#E53935",
  },
  toastText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});