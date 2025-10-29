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
                  <View style={[styles.roleBadge, { backgroundColor: restaurant.isOwner ? "#4CAF50" : "#2196F3" }]}>
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
          <Text style={styles.actionButtonText}>🔑 Davet Koduyla Katıl</Text>
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  restaurantCode: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
  },
  restaurantMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  memberCount: {
    fontSize: 13,
    color: "#666",
  },
  arrow: {
    fontSize: 24,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: "#222",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  roleLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
  },
  roleSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  roleButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  roleButtonActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  roleText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#000",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#222",
  },
  modalButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  modalButtonTextCancel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

