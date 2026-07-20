import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

const safetyHero = require("../assets/images/heroes/safety-hero.png");

const alerts = [
  {
    icon: "alert-circle",
    title: "Large Public Event",
    tag: "Safety Alert",
    accent: colors.terracotta,
    tint: "#F6EAE4",
    place: "Shibuya, Tokyo",
    time: "May 10, 2025  ·  8:45 AM",
    body: "Large event expected May 11. Expect increased crowds, traffic restrictions, and possible delays.",
  },
  {
    icon: "warning",
    title: "Pickpocketing Reported",
    tag: "Safety Advisory",
    accent: colors.gold,
    tint: "#F3EEE1",
    place: "Shinjuku, Tokyo",
    time: "May 10, 2025  ·  7:15 AM",
    body: "Recent reports of pickpocketing in shopping areas and train stations. Keep belongings secure.",
  },
];

const categories = [
  { label: "Crime & Security", icon: "shield-checkmark", accent: accents.blue, level: "Low Risk", levelColor: accents.green },
  { label: "Health", icon: "medkit", accent: accents.green, level: "Low Risk", levelColor: accents.green },
  { label: "Transportation", icon: "train", accent: accents.plum, level: "Low Risk", levelColor: accents.green },
  { label: "Local Laws", icon: "business", accent: accents.amber, level: "Low Risk", levelColor: accents.green },
  { label: "Local Updates", icon: "megaphone", accent: accents.plum, level: "1 Active", levelColor: colors.terracotta },
];

const tips = [
  { icon: "lock-closed", accent: accents.blue, title: "Secure your belongings", body: "Keep bags zipped and wallets in front pockets, especially in crowded areas." },
  { icon: "location", accent: accents.green, title: "Stay aware of your surroundings", body: "Be mindful in busy places and avoid distractions while walking." },
  { icon: "call", accent: accents.plum, title: "Important Contacts", body: "Police: 110  ·  Ambulance/Fire: 119  ·  Tourist Hotline: 03-3201-3331" },
];

