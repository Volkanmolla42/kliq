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

export default function RestaurantSettingsScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: Id<"restaurants"> }>();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newTypeTitle, setNewTypeTitle] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("");
  const [newTypeColor, setNewTypeColor] = useState(colors.success);

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
        setNewTypeColor(colors.success);
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
              placeholderTextColor={colors.placeholder}
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
                <Sparkles size={16} color={colors.text} />
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
                    <Trash2 size={16} color={colors.text} />
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
              placeholderTextColor={colors.placeholder}
              value={newTypeTitle}
              onChangeText={setNewTypeTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="İkon (emoji, örn: ☕)"
              placeholderTextColor={colors.placeholder}
              value={newTypeIcon}
              onChangeText={setNewTypeIcon}
            />
            <View style={styles.colorPicker}>
              <Text style={styles.colorLabel}>Renk:</Text>
              <View style={styles.colorOptions}>
                {[colors.success, colors.primary, colors.error, "#FF9800", "#9C27B0", "#607D8B"].map(
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
                <Plus size={16} color={colors.text} />
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
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
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.lg,
    ...typography.input,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text,
    ...typography.button,
  },
  codeContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  codeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
  code: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
  },
  codeDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  memberEmail: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  memberMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  memberRoleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  memberRoleText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  emptyMembers: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: spacing.lg,
    fontStyle: "italic",
  },
  defaultButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  defaultButtonText: {
    color: colors.text,
    ...typography.button,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  typeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  typeTitle: {
    color: colors.text,
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
    padding: spacing.sm,
  },
  removeTypeButtonText: {
    fontSize: 20,
  },
  colorPicker: {
    marginBottom: spacing.md,
  },
  colorLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  colorOptions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.text,
    ...typography.button,
  },
});
