import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import FeatureHeader from "./shared/FeatureHeader";
import { colors, fonts, radius, spacing } from "../theme/tokens";

const LOW = "#5F7C99";
const HIGH = colors.terracotta;

const currentStats = [
  { icon: "water-outline", label: "Humidity", value: "58%" },
  { icon: "flag-outline", label: "Wind", value: "8 km/h NE" },
  { icon: "sunny-outline", label: "UV Index", value: "6 High" },
  { icon: "eye-outline", label: "Visibility", value: "10 km" },
  { icon: "speedometer-outline", label: "Pressure", value: "1016 hPa" },
];

const hourly = [
  { time: "Now", icon: "sunny", temp: "23°", wind: "8 km/h" },
  { time: "10 AM", icon: "sunny", temp: "24°", wind: "9 km/h" },
  { time: "11 AM", icon: "sunny", temp: "25°", wind: "10 km/h" },
  { time: "12 PM", icon: "partly-sunny", temp: "26°", wind: "11 km/h" },
  { time: "1 PM", icon: "partly-sunny", temp: "27°", wind: "11 km/h" },
  { time: "2 PM", icon: "partly-sunny", temp: "27°", wind: "12 km/h" },
  { time: "3 PM", icon: "partly-sunny", temp: "26°", wind: "12 km/h" },
  { time: "4 PM", icon: "sunny", temp: "25°", wind: "11 km/h" },
];

const daily = [
  { day: "Sat, May 10", icon: "sunny", cond: "Sunny", low: "18°", high: "27°", precip: "10%" },
  { day: "Sun, May 11", icon: "partly-sunny", cond: "Partly Cloudy", low: "18°", high: "26°", precip: "20%" },
  { day: "Mon, May 12", icon: "rainy", cond: "Showers", low: "17°", high: "21°", precip: "60%" },
  { day: "Tue, May 13", icon: "cloudy", cond: "Cloudy", low: "16°", high: "20°", precip: "30%" },
  { day: "Wed, May 14", icon: "partly-sunny", cond: "Partly Cloudy", low: "15°", high: "22°", precip: "20%" },
  { day: "Thu, May 15", icon: "sunny", cond: "Sunny", low: "16°", high: "24°", precip: "10%" },
  { day: "Fri, May 16", icon: "partly-sunny", cond: "Mostly Sunny", low: "17°", high: "25°", precip: "10%" },
];

const alerts = [
  {
    icon: "warning",
    title: "High UV Index",
    tag: "Alert",
    accent: colors.terracotta,
    tint: "#F5EBE3",
    time: "May 10, 2025  ·  9:00 AM",
    body: "High UV levels expected today. Use sunscreen, wear protective clothing, and stay hydrated.",
  },
  {
    icon: "rainy",
    title: "Heavy Rain Advisory",
    tag: "Advisory",
    accent: "#4A6E8A",
    tint: "#E9EEF3",
    time: "May 10, 2025  ·  8:45 AM",
    body: "Periods of heavy rain expected Monday. Plan for possible travel delays and wet conditions.",
  },
  {
    icon: "thunderstorm",
    title: "Thunderstorm Watch",
    tag: "Watch",
    accent: "#6B5E8A",
    tint: "#EDEAF2",
    time: "May 10, 2025  ·  8:30 AM",
    body: "Thunderstorms possible late Monday night through Tuesday morning. Stay tuned for updates.",
  },
];

const bottomStats = [
  { icon: "sunny-outline", label: "Sunrise", value: "4:45 AM" },
  { icon: "moon-outline", label: "Sunset", value: "6:32 PM" },
  { icon: "water-outline", label: "Precipitation", value: "10%" },
  { icon: "leaf-outline", label: "Air Quality", value: "Good (28)" },
];

function SectionHeader({ title, action }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable style={styles.viewAll}>
        <Text style={styles.viewAllText}>{action}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.gold} />
      </Pressable>
    </View>
  );
}

