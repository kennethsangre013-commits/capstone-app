import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      
      if (id_token) {
        setLoading(true);
        setError(null);
        
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then(() => {
            setLoading(false);
          })
          .catch((error) => {
            setError("Google sign-in failed. Please try again.");
            setLoading(false);
          });
      }
    } else if (response?.type === "error") {
      setError("Google sign-in was cancelled or failed.");
    }
  }, [response]);

  const signInWithGoogle = async () => {
    setError(null);
    if (request) {
      await promptAsync();
    } else {
      setError("Google sign-in is not available.");
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
    isReady: !!request,
  };
}
