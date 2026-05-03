import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { map as mapLang } from "@/constant/languages";
import { FamilyCircle } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  createParticipationPermission,
  deleteFamilyCircle,
  leaveFamilyCircle,
  listFamilyCircleMembers,
  participateInFamilyCircle,
  updateFamilyCircle,
  updateFamilyRole,
} from "@/services/trackingManager";
import { BottomSheetFlatList, BottomSheetView } from "@gorhom/bottom-sheet";
import { CircleMember, CircleMembersModal } from "./CircleMembersModal";
import { getUserId, showToast } from "@/utils";
import { scheduleLocalNotification } from "@/utils/notifications";

interface FamilyCircleBottomSheetProps {
  selectedCircleId: string | null;
  onSelectCircle: (circle: FamilyCircle) => void;
  familyCircles: FamilyCircle[];
  onRefresh?: () => Promise<void>;
  onAddFamilyCircle?: () => void;
  tabBarHeight?: number;
}

export const FamilyCircleBottomSheet: React.FC<
  FamilyCircleBottomSheetProps
> = ({
  selectedCircleId,
  onSelectCircle,
  familyCircles,
  onRefresh,
  onAddFamilyCircle,
  tabBarHeight = 0,
}) => {
  const t = useTranslation(mapLang);
  const { height: screenHeight } = useWindowDimensions();

  const roleOptions = [
    { value: "Parent", label: t.roleParent },
    { value: "Child", label: t.roleChild },
    { value: "Guardian", label: t.roleGuardian },
    { value: "Grandparent", label: t.roleGrandparent },
    { value: "Spouse", label: t.roleSpouse },
    { value: "Other", label: t.roleOther },
  ];

  const [managingCircle, setManagingCircle] = useState<FamilyCircle | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [myRole, setMyRole] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteOtp, setInviteOtp] = useState("");
  const [inviteExpiry, setInviteExpiry] = useState<number | null>(null);
  const [invitingCircle, setInvitingCircle] = useState<FamilyCircle | null>(
    null,
  );

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinOtp, setJoinOtp] = useState("");

  const handleOpenManage = useCallback(async (circle: FamilyCircle) => {
    setManagingCircle(circle);
    setEditName(circle.name);
    setMyRole("");
    setCircleMembers([]);
    setIsCurrentUserAdmin(false);
    setLoadingMembers(true);

    try {
      const [membersRes, currentUserId] = await Promise.all([
        listFamilyCircleMembers(circle.familyCircleId),
        getUserId().catch(() => null),
      ]);

      const mapped: CircleMember[] = membersRes.membersList.map((m) => ({
        id: m.memberId,
        name: m.memberUsername,
        role: m.familyRole,
        isAdmin: m.isAdmin,
      }));
      setCircleMembers(mapped);

      if (currentUserId) {
        const me = membersRes.membersList.find(
          (m) => m.memberId === currentUserId,
        );
        if (me) {
          setMyRole(me.familyRole);
          setIsCurrentUserAdmin(me.isAdmin);
        }
      }
    } catch (e: any) {
      showToast(
        e?.message ?? t.loadMembersFailed,
        t.errorTitle,
      );
    } finally {
      setLoadingMembers(false);
    }
  }, [t.errorTitle]);

  const handleSaveName = useCallback(async () => {
    if (!managingCircle || !editName.trim()) return;
    setIsSavingName(true);
    try {
      await updateFamilyCircle(managingCircle.familyCircleId, editName.trim());
      setManagingCircle((prev) =>
        prev ? { ...prev, name: editName.trim() } : prev,
      );
      await onRefresh?.();
    } catch (e: any) {
      showToast(e?.message ?? t.saveError, t.errorTitle);
    } finally {
      setIsSavingName(false);
    }
  }, [managingCircle, editName, onRefresh, t.errorTitle, t.saveError]);

  const handleSelectRole = useCallback(
    async (role: string) => {
      if (!managingCircle || isSavingRole) return;
      const prevRole = myRole;
      setMyRole(role);
      setIsSavingRole(true);
      try {
        await updateFamilyRole(managingCircle.familyCircleId, role);
        await onRefresh?.();
      } catch (e: any) {
        showToast(e?.message ?? t.updateRoleFailed, t.errorTitle);
        setMyRole(prevRole);
      } finally {
        setIsSavingRole(false);
      }
    },
    [managingCircle, myRole, isSavingRole, onRefresh, t.errorTitle, t.updateRoleFailed],
  );

  const handleLeave = useCallback(() => {
    if (!managingCircle) return;
    if (isCurrentUserAdmin) {
      showToast(t.cannotLeaveMessage, t.cannotLeaveTitle);
      return;
    }
    Alert.alert(
      t.leaveCircleTitle,
      t.leaveCircleMessage.replace("{{circle}}", managingCircle.name),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.leave,
          style: "destructive",
          onPress: async () => {
            try {
              const res = await leaveFamilyCircle(
                managingCircle.familyCircleId,
              );
              /* console.log("Leave response:", res) */;

              if (res.status?.code === 9) {
                throw new Error(t.lastMemberCannotLeave);
              }

              setManagingCircle(null);
              await onRefresh?.();
            } catch (e: any) {
              showToast(e?.message ?? t.leaveFailed, t.errorTitle);
            }
          },
        },
      ],
    );
  }, [
    managingCircle,
    onRefresh,
    t.lastMemberCannotLeave,
    t.cannotLeaveMessage,
    t.cannotLeaveTitle,
    t.leave,
    t.leaveCircleMessage,
    t.leaveCircleTitle,
    t.leaveFailed,
    t.errorTitle,
    t.cancel,
  ]);

  const handleDelete = useCallback(() => {
    if (!managingCircle) return;
    Alert.alert(
      t.deleteCircleTitle,
      t.deleteCircleMessage.replace("{{circle}}", managingCircle.name),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteFamilyCircle(
                managingCircle.familyCircleId,
              );
              setManagingCircle(null);

              /* console.log("Delete response:", res) */;

              await onRefresh?.();
            } catch (e: any) {
              showToast(e?.message ?? t.deleteFailed, t.errorTitle);
            }
          },
        },
      ],
    );
  }, [
    managingCircle,
    onRefresh,
    t.delete,
    t.deleteCircleMessage,
    t.deleteCircleTitle,
    t.deleteFailed,
    t.errorTitle,
    t.cancel,
  ]);

  const handleInvite = useCallback(
    async (circle: FamilyCircle) => {
      try {
        const result = await createParticipationPermission(
          circle.familyCircleId,
        );

        /* console.log("Invite result:", result) */;
        if (result.status?.code === 7) {
          throw new Error(result.status.message);
        }

        scheduleLocalNotification(
          "Invite Code Ready",
          "An invite code has been generated. Share it with someone to join your circle.",
        );

        setInvitingCircle(circle);
        setInviteOtp(result.otp);
        setInviteExpiry(result.expiredAtMs);
        setShowInviteModal(true);
      } catch (error: any) {
        showToast(error?.message ?? t.inviteFailed, t.errorTitle);
      }
    },
    [t.errorTitle, t.inviteFailed],
  );

  const handleJoinCircle = useCallback(async () => {
    if (!joinOtp.trim()) return;
    try {
      await participateInFamilyCircle(joinOtp.trim());
      setShowJoinModal(false);
      setJoinOtp("");
      await onRefresh?.();
      showToast(t.joinSuccessMessage, t.successTitle);
    } catch (error: any) {
      showToast(error?.message ?? t.joinFailed, t.errorTitle);
    }
  }, [
    joinOtp,
    onRefresh,
    t.errorTitle,
    t.joinFailed,
    t.joinSuccessMessage,
    t.successTitle,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: FamilyCircle }) => {
      const isSelected = item.familyCircleId === selectedCircleId;
      return (
        <Pressable
          key={item.familyCircleId}
          style={[styles.circleItem, isSelected && styles.selectedItem]}
          onPress={() => onSelectCircle(item)}
        >
          <View
            style={[styles.circleIcon, isSelected && styles.selectedCircleIcon]}
          >
            <Ionicons
              name="people"
              size={24}
              color={isSelected ? "#fff" : "#74becb"}
            />
          </View>
          <View style={styles.circleInfo}>
            <Text
              style={[styles.circleName, isSelected && styles.selectedText]}
            >
              {item.name}
            </Text>
            <Text style={styles.circleMeta}>
              {item.memberCount} {t.members}
              {item.role === "admin" && ` • ${t.admin}`}
            </Text>
          </View>
          <View style={styles.circleActions}>
            <Pressable
              onPress={() => handleInvite(item)}
              hitSlop={8}
              style={styles.actionBtn}
            >
              <Ionicons name="share-outline" size={18} color="#74becb" />
            </Pressable>
            <Pressable
              onPress={() => handleOpenManage(item)}
              hitSlop={8}
              style={styles.actionBtn}
            >
              <Ionicons name="settings-outline" size={18} color="#74becb" />
            </Pressable>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#74becb" />
          )}
        </Pressable>
      );
    },
    [
      onSelectCircle,
      selectedCircleId,
      t.admin,
      t.members,
      handleInvite,
      handleOpenManage,
    ],
  );

  const ActionButtons = () => (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        marginTop: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
      }}
    >
      <TouchableOpacity style={styles.addBtn} onPress={onAddFamilyCircle}>
        <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>
          {t.addFamilyCircle}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.joinBtn}
        onPress={() => setShowJoinModal(true)}
      >
        <Text
          style={{ color: "#74becb", fontWeight: "600", textAlign: "center" }}
        >
          {t.joinCircleButton}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (familyCircles.length === 0) {
    return (
      <BottomSheetView style={[styles.container, { flex: 1 }]}>
        <Text style={styles.title}>{t.familyCircles}</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>{t.noFamilyCircles}</Text>
          <ActionButtons />
        </View>
      </BottomSheetView>
    );
  }

  const isAdmin = isCurrentUserAdmin;

  return (
    <>
      <Text style={styles.title}>{t.selectFamilyCircle}</Text>
      <BottomSheetFlatList
        data={familyCircles}
        keyExtractor={(item: FamilyCircle) => item.familyCircleId}
        renderItem={renderItem}
        contentContainerStyle={{
          gap: 24,
          paddingBottom: 8,
          paddingHorizontal: 16,
        }}
      />
      <ActionButtons />

      <Modal
        visible={!!managingCircle}
        transparent
        animationType="slide"
        onRequestClose={() => setManagingCircle(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setManagingCircle(null)}
        >
          <View
            style={styles.settingsSheet}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>
                {managingCircle?.name} {t.settingsSuffix}
              </Text>
              <Pressable onPress={() => setManagingCircle(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, gap: 20 }}
            >
              {/* {isAdmin && ( */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t.circleNameLabel}</Text>
                <View style={styles.renameRow}>
                  <TextInput
                    style={styles.renameInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t.circleNamePlaceholder}
                    placeholderTextColor="#aaa"
                  />
                  <Pressable
                    style={[
                      styles.saveNameBtn,
                      (isSavingName || !editName.trim()) && { opacity: 0.5 },
                    ]}
                    onPress={handleSaveName}
                    disabled={isSavingName || !editName.trim()}
                  >
                    {isSavingName ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveNameBtnText}>{t.save}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
              {/* )} */}

              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>{t.yourRoleLabel}</Text>
                  {isSavingRole && (
                    <ActivityIndicator size="small" color="#74becb" />
                  )}
                </View>
                <View style={styles.roleGrid}>
                  {roleOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.roleChip,
                        myRole === option.value && styles.roleChipSelected,
                      ]}
                      onPress={() => handleSelectRole(option.value)}
                      disabled={isSavingRole}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          myRole === option.value &&
                            styles.roleChipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* {isAdmin && ( */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t.membersLabel}</Text>
                <Pressable
                  style={styles.menuRow}
                  onPress={() => setShowMembersModal(true)}
                  disabled={loadingMembers}
                >
                  <View style={styles.menuRowLeft}>
                    <Ionicons name="people-outline" size={20} color="#74becb" />
                    <Text style={styles.menuRowText}>{t.manageMembers}</Text>
                  </View>
                  {loadingMembers ? (
                    <ActivityIndicator size="small" color="#74becb" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#999" />
                  )}
                </Pressable>
              </View>
              {/* )} */}

              <View style={styles.section}>
                {/* {!isAdmin ? ( */}
                <Pressable style={styles.dangerRow} onPress={handleLeave}>
                  <Ionicons name="exit-outline" size={20} color="#e74c3c" />
                  <Text style={styles.dangerText}>{t.leaveCircle}</Text>
                </Pressable>
                {/* ) : ( */}
                <>
                  {/* <View style={styles.adminNotice}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color="#f39c12"
                      />
                      <Text style={styles.adminNoticeText}>
                        Admins cannot leave. Transfer admin role to a member
                        first.
                      </Text>
                    </View> */}
                  <Pressable style={styles.dangerRow} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    <Text style={styles.dangerText}>{t.deleteCircle}</Text>
                  </Pressable>
                </>
                {/* )} */}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <CircleMembersModal
        visible={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        circle={managingCircle}
        members={circleMembers}
        isAdmin={isAdmin}
        isLoading={loadingMembers}
        onRefresh={() => {
          onRefresh?.();
        }}
      />

      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowInviteModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>
              {t.inviteTo.replace("{{circle}}", invitingCircle?.name ?? "")}
            </Text>
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              {t.inviteInstruction}
            </Text>
            <Pressable
              style={styles.otpBox}
              onPress={async () => {
                await Clipboard.setStringAsync(inviteOtp);
                if (Platform.OS === "android") {
                  ToastAndroid.show(t.inviteCodeCopied, ToastAndroid.SHORT);
                } else {
                  showToast(t.inviteCodeCopied, t.copiedTitle);
                }
              }}
            >
              <Text style={styles.otpText} selectable>
                {inviteOtp}
              </Text>
              <Text style={styles.otpCopyHint}>{t.tapToCopy}</Text>
            </Pressable>
            {inviteExpiry && (
              <Text style={styles.expiryText}>
                {t.expiresAt.replace(
                  "{{time}}",
                  new Date(inviteExpiry).toLocaleString(),
                )}
              </Text>
            )}
            <Pressable
              style={[styles.modalSaveBtn, { alignSelf: "center" }]}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>{t.done}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowJoinModal(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>{t.joinFamilyCircleTitle}</Text>
              <Text style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                {t.joinInstruction}
              </Text>
              <TextInput
                style={styles.modalInput}
                value={joinOtp}
                onChangeText={setJoinOtp}
                placeholder={t.inviteCodePlaceholder}
                placeholderTextColor="#aaa"
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setShowJoinModal(false);
                    setJoinOtp("");
                  }}
                >
                  <Text style={{ color: "#666" }}>{t.cancel}</Text>
                </Pressable>
                <Pressable
                  style={styles.modalSaveBtn}
                  onPress={handleJoinCircle}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {t.join}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  listContainer: {
    gap: 8,
  },
  circleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    gap: 12,
  },
  selectedItem: {
    backgroundColor: "#e0f2f5",
    borderWidth: 1,
    borderColor: "#74becb",
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0f2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircleIcon: {
    backgroundColor: "#74becb",
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  selectedText: {
    color: "#5aa8b5",
  },
  circleMeta: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    marginTop: 12,
  },
  circleActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  addBtn: {
    flex: 1,
    backgroundColor: "#74becb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  joinBtn: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#74becb",
  },
  // â”€â”€ Settings sheet â”€â”€
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  settingsSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  renameRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  renameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f9fafb",
  },
  saveNameBtn: {
    backgroundColor: "#74becb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  saveNameBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  roleChipSelected: {
    borderColor: "#74becb",
    backgroundColor: "#e0f2f5",
  },
  roleChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  roleChipTextSelected: {
    color: "#3a8fa0",
    fontWeight: "700",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuRowText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  adminNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  adminNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dangerText: {
    fontSize: 15,
    color: "#e74c3c",
    fontWeight: "600",
  },
  // â”€â”€ Generic modals (invite / join) â”€â”€
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    marginHorizontal: 20,
    marginBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0f172a",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: "#0f172a",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalSaveBtn: {
    backgroundColor: "#74becb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  otpBox: {
    backgroundColor: "#f0f7ff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  otpText: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
    color: "#0f172a",
  },
  expiryText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 12,
  },
  otpCopyHint: {
    fontSize: 11,
    color: "#74becb",
    marginTop: 6,
  },
});
