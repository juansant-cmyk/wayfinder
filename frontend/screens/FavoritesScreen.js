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

const favoritesHero = require("../assets/images/heroes/favorites-hero.png");
const sunsetInn = require("../assets/images/hotels/hotel-card-sunset-inn.png");
const cityView = require("../assets/images/hotels/hotel-card-city-view.png");
const tripImage = require("../assets/images/itinerary-trip-reference.png");

const TABS = [
  { key: "hotels", label: "Hotels", icon: "bed-outline" },
  { key: "flights", label: "Flights", icon: "airplane-outline" },
  { key: "itineraries", label: "Itineraries", icon: "calendar-outline" },
  { key: "places", label: "Places", icon: "location-outline" },
];

const hotels = [
  {
    name: "Sunset Inn",
    image: sunsetInn,
    tag: "Best Match",
    tagColor: colors.gold,
    place: "Los Angeles, CA",
    rating: "4.6",
    reviews: "532",
    price: "$149",
    amenities: ["WiFi", "Pool", "Parking"],
    note: "Great value with excellent amenities.",
  },
  {
    name: "City View Hotel",
    image: cityView,
    tag: "Best Budget",
    tagColor: "#4E8A4E",
    place: "Downtown LA",
    rating: "4.4",
    reviews: "318",
    price: "$119",
    amenities: ["WiFi", "Breakfast", "Gym"],
    note: "Affordable and close to popular spots.",
  },
];

const flights = [
  { airline: "All Nippon Airways", dep: "11:15 AM", from: "LAX", dur: "11h 20m", stops: "Nonstop", arr: "3:35 PM", to: "NRT", price: "$765" },
  { airline: "Japan Airlines", dep: "12:45 PM", from: "LAX", dur: "10h 35m", stops: "Nonstop", arr: "4:20 PM", to: "NRT", price: "$812" },
  { airline: "Korean Air", dep: "1:20 PM", from: "LAX", dur: "13h 45m", stops: "1 stop · ICN", arr: "6:05 PM", to: "NRT", price: "$612" },
];

const itineraries = [
  { title: "Los Angeles Trip", mon: "JUL", day: "12", year: "2025", dates: "Jul 12 – Jul 15, 2025  ·  3 Nights", tags: ["Flights", "Hotels", "Itinerary"] },
  { title: "Japan Adventure", mon: "SEP", day: "20", year: "2025", dates: "Sep 20 – Sep 30, 2025  ·  10 Nights", tags: ["Flights", "Hotels", "Itinerary"] },
];

function SectionHeader({ title, icon }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={18} color={colors.navy} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Pressable style={styles.viewAll}>
        <Text style={styles.viewAllText}>View all</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.gold} />
      </Pressable>
    </View>
  );
}

function HotelCard({ hotel }) {
  return (
    <View style={styles.hotelCard}>
      <View style={styles.hotelImageWrap}>
        <Image source={hotel.image} style={styles.hotelImage} resizeMode="cover" />
        <View style={[styles.hotelTag, { backgroundColor: hotel.tagColor }]}>
          <Text style={styles.hotelTagText}>{hotel.tag}</Text>
        </View>
      </View>
      <View style={styles.hotelBody}>
        <View style={styles.hotelTitleRow}>
          <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
          <Ionicons name="heart" size={20} color={colors.terracotta} />
        </View>
        <View style={styles.hotelMetaRow}>
          <Ionicons name="location" size={13} color={colors.navy} />
          <Text style={styles.hotelPlace}>{hotel.place}</Text>
        </View>
        <View style={styles.hotelMetaRow}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={styles.hotelRating}>{hotel.rating}</Text>
          <Text style={styles.hotelReviews}>({hotel.reviews})</Text>
          <Text style={styles.hotelPrice}>{hotel.price}<Text style={styles.hotelPriceUnit}>/night</Text></Text>
        </View>
        <Text style={styles.hotelAmenities} numberOfLines={1}>{hotel.amenities.join("  ·  ")}</Text>
        <View style={styles.hotelNote}>
          <Ionicons name="sparkles" size={12} color={colors.navy} />
          <Text style={styles.hotelNoteText} numberOfLines={2}>
            <Text style={styles.hotelNoteLabel}>Wayfinder note: </Text>{hotel.note}
          </Text>
        </View>
      </View>
    </View>
  );
}

function FlightRow({ flight }) {
  return (
    <View style={styles.flightRow}>
      <View style={styles.flightAirline}>
        <Ionicons name="airplane" size={18} color={colors.navy} />
        <Text style={styles.flightAirlineText} numberOfLines={2}>{flight.airline}</Text>
      </View>
      <View style={styles.flightTimes}>
        <Text style={styles.flightTime}>{flight.dep} <Text style={styles.flightCode}>{flight.from}</Text></Text>
        <Text style={styles.flightDur}>{flight.dur} · {flight.stops}</Text>
        <Text style={styles.flightTime}>{flight.arr} <Text style={styles.flightCode}>{flight.to}</Text></Text>
      </View>
      <View style={styles.flightRight}>
        <Text style={styles.flightPrice}>{flight.price}</Text>
        <Ionicons name="heart" size={18} color={colors.terracotta} />
      </View>
    </View>
  );
}

