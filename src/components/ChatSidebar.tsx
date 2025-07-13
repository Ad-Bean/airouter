"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Menu,
  Image as ImageIcon,
  Cpu,
} from "lucide-react";
import { ChatSession } from "@/types/chat";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatSidebarProps {
  currentSessionId?: string;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  onSessionsRefresh?: () => void; // Optional callback when sessions are refreshed
}

export function ChatSidebar({
  currentSessionId,
  onNewChat,
  isCollapsed,
  onToggle,
  onSessionsRefresh,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(currentSessionId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSessionId(currentSessionId);
  }, [currentSessionId]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/chat/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        onSessionsRefresh?.(); // Notify parent if callback provided
      } else {
        console.error("Failed to fetch sessions:", response.status);
        // Don't show error to user for session fetching failures
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [onSessionsRefresh]);

  useEffect(() => {
    if (session) {
      fetchSessions();
    }
  }, [session, fetchSessions]);

  useEffect(() => {
    if (session && currentSessionId) {
      const sessionExists = sessions.some((s) => s.id === currentSessionId);
      if (!sessionExists && sessions.length > 0) {
        const timer = setTimeout(() => {
          fetchSessions();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [session, currentSessionId, sessions, fetchSessions]);

  const handleNewChat = () => {
    onNewChat();
    router.push("/chat");
  };

  const handleSessionClick = (sessionId: string) => {
    // Immediately update local state for instant visual feedback
    setSelectedSessionId(sessionId);

    // Always navigate to ensure URL is updated and session is properly loaded
    // Even if we think we're on the same session, the URL might be different
    router.push(`/chat?session=${sessionId}`);

    // Auto-collapse sidebar on mobile after selection
    if (window.innerWidth < 768 && !isCollapsed) {
      setTimeout(() => {
        onToggle(); // Use the passed toggle function to collapse
      }, 300); // Small delay to show selection feedback
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionToDelete}/delete`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionToDelete));
        if (currentSessionId === sessionToDelete) {
          router.push("/chat");
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setSessionToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditStart = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleEditSave = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      if (response.ok) {
        setSessions(
          sessions.map((s) =>
            s.id === sessionId ? { ...s, title: editTitle } : s
          )
        );
      }
    } catch (error) {
      console.error("Failed to update session:", error);
    } finally {
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (!session) return null;

  return (
    <>
      {/* Sidebar with improved transitions */}
      <div
        className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen transition-all duration-300 ease-in-out flex flex-col shadow-sm
        ${isCollapsed ? "w-12" : "w-64"}
      `}
      >
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-2">
            {!isCollapsed && (
              <button
                onClick={() => router.push("/")}
                className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
                title="Go to home page"
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
              </button>
            )}

            <button
              onClick={onToggle}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
              title={
                isCollapsed
                  ? "Expand sidebar (Click to show chat history)"
                  : "Collapse sidebar"
              }
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu
                className={`w-4 h-4 transition-transform duration-200 ${
                  isCollapsed ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>

          {/* Navigation buttons */}
          {!isCollapsed && (
            <div className="px-2 pb-2 space-y-1">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span>New Chat</span>
              </button>
              <button
                onClick={() => router.push("/gallery")}
                className="w-full flex items-center gap-2 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Gallery</span>
              </button>
              <button
                onClick={() => router.push("/models")}
                className="w-full flex items-center gap-2 p-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                <Cpu className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Models</span>
              </button>
            </div>
          )}

          {/* Chats title and toggle */}
          {!isCollapsed && (
            <div className="px-2 pb-2 mt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Chats
                </h2>
              </div>
            </div>
          )}
        </div>

        {/* Sessions List - improved overflow handling */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className={`p-2 ${isCollapsed ? "px-1" : ""}`}>
              {!isCollapsed ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              )}
            </div>
          ) : sessions.length === 0 ? (
            <div className={`p-2 ${isCollapsed ? "px-1" : ""}`}>
              {!isCollapsed && (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
                  <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No chats yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`space-y-1 p-1 ${isCollapsed ? "px-0.5" : ""}`}>
              {sessions.map((chatSession) => (
                <div key={chatSession.id} className="group relative">
                  {editingId === chatSession.id ? (
                    // Edit mode
                    !isCollapsed && (
                      <div className="p-1.5">
                        <Input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleEditSave(chatSession.id);
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          className="text-xs h-7"
                          autoFocus
                        />
                        <div className="flex gap-1 mt-1">
                          <Button
                            onClick={() => handleEditSave(chatSession.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={handleEditCancel}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div
                      className={`flex items-center cursor-pointer transition-all duration-200 rounded-md
                      ${
                        selectedSessionId === chatSession.id
                          ? "bg-blue-100 dark:bg-blue-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => handleSessionClick(chatSession.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSessionClick(chatSession.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open chat session: ${chatSession.title}`}
                      title={
                        isCollapsed
                          ? chatSession.title
                          : `${chatSession.title} • ${chatSession._count.messages} messages`
                      }
                    >
                      <div
                        className={`flex-1 p-2 ${
                          isCollapsed ? "flex justify-center" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare
                            className={`flex-shrink-0 ${
                              selectedSessionId === chatSession.id
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                            } ${isCollapsed ? "w-4 h-4" : "w-3 h-3"}`}
                          />
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div
                                className={`text-xs font-medium ${
                                  selectedSessionId === chatSession.id
                                    ? "text-blue-800 dark:text-blue-200 font-semibold"
                                    : "text-gray-900 dark:text-white"
                                }`}
                                title={chatSession.title}
                              >
                                {chatSession.title.length > 20
                                  ? `${chatSession.title.substring(0, 20)}...`
                                  : chatSession.title}
                              </div>
                              <div
                                className={`text-xs flex items-center gap-1 mt-0.5 ${
                                  selectedSessionId === chatSession.id
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                <span>{chatSession._count.messages} msgs</span>
                                <span>•</span>
                                <span>{formatDate(chatSession.updatedAt)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div
                          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 pr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            onClick={(e) => handleEditStart(chatSession, e)}
                            size="sm"
                            variant="ghost"
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Edit title"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDelete(chatSession.id);
                              setDeleteDialogOpen(true);
                            }}
                            size="sm"
                            variant="ghost"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Chat Session"
        description="Are you sure you want to delete this chat? This action cannot be undone and all messages in this conversation will be permanently lost."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </>
  );
}