function SectionHeader({ title, badge, action }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge ? (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {action ? (
        <Pressable style={styles.viewAll}>
          <Text style={styles.viewAllText}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.gold} />
        </Pressable>
      ) : null}
    </View>
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
          hero={safetyHero}
          heroAspect={446 / 230}
        />

        {/* Where are you going */}
        <View style={styles.destCard}>
          <Text style={styles.destTitle}>Where are you going?</Text>
          <Text style={styles.destSubtitle}>Get real-time safety updates for your destination.</Text>
          <Pressable style={styles.destSelect}>
            <Ionicons name="location" size={16} color={colors.navy} />
            <Text style={styles.destSelectText}>Tokyo, Japan</Text>
            <Ionicons name="chevron-down" size={16} color={colors.onDarkMuted} />
          </Pressable>
          <View style={styles.destUpdatedRow}>
            <Text style={styles.destUpdated}>Last updated: May 10, 2025  ·  9:30 AM</Text>
            <Ionicons name="refresh" size={15} color={colors.onDarkMuted} />
          </View>
        </View>

        {/* Overall safety level */}
        <SectionHeader title="Overall Safety Level" action="About safety levels" />
        <View style={styles.levelCard}>
          <View style={styles.levelTop}>
            <View style={styles.levelBadge}>
              <Ionicons name="shield-checkmark" size={26} color={accents.green} />
            </View>
            <View style={styles.levelBody}>
              <Text style={styles.levelValue}>Low Risk</Text>
              <Text style={styles.levelDesc}>
                Tokyo is currently a low risk destination. Exercise normal safety precautions and follow local guidance.
              </Text>
            </View>
          </View>
          <View style={styles.meterTrack}>
            <View style={[styles.meterSeg, { backgroundColor: "#4E8A4E" }]} />
            <View style={[styles.meterSeg, { backgroundColor: "#C0902F" }]} />
            <View style={[styles.meterSeg, { backgroundColor: "#D98A45" }]} />
            <View style={[styles.meterSeg, { backgroundColor: "#C0492F" }]} />
            <View style={styles.meterMarker} />
          </View>
          <View style={styles.meterLabels}>
            <Text style={styles.meterLabel}>Low Risk</Text>
            <Text style={styles.meterLabel}>High Risk</Text>
          </View>
        </View>

        {/* Active alerts */}
        <SectionHeader title="Active Alerts" badge="2" action="View all alerts" />
        {alerts.map((a) => (
          <Pressable key={a.title} style={[styles.alertCard, { backgroundColor: a.tint }]}>
            <Ionicons name={a.icon} size={24} color={a.accent} style={{ marginTop: 1 }} />
            <View style={styles.alertBody}>
              <View style={styles.alertTagRow}>
                <Text style={[styles.alertTag, { color: a.accent }]}>{a.tag}</Text>
                <Text style={styles.alertTime}>{a.time}</Text>
              </View>
              <Text style={styles.alertTitle}>{a.title}</Text>
              <View style={styles.alertPlaceRow}>
                <Ionicons name="location" size={13} color={colors.navy} />
                <Text style={styles.alertPlace}>{a.place}</Text>
              </View>
              <Text style={styles.alertText}>{a.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} style={{ alignSelf: "center" }} />
          </Pressable>
        ))}

        {/* Safety categories */}
        <SectionHeader title="Safety Categories" action="View all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {categories.map((c) => (
            <View key={c.label} style={styles.catCard}>
              <View style={[styles.catIcon, { backgroundColor: tint(c.accent) }]}>
                <Ionicons name={c.icon} size={20} color={c.accent} />
              </View>
              <Text style={styles.catLabel} numberOfLines={2}>{c.label}</Text>
              <Text style={[styles.catLevel, { color: c.levelColor }]}>{c.level}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Safety tips */}
        <SectionHeader title="Safety Tips for Tokyo" action="View all tips" />
        <View style={styles.tipsCard}>
          {tips.map((t, i) => (
            <View key={t.title} style={[styles.tipRow, i < tips.length - 1 && styles.tipRowBorder]}>
              <View style={[styles.tipIcon, { backgroundColor: tint(t.accent) }]}>
                <Ionicons name={t.icon} size={18} color={t.accent} />
              </View>
              <View style={styles.tipBody}>
                <Text style={styles.tipTitle}>{t.title}</Text>
                <Text style={styles.tipText}>{t.body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} style={{ alignSelf: "center" }} />
            </View>
          ))}
        </View>

        {/* Watching banner */}
        <View style={styles.watchBanner}>
          <MaterialCommunityIcons name="robot-happy-outline" size={26} color={colors.navy} />
          <View style={styles.watchBody}>
            <Text style={styles.watchTitle}>Wayfinder is always watching out for you.</Text>
            <Text style={styles.watchText}>We monitor trusted sources 24/7 to keep you informed.</Text>
          </View>
          <Pressable style={styles.watchButton}>
            <Ionicons name="notifications-outline" size={15} color={colors.navy} />
            <Text style={styles.watchButtonText}>Enable</Text>
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

  destCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
  },
  destTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.onDark },
  destSubtitle: { marginTop: 4, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.onDarkMuted },
  destSelect: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  destSelectText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  destUpdatedRow: { marginTop: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  destUpdated: { fontFamily: fonts.sans, fontSize: 12, color: colors.onDarkMuted },

  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  sectionBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "800", color: "#fff" },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },

  levelCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  levelTop: { flexDirection: "row", gap: spacing.lg },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: tint(accents.green),
    alignItems: "center",
    justifyContent: "center",
  },
  levelBody: { flex: 1 },
  levelValue: { fontFamily: fonts.serif, fontSize: 20, fontWeight: "700", color: accents.green },
  levelDesc: { marginTop: 4, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  meterTrack: {
    marginTop: spacing.lg,
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "visible",
    position: "relative",
  },
  meterSeg: { flex: 1, height: 8 },
  meterMarker: {
    position: "absolute",
    left: "10%",
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#14324A",
    borderWidth: 2,
    borderColor: "#fff",
  },
  meterLabels: { marginTop: spacing.sm, flexDirection: "row", justifyContent: "space-between" },
  meterLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600", color: colors.muted },

  alertCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  alertBody: { flex: 1 },
  alertTagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  alertTag: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "700" },
  alertTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  alertTitle: { marginTop: 3, fontFamily: fonts.sans, fontSize: 16, fontWeight: "700", color: colors.ink },
  alertPlaceRow: { marginTop: 3, flexDirection: "row", alignItems: "center", gap: 3 },
  alertPlace: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  alertText: { marginTop: 6, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },

  catRow: { gap: spacing.sm, paddingRight: spacing.xl },
  catCard: {
    width: 108,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "700", color: colors.ink, textAlign: "center" },
  catLevel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600" },

  tipsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  tipRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.lg },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tipBody: { flex: 1 },
  tipTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  tipText: { marginTop: 3, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },

  watchBanner: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSunken,
  },
  watchBody: { flex: 1 },
  watchTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  watchText: { marginTop: 2, fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: colors.muted },
  watchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.surface,
  },
  watchButtonText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.navy },
});
