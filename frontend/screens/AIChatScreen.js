import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as dashboardApi from "../src/api/dashboard";
import { getToken } from "../src/auth/tokenStorage";
import MarkdownText from "../src/ui/MarkdownText";
import BottomNav, { getBottomNavContentPadding } from "./shared/BottomNav";
import DimPressable from "./shared/DimPressable";

/**
 * Poppins for AI Chat (geometric sans matching Ally’s mockups).
 * Ally’s push (5e9781b) used the platform system UI font only — no Google Fonts.
 * Display titles use Bold (700), not ExtraBold.
 * Help card titles use Inter SemiBold; intro title uses Poppins Bold.
 */
const FONT = {
  regular: "Poppins_400Regular",
  italic: "Poppins_400Regular_Italic",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  /** Display titles / section headers — Poppins Bold. */
  display: "Poppins_700Bold",
  bold: "Poppins_700Bold",
  /** Help card titles — Inter SemiBold. */
  helpTitle: "Inter_600SemiBold",
};

const approvedTopBlockImage = require("../assets/images/ai-chat-approved-top-block.png");
const mobileTopBlockImage = require("../assets/images/ai-chat-top-mobile-reference.png");
const heroIllustrationImage = require("../assets/images/ai-chat-hero-art-reference.png");
const heroTitleBotImage = require("../assets/images/ai-chat-title-bot-reference.png");
const introBotImage = require("../assets/images/ai-chat-intro-bot-reference.png");
const helpPlanImage = require("../assets/images/ai-chat-help-plan.png");
const helpHotelsImage = require("../assets/images/ai-chat-help-hotels.png");
const helpWeatherImage = require("../assets/images/ai-chat-help-weather.png");
const helpSafetyImage = require("../assets/images/ai-chat-help-safety.png");
const helpExploreImage = require("../assets/images/ai-chat-help-explore.png");
const helpBudgetImage = require("../assets/images/ai-chat-help-budget.png");
const questionRestaurantsImage = require("../assets/images/ai-chat-q-restaurants.png");
const questionSafetyImage = require("../assets/images/ai-chat-q-safety.png");
const questionTransitImage = require("../assets/images/ai-chat-q-transit.png");
const questionPackingImage = require("../assets/images/ai-chat-q-packing.png");
const questionItineraryImage = require("../assets/images/ai-chat-q-itinerary.png");
const questionTimingImage = require("../assets/images/ai-chat-q-timing.png");

// Intrinsic size of ai-chat-hero-art-reference.png (448×292).
const HERO_ART_INTRINSIC_WIDTH = 448;
const HERO_ART_INTRINSIC_HEIGHT = 292;
const HERO_ART_ASPECT_RATIO = HERO_ART_INTRINSIC_WIDTH / HERO_ART_INTRINSIC_HEIGHT;
// PNG includes a flat lavender “card lip” under the robot ground line (~y 262–291).
const HERO_ART_CARD_LIP_PX = 30;

const HELP_CARDS = [
  {
    title: "Plan a Trip",
    description: "Create an itinerary based on your needs",
    inputText: "Plan a Trip",
    iconImage: helpPlanImage,
    iconBackground: "transparent",
  },
  {
    title: "Find Hotels",
    description: "Get hotel recommendations",
    inputText: "Find Hotels",
    iconImage: helpHotelsImage,
    iconBackground: "transparent",
  },
  {
    title: "Check Weather",
    description: "See forecasts for your destination",
    inputText: "Check Weather",
    iconImage: helpWeatherImage,
    iconBackground: "transparent",
  },
  {
    title: "Safety Tips",
    description: "Get safety info for your destination",
    inputText: "Safety Tips",
    iconImage: helpSafetyImage,
    iconBackground: "transparent",
  },
  {
    title: "Explore Places",
    description: "Discover top attractions, food, and more",
    inputText: "Explore Places",
    iconImage: helpExploreImage,
    iconBackground: "transparent",
  },
  {
    title: "Budget Help",
    description: "Tips to save money while traveling",
    inputText: "Budget Help",
    iconImage: helpBudgetImage,
    iconBackground: "transparent",
  },
];

