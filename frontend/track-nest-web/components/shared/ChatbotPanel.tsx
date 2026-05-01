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
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
        aria-label="Open chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
      </button>

      <div
        className={`fixed bottom-6 right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl bg-background border border-border shadow-2xl transition-all duration-300 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60"></div>
                Thinking...
              </div>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px]">
          {chatMessages.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-30"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p className="text-sm">{emptyState}</p>
            </div>
          ) : (
            chatMessages.map((message, index) => (
              <div
                key={`${message.createdAtMs}-${index}`}
                className={`flex ${
                  message.role === "USER" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.9rem] leading-relaxed shadow-sm ${
                    message.role === "USER"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card text-card-foreground border border-border rounded-bl-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>
        
        {chatError && (
          <div className="mx-4 mb-2 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {chatError}
          </div>
        )}

        <form
          className="flex gap-3 border-t border-border bg-muted/10 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSendMessage();
          }}
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Type your question..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatLoading || !chatSessionId}
            className="flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </>
  );
}
