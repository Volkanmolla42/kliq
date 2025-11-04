import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
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
import { Sparkles, Trash2, Plus } from 'lucide-react-native';

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

export default function RestaurantSettingsScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: Id<"restaurants"> }>();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newTypeTitle, setNewTypeTitle] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#4CAF50");

  const restaurant = useQuery(
    api.restaurantManagement.getRestaurant,
    restaurantId ? { restaurantId } : "skip"
  );

  const members = useQuery(
    api.restaurantManagement.getRestaurantMembers,
    restaurantId ? { restaurantId } : "skip"
  );

  const notificationTypes = useQuery(
    api.notificationTypes.listByRestaurant,
    restaurantId ? { restaurantId } : "skip"
  );

  const updateRestaurantName = useMutation(api.restaurantManagement.updateRestaurantName);
  const refreshInviteCode = useMutation(api.restaurantManagement.refreshInviteCode);
  const createNotificationType = useMutation(api.notificationTypes.create);
  const removeNotificationType = useMutation(api.notificationTypes.remove);
  const createDefaultTypes = useMutation(api.notificationTypes.createDefaults);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (restaurant) {
      setNewName(restaurant.name);
    }
  }, [restaurant]);

  const loadUserId = async () => {
    const storedUserId = await AsyncStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || !userId || !restaurantId) {
      showAlert("Hata", "Lütfen restoran adını girin");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateRestaurantName({
        restaurantId,
        userId,
        newName: newName.trim(),
      });

      if (result.success) {
        showAlert("Başarılı!", "Restoran adı güncellendi");
      } else {
        showAlert("Hata", result.error || "Restoran adı güncellenemedi");
      }
    } catch (error) {
      showAlert("Hata", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCode = async () => {
    if (!userId || !restaurantId) return;

    showAlert(
      "Davet Kodunu Yenile?",
      "Yeni bir davet kodu oluşturulacak. Eski kod geçersiz olacak.",
      [
        { text: "İptal" },
        {
          text: "Yenile",
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await refreshInviteCode({
                restaurantId,
                userId,
              });

              if (result.success) {
                showAlert("Başarılı!", `Yeni Kod: ${result.newInviteCode}`);
              } else {
                showAlert("Hata", result.error || "Kod yenilenemedi");
              }
            } catch (error) {
              showAlert("Hata", (error as Error).message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleCreateDefaults = async () => {
    if (!userId || !restaurantId) return;
    setIsLoading(true);
    try {
      await createDefaultTypes({ restaurantId, userId });
      showAlert("Başarılı!", "Varsayılan bildirim türleri oluşturuldu");
    } catch (error) {
      showAlert("Hata", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newTypeTitle.trim() || !newTypeIcon.trim() || !userId || !restaurantId) {
      showAlert("Hata", "Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createNotificationType({
        restaurantId,
        userId,
        title: newTypeTitle.trim(),
        icon: newTypeIcon.trim(),
        color: newTypeColor,
      });

      if (result.success) {
        showAlert("Başarılı!", "Bildirim türü eklendi");
        setNewTypeTitle("");
        setNewTypeIcon("");
        setNewTypeColor("#4CAF50");
      } else {
        showAlert("Hata", result.error || "Bildirim türü eklenemedi");
      }
    } catch (error) {
      showAlert("Hata", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveType = async (typeId: Id<"notificationTypes">) => {
    if (!userId) return;

    showAlert("Bildirim Türünü Sil?", "Bu bildirim türü silinecek.", [
      { text: "İptal" },
      {
        text: "Sil",
        onPress: async () => {
          setIsLoading(true);
          try {
            const result = await removeNotificationType({ typeId, userId });
            if (result.success) {
              showAlert("Başarılı!", "Bildirim türü silindi");
            } else {
              showAlert("Hata", result.error || "Bildirim türü silinemedi");
            }
          } catch (error) {
            showAlert("Hata", (error as Error).message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  if (!restaurant) {
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
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Geri</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Salon Ayarları</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Salon Adı Bölümü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salon Adı</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Salon adı"
              placeholderTextColor="#666"
              value={newName}
              onChangeText={setNewName}
              editable={!isLoading}
            />
            <Pressable
              style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleUpdateName}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Güncelle</Text>
            </Pressable>
          </View>
        </View>

        {/* Davet Kodu Bölümü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Davet Kodu</Text>
          <View style={styles.card}>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Mevcut Kod:</Text>
              <Text style={styles.code}>{restaurant.inviteCode}</Text>
            </View>
            <Text style={styles.codeDescription}>
              Bu kodu ekip üyelerinizle paylaşarak onları restorana davet edebilirsiniz.
            </Text>
            <Pressable
              style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleRefreshCode}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Yeni Kod Oluştur</Text>
            </Pressable>
          </View>
        </View>

        {/* Salon Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salon Bilgileri</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Salon Sahibi:</Text>
              <Text style={styles.infoValue}>Siz</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Oluşturulma Tarihi:</Text>
              <Text style={styles.infoValue}>
                {new Date(restaurant.createdAt).toLocaleDateString("tr-TR")}
              </Text>
            </View>
          </View>
        </View>

        {/* Ekip Üyeleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ekip Üyeleri ({members?.length || 0})</Text>
          <View style={styles.card}>
            {members && members.length > 0 ? (
              members.map((member, index) => (
                <View
                  key={member._id}
                  style={[
                    styles.memberRow,
                    index !== members.length - 1 && styles.memberRowBorder,
                  ]}
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.userName}</Text>
                    <Text style={styles.memberEmail}>{member.userEmail}</Text>
                  </View>
                  <View style={styles.memberMeta}>
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
                      <Text style={styles.memberRoleText}>
                        {member.role === "owner"
                          ? "Sahip"
                          : member.role === "manager"
                          ? "Yönetici"
                          : member.role === "waiter"
                          ? "Garson"
                          : member.role === "kitchen"
                          ? "Mutfak"
                          : "Bar"}
                      </Text>
                    </View>
                    {member.isOnline && (
                      <View style={styles.onlineDot} />
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMembers}>Henüz üye yok</Text>
            )}
          </View>
        </View>

        {/* Bildirim Türleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirim Türleri</Text>

          {/* Varsayılan türleri oluştur butonu */}
          {(!notificationTypes || notificationTypes.length === 0) && (
            <Pressable
              style={({ pressed }) => [
                styles.defaultButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleCreateDefaults}
              disabled={isLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Sparkles size={16} color="#fff" />
                <Text style={styles.defaultButtonText}>Varsayılan Türleri Oluştur</Text>
              </View>
            </Pressable>
          )}

          {/* Mevcut türler */}
          {notificationTypes && notificationTypes.length > 0 && (
            <View style={styles.card}>
              {notificationTypes.map((type, index) => (
                <View
                  key={type._id}
                  style={[
                    styles.typeRow,
                    index !== notificationTypes.length - 1 && styles.typeRowBorder,
                  ]}
                >
                  <View style={styles.typeLeft}>
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <View style={styles.typeInfo}>
                      <Text style={styles.typeTitle}>{type.title}</Text>
                      <View
                        style={[styles.typeColorBadge, { backgroundColor: type.color }]}
                      />
                    </View>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.removeTypeButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleRemoveType(type._id)}
                  >
                    <Trash2 size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Yeni tür ekle */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yeni Bildirim Türü Ekle</Text>
            <TextInput
              style={styles.input}
              placeholder="Başlık (örn: Moladayım)"
              placeholderTextColor="#666"
              value={newTypeTitle}
              onChangeText={setNewTypeTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="İkon (emoji, örn: ☕)"
              placeholderTextColor="#666"
              value={newTypeIcon}
              onChangeText={setNewTypeIcon}
            />
            <View style={styles.colorPicker}>
              <Text style={styles.colorLabel}>Renk:</Text>
              <View style={styles.colorOptions}>
                {["#4CAF50", "#2196F3", "#F44336", "#FF9800", "#9C27B0", "#607D8B"].map(
                  (color) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newTypeColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setNewTypeColor(color)}
                    />
                  )
                )}
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleAddType}
              disabled={isLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Plus size={16} color="#fff" />
                <Text style={styles.addButtonText}>Ekle</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
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
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
  },
  secondaryButton: {
    backgroundColor: "#2196F3",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  codeContainer: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  codeLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  code: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
  },
  codeDescription: {
    color: "#999",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  infoLabel: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  memberEmail: {
    color: "#999",
    fontSize: 13,
  },
  memberMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberRoleText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  emptyMembers: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
  defaultButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  defaultButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  typeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  typeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  typeColorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  removeTypeButton: {
    padding: 8,
  },
  removeTypeButtonText: {
    fontSize: 20,
  },
  colorPicker: {
    marginBottom: 16,
  },
  colorLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  colorOptions: {
    flexDirection: "row",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#fff",
    borderWidth: 3,
  },
  addButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
