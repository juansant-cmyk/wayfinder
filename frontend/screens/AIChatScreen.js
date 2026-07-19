import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as dashboardApi from "../src/api/dashboard";
import { getToken } from "../src/auth/tokenStorage";
import MarkdownText from "../src/ui/MarkdownText";
import { WayfinderBrand } from "./AuthShared";
import BottomNav, { BOTTOM_NAV_CONTENT_PADDING } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

const approvedTopBlockImage = require("../assets/images/ai-chat-approved-top-block.png");
const mobileTopBlockImage = require("../assets/images/ai-chat-top-mobile-reference.png");
const heroIllustrationImage = require("../assets/images/ai-chat-hero-art-reference.png");
const heroTitleBotImage = require("../assets/images/ai-chat-title-bot-reference.png");
const introBotImage = require("../assets/images/ai-chat-intro-bot-reference.png");

const HELP_CARDS = [
  {
    title: "Plan a Trip",
    description: "Create an itinerary based on your needs",
    inputText: "Plan a Trip",
    icon: "calendar-star",
    iconFamily: "material",
    iconBackground: "#EEEAFF",
    iconColor: "#6454FF",
  },
  {
    title: "Find Hotels",
    description: "Get hotel recommendations",
    inputText: "Find Hotels",
    icon: "bed-outline",
    iconFamily: "ion",
    iconBackground: "#E8F7EE",
    iconColor: "#2EA764",
  },
  {
    title: "Check Weather",
    description: "See forecasts for your destination",
    inputText: "Check Weather",
    icon: "partly-sunny-outline",
    iconFamily: "ion",
    iconBackground: "#FFF2E1",
    iconColor: "#F6A623",
  },
  {
    title: "Safety Tips",
    description: "Get safety info for your destination",
    inputText: "Safety Tips",
    icon: "shield-checkmark-outline",
    iconFamily: "ion",
    iconBackground: "#EAF3FF",
    iconColor: "#3D82FF",
  },
  {
    title: "Explore Places",
    description: "Discover top attractions, food, and more",
    inputText: "Explore Places",
    icon: "map-marker-radius-outline",
    iconFamily: "material",
    iconBackground: "#FFE8F4",
    iconColor: "#E35AB5",
  },
  {
    title: "Budget Help",
    description: "Tips to save money while traveling",
    inputText: "Budget Help",
    icon: "cash-multiple",
    iconFamily: "material",
    iconBackground: "#E7F8EB",
    iconColor: "#25A357",
  },
];

const POPULAR_QUESTIONS = [
  {
    label: "Best restaurants in Tokyo",
    icon: "restaurant-outline",
    iconFamily: "ion",
  },
  {
    label: "Is Tokyo safe for tourists?",
    icon: "shield-checkmark-outline",
    iconFamily: "ion",
  },
  {
    label: "How to get around Tokyo?",
    icon: "train-outline",
    iconFamily: "ion",
  },
  {
    label: "Packing list for Japan",
    icon: "briefcase-outline",
    iconFamily: "ion",
  },
  {
    label: "What to do in 3 days?",
    icon: "calendar-clear-outline",
    iconFamily: "ion",
  },
  {
    label: "Best time to visit Japan?",
    icon: "time-outline",
    iconFamily: "ion",
  },
];

const CHAT_NAV_ITEMS = [
  {
    label: "Home",
    route: "home",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    label: "Itinerary",
    route: "itinerary",
    icon: "calendar-clear-outline",
    activeIcon: "calendar-clear",
  },
  {
    label: "Flights",
    route: "flights",
    icon: "airplane-outline",
    activeIcon: "airplane",
  },
  {
    label: "AI Chat",
    route: "chat",
    icon: "chatbubble-ellipses-outline",
    activeIcon: "chatbubble-ellipses",
  },
  {
    label: "Profile",
    route: "profile",
    icon: "person-outline",
    activeIcon: "person",
  },
];

const cardShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 14px 28px rgba(143, 163, 191, 0.12)",
  },
  default: {
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
});

const chipShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 10px 20px rgba(163, 178, 204, 0.08)",
  },
  default: {
    shadowColor: "#A3B2CC",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});

function IconBadge({ icon, iconFamily, color, size = 28 }) {
  if (iconFamily === "material") {
    return <MaterialCommunityIcons name={icon} size={size} color={color} />;
  }

  return <Ionicons name={icon} size={size} color={color} />;
}

function HelpCard({ item, width, onPress, compact = false }) {
  return (
    <DimPressable
      onPress={onPress}
      style={[styles.helpCard, compact && styles.helpCardCompact, cardShadowStyle, { width }]}
    >
      <View
        style={[
          styles.helpCardIconWrap,
          compact && styles.helpCardIconWrapCompact,
          { backgroundColor: item.iconBackground },
        ]}
      >
        <IconBadge
          icon={item.icon}
          iconFamily={item.iconFamily}
          color={item.iconColor}
          size={compact ? 24 : 28}
        />
      </View>
      <Text style={[styles.helpCardTitle, compact && styles.helpCardTitleCompact]}>
        {item.title}
      </Text>
      <Text
        style={[styles.helpCardDescription, compact && styles.helpCardDescriptionCompact]}
      >
        {item.description}
      </Text>
    </DimPressable>
  );
}

function PopularQuestionChip({ item, width, onPress, compact = false, singleColumn = false }) {
  return (
    <DimPressable
      onPress={onPress}
      style={[
        styles.questionChip,
        compact && styles.questionChipCompact,
        chipShadowStyle,
        { width },
      ]}
    >
      <IconBadge
        icon={item.icon}
        iconFamily={item.iconFamily}
        color="#6C63FF"
        size={compact ? 18 : 20}
      />
      <Text
        numberOfLines={singleColumn ? 2 : 1}
        style={[styles.questionChipLabel, compact && styles.questionChipLabelCompact]}
      >
        {item.label}
      </Text>
    </DimPressable>
  );
}

