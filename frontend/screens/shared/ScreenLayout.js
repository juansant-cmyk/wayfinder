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

import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./BottomNav";
import FeatureHeader from "./FeatureHeader";
import { colors, fonts } from "../../theme/tokens";

export default function ScreenLayout({
  title,
  subtitle,
  accentTail,
  hero,
  heroAspect,
  onBack,
  loading = false,
  error = null,
  children,
  footer,
  onNavigate,
  activeLabel = null,
}) {
  const showBottomNav = Boolean(onNavigate);
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {hero ? null : (
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gold} />
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
            hero && styles.contentContainerHero,
            showBottomNav && styles.contentContainerWithBottomNav,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {hero ? (
            <FeatureHeader
              title={title}
              subtitle={subtitle}
              accentTail={accentTail}
              onBack={onBack}
              hero={hero}
              heroAspect={heroAspect}
            />
          ) : null}
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
    backgroundColor: colors.paper,
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
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: 0.2,
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
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: "600",
    color: colors.muted,
  },

  errorText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: colors.danger,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  contentContainerHero: {
    paddingTop: 56,
  },

  contentContainerWithBottomNav: {
    paddingBottom: BOTTOM_NAV_CONTENT_PADDING,
  },
});
