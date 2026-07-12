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
import { cardStyles } from "./shared/screenStyles";

export default function ChatScreen({ onBack, onNavigate }) {
  const [message, setMessage] = useState("Help me plan my next trip.");
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
    <ScreenLayout title="Ask Wayfinder" onBack={onBack} onNavigate={onNavigate}>
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>Your question</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          style={styles.input}
          placeholder="Ask about destinations, hotels, or safety..."
          placeholderTextColor="#94A3B8"
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendLabel}>Send</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {reply ? (
        <View style={cardStyles.card}>
          <Text style={cardStyles.cardTitle}>Wayfinder</Text>
          <Text style={cardStyles.cardSubtitle}>{reply}</Text>
        </View>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: 12,
    minHeight: 96,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    fontSize: 15,
    lineHeight: 22,
    color: "#14253E",
    textAlignVertical: "top",
  },

  sendButton: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F78FF",
  },

  sendLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#B42318",
  },
});
