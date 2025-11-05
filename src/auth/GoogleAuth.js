import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
    const [request, response, prompAsync] = Google.useAuthRequest({
        expoClientId: process.env.EXPO_PUBLIC
    })
}