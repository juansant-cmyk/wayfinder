import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FeatureHeader from "./shared/FeatureHeader";
import { accents, colors, fonts, radius, spacing, tint } from "../theme/tokens";

const SAFE = "#3E6B4A";

const alerts = [
  {
    tone: "alert",
    tag: "Safety Alert",
    title: "Large Public Event",
    place: "Shibuya, Tokyo",
    time: "May 10, 2025  ·  8:45 AM",
    body: "Large event expected May 11. Expect increased crowds, traffic restrictions, and possible delays.",
  },
  {
    tone: "advisory",
    tag: "Safety Advisory",
    title: "Pickpocketing Reported",
    place: "Shinjuku, Tokyo",
    time: "May 10, 2025  ·  7:15 AM",
    body: "Recent reports of pickpocketing in shopping areas and train stations. Keep belongings secure.",
  },
];

const categories = [
  { icon: "shield-checkmark-outline", label: "Crime & Security", status: "Low Risk", active: false, accent: accents.blue },
  { icon: "medical-outline", label: "Health", status: "Low Risk", active: false, accent: accents.green },
  { icon: "train-outline", label: "Transportation", status: "Low Risk", active: false, accent: accents.plum },
  { icon: "business-outline", label: "Local Laws", status: "Low Risk", active: false, accent: accents.amber },
  { icon: "megaphone-outline", label: "Local Updates", status: "1 Active", active: true, accent: accents.terracotta },
];

const tips = [
  {
    icon: "lock-closed-outline",
    title: "Secure your belongings",
    body: "Keep bags zipped and wallets in front pockets, especially in crowded areas.",
  },
  {
    icon: "location-outline",
    title: "Stay aware of your surroundings",
    body: "Be mindful in busy places and avoid distractions while walking.",
  },
  {
    icon: "call-outline",
    title: "Important Contacts",
    body: "Police: 110  ·  Ambulance/Fire: 119  ·  Tourist Hotline: 03-3201-3331",
  },
];

const riskSegments = [SAFE, "#7E8A3E", colors.star, "#C67A3E", colors.terracotta];

function AlertCard({ alert }) {
  const isAlert = alert.tone === "alert";
  const accent = isAlert ? colors.terracotta : colors.star;
  return (
    <Pressable style={[styles.alertCard, { backgroundColor: isAlert ? "#F5E9E5" : "#F4EEDD" }]}>
      <Ionicons name="warning" size={22} color={accent} style={{ marginTop: 2 }} />
      <View style={styles.alertBody}>
        <View style={styles.alertTopRow}>
          <Text style={[styles.alertTag, { color: accent }]}>{alert.tag}</Text>
          <Text style={styles.alertTime}>{alert.time}</Text>
        </View>
        <Text style={styles.alertTitle}>{alert.title}</Text>
        <View style={styles.placeRow}>
          <Ionicons name="location" size={13} color={accent} />
          <Text style={styles.alertPlace}>{alert.place}</Text>
        </View>
        <Text style={styles.alertText}>{alert.body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} style={{ marginTop: 2 }} />
    </Pressable>
  );
}

