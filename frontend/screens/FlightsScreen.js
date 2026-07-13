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
import { colors, fonts, radius, spacing } from "../theme/tokens";

const trustPoints = [
  { icon: "pricetag-outline", title: "Best Prices", subtitle: "We compare so you save more" },
  { icon: "shield-checkmark-outline", title: "No Hidden Fees", subtitle: "What you see is what you pay" },
  { icon: "lock-closed-outline", title: "Secure Booking", subtitle: "Book with confidence every time" },
  { icon: "headset-outline", title: "24/7 Support", subtitle: "We're here to help anytime" },
];

const flights = [
  {
    badge: "Best Overall",
    airline: "ANA",
    airlineFull: "All Nippon Airways",
    departTime: "11:15 AM",
    departCode: "LAX",
    duration: "11h 20m",
    stops: "Nonstop",
    nonstop: true,
    arriveTime: "3:35 PM",
    arrivePlus: "+1",
    arriveCode: "NRT",
    price: "$765",
  },
  {
    badge: "Best Price",
    airline: "KOREAN AIR",
    airlineFull: "",
    departTime: "1:20 PM",
    departCode: "LAX",
    duration: "13h 45m",
    stops: "1 stop · ICN",
    nonstop: false,
    arriveTime: "6:05 PM",
    arrivePlus: "+1",
    arriveCode: "NRT",
    price: "$612",
  },
  {
    badge: "Shortest Duration",
    airline: "JAPAN AIRLINES",
    airlineFull: "",
    departTime: "12:45 PM",
    departCode: "LAX",
    duration: "10h 35m",
    stops: "Nonstop",
    nonstop: true,
    arriveTime: "4:20 PM",
    arrivePlus: "+1",
    arriveCode: "NRT",
    price: "$812",
  },
];

