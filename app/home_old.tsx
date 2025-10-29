import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function HomeScreen() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [restaurantId, setRestaurantId] = useState<Id<"restaurants"> | null>(null);
  const [userRole, setUserRole] = useState<"owner" | "manager" | "waiter" | "kitchen" | "bar" | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedButton, setSelectedButton] = useState<any>(null);
  const [additionalMessage, setAdditionalMessage] = useState("");

  const restaurant = useQuery(
    api.restaurants.get,
    restaurantId ? { restaurantId } : "skip"
  );

  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  const userMembership = useQuery(
    api.restaurantManagement.getUserRestaurants,
    userId ? { userId } : "skip"
  );

  const actionButtons = useQuery(
    api.notificationTypes.listByRestaurant,
    restaurantId ? { restaurantId } : "skip"
  );

  const notifications = useQuery(
    api.notifications.listByUser,
    restaurantId && userRole && userId ? { restaurantId, userId, userRole, limit: 10 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.unreadCount,
    restaurantId && userRole && userId ? { restaurantId, userRole, userId } : "skip"
  );

  const sendNotification = useMutation(api.notifications.send);
  const markAsRead = useMutation(api.notifications.markAsRead);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userMembership && restaurantId) {
      const membership = userMembership.find((m) => m._id === restaurantId);
      if (membership) {
        setUserRole(membership.role);
      }
    }
  }, [userMembership, restaurantId]);

  const loadUserData = async () => {
    const storedUserId = await AsyncStorage.getItem("userId");
    const storedRestaurantId = await AsyncStorage.getItem("restaurantId");

    if (storedUserId && storedRestaurantId) {
      setUserId(storedUserId as Id<"users">);
      setRestaurantId(storedRestaurantId as Id<"restaurants">);
    } else {
      router.replace("/");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/");
  };

  const handleButtonPress = (button: any) => {
    setSelectedButton(button);
    // Eğer input gerektirmiyorsa direkt gönder
    if (!button.requiresInput) {
      handleQuickSend(button);
    } else {
      setModalVisible(true);
    }
  };

  const handleQuickSend = async (button: any) => {
    if (!userId || !restaurantId) return;

    await sendNotification({
      restaurantId,
      fromUserId: userId,
      toRole: button.toRole,
      actionTitle: button.title,
      priority: button.priority,
      category: button.category,
    });
  };

  const handleSendNotification = async () => {
    if (!userId || !restaurantId || !selectedButton) return;

    await sendNotification({
      restaurantId,
      fromUserId: userId,
      toRole: selectedButton.toRole,
      actionTitle: selectedButton.title,
      message: additionalMessage || undefined,
      priority: selectedButton.priority,
      category: selectedButton.category,
    });

    setModalVisible(false);
    setAdditionalMessage("");
    setSelectedButton(null);
  };

  const handleNotificationPress = async (notification: any) => {
    if (!userId) return;
    await markAsRead({
      notificationId: notification._id,
      userId,
    });
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "manager":
        return "Yönetici";
      case "waiter":
        return "Garson";
      case "kitchen":
        return "Mutfak";
      case "bar":
        return "Bar";
      case "all":
        return "Herkes";
      default:
        return role;
    }
  };

  if (!restaurant || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.userName}>
            {user.name} • {userRole ? getRoleName(userRole) : ""}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İletişim</Text>
        <View style={styles.buttonsGrid}>
          {actionButtons?.map((item: any) => (
            <TouchableOpacity
              key={item._id}
              style={[
                styles.actionButton,
                { backgroundColor: item.color },
              ]}
              onPress={() => handleButtonPress(item)}
            >
              {item.priority === "urgent" && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>!</Text>
                </View>
              )}
              {item.priority === "question" && (
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>?</Text>
                </View>
              )}
              <Text style={styles.buttonIcon}>{item.icon}</Text>
              <Text style={styles.buttonTitle}>{item.title}</Text>
              {!item.requiresInput && (
                <Text style={styles.quickSendHint}>Tek dokunuş</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.notificationHeader}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          {unreadCount !== undefined && unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {notifications?.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={[
              styles.notificationItem,
              !item.readBy.includes(userId!) && styles.unreadNotification,
              item.priority === "urgent" && styles.urgentNotification,
            ]}
            onPress={() => handleNotificationPress(item)}
          >
            <View style={styles.notificationHeader2}>
              <Text style={styles.notificationTitle}>
                {item.priority === "urgent" && "🚨 "}
                {item.priority === "question" && "❓ "}
                {item.actionTitle}
              </Text>
              {item.priority === "urgent" && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>ACİL</Text>
                </View>
              )}
            </View>
            <Text style={styles.notificationFrom}>
              {item.fromUserName} ({getRoleName(item.fromUserRole)})
            </Text>
            {item.message && (
              <Text style={styles.notificationMessage}>📝 {item.message}</Text>
            )}
            <Text style={styles.notificationTime}>
              {new Date(item._creationTime).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedButton?.icon} {selectedButton?.title}
            </Text>
            <Text style={styles.modalSubtitle}>
              Gönderilecek: {selectedButton && getRoleName(selectedButton.toRole)}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={selectedButton?.inputPlaceholder || "Ek mesaj (opsiyonel)"}
              placeholderTextColor="#999"
              value={additionalMessage}
              onChangeText={setAdditionalMessage}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setAdditionalMessage("");
                }}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleSendNotification}
              >
                <Text style={styles.modalButtonText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: "#333" },
  restaurantName: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  userName: { fontSize: 14, color: "#999", marginTop: 4 },
  logoutButton: { padding: 10 },
  logoutText: { color: "#fff", fontSize: 14 },
  loadingText: { color: "#fff", fontSize: 16, textAlign: "center", marginTop: 100 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  buttonsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionButton: { width: "48%", aspectRatio: 1.5, borderRadius: 12, padding: 16, justifyContent: "center", alignItems: "center", position: "relative" },
  urgentButton: { borderWidth: 2, borderColor: "#fff", shadowColor: "#fff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8 },
  urgentBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 12, width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  urgentBadgeText: { color: "#F44336", fontSize: 16, fontWeight: "bold" },
  questionBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 12, width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  questionBadgeText: { color: "#9C27B0", fontSize: 16, fontWeight: "bold" },
  buttonIcon: { fontSize: 32, marginBottom: 8 },
  buttonTitle: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" },
  quickSendHint: { color: "#fff", fontSize: 10, marginTop: 4, opacity: 0.7 },
  notificationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  badge: { backgroundColor: "#E91E63", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  notificationItem: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 12 },
  unreadNotification: { backgroundColor: "#2a2a2a", borderLeftWidth: 4, borderLeftColor: "#E91E63" },
  urgentNotification: { borderWidth: 2, borderColor: "#F44336", backgroundColor: "#2a1a1a" },
  notificationHeader2: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  notificationTitle: { color: "#fff", fontSize: 16, fontWeight: "600", flex: 1 },
  priorityBadge: { backgroundColor: "#F44336", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  priorityBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  notificationFrom: { color: "#999", fontSize: 14, marginBottom: 4 },
  notificationMessage: { color: "#ccc", fontSize: 14, marginTop: 8 },
  notificationTime: { color: "#666", fontSize: 12, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 24, width: "85%", maxWidth: 400 },
  modalTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  modalSubtitle: { fontSize: 14, color: "#999", marginBottom: 20, textAlign: "center" },
  modalInput: { backgroundColor: "#2a2a2a", borderRadius: 8, padding: 12, color: "#fff", fontSize: 16, minHeight: 80, textAlignVertical: "top", marginBottom: 20 },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 8, alignItems: "center" },
  cancelButton: { backgroundColor: "#333" },
  sendButton: { backgroundColor: "#4CAF50" },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
