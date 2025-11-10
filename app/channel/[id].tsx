import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { MessageCircle, Utensils, AlertCircle } from 'lucide-react-native';
import type { Id } from "../../convex/_generated/dataModel";
import { colors, spacing, typography, borderRadius } from "../utils/designSystem";

export default function ChannelScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [message, setMessage] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const flatListRef = useRef<FlatList>(null);


  const channel: any = null;
  const messages: any = null;
  const quickMessages: any = null;

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadUserId = async () => {
    const storedUserId = await AsyncStorage.getItem("userId");
    if (!storedUserId) {
      router.replace("/");
      return;
    }
    setUserId(storedUserId as Id<"users">);
  };

  const handleSend = async () => {
    if (!message.trim() || !userId || !id) return;

    try {
      // await sendMessage({
      //   channelId: id,
      //   userId,
      //   content: message.trim(),
      //   type: "text",
      // });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleQuickMessage = async (text: string) => {
    if (!userId || !id) return;

    try {
      // await sendMessage({
      //   channelId: id,
      //   userId,
      //   content: text,
      //   type: "text",
      // });
      setShowQuickMessages(false);
    } catch (error) {
      console.error("Failed to send quick message:", error);
    }
  };

  if (!channel || !messages || !userId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getChannelIcon = (type: string) => {
    const iconColor = colors.text;
    switch (type) {
      case "general":
        return <MessageCircle size={24} color={iconColor} />;
      case "kitchen":
        return <Utensils size={24} color={iconColor} />;
      case "service":
        return <Utensils size={24} color={iconColor} />;
      case "urgent":
        return <AlertCircle size={24} color={iconColor} />;
      default:
        return <MessageCircle size={24} color={iconColor} />;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        {getChannelIcon(channel.type)}
        <Text style={styles.channelName}>{channel.name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isOwnMessage = item.userId === userId;
          return (
            <View
              style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessage : styles.otherMessage,
              ]}
            >
              {!isOwnMessage && (
                <Text style={styles.senderName}>{item.user?.name || "Unknown"}</Text>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isOwnMessage ? styles.ownBubble : styles.otherBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isOwnMessage ? styles.ownText : styles.otherText,
                  ]}
                >
                  {item.content}
                </Text>
              </View>
              <Text style={styles.messageTime}>
                {new Date(item.createdAt).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {showQuickMessages && quickMessages && (
        <View style={styles.quickMessagesContainer}>
          <View style={styles.quickMessagesHeader}>
            <Text style={styles.quickMessagesTitle}>Hızlı Mesajlar</Text>
            <TouchableOpacity onPress={() => setShowQuickMessages(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={quickMessages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickMessageButton}
                onPress={() => handleQuickMessage(item.text)}
              >
                <Text style={styles.quickMessageText}>{item.text}</Text>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickMessagesList}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setShowQuickMessages(!showQuickMessages)}
        >
          <Text style={styles.quickButtonText}>⚡</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.placeholder}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  backButton: {
    marginRight: spacing.md,
  },
  backText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: "300",
  },
  channelIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  channelName: {
    ...typography.h3,
    color: colors.text,
    marginLeft: spacing.md,
  },
  messagesList: {
    padding: spacing.md,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  senderName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.md,
  },
  messageBubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ownBubble: {
    backgroundColor: colors.primary,
  },
  otherBubble: {
    backgroundColor: colors.surface,
  },
  messageText: {
    ...typography.body,
  },
  ownText: {
    color: colors.text,
  },
  otherText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginHorizontal: spacing.md,
  },
  quickMessagesContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  quickMessagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  quickMessagesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  quickMessagesList: {
    paddingHorizontal: spacing.md,
  },
  quickMessageButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  quickMessageText: {
    color: colors.text,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  quickButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  quickButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.input,
    color: colors.text,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: "bold",
  },
});
