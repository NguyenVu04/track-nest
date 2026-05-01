"use client";

import { useEffect, useState } from "react";
import {
  ChatbotSessionMessage,
  criminalReportsService,
} from "@/services/criminalReportsService";

interface ChatbotPanelProps {
  documentId: string;
  title?: string;
  emptyState?: string;
}

const sessionKeyForDocument = (documentId: string) =>
  `chatbot-session:${documentId}`;

export function ChatbotPanel({
  documentId: rawDocumentId,
  title = "Document Chat",
  emptyState = "Ask a question about this document.",
}: ChatbotPanelProps) {
  const documentId = rawDocumentId?.replace(/<[^>]*>?/gm, "")?.replace(/\.html$/i, "");
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatbotSessionMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    let isActive = true;

    const startSession = async () => {
      setIsChatLoading(true);
      setChatError(null);
      try {
        let sessionId: string | null = null;

        if (typeof window !== "undefined") {
          sessionId = sessionStorage.getItem(sessionKeyForDocument(documentId));
        }

        if (sessionId) {
          try {
            const history =
              await criminalReportsService.getChatbotSession(sessionId);
            if (!isActive) return;
            setChatSessionId(sessionId);
            setChatMessages(history.messages);
            return;
          } catch (error) {
            console.warn("Failed to reuse chatbot session:", error);
          }
        }

        const session = await criminalReportsService.startChatbotSession({
          documentId,
        });
        if (!isActive) return;
        setChatSessionId(session.sessionId);

        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            sessionKeyForDocument(documentId),
            session.sessionId,
          );
        }
      } catch (error) {
        console.error("Failed to start chatbot session:", error);
        if (isActive) {
          setChatError("Failed to start chatbot session.");
        }
      } finally {
        if (isActive) setIsChatLoading(false);
      }
    };

    startSession();

    return () => {
      isActive = false;
    };
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
    } catch (error) {
      console.error("Failed to send chat message:", error);
      setChatError("Failed to send message.");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 text-lg font-semibold">{title}</h3>
        {isChatLoading && (
          <span className="text-xs text-gray-500">Thinking...</span>
        )}
      </div>
      <div className="h-72 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyState}</p>
        ) : (
          chatMessages.map((message, index) => (
            <div
              key={`${message.createdAtMs}-${index}`}
              className={`flex ${
                message.role === "USER" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "USER"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>
      {chatError && <p className="mt-2 text-sm text-red-600">{chatError}</p>}
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          type="text"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Ask about this document..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isChatLoading || !chatSessionId}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
