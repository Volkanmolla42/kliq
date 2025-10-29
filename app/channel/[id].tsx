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
import type { Id } from "../../convex/_generated/dataModel";

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
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "general":
        return "💬";
      case "kitchen":
        return "🍳";
      case "service":
        return "🍽️";
      case "urgent":
        return "🚨";
      default:
        return "📢";
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
        <Text style={styles.channelIcon}>{getChannelIcon(channel.type)}</Text>
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
          placeholderTextColor="#666"
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
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
  },
  channelIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  channelName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
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
    color: "#666",
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: "#fff",
  },
  otherBubble: {
    backgroundColor: "#222",
  },
  messageText: {
    fontSize: 16,
  },
  ownText: {
    color: "#000",
  },
  otherText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    marginHorizontal: 12,
  },
  quickMessagesContainer: {
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingVertical: 12,
  },
  quickMessagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickMessagesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    fontSize: 20,
    color: "#666",
  },
  quickMessagesList: {
    paddingHorizontal: 16,
  },
  quickMessageButton: {
    backgroundColor: "#222",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickMessageText: {
    color: "#fff",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#222",
    backgroundColor: "#000",
  },
  quickButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  quickButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#fff",
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#333",
  },
  sendButtonText: {
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
  },
});

