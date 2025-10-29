import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// Animasyonlu Buton Komponenti
const AnimatedButton = ({ item, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.actionButton,
          { backgroundColor: item.color, transform: [{ scale: scaleAnim }] },
          item.priority === "urgent" && styles.urgentButton,
        ]}
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
        <Text style={styles.buttonTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {!item.requiresInput && (
          <View style={styles.quickSendBadge}>
            <Text style={styles.quickSendText}>⚡</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

// Zaman formatı helper
const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Şimdi";
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} saat önce`;
  return new Date(timestamp).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function HomeScreen() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [restaurantId, setRestaurantId] = useState<Id<"restaurants"> | null>(
    null
  );
  const [userRole, setUserRole] = useState<
    "manager" | "waiter" | "kitchen" | "bar" | null
  >(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedButton, setSelectedButton] = useState<any>(null);
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberMessage, setMemberMessage] = useState("");

  const restaurant = useQuery(
    api.restaurants.get,
    restaurantId ? { restaurantId } : "skip"
  );

  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  // Get user's role in the restaurant
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
    restaurantId && userRole && userId ? { restaurantId, userId, userRole, limit: 20 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.unreadCount,
    restaurantId && userRole && userId
      ? { restaurantId, userRole, userId }
      : "skip"
  );

  const members = useQuery(
    api.restaurantManagement.getRestaurantMembers,
    restaurantId ? { restaurantId } : "skip"
  );

  const sendNotification = useMutation(api.notifications.send);
  const markAsRead = useMutation(api.notifications.markAsRead);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userMembership && restaurantId) {
      const currentRestaurant = userMembership.find(
        (r) => r._id === restaurantId
      );
      if (currentRestaurant) {
        setUserRole(currentRestaurant.role as any);
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

  const handleBackToRestaurants = async () => {
    router.replace("/restaurant-select");
  };

  const handleRestaurantSettings = async () => {
    router.push({
      pathname: "/restaurant-settings",
      params: { restaurantId },
    });
  };

  const handleButtonPress = (button: any) => {
    setSelectedButton(button);
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

  const handleMemberPress = (member: any) => {
    setSelectedMember(member);
    setMemberModalVisible(true);
  };

  const handleSendToMember = async () => {
    if (!userId || !restaurantId || !selectedMember || !memberMessage.trim()) return;

    await sendNotification({
      restaurantId,
      fromUserId: userId,
      toUserId: selectedMember.userId,
      actionTitle: "Mesaj",
      message: memberMessage,
      priority: "normal",
      category: "info",
    });

    setMemberModalVisible(false);
    setMemberMessage("");
    setSelectedMember(null);
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

  // Butonları kategorilere göre grupla
  const groupedButtons = actionButtons?.reduce((acc: any, button: any) => {
    if (!acc[button.category]) {
      acc[button.category] = [];
    }
    acc[button.category].push(button);
    return acc;
  }, {});

  const categoryInfo: any = {
    order: { title: "📋 Sipariş İşlemleri", color: "#4CAF50" },
    help: { title: "🆘 Yardım & Destek", color: "#F44336" },
    info: { title: "ℹ️ Bilgilendirme", color: "#2196F3" },
    stock: { title: "📦 Stok & Malzeme", color: "#FF9800" },
  };

  if (!restaurant || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantCode}>Kod: {restaurant.inviteCode}</Text>
          <View style={styles.userInfo}>
            <View style={[styles.roleBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.roleBadgeText}>{getRoleName(userRole || "waiter")}</Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <Pressable onPress={handleRestaurantSettings} style={styles.settingsButton}>
            <Text style={styles.buttonText}>⚙️</Text>
          </Pressable>
          <Pressable onPress={handleBackToRestaurants} style={styles.backButton}>
            <Text style={styles.buttonText}>←</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Çıkış</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Kategorilere göre butonlar */}
        {groupedButtons &&
          Object.keys(categoryInfo).map((category) => {
            const buttons = groupedButtons[category];
            if (!buttons || buttons.length === 0) return null;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View
                    style={[
                      styles.categoryIndicator,
                      { backgroundColor: categoryInfo[category].color },
                    ]}
                  />
                  <Text style={styles.categoryTitle}>
                    {categoryInfo[category].title}
                  </Text>
                </View>
                <View style={styles.buttonsGrid}>
                  {buttons.map((item: any) => (
                    <AnimatedButton
                      key={item._id}
                      item={item}
                      onPress={() => handleButtonPress(item)}
                    />
                  ))}
                </View>
              </View>
            );
          })}

        {/* Ekip Üyeleri Bölümü */}
        <View style={styles.membersSection}>
          <View style={styles.categoryHeader}>
            <View
              style={[
                styles.categoryIndicator,
                { backgroundColor: "#9C27B0" },
              ]}
            />
            <Text style={styles.categoryTitle}>👥 Ekip Üyeleri ({members?.length || 0})</Text>
          </View>
          <View style={styles.membersGrid}>
            {members?.map((member) => (
              <Pressable
                key={member._id}
                style={({ pressed }) => [
                  styles.memberCard,
                  pressed && styles.memberCardPressed,
                ]}
                onPress={() => handleMemberPress(member)}
              >
                <View style={styles.memberCardTop}>
                  <Text style={styles.memberCardName} numberOfLines={1}>
                    {member.userName}
                  </Text>
                  {member.isOnline && (
                    <View style={styles.memberOnlineDot} />
                  )}
                </View>
                <View
                  style={[
                    styles.memberCardRoleBadge,
                    {
                      backgroundColor:
                        member.role === "owner"
                          ? "#4CAF50"
                          : member.role === "manager"
                          ? "#2196F3"
                          : member.role === "kitchen"
                          ? "#FF9800"
                          : member.role === "bar"
                          ? "#9C27B0"
                          : "#607D8B",
                    },
                  ]}
                >
                  <Text style={styles.memberCardRoleText}>
                    {getRoleName(member.role)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bildirimler Bölümü */}
        <View style={styles.notificationsSection}>
          <View style={styles.notificationsHeader}>
            <View style={styles.categoryHeader}>
              <View
                style={[
                  styles.categoryIndicator,
                  { backgroundColor: "#E91E63" },
                ]}
              />
              <Text style={styles.categoryTitle}>🔔 Bildirimler</Text>
            </View>
            {unreadCount !== undefined && unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {notifications && notifications.length > 0 ? (
            notifications.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => handleNotificationPress(item)}
                style={({ pressed }) => [
                  styles.notificationCard,
                  !item.readBy.includes(userId!) &&
                    styles.unreadNotificationCard,
                  item.priority === "urgent" && styles.urgentNotificationCard,
                  pressed && styles.notificationCardPressed,
                ]}
              >
                <View style={styles.notificationTop}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={styles.notificationTitle} numberOfLines={2}>
                      {item.priority === "urgent" && "🚨 "}
                      {item.priority === "question" && "❓ "}
                      {item.actionTitle}
                    </Text>
                    {item.priority === "urgent" && (
                      <View style={styles.urgentLabel}>
                        <Text style={styles.urgentLabelText}>ACİL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.notificationFrom}>
                    {item.fromUserName} • {getRoleName(item.fromUserRole)}
                  </Text>
                </View>

                {item.message && (
                  <View style={styles.notificationMessageBox}>
                    <Text style={styles.notificationMessage}>
                      💬 {item.message}
                    </Text>
                  </View>
                )}

                <View style={styles.notificationBottom}>
                  <Text style={styles.notificationTime}>
                    {formatTimeAgo(item._creationTime)}
                  </Text>
                  {!item.readBy.includes(userId!) && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyNotifications}>
              <Text style={styles.emptyNotificationsText}>
                Henüz bildirim yok
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>{selectedButton?.icon}</Text>
              <Text style={styles.modalTitle}>{selectedButton?.title}</Text>
              <Text style={styles.modalSubtitle}>
                Gönderilecek: {selectedButton && getRoleName(selectedButton.toRole)}
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {selectedButton?.inputPlaceholder || "Ek mesaj (opsiyonel)"}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Buraya yazın..."
                placeholderTextColor="#666"
                value={additionalMessage}
                onChangeText={setAdditionalMessage}
                multiline
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setAdditionalMessage("");
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.sendButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSendNotification}
              >
                <Text style={styles.sendButtonText}>Gönder 🚀</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Member Modal */}
      <Modal
        visible={memberModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMemberModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>💬</Text>
              <Text style={styles.modalTitle}>{selectedMember?.userName}</Text>
              <Text style={styles.modalSubtitle}>
                {selectedMember && getRoleName(selectedMember.role)}
              </Text>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#666"
              value={memberMessage}
              onChangeText={setMemberMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setMemberModalVisible(false);
                  setMemberMessage("");
                  setSelectedMember(null);
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.sendButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSendToMember}
              >
                <Text style={styles.sendButtonText}>Gönder 🚀</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#fff", fontSize: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  headerLeft: { flex: 1 },
  restaurantName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  restaurantCode: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userName: { fontSize: 14, color: "#999", fontWeight: "500" },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  settingsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  scrollView: { flex: 1 },
  categorySection: { marginBottom: 32 },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  categoryIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  buttonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    width: "48%",
    aspectRatio: 1.3,
    borderRadius: 16,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  urgentButton: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  urgentBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  urgentBadgeText: {
    color: "#F44336",
    fontSize: 18,
    fontWeight: "900",
  },
  questionBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  questionBadgeText: {
    color: "#9C27B0",
    fontSize: 18,
    fontWeight: "900",
  },
  buttonIcon: { fontSize: 40, marginBottom: 8 },
  buttonTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  quickSendBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quickSendText: { fontSize: 12 },

  // Bildirimler
  notificationsSection: {
    paddingBottom: 40,
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },
  unreadBadge: {
    backgroundColor: "#E91E63",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  notificationCard: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  unreadNotificationCard: {
    backgroundColor: "#1f1f1f",
    borderLeftWidth: 4,
    borderLeftColor: "#E91E63",
  },
  urgentNotificationCard: {
    borderColor: "#F44336",
    borderWidth: 2,
    backgroundColor: "#2a1515",
  },
  notificationCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  notificationTop: {
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  urgentLabel: {
    backgroundColor: "#F44336",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgentLabelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  notificationFrom: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  notificationMessageBox: {
    backgroundColor: "#252525",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#ddd",
    lineHeight: 20,
  },
  notificationBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E91E63",
  },
  emptyNotifications: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyNotificationsText: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#333",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  modalIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#252525",
    borderWidth: 1,
    borderColor: "#333",
  },
  sendButton: {
    backgroundColor: "#4CAF50",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Members
  membersSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  membersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  memberCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    borderWidth: 1,
    borderColor: "#222",
  },
  memberCardPressed: {
    backgroundColor: "#252525",
    transform: [{ scale: 0.98 }],
  },
  memberCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  memberCardName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  memberOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginLeft: 8,
  },
  memberCardRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  memberCardRoleText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

