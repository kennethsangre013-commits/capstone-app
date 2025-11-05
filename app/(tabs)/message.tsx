import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text } from "react-native";

export default function MessageScreen() {

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light"/>
            <View style={styles.topBar}>
                <Text style={styles.titleText}>Message</Text>
                <Text style={styles.infoText}>
                    We are still working on to provide best experience to you.{"\n"}
                    Coming soon, check later!
                </Text>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#3B141C",
    },
    topBar: {
        alignItems: "center",
        paddingVertical: 40,
    },
    titleText: {
        fontWeight: "bold",
        color: "#FFB200",
        fontSize: 20,
    },
    infoText: {
        color: "#DBB98E",
        fontSize: 15.5,
        textAlign: "center",
        lineHeight: 23,
        fontWeight: "500",
    },
});