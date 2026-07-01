import { StyleSheet, Text, View } from "react-native";

export default function SafetyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafetyScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
  },
});