export default function SafetyScreen({ onBack }) {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeatureHeader
          title="Safety"
          subtitle="Safety updates and alerts for your destination."
          onBack={onBack}
        />

        {/* Search */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Where are you going?</Text>
          <Text style={styles.searchSubtitle}>Get real-time safety updates for your destination.</Text>
          <View style={styles.locationSelect}>
            <Ionicons name="location" size={16} color={colors.navy} />
            <Text style={styles.locationText}>Tokyo, Japan</Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </View>
          <View style={styles.updatedRow}>
            <Text style={styles.updatedText}>Last updated: May 10, 2025  ·  9:30 AM</Text>
            <Ionicons name="refresh" size={15} color={colors.onDarkMuted} />
          </View>
        </View>

        {/* Overall */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overall Safety Level</Text>
          <Pressable style={styles.viewAll}>
            <Text style={styles.viewAllText}>About safety levels</Text>
            <Ionicons name="information-circle-outline" size={15} color={colors.gold} />
          </Pressable>
        </View>
        <View style={styles.overallCard}>
          <View style={styles.overallTop}>
            <View style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark" size={26} color={SAFE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.riskLevel, { color: SAFE }]}>Low Risk</Text>
              <Text style={styles.riskDesc}>
                Tokyo is currently a low risk destination. Exercise normal safety precautions and
                follow local guidance.
              </Text>
            </View>
          </View>
          <View style={styles.scaleBar}>
            {riskSegments.map((seg, i) => (
              <View
                key={i}
                style={[
                  styles.scaleSeg,
                  { backgroundColor: seg },
                  i === 0 && styles.scaleSegFirst,
                  i === riskSegments.length - 1 && styles.scaleSegLast,
                ]}
              />
            ))}
            <View style={styles.scaleMarker} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>Low Risk</Text>
            <Text style={styles.scaleLabel}>High Risk</Text>
          </View>
        </View>

        {/* Alerts */}
        <View style={styles.sectionHeader}>
          <View style={styles.alertsTitleRow}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>2</Text>
            </View>
          </View>
          <Pressable style={styles.viewAll}>
            <Text style={styles.viewAllText}>View all alerts</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.gold} />
          </Pressable>
        </View>
        {alerts.map((a) => (
          <AlertCard key={a.title} alert={a} />
        ))}

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety Categories</Text>
          <Pressable style={styles.viewAll}>
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {categories.map((c) => (
            <View key={c.label} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: tint(c.accent) }]}>
                <Ionicons name={c.icon} size={19} color={c.accent} />
              </View>
              <Text style={styles.categoryLabel}>{c.label}</Text>
              <Text style={[styles.categoryStatus, { color: c.active ? colors.terracotta : SAFE }]}>
                {c.status}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Tips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety Tips for Tokyo</Text>
          <Pressable style={styles.viewAll}>
            <Text style={styles.viewAllText}>View all tips</Text>
          </Pressable>
        </View>
        <View style={styles.tipsCard}>
          {tips.map((t, i) => (
            <View key={t.title} style={[styles.tipRow, i < tips.length - 1 && styles.tipRowBorder]}>
              <View style={styles.tipIcon}>
                <Ionicons name={t.icon} size={17} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{t.title}</Text>
                <Text style={styles.tipBody}>{t.body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} style={{ marginTop: 2 }} />
            </View>
          ))}
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Wayfinder is always watching out for you.</Text>
            <Text style={styles.bannerBody}>We monitor trusted sources 24/7 to keep you informed.</Text>
          </View>
          <Pressable style={styles.bannerButton}>
            <Ionicons name="notifications-outline" size={15} color={colors.gold} />
            <Text style={styles.bannerButtonText}>Enable Push Alerts</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1 },
  content: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: 40 },

  searchCard: { padding: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.navy },
  searchTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.onDark },
  searchSubtitle: { marginTop: spacing.sm, fontFamily: fonts.sans, fontSize: 14, color: colors.onDarkMuted },
  locationSelect: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  locationText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, fontWeight: "600", color: colors.ink },
  updatedRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  updatedText: { fontFamily: fonts.sans, fontSize: 12, color: colors.onDarkMuted },

  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewAllText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },

  overallCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  overallTop: { flexDirection: "row", gap: spacing.lg },
  shieldCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E4EEE6",
    alignItems: "center",
    justifyContent: "center",
  },
  riskLevel: { fontFamily: fonts.serif, fontSize: 22 },
  riskDesc: { marginTop: 4, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  scaleBar: { marginTop: spacing.xl, flexDirection: "row", height: 8, position: "relative" },
  scaleSeg: { flex: 1, height: 8 },
  scaleSegFirst: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  scaleSegLast: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  scaleMarker: {
    position: "absolute",
    left: "10%",
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  scaleLabels: { marginTop: spacing.sm, flexDirection: "row", justifyContent: "space-between" },
  scaleLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600", color: colors.ink },

  alertsTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

  alertCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  alertBody: { flex: 1 },
  alertTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  alertTag: { fontFamily: fonts.sans, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  alertTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  alertTitle: { marginTop: 3, fontFamily: fonts.sans, fontSize: 16, fontWeight: "700", color: colors.ink },
  placeRow: { marginTop: 3, flexDirection: "row", alignItems: "center", gap: 4 },
  alertPlace: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  alertText: { marginTop: spacing.sm, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },

  hRow: { gap: spacing.sm, paddingRight: spacing.xl },
  categoryCard: {
    width: 118,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 6,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
    textAlign: "center",
  },
  categoryStatus: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "700" },

  tipsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.lg },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  tipBody: { marginTop: 3, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },

  banner: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunken,
  },
  bannerText: { marginBottom: spacing.md },
  bannerTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  bannerBody: { marginTop: 3, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  bannerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  bannerButtonText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.gold },
});
