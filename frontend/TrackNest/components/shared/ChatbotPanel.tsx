import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/styles/styles";
import { criminalReportsService } from "@/services/criminalReports";
import type { ChatbotSessionMessage } from "@/types/criminalReports";

interface ChatbotPanelProps {
  documentId: string;
  title?: string;
  emptyState?: string;
}

export function ChatbotPanel({
  documentId: rawDocumentId,
  title = "Document Chat",
  emptyState = "Ask a question about this document.",
}: ChatbotPanelProps) {
  const documentId = rawDocumentId?.replace(/<[^>]*>?/gm, "")?.replace(/\.html$/i, "");
  const [isOpen, setIsOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatbotSessionMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!documentId) return;
    let isActive = true;

    const startSession = async () => {
      setIsChatLoading(true);
      setChatError(null);
      try {
        const session = await criminalReportsService.startChatbotSession({ documentId });
        if (!isActive) return;
        setChatSessionId(session.sessionId);
      } catch (error) {
        console.error("Failed to start chatbot session:", error);
        if (isActive) setChatError("Failed to start chatbot session.");
      } finally {
        if (isActive) setIsChatLoading(false);
      }
    };

    startSession();
    return () => { isActive = false; };
  }, [documentId]);

  const handleSendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || !chatSessionId) return;

    const optimistic: ChatbotSessionMessage = {
      role: "USER",
      content: trimmed,
      createdAtMs: Date.now(),
    };

    setChatMessages((prev) => [...prev, optimistic]);
    setChatInput("");
    setIsChatLoading(true);
    setChatError(null);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await criminalReportsService.sendChatbotMessage({
        sessionId: chatSessionId,
        message: trimmed,
      });

      const assistant: ChatbotSessionMessage = {
        role: "MODEL",
        content: response.response,
        createdAtMs: response.createdAt,
      };

      setChatMessages((prev) => [...prev, assistant]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      setChatError("Failed to send message.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatbotSessionMessage }) => {
    const isUser = item.role === "USER";
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowModel]}>
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleModel]}>
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextModel]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsOpen(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <View style={styles.headerActions}>
              {isChatLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView 
            style={styles.keyboardView} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.chatContainer}>
              <FlatList
                ref={flatListRef}
                data={chatMessages}
                keyExtractor={(item, index) => `${item.createdAtMs}-${index}`}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.border} />
                    <Text style={styles.emptyStateText}>{emptyState}</Text>
                  </View>
                }
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </View>

            {chatError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{chatError}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about this document..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!chatInput.trim() || isChatLoading || !chatSessionId) && styles.sendBtnDisabled]} 
                onPress={handleSendMessage}
                disabled={!chatInput.trim() || isChatLoading || !chatSessionId}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeBtn: {
    padding: 4,
  },
  keyboardView: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  messageList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowModel: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleModel: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: "#fff",
  },
  messageTextModel: {
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    gap: 6,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
