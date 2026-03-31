import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { CircleMembersModal as circleMembersModalLang } from "@/constant/languages";
import { FamilyCircle } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  assignFamilyCircleAdmin,
  removeMemberFromFamilyCircle,
  updateFamilyRole,
} from "@/services/trackingManager";

export type CircleMember = {
  id: string;
  name: string;
  role?: string;
  isAdmin?: boolean;
};

interface CircleMembersModalProps {
  visible: boolean;
  onClose: () => void;
  circle: FamilyCircle | null;
  members: CircleMember[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export const CircleMembersModal: React.FC<CircleMembersModalProps> = ({
  visible,
  onClose,
  circle,
  members,
  onRefresh,
  isAdmin = false,
}) => {
  const t = useTranslation(circleMembersModalLang);
  const [editingRoleMember, setEditingRoleMember] =
    useState<CircleMember | null>(null);
  const [newRole, setNewRole] = useState("");

  const handleRemoveMember = (member: CircleMember) => {
    if (!circle) return;
    Alert.alert(
      t.removeMemberTitle,
      t.removeMemberMessage
        .replace("{{member}}", member.name)
        .replace("{{circle}}", circle.name),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.remove,
          style: "destructive",
          onPress: async () => {
            try {
              await removeMemberFromFamilyCircle(
                circle.familyCircleId,
                member.id,
              );
              onRefresh?.();
            } catch (error: any) {
              Alert.alert(t.errorTitle, error?.message ?? t.removeMemberFailed);
            }
          },
        },
      ],
    );
  };

  const handleMakeAdmin = (member: CircleMember) => {
    if (!circle) return;
    Alert.alert(
      t.assignAdminTitle,
      t.assignAdminMessage
        .replace("{{member}}", member.name)
        .replace("{{circle}}", circle.name),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.confirm,
          onPress: async () => {
            try {
              await assignFamilyCircleAdmin(circle.familyCircleId, member.id);
              onRefresh?.();
            } catch (error: any) {
              Alert.alert(t.errorTitle, error?.message ?? t.assignAdminFailed);
            }
          },
        },
      ],
    );
  };

  const handleUpdateRole = async () => {
    if (!circle || !editingRoleMember || !newRole.trim()) return;
    try {
      await updateFamilyRole(circle.familyCircleId, newRole.trim());
      setEditingRoleMember(null);
      setNewRole("");
      onRefresh?.();
    } catch (error: any) {
      Alert.alert(t.errorTitle, error?.message ?? t.updateRoleFailed);
    }
  };

  const renderMember = ({ item }: { item: CircleMember }) => (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        <Ionicons name="person" size={20} color="#74becb" />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        {item.role && <Text style={styles.memberRole}>{item.role}</Text>}
        {item.isAdmin && <Text style={styles.adminBadge}>{t.admin}</Text>}
      </View>
      <View style={styles.memberActions}>
        <Pressable
          onPress={() => {
            setEditingRoleMember(item);
            setNewRole(item.role ?? "");
          }}
          hitSlop={8}
          style={styles.memberActionBtn}
        >
          <Ionicons name="create-outline" size={18} color="#74becb" />
        </Pressable>
        {isAdmin && !item.isAdmin && (
          <>
            <Pressable
              onPress={() => handleMakeAdmin(item)}
              hitSlop={8}
              style={styles.memberActionBtn}
            >
              <Ionicons name="shield-outline" size={18} color="#f39c12" />
            </Pressable>
            <Pressable
              onPress={() => handleRemoveMember(item)}
              hitSlop={8}
              style={styles.memberActionBtn}
            >
              <Ionicons name="close-circle-outline" size={18} color="#e74c3c" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.content} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {circle?.name ?? t.circleFallback} {t.membersSuffix}
              </Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            {members.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>{t.noMembers}</Text>
              </View>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                style={{ maxHeight: 400 }}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Update role modal */}
      <Modal
        visible={!!editingRoleMember}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingRoleMember(null)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setEditingRoleMember(null)}
        >
          <View style={styles.content} onStartShouldSetResponder={() => true}>
            <Text style={styles.title}>
              {t.updateRoleFor.replace(
                "{{member}}",
                editingRoleMember?.name ?? "",
              )}
            </Text>
            <TextInput
              style={styles.input}
              value={newRole}
              onChangeText={setNewRole}
              placeholder={t.rolePlaceholder}
              autoFocus
            />
            <View style={styles.buttons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setEditingRoleMember(null)}
              >
                <Text style={{ color: "#666" }}>{t.cancel}</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleUpdateRole}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {t.save}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0f2f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  memberRole: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  adminBadge: {
    fontSize: 11,
    color: "#74becb",
    fontWeight: "600",
    marginTop: 2,
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  memberActionBtn: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    margin: 20,
    marginTop: 16,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveBtn: {
    backgroundColor: "#74becb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
