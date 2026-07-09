import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as dashboardApi from "../src/api/dashboard";
import { getToken } from "../src/auth/tokenStorage";
import ScreenLayout from "./shared/ScreenLayout";
import { accents, colors, fonts, radius, spacing, tint } from "../theme/tokens";

const capabilities = [
  { title: "Plan a Trip", subtitle: "Create an itinerary based on your needs", icon: "map-outline", accent: accents.blue },
  { title: "Find Hotels", subtitle: "Get hotel recommendations", icon: "bed-outline", accent: accents.terracotta },
  { title: "Check Weather", subtitle: "See forecasts for your destination", icon: "partly-sunny-outline", accent: accents.amber },
  { title: "Safety Tips", subtitle: "Get safety info for your destination", icon: "shield-checkmark-outline", accent: accents.green },
  { title: "Explore Places", subtitle: "Discover top attractions, food, and more", icon: "compass-outline", accent: accents.plum },
  { title: "Budget Help", subtitle: "Tips to save money while traveling", icon: "wallet-outline", accent: accents.teal },
];

const popularQuestions = [
  "Best restaurants in Tokyo",
  "Is Tokyo safe for tourists?",
  "How to get around Tokyo?",
  "Packing list for Japan",
  "What to do in 3 days?",
  "Best time to visit Japan?",
];

export default function ChatScreen({ onBack }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend() {
    const trimmed = message.trim();

    if (!trimmed) {
      setError("Enter a message for Wayfinder.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        setError("Sign in to chat with Wayfinder.");
        return;
      }

      const response = await dashboardApi.sendChatMessage(token, trimmed);
      setReply(response.reply);
    } catch (sendError) {
      const text = sendError instanceof Error ? sendError.message : "Request failed.";
      setError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout title="Ask Wayfinder" onBack={onBack}>
      {/* Intro */}
      <View style={styles.introCard}>
        <View style={styles.introHeader}>
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={18} color={colors.gold} />
          </View>
          <Text style={styles.introLabel}>WAYFINDER AI</Text>
        </View>
        <Text style={styles.introHeading}>Hi, I'm Wayfinder</Text>
        <Text style={styles.introText}>
          I can help you plan your trip, find recommendations, and answer any travel questions.
        </Text>
        <Text style={styles.introQuestion}>What would you like to know today?</Text>
      </View>

      {/* Ask box */}
      <View style={styles.askRow}>
        <TextInput
          value={message}
          onChangeText={(value) => {
            setMessage(value);
            setError(null);
          }}
          style={styles.input}
          placeholder="Ask me anything about your trip..."
          placeholderTextColor={colors.faint}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.onDark} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={colors.onDark} />
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {reply ? (
        <View style={styles.replyCard}>
          <Text style={styles.replyLabel}>WAYFINDER</Text>
          <Text style={styles.replyText}>{reply}</Text>
        </View>
      ) : null}

      {/* Capabilities */}
      <Text style={styles.sectionTitle}>Things I can help you with</Text>
      <View style={styles.grid}>
        {capabilities.map((item) => (
          <Pressable
            key={item.title}
            style={styles.capCard}
            onPress={() => {
              setMessage(item.title);
              setError(null);
            }}
          >
            <View style={[styles.capIcon, { backgroundColor: tint(item.accent) }]}>
              <Ionicons name={item.icon} size={20} color={item.accent} />
            </View>
            <Text style={styles.capTitle}>{item.title}</Text>
            <Text style={styles.capSubtitle}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      {/* Popular questions */}
      <Text style={styles.sectionTitle}>Popular questions</Text>
      <View style={styles.chipsWrap}>
        {popularQuestions.map((question) => (
          <Pressable
            key={question}
            style={styles.chip}
            onPress={() => {
              setMessage(question);
              setError(null);
            }}
          >
            <Text style={styles.chipText}>{question}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  introCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },

  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },

  introLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.gold,
  },

  introHeading: {
    marginTop: spacing.lg,
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
    letterSpacing: -0.2,
  },

  introText: {
    marginTop: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },

  introQuestion: {
    marginTop: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: "600",
    color: colors.gold,
  },

  askRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },

  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    textAlignVertical: "top",
  },

  sendButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.navy,
  },

  errorText: {
    marginTop: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
  },

  replyCard: {
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },

  replyLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.gold,
  },

  replyText: {
    marginTop: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },

  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.2,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  capCard: {
    width: "48%",
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },

  capIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  capTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },

  capSubtitle: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunken,
  },

  chipText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
  },
});
