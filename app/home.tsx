import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Users, Bell, AlertCircle, MessageCircle } from 'lucide-react-native';

export default function HomeScreen() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [restaurantId, setRestaurantId] = useState<Id<"restaurants"> | null>(null);
  const [userRole, setUserRole] = useState<"owner" | "manager" | "waiter" | "kitchen" | "bar" | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "notifications">("home");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const restaurant = useQuery(
    api.restaurants.get,
    restaurantId ? { restaurantId } : "skip"
  );

  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  const userMembership = useQuery(
    api.restaurantManagement.getUserRestaurants,
    userId ? { userId } : "skip"
  );

  const members = useQuery(
    api.restaurantManagement.getRestaurantMembers,
    restaurantId ? { restaurantId } : "skip"
  );

  const notificationTypes = useQuery(
    api.notificationTypes.listByRestaurant,
    restaurantId ? { restaurantId } : "skip"
  );

  const notifications = useQuery(
    api.notifications.listByUser,
    restaurantId && userRole && userId
      ? { restaurantId, userId, userRole, limit: 50 }
      : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.unreadCount,
    restaurantId && userRole && userId
      ? { restaurantId, userRole, userId }
      : "skip"
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

  const handleBackToRestaurants = async () => {
    router.replace("/restaurant-select");
  };

  const handleRestaurantSettings = async () => {
    router.push({
      pathname: "/restaurant-settings",
      params: { restaurantId },
    });
  };

  const handleMemberPress = (member: any) => {
    if (member.userId === userId) return; // Kendine bildirim gönderemez
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleSendNotification = async (notificationType: any) => {
    if (!userId || !restaurantId || !selectedMember) return;

    await sendNotification({
      restaurantId,
      fromUserId: userId,
      toUserId: selectedMember.userId,
      actionTitle: notificationType.title,
      priority: "normal",
      category: "info",
    });

    setModalVisible(false);
    setSelectedMember(null);
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
      case "owner":
        return "Sahip";
      case "manager":
        return "Yönetici";
      case "waiter":
        return "Garson";
      case "kitchen":
        return "Mutfak";
      case "bar":
        return "Bar";
      default:
        return role;
    }
  };

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

  if (!restaurant || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  const isOwner = restaurant.ownerId === userId;

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
          {isOwner && (
            <Pressable onPress={handleRestaurantSettings} style={styles.settingsButton}>
              <Text style={styles.buttonText}>⚙️</Text>
            </Pressable>
          )}
          <Pressable onPress={handleBackToRestaurants} style={styles.backButton}>
            <Text style={styles.buttonText}>←</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "home" && styles.activeTab]}
          onPress={() => setActiveTab("home")}
        >
          <Text style={[styles.tabText, activeTab === "home" && styles.activeTabText]}>
            <Users size={16} color={activeTab === "home" ? "#fff" : "#666"} /> Ekip
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "notifications" && styles.activeTab]}
          onPress={() => setActiveTab("notifications")}
        >
          <Text style={[styles.tabText, activeTab === "notifications" && styles.activeTabText]}>
            <Bell size={16} color={activeTab === "notifications" ? "#fff" : "#666"} /> Bildirimler
          </Text>
          {unreadCount !== undefined && unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === "home" ? (
          // Home Tab - Üyeler
          <View style={styles.membersContainer}>
            {members?.filter(m => m.userId !== userId).map((member) => (
              <Pressable
                key={member._id}
                style={({ pressed }) => [
                  styles.memberCard,
                  pressed && styles.memberCardPressed,
                ]}
                onPress={() => handleMemberPress(member)}
              >
                <View style={styles.memberCardHeader}>
                  <Text style={styles.memberName}>{member.userName}</Text>
                  {member.isOnline && <View style={styles.onlineDot} />}
                </View>
                <View
                  style={[
                    styles.memberRoleBadge,
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
                  <Text style={styles.memberRoleText}>{getRoleName(member.role)}</Text>
                </View>
                <Text style={styles.memberEmail}>{member.userEmail}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          // Notifications Tab
          <View style={styles.notificationsContainer}>
            {notifications && notifications.length > 0 ? (
              notifications.map((item) => (
                <Pressable
                  key={item._id}
                  onPress={() => handleNotificationPress(item)}
                  style={[
                    styles.notificationCard,
                    !item.readBy.includes(userId!) && styles.unreadNotificationCard,
                  ]}
                >
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{item.actionTitle}</Text>
                    {!item.readBy.includes(userId!) && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationFrom}>
                    {item.fromUserName} • {getRoleName(item.fromUserRole)}
                  </Text>
                  <Text style={styles.notificationTime}>{formatTimeAgo(item._creationTime)}</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Henüz bildirim yok</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal - Bildirim Türü Seçimi */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{selectedMember?.userName}</Text>
            <Text style={styles.modalSubtitle}>Bildirim türü seçin</Text>
            <View style={styles.notificationTypesGrid}>
              {notificationTypes?.map((type) => (
                <Pressable
                  key={type._id}
                  style={[styles.typeButton, { backgroundColor: type.color }]}
                  onPress={() => handleSendNotification(type)}
                >
                  <Text style={styles.typeIcon}>
                    {type.icon === 'message-circle' ? <MessageCircle size={16} color="#fff" /> : <AlertCircle size={16} color="#fff" />}
                  </Text>
                  <Text style={styles.typeTitle}>{type.title}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  restaurantName: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  restaurantCode: { fontSize: 12, color: "#999", marginTop: 4, fontWeight: "500", letterSpacing: 0.5 },
  userInfo: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  userName: { fontSize: 14, color: "#999", fontWeight: "500" },
  headerButtons: { flexDirection: "row", gap: 8, alignItems: "center" },
  settingsButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#222", borderRadius: 8 },
  backButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#222", borderRadius: 8 },
  buttonText: { fontSize: 18, fontWeight: "600" },
  tabs: { flexDirection: "row", backgroundColor: "#111", borderBottomWidth: 1, borderBottomColor: "#222" },
  tab: { flex: 1, paddingVertical: 16, alignItems: "center", position: "relative" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#4CAF50" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#666", flexDirection: "row", alignItems: "center", gap: 4 },
  activeTabText: { color: "#fff" },
  tabBadge: { position: "absolute", top: 8, right: "30%", backgroundColor: "#E91E63", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: "center" },
  tabBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  scrollView: { flex: 1 },
  membersContainer: { padding: 20, gap: 16 },
  memberCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  memberCardPressed: { backgroundColor: "#252525", transform: [{ scale: 0.98 }] },
  memberCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  memberName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4CAF50" },
  memberRoleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start", marginBottom: 8 },
  memberRoleText: { color: "#fff", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  memberEmail: { fontSize: 14, color: "#999" },
  notificationsContainer: { padding: 20, gap: 12 },
  notificationCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  unreadNotificationCard: { backgroundColor: "#252525", borderLeftWidth: 4, borderLeftColor: "#4CAF50" },
  notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4CAF50" },
  notificationFrom: { fontSize: 14, color: "#999", marginBottom: 4 },
  notificationTime: { fontSize: 12, color: "#666" },
  emptyState: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16, fontStyle: "italic" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#1a1a1a", borderRadius: 24, width: "100%", maxWidth: 400, padding: 24, borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#999", textAlign: "center", marginBottom: 24 },
  notificationTypesGrid: { gap: 12 },
  typeButton: { borderRadius: 12, padding: 16, alignItems: "center", flexDirection: "row", gap: 12 },
  typeIcon: { fontSize: 24 },
  typeTitle: { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1 },
});
