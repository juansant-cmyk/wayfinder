import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FeatureHeader from "./shared/FeatureHeader";
import { colors, fonts, radius, spacing } from "../theme/tokens";

const days = [
  { label: "Day 1", date: "Jul 12" },
  { label: "Day 2", date: "Jul 13" },
  { label: "Day 3", date: "Jul 14" },
  { label: "Day 4", date: "Jul 15" },
];

const activities = [
  {
    time: "9:00 AM",
    icon: "cafe-outline",
    title: "Breakfast at Urth Caffé",
    place: "Santa Monica",
    tag: "Recommended by Wayfinder",
    distance: "2.1 mi",
  },
  {
    time: "11:00 AM",
    icon: "camera-outline",
    title: "Santa Monica Pier",
    place: "Santa Monica",
    tag: "Photo spot",
    distance: "2.4 mi",
  },
  {
    time: "1:30 PM",
    icon: "restaurant-outline",
    title: "Lunch at The Albright",
    place: "Santa Monica",
    tag: null,
    distance: "0.8 mi",
  },
  {
    time: "3:30 PM",
    icon: "business-outline",
    title: "The Getty Center",
    place: "Brentwood",
    tag: "Reserve tickets online",
    distance: "6.3 mi",
  },
  {
    time: "7:00 PM",
    icon: "sunny-outline",
    title: "Sunset at Griffith Observatory",
    place: "Los Feliz",
    tag: "Best sunset in LA",
    distance: "7.9 mi",
  },
  {
    time: "9:00 PM",
    icon: "wine-outline",
    title: "Dinner in Downtown LA",
    place: "Downtown LA",
    tag: null,
    distance: "5.2 mi",
  },
];

function ActivityRow({ item, isLast }) {
  return (
    <View style={styles.activityRow}>
      <Text style={styles.activityTime}>{item.time}</Text>

      <View style={styles.rail}>
        <View style={styles.railIcon}>
          <Ionicons name={item.icon} size={18} color={colors.gold} />
        </View>
        {!isLast ? <View style={styles.railLine} /> : null}
      </View>

      <View style={styles.activityBody}>
        <View style={styles.activityTopRow}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <View style={styles.distanceCol}>
            <Ionicons name="location" size={12} color={colors.gold} />
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>
        </View>
        <View style={styles.placeRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.placeText}>{item.place}</Text>
        </View>
        {item.tag ? (
          <View style={styles.tag}>
            <Ionicons name="sparkles" size={11} color={colors.gold} />
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ItineraryScreen({ onBack }) {
  const [activeDay, setActiveDay] = useState("Day 1");

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeatureHeader title="Itinerary" subtitle="Your trip," accentTail="day by day." onBack={onBack} />

        {/* Trip card */}
        <View style={styles.tripCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=400&q=80",
            }}
            style={styles.tripImage}
          />
          <View style={styles.tripInfo}>
            <Text style={styles.tripTitle}>Los Angeles Trip</Text>
            <View style={styles.tripMetaRow}>
              <Ionicons name="location-outline" size={13} color={colors.gold} />
              <Text style={styles.tripMetaText}>Los Angeles, California</Text>
            </View>
            <View style={styles.tripMetaRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.gold} />
              <Text style={styles.tripMetaText}>Jul 12 – Jul 15, 2025  ·  3 Nights</Text>
            </View>
            <Pressable style={styles.editButton}>
              <Ionicons name="create-outline" size={14} color={colors.gold} />
              <Text style={styles.editText}>Edit Trip</Text>
            </Pressable>
          </View>
        </View>

        {/* Day tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayRow}
        >
          {days.map((day) => {
            const active = day.label === activeDay;
            return (
              <Pressable
                key={day.label}
                onPress={() => setActiveDay(day.label)}
                style={[styles.dayTab, active && styles.dayTabActive]}
              >
                <Text style={[styles.dayLabel, active && styles.dayTextActive]}>{day.label}</Text>
                <Text style={[styles.dayDate, active && styles.dayTextActive]}>{day.date}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable style={styles.viewMap}>
          <Ionicons name="map-outline" size={15} color={colors.gold} />
          <Text style={styles.viewMapText}>View Map</Text>
        </Pressable>

        {/* Day header */}
        <View style={styles.dayHeader}>
          <View>
            <Text style={styles.dayHeaderTitle}>Day 1  ·  Saturday, Jul 12</Text>
            <View style={styles.dayHeaderMeta}>
              <Ionicons name="sunny-outline" size={14} color={colors.gold} />
              <Text style={styles.dayHeaderMetaText}>Sunny  ·  78°F</Text>
            </View>
          </View>
          <Pressable style={styles.addActivity}>
            <Text style={styles.addActivityText}>Add Activity</Text>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {activities.map((item, index) => (
            <ActivityRow key={item.title} item={item} isLast={index === activities.length - 1} />
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tipBanner}>
          <Ionicons name="sparkles" size={16} color={colors.gold} style={{ marginTop: 2 }} />
          <View style={styles.tipText}>
            <Text style={styles.tipTitle}>Wayfinder Tip</Text>
            <Text style={styles.tipBody}>
              Consider using rideshare or public transit to avoid parking and traffic.
            </Text>
          </View>
          <Pressable style={styles.tipLink}>
            <Text style={styles.tipLinkText}>View Tips</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.gold} />
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

  tripCard: {
    flexDirection: "row",
    gap: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tripImage: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.surfaceSunken },
  tripInfo: { flex: 1 },
  tripTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  tripMetaRow: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 5 },
  tripMetaText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  editButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  editText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.gold },

  dayRow: { gap: spacing.sm, paddingVertical: spacing.lg, paddingRight: spacing.xl },
  dayTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  dayTabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  dayLabel: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  dayDate: { marginTop: 2, fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  dayTextActive: { color: colors.onDark },

  viewMap: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: spacing.lg,
  },
  viewMapText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },

  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.navy,
  },
  dayHeaderTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.onDark },
  dayHeaderMeta: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 5 },
  dayHeaderMetaText: { fontFamily: fonts.sans, fontSize: 12, color: colors.onDarkMuted },
  addActivity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.cta,
  },
  addActivityText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

  timeline: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  activityRow: { flexDirection: "row" },
  activityTime: {
    width: 58,
    paddingTop: 8,
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  rail: { width: 40, alignItems: "center" },
  railIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  railLine: { flex: 1, width: 1, backgroundColor: colors.line, marginVertical: 4 },
  activityBody: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.lg },
  activityTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  activityTitle: { flex: 1, fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  distanceCol: { flexDirection: "row", alignItems: "center", gap: 3, paddingTop: 2 },
  distanceText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  placeRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 4 },
  placeText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  tag: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  tagText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: "600", color: colors.gold },

  tipBanner: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunken,
  },
  tipText: { flex: 1 },
  tipTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  tipBody: { marginTop: 3, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  tipLink: { flexDirection: "row", alignItems: "center", gap: 2, paddingTop: 2 },
  tipLinkText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },
});
