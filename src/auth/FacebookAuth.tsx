import * as WebBrowser from "expo-web-browser";
import * as Facebook from "expo-auth-session/providers/facebook";
import { useEffect, useState } from "react";
import { signInWithCredential, FacebookAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

WebBrowser.maybeCompleteAuthSession();

export function useFacebookAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      
      if (access_token) {
        setLoading(true);
        setError(null);
        
        const credential = FacebookAuthProvider.credential(access_token);
        signInWithCredential(auth, credential)
          .then(() => {
            setLoading(false);
          })
          .catch((error) => {
            setError("Facebook sign-in failed. Please try again.");
            setLoading(false);
          });
      }
    } else if (response?.type === "error") {
      setError("Facebook sign-in was cancelled or failed.");
    }
  }, [response]);

  const signInWithFacebook = async () => {
    setError(null);
    if (request) {
      await promptAsync();
    } else {
      setError("Facebook sign-in is not available.");
    }
  };

  return {
    signInWithFacebook,
    loading,
    error,
    isReady: !!request,
  };
}