const POPULAR_QUESTIONS = [
  {
    label: "Best restaurants in Tokyo",
    iconImage: questionRestaurantsImage,
  },
  {
    label: "Is Tokyo safe for tourists?",
    iconImage: questionSafetyImage,
  },
  {
    label: "How to get around Tokyo?",
    iconImage: questionTransitImage,
  },
  {
    label: "Packing list for Japan",
    iconImage: questionPackingImage,
  },
  {
    label: "What to do in 3 days?",
    iconImage: questionItineraryImage,
  },
  {
    label: "Best time to visit Japan?",
    iconImage: questionTimingImage,
  },
];

const SOFT_OUTLINE = "rgba(0, 0, 0, 0.06)";

const cardShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 10px 22px rgba(143, 163, 191, 0.08)",
  },
  default: {
    shadowColor: "#8FA3BF",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});

const chipShadowStyle = Platform.select({
  web: {
    boxShadow: "0px 6px 14px rgba(163, 178, 204, 0.06)",
  },
  default: {
    shadowColor: "#A3B2CC",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
});

function IconBadge({ icon, iconFamily, iconImage, color, size = 28 }) {
  if (iconImage) {
    return (
      <Image
        source={iconImage}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    );
  }

  if (iconFamily === "material") {
    return <MaterialCommunityIcons name={icon} size={size} color={color} />;
  }

  return <Ionicons name={icon} size={size} color={color} />;
}

function HelpCard({ item, width, onPress, compact = false, style }) {
  const iconSize = compact ? 26 : 64;
  const hasImageIcon = Boolean(item.iconImage);

  return (
    <DimPressable
      onPress={onPress}
      style={[styles.helpCard, compact && styles.helpCardCompact, cardShadowStyle, { width }, style]}
    >
      <View
        style={[
          styles.helpCardIconWrap,
          compact && styles.helpCardIconWrapCompact,
          {
            backgroundColor: hasImageIcon
              ? "transparent"
              : item.iconBackground || "transparent",
          },
          hasImageIcon && styles.helpCardIconWrapImage,
        ]}
      >
        <IconBadge
          icon={item.icon}
          iconFamily={item.iconFamily}
          iconImage={item.iconImage}
          color={item.iconColor}
          size={hasImageIcon ? iconSize : compact ? 16 : 28}
        />
      </View>
      <Text
        numberOfLines={compact ? 1 : undefined}
        style={[styles.helpCardTitle, compact && styles.helpCardTitleCompact]}
      >
        {item.title}
      </Text>
      <Text
        numberOfLines={compact ? 2 : undefined}
        style={[styles.helpCardDescription, compact && styles.helpCardDescriptionCompact]}
      >
        {item.description}
      </Text>
    </DimPressable>
  );
}

function PopularQuestionChip({ item, width, onPress, compact = false }) {
  const iconSize = compact ? 17 : 22;

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
        iconImage={item.iconImage}
        color="#6C63FF"
        size={iconSize}
      />
      <Text
        numberOfLines={compact ? 2 : 1}
        ellipsizeMode="tail"
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
        <MarkdownText
          text={message.text}
          style={textStyle}
          boldStyle={{ fontFamily: FONT.bold }}
          italicStyle={{ fontFamily: FONT.italic }}
        />
      )}
    </View>
  );
}

const WELCOME_MESSAGE_ID = "assistant-welcome";
const WELCOME_TEXT =
  "Tap a card or popular question and I'll answer using your active trip, weather, and favorites.";

function MessageList({ messages, compact, style }) {
  return (
    <View style={[styles.messageListContent, style]}>
      {messages.map((item) => (
        <MessageBubble key={item.id} message={item} compact={compact} />
      ))}
    </View>
  );
}