function MessageBubble({ message, compact = false }) {
  const isUser = message.role === "user";
  const textStyle = [
    styles.messageText,
    compact && styles.messageTextCompact,
    isUser ? styles.userMessageText : styles.assistantMessageText,
  ];

  return (
    <View
      style={[
        styles.messageBubble,
        compact && styles.messageBubbleCompact,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text style={[styles.messageMeta, isUser ? styles.userMeta : styles.assistantMeta]}>
        {isUser ? "You" : "Wayfinder"}
      </Text>
      {isUser ? (
        <Text style={textStyle}>{message.text}</Text>
      ) : (
        <MarkdownText text={message.text} style={textStyle} />
      )}
    </View>
  );
}

const WELCOME_MESSAGE_ID = "assistant-welcome";
const WELCOME_TEXT =
  "Tap a card or popular question to prefill the chat, then send — I'll use your active trip, weather, and favorites.";

export default function AIChatScreen({ onNavigate, onBack }) {
  const { width } = useWindowDimensions();
  const inputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: WELCOME_MESSAGE_ID,
      role: "assistant",
      text: WELCOME_TEXT,
    },
  ]);

  const isPhone = width < 430;
  const isNarrowPhone = width < 390;
  const useStructuredPhoneTop = isPhone;
  const useMobileTopBlock = !useStructuredPhoneTop && width < 520;
  const pageHorizontalPadding = 18;
  const pageBottomPadding = BOTTOM_NAV_CONTENT_PADDING;
  const cardGap = isPhone ? 12 : 16;
  const questionGap = isPhone ? 10 : 12;
  const columns = width >= 920 ? 3 : 2;
  const questionColumns = width >= 860 ? 3 : width >= 620 ? 2 : 1;
  const availableContentWidth = Math.max(width - pageHorizontalPadding * 2, 280);
  const pageWidth = Math.min(availableContentWidth, 1120);
  const mobileHeroImageHeight = Math.round((availableContentWidth * 292) / 448);
  const helpCardWidth = (pageWidth - (columns - 1) * cardGap) / columns;
  const questionChipWidth = (pageWidth - (questionColumns - 1) * questionGap) / questionColumns;
  const topBlockSource = useMobileTopBlock ? mobileTopBlockImage : approvedTopBlockImage;
  const topBlockAspectRatio = useMobileTopBlock ? 853 / 510 : 1308 / 820;

  function focusComposerWithText(nextMessage) {
    setMessage(nextMessage);
    setTimeout(() => {
      inputRef.current?.focus?.();
    }, 0);
  }

  async function handleSend() {
    const trimmed = message.trim();

    if (!trimmed || sending) {
      return;
    }

    const stamp = Date.now();
    const userId = `user-${stamp}`;
    const thinkingId = `thinking-${stamp}`;

    setSending(true);
    setMessage("");
    setMessages((currentMessages) => {
      const withoutWelcome = currentMessages.filter((item) => item.id !== WELCOME_MESSAGE_ID);
      return [
        ...withoutWelcome,
        { id: userId, role: "user", text: trimmed },
        {
          id: thinkingId,
          role: "assistant",
          text: "Wayfinder is thinking…",
        },
      ];
    });

    try {
      const token = await getToken();

      if (!token) {
        setMessages((currentMessages) =>
          currentMessages.map((item) =>
            item.id === thinkingId
              ? {
                  ...item,
                  id: `assistant-${stamp}`,
                  text: "Sign in to chat with Wayfinder.",
                }
              : item
          )
        );
        return;
      }

      const response = await dashboardApi.sendChatMessage(token, trimmed);
      const reply =
        typeof response?.reply === "string" && response.reply.trim()
          ? response.reply.trim()
          : "I didn't get a reply. Try again in a moment.";

      setMessages((currentMessages) =>
        currentMessages.map((item) =>
          item.id === thinkingId
            ? { ...item, id: `assistant-${stamp}`, text: reply }
            : item
        )
      );
    } catch (sendError) {
      const text =
        sendError instanceof Error ? sendError.message : "Request failed. Please try again.";
      setMessages((currentMessages) =>
        currentMessages.map((item) =>
          item.id === thinkingId
            ? { ...item, id: `assistant-error-${stamp}`, text }
            : item
        )
      );
    } finally {
      setSending(false);
    }
  }

  const canSend = Boolean(message.trim()) && !sending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: 18,
              paddingHorizontal: pageHorizontalPadding,
              paddingBottom: pageBottomPadding,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onBack || (() => onNavigate?.("home"))}
                style={styles.roundHeaderButton}
              >
                <Ionicons name="arrow-back" size={28} color="#14253E" />
              </DimPressable>

              <View style={styles.brandSlot}>
                <WayfinderBrand
                  containerStyle={styles.headerBrandRow}
                  textStyle={styles.headerBrandText}
                />
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  style={styles.headerActionButton}
                >
                  <Ionicons name="notifications-outline" size={28} color="#111827" />
                  <View style={styles.notificationDot} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                  style={styles.headerActionButton}
                >
                  <Ionicons name="person-circle-outline" size={33} color="#111827" />
                </Pressable>
              </View>
            </View>

            {useStructuredPhoneTop ? (
              <View style={styles.mobileTopSection}>
                <View style={styles.mobileHeroCopy}>
                  <View style={styles.mobileHeroTitleRow}>
                    <Text
                      style={[
                        styles.mobileHeroTitle,
                        isNarrowPhone && styles.mobileHeroTitleNarrow,
                      ]}
                    >
                      AI Chat
                    </Text>
                    <Image
                      source={heroTitleBotImage}
                      resizeMode="contain"
                      style={[
                        styles.mobileHeroTitleBot,
                        isNarrowPhone && styles.mobileHeroTitleBotNarrow,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.mobileHeroAccent,
                      isNarrowPhone && styles.mobileHeroAccentNarrow,
                    ]}
                  >
                    Your smart travel assistant.
                  </Text>
                  <Text
                    style={[
                      styles.mobileHeroDescription,
                      isNarrowPhone && styles.mobileHeroDescriptionNarrow,
                    ]}
                  >
                    Ask about trips, hotels, safety, weather, maps, or budgets.
                  </Text>
                </View>

                <View
                  style={[
                    styles.mobileHeroArtWrap,
                    {
                      height: mobileHeroImageHeight,
                    },
                  ]}
                >
                  <Image
                    source={heroIllustrationImage}
                    resizeMode="contain"
                    style={styles.mobileHeroArt}
                  />
                </View>

                <View style={[styles.mobileIntroCard, cardShadowStyle]}>
                  <Image
                    source={introBotImage}
                    resizeMode="cover"
                    style={[
                      styles.mobileIntroBot,
                      isNarrowPhone && styles.mobileIntroBotNarrow,
                    ]}
                  />
                  <View style={styles.mobileIntroCopy}>
                    <Text
                      style={[
                        styles.mobileIntroTitle,
                        isNarrowPhone && styles.mobileIntroTitleNarrow,
                      ]}
                    >
                      Hi, I&apos;m Wayfinder! 👋
                    </Text>
                    <Text
                      style={[
                        styles.mobileIntroDescription,
                        isNarrowPhone && styles.mobileIntroDescriptionNarrow,
                      ]}
                    >
                      I can help you plan your trip, find recommendations, and answer any
                      travel questions.
                    </Text>
                    <Text
                      style={[
                        styles.mobileIntroQuestion,
                        isNarrowPhone && styles.mobileIntroQuestionNarrow,
                      ]}
                    >
                      What would you like to know today?
                    </Text>
                  </View>
                  <Ionicons
                    name="sparkles"
                    size={isNarrowPhone ? 24 : 28}
                    color="#7B71FF"
                    style={styles.mobileIntroSparkles}
                  />
                </View>
              </View>
            ) : (
              <View style={[styles.topBlockWrap, isPhone && styles.topBlockWrapCompact]}>
                <Image
                  source={topBlockSource}
                  resizeMode="contain"
                  style={[
                    styles.topBlockImage,
                    isPhone && styles.topBlockImageCompact,
                    { aspectRatio: topBlockAspectRatio },
                  ]}
                />
              </View>
            )}

            <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
              Things I can help you with
            </Text>
            <View style={[styles.helpGrid, { gap: cardGap }]}>
              {HELP_CARDS.map((item) => (
                <HelpCard
                  key={item.title}
                  item={item}
                  width={helpCardWidth}
                  compact={isPhone}
                  onPress={() => focusComposerWithText(item.inputText)}
                />
              ))}
            </View>

            <Text
              style={[
                styles.sectionTitle,
                styles.popularSectionTitle,
                isPhone && styles.popularSectionTitleCompact,
              ]}
            >
              Popular questions
            </Text>
            <View style={[styles.questionsGrid, { gap: questionGap }]}>
              {POPULAR_QUESTIONS.map((item) => (
                <PopularQuestionChip
                  key={item.label}
                  item={item}
                  width={questionChipWidth}
                  compact={isPhone}
                  singleColumn={questionColumns === 1}
                  onPress={() => focusComposerWithText(item.label)}
                />
              ))}
            </View>

            <View
              style={[
                styles.startConversationSection,
                isPhone && styles.startConversationSectionCompact,
              ]}
            >
              <View
                style={[
                  styles.startConversationBadge,
                  isPhone && styles.startConversationBadgeCompact,
                ]}
              >
                <Ionicons name="chatbubbles-outline" size={40} color="#8B81FF" />
              </View>
              <Text
                style={[
                  styles.startConversationTitle,
                  isPhone && styles.startConversationTitleCompact,
                ]}
              >
                Start a conversation
              </Text>
              <Text
                style={[
                  styles.startConversationDescription,
                  isPhone && styles.startConversationDescriptionCompact,
                ]}
              >
                Ask me anything about your trip and I&apos;ll help you plan the best
                experience!
              </Text>
            </View>

            {messages.length ? (
              <View style={[styles.messagesSection, isPhone && styles.messagesSectionCompact]}>
                {messages.map((item) => (
                  <MessageBubble key={item.id} message={item} compact={isPhone} />
                ))}
              </View>
            ) : null}

            <View
              style={[
                styles.composerShell,
                isPhone && styles.composerShellCompact,
                cardShadowStyle,
              ]}
            >
              <TextInput
                ref={inputRef}
                value={message}
                onChangeText={setMessage}
                placeholder="Ask me anything about your trip..."
                placeholderTextColor="#9BA8C2"
                style={[styles.composerInput, isPhone && styles.composerInputCompact]}
                returnKeyType="send"
                editable={!sending}
                onSubmitEditing={handleSend}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                disabled={!canSend}
                onPress={handleSend}
                style={[
                  styles.sendButton,
                  isPhone && styles.sendButtonCompact,
                  !canSend && styles.sendButtonDisabled,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <BottomNav
          activeLabel="AI Chat"
          items={CHAT_NAV_ITEMS}
          onNavigate={onNavigate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8FF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F5F8FF",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#F5F8FF",
  },

  scrollContent: {
    alignItems: "center",
  },

  page: {
    width: "100%",
    maxWidth: 1040,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  roundHeaderButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  brandSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  headerBrandRow: {
    alignSelf: "auto",
    marginRight: 0,
  },

  headerBrandText: {
    fontSize: 26,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerActionButton: {
    width: 50,
    height: 50,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF7A32",
  },

  topBlockWrap: {
    width: "100%",
    marginTop: 8,
  },

  topBlockWrapCompact: {
    marginTop: 6,
  },

  topBlockImage: {
    width: "100%",
  },

  topBlockImageCompact: {
    width: "100%",
  },

  mobileTopSection: {
    marginTop: 4,
  },

  mobileHeroCopy: {
    paddingTop: 8,
  },

  mobileHeroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  mobileHeroTitle: {
    flexShrink: 1,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -1.8,
    color: "#12214B",
  },

  mobileHeroTitleNarrow: {
    fontSize: 38,
    lineHeight: 42,
  },

  mobileHeroTitleBot: {
    width: 34,
    height: 34,
    marginLeft: 6,
  },

  mobileHeroTitleBotNarrow: {
    width: 30,
    height: 30,
  },

  mobileHeroAccent: {
    marginTop: 14,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#5B59FF",
  },

  mobileHeroAccentNarrow: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 23,
  },

  mobileHeroDescription: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: "#243459",
  },

  mobileHeroDescriptionNarrow: {
    fontSize: 14,
    lineHeight: 22,
  },

  mobileHeroArtWrap: {
    width: "100%",
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  mobileHeroArt: {
    width: "100%",
    height: "100%",
  },

  mobileIntroCard: {
    marginTop: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(208, 220, 247, 0.88)",
    backgroundColor: "rgba(249, 251, 255, 0.96)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  mobileIntroBot: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },

  mobileIntroBotNarrow: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },

  mobileIntroCopy: {
    flex: 1,
    flexShrink: 1,
    paddingLeft: 12,
    paddingRight: 8,
  },

  mobileIntroTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: "#12214B",
  },

  mobileIntroTitleNarrow: {
    fontSize: 18,
    lineHeight: 23,
  },

  mobileIntroDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#243459",
  },

  mobileIntroDescriptionNarrow: {
    fontSize: 13,
    lineHeight: 20,
  },

  mobileIntroQuestion: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#5B59FF",
  },

  mobileIntroQuestionNarrow: {
    fontSize: 14,
    lineHeight: 20,
  },

  mobileIntroSparkles: {
    marginRight: 2,
  },

  sectionTitle: {
    marginTop: 22,
    fontSize: 18,
    fontWeight: "800",
    color: "#18264A",
    letterSpacing: -0.3,
  },

  sectionTitleCompact: {
    marginTop: 18,
    fontSize: 17,
  },

  popularSectionTitle: {
    marginTop: 26,
  },

  popularSectionTitleCompact: {
    marginTop: 22,
  },

  helpGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  helpCard: {
    minHeight: 190,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(145, 170, 219, 0.14)",
    alignItems: "center",
  },

  helpCardCompact: {
    height: 150,
    minHeight: 150,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: "flex-start",
  },

  helpCardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  helpCardIconWrapCompact: {
    width: 54,
    height: 54,
    borderRadius: 18,
  },

  helpCardTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: "#18264A",
    textAlign: "center",
    letterSpacing: -0.4,
  },

  helpCardTitleCompact: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 20,
  },

  helpCardDescription: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 27,
    color: "#334467",
    textAlign: "center",
  },

  helpCardDescriptionCompact: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
  },

  questionsGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  questionChip: {
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#D9DDFF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  questionChipCompact: {
    minHeight: 46,
    borderRadius: 22,
    paddingHorizontal: 14,
    gap: 8,
  },

  questionChipLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#5F58FF",
  },

  questionChipLabelCompact: {
    fontSize: 14,
  },

  startConversationSection: {
    marginTop: 44,
    alignItems: "center",
    alignSelf: "center",
    maxWidth: 460,
  },

  startConversationSectionCompact: {
    marginTop: 32,
    maxWidth: 360,
  },

  startConversationBadge: {
    width: 180,
    height: 86,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CEC7FF",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  startConversationBadgeCompact: {
    width: 150,
    height: 74,
    borderRadius: 20,
  },

  startConversationTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "800",
    color: "#17244A",
    letterSpacing: -0.4,
  },

  startConversationTitleCompact: {
    marginTop: 14,
    fontSize: 18,
  },

  startConversationDescription: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 29,
    color: "#243459",
    textAlign: "center",
  },

  startConversationDescriptionCompact: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 24,
  },

  messagesSection: {
    marginTop: 28,
    gap: 12,
  },

  messagesSectionCompact: {
    marginTop: 20,
    gap: 10,
  },

  messageBubble: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 15,
    maxWidth: "82%",
  },

  messageBubbleCompact: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: "88%",
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#5B59FF",
  },

  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F7",
  },

  messageMeta: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  userMeta: {
    color: "rgba(255, 255, 255, 0.84)",
  },

  assistantMeta: {
    color: "#5D6F95",
  },

  messageText: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 26,
  },

  messageTextCompact: {
    fontSize: 15,
    lineHeight: 22,
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  assistantMessageText: {
    color: "#22324E",
  },

  composerShell: {
    marginTop: 22,
    marginBottom: 8,
    minHeight: 86,
    borderRadius: 28,
    paddingLeft: 24,
    paddingRight: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(145, 170, 219, 0.12)",
    flexDirection: "row",
    alignItems: "center",
  },

  composerShellCompact: {
    marginTop: 18,
    minHeight: 74,
    borderRadius: 22,
    paddingLeft: 18,
    paddingRight: 12,
    paddingVertical: 10,
  },

  composerInput: {
    flex: 1,
    fontSize: 18,
    color: "#22324E",
    paddingVertical: 10,
    paddingRight: 12,
  },

  composerInputCompact: {
    fontSize: 16,
    paddingVertical: 8,
  },

  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7264FF",
  },

  sendButtonCompact: {
    width: 48,
    height: 48,
    borderRadius: 17,
  },

  sendButtonDisabled: {
    backgroundColor: "#B6B6D8",
  },
});
