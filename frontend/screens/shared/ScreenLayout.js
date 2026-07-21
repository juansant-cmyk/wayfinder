import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav, { getBottomNavContentPadding } from "./BottomNav";

export default function ScreenLayout({
  title,
  onBack,
  loading = false,
  error = null,
  children,
  footer,
  onNavigate,
  activeLabel = null,
}) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = getBottomNavContentPadding(insets);
  const showBottomNav = Boolean(onNavigate);
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color="#14253E" />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1F78FF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            showBottomNav && { paddingBottom: bottomNavPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}

      {showBottomNav ? (
        <BottomNav activeLabel={activeLabel} onNavigate={onNavigate} />
      ) : (
        footer
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF2FC",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#14253E",
    letterSpacing: -0.5,
  },

  headerSpacer: {
    width: 40,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#1F78FF",
  },

  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: "#B42318",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
});