export default function AIChatScreen({ onNavigate, onBack }) {
  const [fontsLoaded] = useFonts({
    Inter_600SemiBold,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const pageScrollRef = useRef(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: WELCOME_MESSAGE_ID,
      role: "assistant",
      text: WELCOME_TEXT,
    },
  ]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.some((item) => item.role === "user")) {
      requestAnimationFrame(() => {
        pageScrollRef.current?.scrollToEnd?.({ animated: true });
      });
    }
  }, [messages]);

  const isPhone = width < 430;
  const isCompactPhone = width < 400;
  const isNarrowPhone = width < 390;
  const isShortPhone = isPhone && height < 740;
  const backButtonSize = isCompactPhone ? 40 : isPhone ? 44 : 48;
  const useStructuredPhoneTop = isPhone;
  const useMobileTopBlock = !useStructuredPhoneTop && width < 520;
  const pageHorizontalPadding = isPhone ? 14 : 18;
  const pageBottomPadding = getBottomNavContentPadding(insets);
  const cardGap = isPhone ? (isShortPhone ? 5 : 6) : 16;
  const questionGap = isPhone ? (isShortPhone ? 4 : 5) : 12;
  // Phone: help cards stay 3-col; popular question chips use 2-col for wider labels.
  const columns = isPhone || width >= 920 ? 3 : 2;
  const questionColumns = isPhone ? 2 : width >= 860 ? 3 : 2;
  const availableContentWidth = Math.max(width - pageHorizontalPadding * 2, 280);
  const pageWidth = Math.min(availableContentWidth, 1120);
  // Base size, then ~1.3× so art grows without pushing the intro card down.
  const mobileHeroArtBaseWidth = Math.round(
    Math.min(availableContentWidth * (isShortPhone ? 0.34 : 0.38), isShortPhone ? 112 : 132)
  );
  const mobileHeroArtWidth = Math.round(
    Math.min(
      mobileHeroArtBaseWidth * 1.3,
      isShortPhone ? 145 : 172
    )
  );
  // Match the PNG aspect so resizeMode="contain" has no vertical letterboxing.
  const mobileHeroArtHeight = Math.round(
    (mobileHeroArtWidth * HERO_ART_INTRINSIC_HEIGHT) / HERO_ART_INTRINSIC_WIDTH
  );
  const mobileHeroArtBaseHeight = Math.round(
    (mobileHeroArtBaseWidth * HERO_ART_INTRINSIC_HEIGHT) / HERO_ART_INTRINSIC_WIDTH
  );
  // Grow art upward: shrink top offset by the height delta so the art bottom (and intro) stay put.
  const mobileHeroArtOffset = Math.max(
    0,
    28 - (mobileHeroArtHeight - mobileHeroArtBaseHeight)
  );
  // Light tuck under the PNG lip only — keep the card low so it meets the art feet cleanly.
  const mobileIntroCardSeat = Math.min(
    2,
    Math.max(
      0,
      Math.round((mobileHeroArtHeight * HERO_ART_CARD_LIP_PX) / HERO_ART_INTRINSIC_HEIGHT)
    )
  );
  // Mild push so absolute description clears the art; keep seat intact.
  // Use base height so larger art does not push absolute copy (or content below) down.
  const mobileHeroCopyPadTop = Math.max(
    8,
    Math.round(mobileHeroArtBaseHeight * 0.1)
  );
  const helpCardWidth = (pageWidth - (columns - 1) * cardGap) / columns;
  const questionChipWidth = (pageWidth - (questionColumns - 1) * questionGap) / questionColumns;
  const topBlockSource = useMobileTopBlock ? mobileTopBlockImage : approvedTopBlockImage;
  const topBlockAspectRatio = useMobileTopBlock ? 853 / 510 : 1308 / 820;
  const userTurnCount = messages.filter((item) => item.role === "user").length;
  // Landing mockup has no transcript; show the card once the user starts chatting.
  const showConversationCard = userTurnCount >= 1;
  const helpCardCompactStyle = isShortPhone
    ? { height: 78, minHeight: 78, paddingVertical: 4 }
    : null;
  const composerBottomPad = keyboardVisible
    ? 8
    : Math.max(pageBottomPadding - 8, isPhone ? 12 : 16);

  function scrollToLatestMessages() {
    requestAnimationFrame(() => {
      pageScrollRef.current?.scrollToEnd?.({ animated: true });
    });
  }

  async function handleSend(overrideText) {
    const trimmed = (typeof overrideText === "string" ? overrideText : message).trim();

    if (!trimmed || sending) {
      return;
    }

    const stamp = Date.now();
    const userId = `user-${stamp}`;
    const thinkingId = `thinking-${stamp}`;

    inputRef.current?.blur?.();
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

    scrollToLatestMessages();

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
      scrollToLatestMessages();
    }
  }

  function sendPresetPrompt(nextMessage) {
    const text = typeof nextMessage === "string" ? nextMessage.trim() : "";
    if (!text || sending) {
      return;
    }

    void handleSend(text);
  }

  const canSend = Boolean(message.trim()) && !sending;

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FBFE" }}>
        <ActivityIndicator size="large" color="#5B59FF" />
      </View>
    );
  }

  function renderComposer(extraShellStyle) {
    return (
      <View
        style={[
          styles.composerShell,
          isPhone && styles.composerShellCompact,
          cardShadowStyle,
          extraShellStyle,
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
          blurOnSubmit={false}
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
    );
  }

  return (
    // Keep top inset only — BottomNav is absolute to the viewport bottom (like Home).
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={pageScrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: isPhone ? 6 : 18,
              paddingHorizontal: pageHorizontalPadding,
              paddingBottom: 12,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View style={styles.headerRow}>
              <DimPressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onBack || (() => onNavigate?.("home"))}
                style={[
                  styles.roundHeaderButton,
                  {
                    width: backButtonSize,
                    height: backButtonSize,
                    borderRadius: backButtonSize / 2,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={isPhone ? 22 : 26} color="#14253E" />
              </DimPressable>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  onPress={() => onNavigate?.("notifications")}
                  style={[styles.headerActionButton, isPhone && styles.headerActionButtonPhone]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={isPhone ? 24 : 28}
                    color="#111827"
                  />
                  <View
                    style={[styles.notificationDot, isPhone && styles.notificationDotPhone]}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  onPress={() => onNavigate?.("profile")}
                  style={[styles.headerActionButton, isPhone && styles.headerActionButtonPhone]}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={isPhone ? 28 : 33}
                    color="#111827"
                  />
                </Pressable>
              </View>
            </View>

            {useStructuredPhoneTop ? (
              <View style={styles.mobileTopSection}>
                <View style={styles.mobileHeroStage}>
                  <View
                    style={[
                      styles.mobileHeroCopy,
                      {
                        right: mobileHeroArtWidth + 6,
                        paddingTop: mobileHeroCopyPadTop,
                      },
                    ]}
                  >
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
                        width: mobileHeroArtWidth,
                        aspectRatio: HERO_ART_ASPECT_RATIO,
                        // Push seated art+intro below the absolute description copy.
                        marginTop: mobileHeroArtOffset,
                      },
                    ]}
                  >
                    <Image
                      source={heroIllustrationImage}
                      resizeMode="contain"
                      style={styles.mobileHeroArt}
                    />
                  </View>

                  <View
                    style={[
                      styles.mobileIntroCard,
                      cardShadowStyle,
                      // Cover the PNG’s baked card lip so the ground line meets this card.
                      { marginTop: -mobileIntroCardSeat },
                    ]}
                  >
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
                      size={isNarrowPhone ? 16 : 18}
                      color="#7B71FF"
                      style={styles.mobileIntroSparkles}
                    />
                  </View>
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
            <View style={[styles.helpGrid, isPhone && styles.helpGridCompact, { gap: cardGap }]}>
              {HELP_CARDS.map((item) => (
                <HelpCard
                  key={item.title}
                  item={item}
                  width={helpCardWidth}
                  compact={isPhone}
                  style={helpCardCompactStyle}
                  onPress={() => sendPresetPrompt(item.inputText)}
                />
              ))}
            </View>

            <Text
              style={[
                styles.sectionTitle,
                styles.popularSectionTitle,
                isPhone && styles.sectionTitleCompact,
                isPhone && styles.popularSectionTitleCompact,
              ]}
            >
              Popular questions
            </Text>
            <View
              style={[
                styles.questionsGrid,
                isPhone && styles.questionsGridCompact,
                { gap: questionGap },
              ]}
            >
              {POPULAR_QUESTIONS.map((item) => (
                <PopularQuestionChip
                  key={item.label}
                  item={item}
                  width={questionChipWidth}
                  compact={isPhone}
                  onPress={() => sendPresetPrompt(item.label)}
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
                accessibilityLabel="Start a conversation"
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

            {showConversationCard ? (
              <View
                style={[
                  styles.chatCard,
                  isPhone && styles.chatCardCompact,
                  cardShadowStyle,
                ]}
              >
                <View style={styles.chatCardHeader}>
                  <Text style={styles.chatCardTitle}>Conversation</Text>
                  {userTurnCount >= 1 ? (
                    <Text style={styles.chatCardHint}>Scroll for history</Text>
                  ) : null}
                </View>
                <MessageList
                  messages={messages}
                  compact={isPhone}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.composerDock,
            {
              paddingHorizontal: pageHorizontalPadding,
              paddingBottom: composerBottomPad,
            },
          ]}
        >
          {renderComposer(styles.composerDockShell)}
        </View>

        {!keyboardVisible ? <BottomNav activeLabel={null} onNavigate={onNavigate} /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FBFE",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F9FBFE",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#F9FBFE",
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

  // Matches MapsScreen / ItineraryScreen circular back control.
  roundHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#9DB2CF",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    flexShrink: 0,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    transform: [{ translateY: -5 }],
  },

  headerActionButton: {
    width: 50,
    height: 50,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerActionButtonPhone: {
    width: 40,
    height: 40,
    marginLeft: 2,
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

  notificationDotPhone: {
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
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
    marginTop: 10,
  },

  mobileHeroStage: {
    position: "relative",
    width: "100%",
  },

  mobileHeroCopy: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    paddingTop: 8,
    paddingBottom: 0,
    paddingRight: 2,
  },

  mobileHeroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },

  mobileHeroTitle: {
    flexShrink: 1,
    fontSize: 30,
    lineHeight: 36,
    paddingTop: 2,
    paddingBottom: 2,
    fontFamily: FONT.display,
    letterSpacing: -1.2,
    color: "#12214B",
  },

  mobileHeroTitleNarrow: {
    fontSize: 26,
    lineHeight: 32,
  },

  mobileHeroTitleBot: {
    width: 32,
    height: 32,
    marginLeft: 10,
  },

  mobileHeroTitleBotNarrow: {
    width: 30,
    height: 30,
  },

  mobileHeroAccent: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: FONT.medium,
    color: "#5B59FF",
  },

  mobileHeroAccentNarrow: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 15,
  },

  mobileHeroDescription: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: FONT.regular,
    color: "#5D6F95",
  },

  mobileHeroDescriptionNarrow: {
    fontSize: 10,
    lineHeight: 13,
  },

  mobileHeroArtWrap: {
    alignSelf: "flex-end",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 0,
    zIndex: 1,
  },

  mobileHeroArt: {
    width: "100%",
    height: "100%",
  },

  mobileIntroCard: {
    marginTop: 0,
    zIndex: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_OUTLINE,
    backgroundColor: "rgba(232, 238, 245, 0.48)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  mobileIntroBot: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  mobileIntroBotNarrow: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  mobileIntroCopy: {
    flex: 1,
    flexShrink: 1,
    paddingLeft: 14,
    paddingRight: 2,
  },

  mobileIntroTitle: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 1,
    paddingBottom: 1,
    fontFamily: FONT.bold,
    color: "#12214B",
  },

  mobileIntroTitleNarrow: {
    fontSize: 13,
    lineHeight: 18,
  },

  mobileIntroDescription: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: FONT.regular,
    color: "#243459",
  },

  mobileIntroDescriptionNarrow: {
    fontSize: 11,
    lineHeight: 13,
  },

  mobileIntroQuestion: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONT.semibold,
    color: "#5B59FF",
  },

  mobileIntroQuestionNarrow: {
    fontSize: 11,
    lineHeight: 13,
  },

  mobileIntroSparkles: {
    marginRight: 0,
    alignSelf: "flex-end",
    marginBottom: 0,
  },

  sectionTitle: {
    marginTop: 22,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 1,
    paddingBottom: 1,
    fontFamily: FONT.display,
    color: "#18264A",
    letterSpacing: -0.2,
  },

  sectionTitleCompact: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 1,
    paddingBottom: 1,
    fontFamily: FONT.display,
  },

  popularSectionTitle: {
    marginTop: 26,
  },

  popularSectionTitleCompact: {
    marginTop: 10,
  },

  helpGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  helpGridCompact: {
    marginTop: 6,
  },

  helpCard: {
    minHeight: 190,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: SOFT_OUTLINE,
    alignItems: "center",
  },

  helpCardCompact: {
    height: 86,
    minHeight: 86,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 4,
    justifyContent: "flex-start",
  },

  helpCardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  helpCardIconWrapCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  /** Soft circle is baked into the PNG — avoid double tint wrap. */
  helpCardIconWrapImage: {
    backgroundColor: "transparent",
  },

  helpCardTitle: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 20,
    paddingTop: 1,
    paddingBottom: 1,
    fontFamily: FONT.helpTitle,
    color: "#18264A",
    textAlign: "center",
    letterSpacing: -0.3,
  },

  helpCardTitleCompact: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 12,
    letterSpacing: -0.15,
  },

  helpCardDescription: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT.regular,
    color: "#334467",
    textAlign: "center",
  },

  helpCardDescriptionCompact: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 11,
  },

  questionsGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  questionsGridCompact: {
    marginTop: 6,
  },

  questionChip: {
    minHeight: 48,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: SOFT_OUTLINE,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 10,
  },

  questionChipCompact: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },

  questionChipLabel: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FONT.medium,
    color: "#5F58FF",
  },

  questionChipLabelCompact: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FONT.medium,
  },

  startConversationSection: {
    marginTop: 44,
    alignItems: "center",
    alignSelf: "center",
    maxWidth: 460,
    width: "100%",
  },

  startConversationSectionCompact: {
    marginTop: 12,
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
    lineHeight: 26,
    paddingTop: 1,
    paddingBottom: 1,
    fontFamily: FONT.display,
    color: "#17244A",
    letterSpacing: -0.4,
    textAlign: "center",
  },

  startConversationTitleCompact: {
    marginTop: 14,
    fontSize: 18,
  },

  startConversationDescription: {
    marginTop: 8,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: FONT.regular,
    color: "#243459",
    textAlign: "center",
  },

  startConversationDescriptionCompact: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
  },

  chatCard: {
    marginTop: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: SOFT_OUTLINE,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    overflow: "hidden",
  },

  chatCardCompact: {
    marginTop: 12,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  chatCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  chatCardTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: "#14253E",
  },

  chatCardHint: {
    fontSize: 12,
    fontFamily: FONT.semibold,
    color: "#7B8AA8",
  },

  messageListContent: {
    gap: 10,
    paddingBottom: 8,
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
    fontFamily: FONT.bold,
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
    fontFamily: FONT.regular,
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

  composerDock: {
    backgroundColor: "#F9FBFE",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
  },

  composerDockShell: {
    marginTop: 10,
    marginBottom: 4,
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
    borderColor: SOFT_OUTLINE,
    flexDirection: "row",
    alignItems: "center",
  },

  composerShellCompact: {
    marginTop: 12,
    minHeight: 64,
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 8,
  },

  composerInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONT.regular,
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
