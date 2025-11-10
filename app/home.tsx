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
import { colors, spacing, typography, borderRadius } from "../utils/designSystem";

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
            <View style={[styles.roleBadge, { backgroundColor: colors.success }]}>
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
            <Users size={16} color={activeTab === "home" ? colors.text : colors.textSecondary} /> Ekip
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "notifications" && styles.activeTab]}
          onPress={() => setActiveTab("notifications")}
        >
          <Text style={[styles.tabText, activeTab === "notifications" && styles.activeTabText]}>
            <Bell size={16} color={activeTab === "notifications" ? colors.text : colors.textSecondary} /> Bildirimler
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
                          ? colors.success
                          : member.role === "manager"
                          ? colors.primary
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
                    {type.icon === 'message-circle' ? <MessageCircle size={16} color={colors.text} /> : <AlertCircle size={16} color={colors.text} />}
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
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors.text, fontSize: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flex: 1 },
  restaurantName: { ...typography.h2, color: colors.text, letterSpacing: -0.5 },
  restaurantCode: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, fontWeight: "500", letterSpacing: 0.5 },
  userInfo: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: spacing.sm },
  roleBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  roleBadgeText: { color: colors.text, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  userName: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  headerButtons: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  settingsButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.sm },
  backButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.sm },
  buttonText: { fontSize: 18, fontWeight: "600" },
  tabs: { flexDirection: "row", backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: "center", position: "relative" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { ...typography.body, fontWeight: "600", color: colors.textSecondary, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  activeTabText: { color: colors.text },
  tabBadge: { position: "absolute", top: spacing.sm, right: "30%", backgroundColor: colors.error, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: "center" },
  tabBadgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  scrollView: { flex: 1 },
  membersContainer: { padding: spacing.lg, gap: spacing.md },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  memberCardPressed: { backgroundColor: "#252525", transform: [{ scale: 0.98 }] },
  memberCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  memberName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  memberRoleBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, alignSelf: "flex-start", marginBottom: spacing.sm },
  memberRoleText: { color: colors.text, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  memberEmail: { fontSize: 14, color: colors.textSecondary },
  notificationsContainer: { padding: spacing.lg, gap: spacing.md },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  unreadNotificationCard: { backgroundColor: "#252525", borderLeftWidth: 4, borderLeftColor: colors.primary },
  notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  notificationTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  notificationFrom: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs },
  notificationTime: { fontSize: 12, color: colors.placeholder },
  emptyState: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 16, fontStyle: "italic" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, width: "100%", maxWidth: 400, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  modalTitle: { ...typography.h3, color: colors.text, textAlign: "center", marginBottom: spacing.sm },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  notificationTypesGrid: { gap: spacing.md },
  typeButton: { borderRadius: borderRadius.md, padding: spacing.md, alignItems: "center", flexDirection: "row", gap: spacing.md },
  typeIcon: { fontSize: 24 },
  typeTitle: { ...typography.body, fontWeight: "700", color: colors.text, flex: 1 },
});