export default function WeatherScreen({ onBack }) {
  const [query, setQuery] = useState("");

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeatureHeader
          title="Weather"
          subtitle="Accurate forecasts to help you plan your perfect trip."
          onBack={onBack}
        />

        {/* Search + location */}
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={17} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search destination or city"
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
          />
          <Ionicons name="options-outline" size={18} color={colors.muted} />
        </View>
        <View style={styles.locationRow}>
          <View style={styles.locationSelect}>
            <Ionicons name="location" size={16} color={colors.gold} />
            <Text style={styles.locationText}>Tokyo, Japan</Text>
            <Ionicons name="chevron-down" size={15} color={colors.muted} />
          </View>
          <Pressable style={styles.currentLocation}>
            <Ionicons name="locate-outline" size={15} color={colors.gold} />
            <Text style={styles.currentLocationText}>Current location</Text>
          </Pressable>
        </View>

        {/* Current conditions */}
        <View style={styles.currentCard}>
          <View style={styles.currentTop}>
            <Ionicons name="sunny" size={54} color={colors.gold} />
            <View style={styles.currentTemp}>
              <View style={styles.tempRow}>
                <Text style={styles.tempValue}>23</Text>
                <Text style={styles.tempUnit}>°C</Text>
              </View>
              <Text style={styles.condition}>Sunny</Text>
              <Text style={styles.feelsLike}>Feels like 24°</Text>
            </View>
          </View>
          <Text style={styles.currentDate}>May 10, 2025  ·  9:30 AM</Text>

          <View style={styles.statsDivider} />
          <View style={styles.statsGrid}>
            {currentStats.map((s) => (
              <View key={s.label} style={styles.statCell}>
                <Ionicons name={s.icon} size={16} color={colors.gold} />
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hourly */}
        <SectionHeader title="Hourly Forecast" action="View full day" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourRow}>
          {hourly.map((h, i) => (
            <View key={h.time} style={[styles.hourCard, i === 0 && styles.hourCardNow]}>
              <Text style={[styles.hourTime, i === 0 && styles.hourTimeNow]}>{h.time}</Text>
              <Ionicons name={h.icon} size={24} color={colors.gold} />
              <Text style={styles.hourTemp}>{h.temp}</Text>
              <View style={styles.hourWindRow}>
                <Ionicons name="flag-outline" size={10} color={colors.muted} />
                <Text style={styles.hourWind}>{h.wind}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 7-Day */}
        <SectionHeader title="7-Day Forecast" action="View daily details" />
        <View style={styles.dailyCard}>
          {daily.map((d, i) => (
            <View key={d.day} style={[styles.dailyRow, i < daily.length - 1 && styles.dailyRowBorder]}>
              <Text style={styles.dailyDay}>{d.day}</Text>
              <Ionicons name={d.icon} size={20} color={colors.gold} style={styles.dailyIcon} />
              <Text style={styles.dailyCond} numberOfLines={1}>{d.cond}</Text>
              <Text style={styles.dailyTemps}>
                <Text style={{ color: LOW }}>{d.low}</Text>
                <Text style={styles.dailySlash}> / </Text>
                <Text style={{ color: HIGH }}>{d.high}</Text>
              </Text>
              <View style={styles.dailyPrecip}>
                <Ionicons name="water-outline" size={12} color={LOW} />
                <Text style={styles.dailyPrecipText}>{d.precip}</Text>
              </View>
              <Ionicons name="chevron-down" size={15} color={colors.faint} />
            </View>
          ))}
        </View>

        {/* Alerts */}
        <Text style={styles.alertsHeader}>Weather Alerts & Advisories</Text>
        {alerts.map((a) => (
          <View key={a.title} style={[styles.alertCard, { backgroundColor: a.tint }]}>
            <View style={styles.alertTop}>
              <Ionicons name={a.icon} size={22} color={a.accent} style={{ marginTop: 1 }} />
              <View style={styles.alertBody}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle}>{a.title}</Text>
                  <View style={[styles.alertTag, { backgroundColor: `${a.accent}22` }]}>
                    <Text style={[styles.alertTagText, { color: a.accent }]}>{a.tag}</Text>
                  </View>
                </View>
                <Text style={styles.alertText}>{a.body}</Text>
              </View>
            </View>
            <View style={styles.alertFooter}>
              <Text style={styles.alertTime}>{a.time}</Text>
              <Pressable style={styles.alertButton}>
                <Text style={styles.alertButtonText}>View Details</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Bottom stats */}
        <View style={styles.bottomStats}>
          {bottomStats.map((s) => (
            <View key={s.label} style={styles.bottomStat}>
              <Ionicons name={s.icon} size={18} color={colors.gold} />
              <Text style={styles.bottomStatLabel}>{s.label}</Text>
              <Text style={styles.bottomStatValue}>{s.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1 },
  content: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: 40 },

  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  locationRow: { marginTop: spacing.sm, flexDirection: "row", gap: spacing.sm },
  locationSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  locationText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, fontWeight: "600", color: colors.ink },
  currentLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  currentLocationText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },

  currentCard: {
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
  },
  currentTop: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  currentTemp: { flex: 1 },
  tempRow: { flexDirection: "row", alignItems: "flex-start" },
  tempValue: { fontFamily: fonts.sans, fontSize: 56, fontWeight: "700", lineHeight: 60, color: colors.onDark },
  tempUnit: { fontFamily: fonts.sans, fontSize: 20, fontWeight: "600", color: colors.onDark, marginTop: 6 },
  condition: { fontFamily: fonts.serif, fontSize: 20, color: colors.onDark },
  feelsLike: { marginTop: 2, fontFamily: fonts.sans, fontSize: 13, color: colors.onDarkMuted },
  currentDate: { marginTop: spacing.md, fontFamily: fonts.sans, fontSize: 13, color: colors.onDarkMuted },
  statsDivider: { marginVertical: spacing.lg, height: 1, backgroundColor: colors.onDarkLine },
  statsGrid: { flexDirection: "row", flexWrap: "wrap" },
  statCell: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 7,
  },
  statLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.onDarkMuted },
  statValue: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.onDark },

  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },

  hourRow: { gap: spacing.sm, paddingRight: spacing.xl },
  hourCard: {
    width: 74,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 6,
  },
  hourCardNow: { backgroundColor: colors.surfaceSunken, borderColor: colors.gold },
  hourTime: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600", color: colors.muted },
  hourTimeNow: { color: colors.gold },
  hourTemp: { fontFamily: fonts.sans, fontSize: 16, fontWeight: "700", color: colors.ink },
  hourWindRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  hourWind: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted },

  dailyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  dailyRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, gap: spacing.sm },
  dailyRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  dailyDay: { width: 78, fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.ink },
  dailyIcon: { width: 22 },
  dailyCond: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  dailyTemps: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700" },
  dailySlash: { color: colors.faint, fontWeight: "400" },
  dailyPrecip: { width: 52, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3 },
  dailyPrecipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  alertsHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.ink,
  },
  alertCard: { padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md },
  alertTop: { flexDirection: "row", gap: spacing.md },
  alertBody: { flex: 1 },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  alertTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  alertTag: { paddingVertical: 2, paddingHorizontal: spacing.sm, borderRadius: radius.pill },
  alertTagText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: "700" },
  alertText: { marginTop: 4, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  alertFooter: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  alertButton: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  alertButtonText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "700", color: colors.ink },

  bottomStats: {
    marginTop: spacing.md,
    flexDirection: "row",
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  bottomStat: { flex: 1, alignItems: "center", gap: 4 },
  bottomStatLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  bottomStatValue: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.ink, textAlign: "center" },
});