function ItineraryCard({ item }) {
  return (
    <View style={styles.itinCard}>
      <Image source={tripImage} style={styles.itinImage} resizeMode="cover" />
      <View style={styles.itinDate}>
        <Text style={styles.itinMon}>{item.mon}</Text>
        <Text style={styles.itinDay}>{item.day}</Text>
        <Text style={styles.itinYear}>{item.year}</Text>
      </View>
      <View style={styles.itinBody}>
        <Text style={styles.itinTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itinDates} numberOfLines={1}>{item.dates}</Text>
        <View style={styles.itinTags}>
          {item.tags.map((t) => (
            <View key={t} style={styles.itinTag}>
              <Text style={styles.itinTagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="heart" size={18} color={colors.terracotta} style={{ alignSelf: "center" }} />
    </View>
  );
}

function EmptyPlaces() {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="location-outline" size={30} color={colors.navy} />
      <Text style={styles.emptyTitle}>No saved places yet.</Text>
      <Text style={styles.emptyText}>Save spots from Maps to see them here.</Text>
    </View>
  );
}

export default function FavoritesScreen({ onBack }) {
  const [tab, setTab] = useState("hotels");

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeatureHeader
          title="Favorites"
          subtitle="All your saved places, flights, and trips in one spot."
          onBack={onBack}
          hero={favoritesHero}
          heroAspect={412 / 214}
        />

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={t.icon} size={16} color={active ? colors.onDark : colors.navy} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {tab === "hotels" ? (
          <>
            <SectionHeader title="Saved Hotels" icon="bed-outline" />
            {hotels.map((h) => <HotelCard key={h.name} hotel={h} />)}
          </>
        ) : null}

        {tab === "flights" ? (
          <>
            <SectionHeader title="Saved Flights" icon="airplane-outline" />
            <View style={styles.flightsCard}>
              {flights.map((f, i) => (
                <View key={f.airline} style={i < flights.length - 1 && styles.flightRowBorder}>
                  <FlightRow flight={f} />
                </View>
              ))}
            </View>
          </>
        ) : null}

        {tab === "itineraries" ? (
          <>
            <SectionHeader title="Saved Itineraries" icon="calendar-outline" />
            {itineraries.map((it) => <ItineraryCard key={it.title} item={it} />)}
          </>
        ) : null}

        {tab === "places" ? <EmptyPlaces /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1 },
  content: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: 40 },

  tabsRow: { gap: spacing.sm, paddingRight: spacing.xl, marginBottom: spacing.lg },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  tabTextActive: { color: colors.onDark },

  sectionHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600", color: colors.gold },

  hotelCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  hotelImageWrap: { width: 104, borderRadius: radius.md, overflow: "hidden", position: "relative" },
  hotelImage: { width: 104, height: "100%", minHeight: 132 },
  hotelTag: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
  },
  hotelTagText: { fontFamily: fonts.sans, fontSize: 10, fontWeight: "800", color: "#fff" },
  hotelBody: { flex: 1, minWidth: 0 },
  hotelTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  hotelName: { flex: 1, fontFamily: fonts.serif, fontSize: 17, fontWeight: "700", color: colors.ink },
  hotelMetaRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 4 },
  hotelPlace: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  hotelRating: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "700", color: colors.ink },
  hotelReviews: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  hotelPrice: { marginLeft: "auto", fontFamily: fonts.sans, fontSize: 16, fontWeight: "800", color: colors.navy },
  hotelPriceUnit: { fontSize: 11, fontWeight: "600", color: colors.muted },
  hotelAmenities: { marginTop: 6, fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  hotelNote: {
    marginTop: 8,
    flexDirection: "row",
    gap: 6,
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  hotelNoteText: { flex: 1, fontFamily: fonts.sans, fontSize: 11, lineHeight: 15, color: colors.muted },
  hotelNoteLabel: { fontWeight: "700", color: colors.ink },

  flightsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  flightRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  flightRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  flightAirline: { width: 74, flexDirection: "column", gap: 3 },
  flightAirlineText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: "700", color: colors.ink },
  flightTimes: { flex: 1, alignItems: "center" },
  flightTime: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.ink },
  flightCode: { fontSize: 11, fontWeight: "600", color: colors.muted },
  flightDur: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginVertical: 1 },
  flightRight: { alignItems: "flex-end", gap: 4 },
  flightPrice: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "800", color: colors.navy },

  itinCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  itinImage: { width: 64, height: 64, borderRadius: radius.md },
  itinDate: { alignItems: "center", width: 42 },
  itinMon: { fontFamily: fonts.sans, fontSize: 11, fontWeight: "700", color: colors.navy },
  itinDay: { fontFamily: fonts.serif, fontSize: 22, fontWeight: "800", color: colors.ink, lineHeight: 26 },
  itinYear: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted },
  itinBody: { flex: 1, minWidth: 0 },
  itinTitle: { fontFamily: fonts.serif, fontSize: 16, fontWeight: "700", color: colors.ink },
  itinDates: { marginTop: 2, fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  itinTags: { marginTop: 6, flexDirection: "row", gap: 5 },
  itinTag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken },
  itinTagText: { fontFamily: fonts.sans, fontSize: 10, fontWeight: "600", color: colors.navy },

  emptyCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: "center" },
});
