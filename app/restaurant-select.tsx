import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { colors, spacing, typography, borderRadius } from "../utils/designSystem";

const showAlert = (title: string, message: string, buttons?: { text: string; onPress?: () => void }[]) => {
  if (Platform.OS === "web") {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && buttons && buttons[0]?.onPress) {
      buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function RestaurantSelectScreen() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selectedRole, setSelectedRole] = useState<"manager" | "waiter" | "kitchen" | "bar">("waiter");

  const restaurants = useQuery(
    api.restaurantManagement.getUserRestaurants,
    userId ? { userId } : "skip"
  );

  const createRestaurant = useMutation(api.restaurantManagement.createRestaurant);
  const joinRestaurant = useMutation(api.restaurantManagement.joinRestaurant);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const storedUserId = await AsyncStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    } else {
      router.replace("/");
    }
  };

  const handleSelectRestaurant = async (restaurantId: Id<"restaurants">) => {
    await AsyncStorage.setItem("restaurantId", restaurantId);
    router.replace("/home");
  };

  const handleCreateRestaurant = async () => {
    if (!restaurantName || !userId) {
      showAlert("Hata", "Lütfen restoran adını girin");
      return;
    }

    try {
      const result = await createRestaurant({
        name: restaurantName,
        ownerId: userId,
      });

      await AsyncStorage.setItem("restaurantId", result.restaurantId);
      setCreateModalVisible(false);
      setRestaurantName("");

      showAlert(
        "Restoran Oluşturuldu! 🎉",
        `Davet Kodu: ${result.inviteCode}\n\nBu kodu ekip üyelerinizle paylaşın.`,
        [{ text: "Tamam", onPress: () => router.replace("/home") }]
      );
    } catch (error) {
      showAlert("Hata", (error as Error).message);
    }
  };

  const handleJoinRestaurant = async () => {
    if (!inviteCode || !userId) {
      showAlert("Hata", "Lütfen davet kodunu girin");
      return;
    }

    try {
      const result = await joinRestaurant({
        userId,
        inviteCode: inviteCode.toUpperCase(),
        role: selectedRole,
      });

      if (!result.success) {
        showAlert("Hata", result.error || "Restorana katılınamadı");
        return;
      }

      if (result.restaurantId) {
        await AsyncStorage.setItem("restaurantId", result.restaurantId);
      }

      setJoinModalVisible(false);
      setInviteCode("");

      showAlert("Başarılı!", "Restorana katıldınız", [
        { text: "Tamam", onPress: () => router.replace("/home") },
      ]);
    } catch (error) {
      showAlert("Hata", (error as Error).message);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restoranlarım</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {restaurants && restaurants.length > 0 ? (
          restaurants.map((restaurant) => (
            <Pressable
              key={restaurant._id}
              style={styles.restaurantCard}
              onPress={() => handleSelectRestaurant(restaurant._id)}
            >
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantCode}>Kod: {restaurant.inviteCode}</Text>
                <View style={styles.restaurantMeta}>
                  <View style={[styles.roleBadge, { backgroundColor: restaurant.isOwner ? colors.success : colors.primary }]}>
                    <Text style={styles.roleBadgeText}>
                      {restaurant.role === "owner"
                        ? "Sahip"
                        : restaurant.role === "manager"
                        ? "Yönetici"
                        : restaurant.role === "waiter"
                        ? "Garson"
                        : restaurant.role === "kitchen"
                        ? "Mutfak"
                        : "Bar"}
                    </Text>
                  </View>
                  <Text style={styles.memberCount}>{restaurant.memberCount} kişi</Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Henüz bir restorana üye değilsiniz</Text>
            <Text style={styles.emptySubtext}>Yeni bir restoran oluşturun veya davet koduyla katılın</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.actionButtonText}>🏪 Yeni Restoran Oluştur</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => setJoinModalVisible(true)}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>🔑 Davet Koduyla Katıl</Text>
        </TouchableOpacity>
      </View>

      {/* Create Restaurant Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setCreateModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Yeni Restoran Oluştur</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Restoran Adı"
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholderTextColor={colors.placeholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleCreateRestaurant}>
                <Text style={styles.modalButtonText}>Oluştur 🎉</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Restaurant Modal */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setJoinModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Restorana Katıl</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Davet Kodu (6 hane)"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              placeholderTextColor={colors.placeholder}
            />
            <Text style={styles.roleLabel}>Rolünüz:</Text>
            <View style={styles.roleSelector}>
              {(["manager", "waiter", "kitchen", "bar"] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[styles.roleText, selectedRole === role && styles.roleTextActive]}>
                    {role === "manager"
                      ? "Yönetici"
                      : role === "waiter"
                      ? "Garson"
                      : role === "kitchen"
                      ? "Mutfak"
                      : "Bar"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleJoinRestaurant}>
                <Text style={styles.modalButtonText}>Katıl 🚀</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  logoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  restaurantCode: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  restaurantMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  roleBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  memberCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.placeholder,
    textAlign: "center",
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.input,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roleSelector: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  roleButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  roleTextActive: {
    color: colors.text,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: colors.surface,
  },
  modalButtonText: {
    color: colors.text,
    ...typography.button,
  },
  modalButtonTextCancel: {
    color: colors.text,
    ...typography.button,
  },
});