function FlightCard({ flight }) {
  return (
    <View style={styles.flightCard}>
      <View style={styles.flightTop}>
        <View style={styles.flightBadge}>
          <Text style={styles.flightBadgeText}>{flight.badge}</Text>
        </View>
        <Ionicons name="heart-outline" size={18} color={colors.faint} />
      </View>

      <View style={styles.airlineRow}>
        <View style={styles.airlineMark}>
          <Ionicons name="airplane" size={15} color={colors.navy} />
        </View>
        <View>
          <Text style={styles.airlineName}>{flight.airline}</Text>
          {flight.airlineFull ? (
            <Text style={styles.airlineFull}>{flight.airlineFull}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.timeline}>
        <View style={styles.timeCol}>
          <Text style={styles.time}>{flight.departTime}</Text>
          <Text style={styles.code}>{flight.departCode}</Text>
        </View>

        <View style={styles.durationCol}>
          <Text style={styles.duration}>{flight.duration}</Text>
          <View style={styles.line}>
            <View style={styles.dot} />
            <View style={styles.lineBar} />
            {!flight.nonstop ? <View style={styles.stopDot} /> : null}
            <View style={styles.lineBar} />
            <View style={styles.dot} />
          </View>
          <Text style={[styles.stops, flight.nonstop && styles.nonstop]}>{flight.stops}</Text>
        </View>

        <View style={[styles.timeCol, styles.timeColRight]}>
          <Text style={styles.time}>
            {flight.arriveTime} <Text style={styles.plus}>{flight.arrivePlus}</Text>
          </Text>
          <Text style={styles.code}>{flight.arriveCode}</Text>
        </View>
      </View>

      <View style={styles.flightBottom}>
        <View>
          <Text style={styles.price}>{flight.price}</Text>
          <Text style={styles.priceMeta}>round trip</Text>
        </View>
        <Pressable style={styles.detailsButton}>
          <Text style={styles.detailsText}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FlightsScreen({ onBack }) {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FeatureHeader
          title="Flights"
          subtitle="Find the best flights for"
          accentTail="your next adventure."
          onBack={onBack}
        />

        {/* Search */}
        <View style={styles.searchCard}>
          <View style={styles.searchHeaderRow}>
            <View style={styles.searchIcon}>
              <Ionicons name="airplane" size={18} color={colors.navy} />
            </View>
            <Text style={styles.searchTitle}>Search Flights</Text>
          </View>
          <Text style={styles.searchSubtitle}>Compare prices and book with confidence.</Text>

          <View style={styles.routeRow}>
            <View style={styles.routeField}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeValue}>
                <Text style={styles.routeCode}>LAX</Text>  Los Angeles
              </Text>
            </View>
            <View style={styles.swap}>
              <Ionicons name="swap-horizontal" size={16} color={colors.navy} />
            </View>
            <View style={styles.routeField}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeValue}>
                <Text style={styles.routeCode}>NRT</Text>  Tokyo (Narita)
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={[styles.routeFieldWide]}>
              <View style={styles.dateCols}>
                <View>
                  <Text style={styles.routeLabel}>Depart</Text>
                  <Text style={styles.dateValue}>Jul 12, 2025</Text>
                </View>
                <View>
                  <Text style={styles.routeLabel}>Return</Text>
                  <Text style={styles.dateValue}>Jul 19, 2025</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.travelerField}>
            <Text style={styles.routeLabel}>Travelers</Text>
            <Text style={styles.dateValue}>1 Traveler, Economy</Text>
          </View>

          <Pressable style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search Flights</Text>
          </Pressable>
        </View>

        {/* Trust */}
        <View style={styles.trustGrid}>
          {trustPoints.map((p) => (
            <View key={p.title} style={styles.trustCard}>
              <Ionicons name={p.icon} size={18} color={colors.gold} />
              <Text style={styles.trustTitle}>{p.title}</Text>
              <Text style={styles.trustSubtitle}>{p.subtitle}</Text>
            </View>
          ))}
        </View>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>Best Flights</Text>
            <Text style={styles.resultsSubtitle}>Top picks for your search</Text>
          </View>
          <View style={styles.sortPill}>
            <Ionicons name="funnel-outline" size={13} color={colors.muted} />
            <Text style={styles.sortText}>Sort by: Best Price</Text>
          </View>
        </View>

        {flights.map((flight) => (
          <FlightCard key={flight.airline} flight={flight} />
        ))}

        {/* Track banner */}
        <View style={styles.trackBanner}>
          <View style={styles.trackText}>
            <Text style={styles.trackTitle}>Not sure when to book?</Text>
            <Text style={styles.trackSubtitle}>
              Wayfinder analyzes prices daily and will notify you when prices drop.
            </Text>
          </View>
          <Pressable style={styles.trackButton}>
            <Ionicons name="notifications-outline" size={15} color={colors.gold} />
            <Text style={styles.trackButtonText}>Track This Route</Text>
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
  searchHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.onDark,
    alignItems: "center",
    justifyContent: "center",
  },
  searchTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.onDark },
  searchSubtitle: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.onDarkMuted,
  },

  routeRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  routeField: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  routeFieldWide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  routeLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  routeValue: { marginTop: 3, fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  routeCode: { fontWeight: "700" },
  swap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.onDark,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsRow: { marginTop: spacing.sm },
  dateCols: { flexDirection: "row", justifyContent: "space-between" },
  dateValue: { marginTop: 3, fontFamily: fonts.sans, fontSize: 14, fontWeight: "600", color: colors.ink },
  travelerField: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  searchButton: {
    marginTop: spacing.lg,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },

  trustGrid: {
    marginTop: spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  trustCard: {
    width: "48%",
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 6,
  },
  trustTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.ink },
  trustSubtitle: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: colors.muted },

  resultsHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  resultsSubtitle: { marginTop: 2, fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  sortText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600", color: colors.muted },

  flightCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  flightTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flightBadge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  flightBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: colors.gold,
  },
  airlineRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  airlineMark: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  airlineName: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  airlineFull: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  timeline: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  timeCol: { flex: 1 },
  timeColRight: { alignItems: "flex-end" },
  time: { fontFamily: fonts.sans, fontSize: 16, fontWeight: "700", color: colors.ink },
  plus: { fontSize: 11, color: colors.terracotta, fontWeight: "700" },
  code: { marginTop: 2, fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  durationCol: { flex: 1.4, alignItems: "center", paddingHorizontal: spacing.sm },
  duration: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  line: {
    marginVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
  },
  lineBar: { flex: 1, height: 1, backgroundColor: colors.line },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.faint },
  stopDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold },
  stops: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  nonstop: { color: "#3E6B4A", fontWeight: "600" },

  flightBottom: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: { fontFamily: fonts.sans, fontSize: 20, fontWeight: "700", color: colors.ink },
  priceMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  detailsButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  detailsText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "700", color: colors.gold },

  trackBanner: {
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunken,
  },
  trackText: { marginBottom: spacing.md },
  trackTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "700", color: colors.ink },
  trackSubtitle: { marginTop: 4, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  trackButton: {
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
  trackButtonText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: "700", color: colors.gold },
});
