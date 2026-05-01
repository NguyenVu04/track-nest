import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showToast } from "@/utils";

import { trackingManagerTest as trackingManagerTestLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import {
  assignFamilyCircleAdmin,
  createFamilyCircle,
  createParticipationPermission,
  deleteFamilyCircle,
  leaveFamilyCircle,
  listFamilyCircles,
  participateInFamilyCircle,
  removeMemberFromFamilyCircle,
  updateFamilyCircle,
  updateFamilyRole,
} from "@/services/trackingManager";
import { colors, spacing } from "@/styles/styles";

export default function TrackingManagerTestScreen() {
  const t = useTranslation(trackingManagerTestLang);
  // Create Family Circle
  const [createName, setCreateName] = useState("My Family");
  const [createRole, setCreateRole] = useState("Parent");
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);

  // List Family Circles
  const [listPageSize, setListPageSize] = useState("10");
  const [listPageToken, setListPageToken] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [listResult, setListResult] = useState<string | null>(null);

  // Delete Family Circle
  const [deleteCircleId, setDeleteCircleId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  // Update Family Circle
  const [updateCircleId, setUpdateCircleId] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  // Update Family Role
  const [roleCircleId, setRoleCircleId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleResult, setRoleResult] = useState<string | null>(null);

  // Create Participation Permission (OTP)
  const [otpCircleId, setOtpCircleId] = useState("");
  const [previousOtp, setPreviousOtp] = useState("");
  const [isCreatingOtp, setIsCreatingOtp] = useState(false);
  const [otpResult, setOtpResult] = useState<string | null>(null);

  // Participate in Family Circle (Join with OTP)
  const [joinOtp, setJoinOtp] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<string | null>(null);

  // Leave Family Circle
  const [leaveCircleId, setLeaveCircleId] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveResult, setLeaveResult] = useState<string | null>(null);

  // Remove Member from Family Circle
  const [removeMemberCircleId, setRemoveMemberCircleId] = useState("");
  const [removeMemberId, setRemoveMemberId] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeResult, setRemoveResult] = useState<string | null>(null);

  // Assign Family Circle Admin
  const [adminCircleId, setAdminCircleId] = useState("");
  const [adminMemberId, setAdminMemberId] = useState("");
  const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
  const [adminResult, setAdminResult] = useState<string | null>(null);

  // Handlers
  const handleCreateFamilyCircle = useCallback(async () => {
    if (!createName.trim() || !createRole.trim()) {
      showToast(t.enterNameAndRole, t.errorTitle);
      return;
    }
    try {
      setIsCreating(true);
      setCreateResult(null);
      const response = await createFamilyCircle(createName, createRole);
      setCreateResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsCreating(false);
    }
  }, [createName, createRole, t.enterNameAndRole, t.errorTitle]);

  const handleListFamilyCircles = useCallback(async () => {
    const pageSize = parseInt(listPageSize, 10);
    if (isNaN(pageSize) || pageSize <= 0) {
      showToast(t.validPageSize, t.errorTitle);
      return;
    }
    try {
      setIsListing(true);
      setListResult(null);
      const response = await listFamilyCircles(
        pageSize,
        listPageToken || undefined,
      );
      setListResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsListing(false);
    }
  }, [listPageSize, listPageToken, t.errorTitle, t.validPageSize]);

  const handleDeleteFamilyCircle = useCallback(async () => {
    if (!deleteCircleId.trim()) {
      showToast(t.enterFamilyCircleId, t.errorTitle);
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteResult(null);
      const response = await deleteFamilyCircle(deleteCircleId);
      setDeleteResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteCircleId, t.enterFamilyCircleId, t.errorTitle]);

  const handleUpdateFamilyCircle = useCallback(async () => {
    if (!updateCircleId.trim() || !updateName.trim()) {
      showToast(t.enterCircleIdAndName, t.errorTitle);
      return;
    }
    try {
      setIsUpdating(true);
      setUpdateResult(null);
      const response = await updateFamilyCircle(updateCircleId, updateName);
      setUpdateResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsUpdating(false);
    }
  }, [updateCircleId, updateName, t.enterCircleIdAndName, t.errorTitle]);

  const handleUpdateFamilyRole = useCallback(async () => {
    if (!roleCircleId.trim() || !newRole.trim()) {
      showToast(t.enterCircleIdAndRole, t.errorTitle);
      return;
    }
    try {
      setIsUpdatingRole(true);
      setRoleResult(null);
      const response = await updateFamilyRole(roleCircleId, newRole);
      setRoleResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsUpdatingRole(false);
    }
  }, [roleCircleId, newRole, t.enterCircleIdAndRole, t.errorTitle]);

  const handleCreateParticipationPermission = useCallback(async () => {
    if (!otpCircleId.trim()) {
      showToast(t.enterFamilyCircleId, t.errorTitle);
      return;
    }
    try {
      setIsCreatingOtp(true);
      setOtpResult(null);
      const response = await createParticipationPermission(
        otpCircleId,
        previousOtp || undefined,
      );
      setOtpResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsCreatingOtp(false);
    }
  }, [otpCircleId, previousOtp, t.enterFamilyCircleId, t.errorTitle]);

  const handleParticipateInFamilyCircle = useCallback(async () => {
    if (!joinOtp.trim()) {
      showToast(t.enterOtp, t.errorTitle);
      return;
    }
    try {
      setIsJoining(true);
      setJoinResult(null);
      const response = await participateInFamilyCircle(joinOtp);
      setJoinResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsJoining(false);
    }
  }, [joinOtp, t.enterOtp, t.errorTitle]);

  const handleLeaveFamilyCircle = useCallback(async () => {
    if (!leaveCircleId.trim()) {
      showToast(t.enterFamilyCircleId, t.errorTitle);
      return;
    }
    try {
      setIsLeaving(true);
      setLeaveResult(null);
      const response = await leaveFamilyCircle(leaveCircleId);
      setLeaveResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsLeaving(false);
    }
  }, [leaveCircleId, t.enterFamilyCircleId, t.errorTitle]);

  const handleRemoveMemberFromFamilyCircle = useCallback(async () => {
    if (!removeMemberCircleId.trim() || !removeMemberId.trim()) {
      showToast(t.enterCircleAndMemberId, t.errorTitle);
      return;
    }
    try {
      setIsRemoving(true);
      setRemoveResult(null);
      const response = await removeMemberFromFamilyCircle(
        removeMemberCircleId,
        removeMemberId,
      );
      setRemoveResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsRemoving(false);
    }
  }, [
    removeMemberCircleId,
    removeMemberId,
    t.enterCircleAndMemberId,
    t.errorTitle,
  ]);

  const handleAssignFamilyCircleAdmin = useCallback(async () => {
    if (!adminCircleId.trim() || !adminMemberId.trim()) {
      showToast(t.enterCircleAndMemberId, t.errorTitle);
      return;
    }
    try {
      setIsAssigningAdmin(true);
      setAdminResult(null);
      const response = await assignFamilyCircleAdmin(
        adminCircleId,
        adminMemberId,
      );
      setAdminResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      showToast(error.message, t.errorTitle);
    } finally {
      setIsAssigningAdmin(false);
    }
  }, [adminCircleId, adminMemberId, t.enterCircleAndMemberId, t.errorTitle]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.title}</Text>

        {/* Create Family Circle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionCreate}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.circleNamePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={createName}
            onChangeText={setCreateName}
          />
          <TextInput
            style={styles.input}
            placeholder={t.yourRolePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={createRole}
            onChangeText={setCreateRole}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSuccess,
              isCreating && styles.buttonDisabled,
            ]}
            onPress={handleCreateFamilyCircle}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.createCircle}</Text>
            )}
          </TouchableOpacity>
          {createResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{createResult}</Text>
            </View>
          )}
        </View>

        {/* List Family Circles Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionList}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.pageSizePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={listPageSize}
              onChangeText={setListPageSize}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.pageTokenOptionalPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={listPageToken}
              onChangeText={setListPageToken}
            />
          </View>
          <TouchableOpacity
            style={[styles.button, isListing && styles.buttonDisabled]}
            onPress={handleListFamilyCircles}
            disabled={isListing}
          >
            {isListing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.listCircles}</Text>
            )}
          </TouchableOpacity>
          {listResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{listResult}</Text>
            </View>
          )}
        </View>

        {/* Update Family Circle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionUpdateCircle}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.familyCircleIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={updateCircleId}
            onChangeText={setUpdateCircleId}
          />
          <TextInput
            style={styles.input}
            placeholder={t.newNamePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={updateName}
            onChangeText={setUpdateName}
          />
          <TouchableOpacity
            style={[styles.button, isUpdating && styles.buttonDisabled]}
            onPress={handleUpdateFamilyCircle}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.updateCircle}</Text>
            )}
          </TouchableOpacity>
          {updateResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{updateResult}</Text>
            </View>
          )}
        </View>

        {/* Update Family Role Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionUpdateRole}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.familyCircleIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={roleCircleId}
            onChangeText={setRoleCircleId}
          />
          <TextInput
            style={styles.input}
            placeholder={t.newRolePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={newRole}
            onChangeText={setNewRole}
          />
          <TouchableOpacity
            style={[styles.button, isUpdatingRole && styles.buttonDisabled]}
            onPress={handleUpdateFamilyRole}
            disabled={isUpdatingRole}
          >
            {isUpdatingRole ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.updateRole}</Text>
            )}
          </TouchableOpacity>
          {roleResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{roleResult}</Text>
            </View>
          )}
        </View>

        {/* Create Participation Permission (OTP) Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionOtp}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.familyCircleIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={otpCircleId}
            onChangeText={setOtpCircleId}
          />
          <TextInput
            style={styles.input}
            placeholder={t.previousOtpOptionalPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={previousOtp}
            onChangeText={setPreviousOtp}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSuccess,
              isCreatingOtp && styles.buttonDisabled,
            ]}
            onPress={handleCreateParticipationPermission}
            disabled={isCreatingOtp}
          >
            {isCreatingOtp ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.generateOtp}</Text>
            )}
          </TouchableOpacity>
          {otpResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{otpResult}</Text>
            </View>
          )}
        </View>

        {/* Participate in Family Circle (Join) Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionJoin}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.otpCodePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={joinOtp}
            onChangeText={setJoinOtp}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSuccess,
              isJoining && styles.buttonDisabled,
            ]}
            onPress={handleParticipateInFamilyCircle}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.joinCircle}</Text>
            )}
          </TouchableOpacity>
          {joinResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{joinResult}</Text>
            </View>
          )}
        </View>

        {/* Leave Family Circle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionLeave}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.familyCircleIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={leaveCircleId}
            onChangeText={setLeaveCircleId}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonDanger,
              isLeaving && styles.buttonDisabled,
            ]}
            onPress={handleLeaveFamilyCircle}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.leaveCircle}</Text>
            )}
          </TouchableOpacity>
          {leaveResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{leaveResult}</Text>
            </View>
          )}
        </View>

        {/* Remove Member from Family Circle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionRemoveMember}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.familyCircleIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={removeMemberCircleId}
            onChangeText={setRemoveMemberCircleId}
          />
          <TextInput
            style={styles.input}
            placeholder={t.memberIdRemovePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={removeMemberId}
            onChangeText={setRemoveMemberId}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonDanger,
              isRemoving && styles.buttonDisabled,
            ]}
            onPress={handleRemoveMemberFromFamilyCircle}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.removeMember}</Text>
            )}
          </TouchableOpacity>
          {removeResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{removeResult}</Text>
            </View>
          )}
        </View>

        {/* Assign Family Circle Admin Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionAssignAdmin}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.familyCircleIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={adminCircleId}
            onChangeText={setAdminCircleId}
          />
          <TextInput
            style={styles.input}
            placeholder={t.memberIdPromotePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={adminMemberId}
            onChangeText={setAdminMemberId}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonWarning,
              isAssigningAdmin && styles.buttonDisabled,
            ]}
            onPress={handleAssignFamilyCircleAdmin}
            disabled={isAssigningAdmin}
          >
            {isAssigningAdmin ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.assignAdmin}</Text>
            )}
          </TouchableOpacity>
          {adminResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{adminResult}</Text>
            </View>
          )}
        </View>

        {/* Delete Family Circle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionDelete}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.familyCircleIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={deleteCircleId}
            onChangeText={setDeleteCircleId}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonDanger,
              isDeleting && styles.buttonDisabled,
            ]}
            onPress={handleDeleteFamilyCircle}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.deleteCircle}</Text>
            )}
          </TouchableOpacity>
          {deleteResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{t.response}</Text>
              <Text style={styles.resultText}>{deleteResult}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonWarning: {
    backgroundColor: "#f59e0b",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
});
