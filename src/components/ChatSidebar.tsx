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
} from "lucide-react";
import { ChatSession } from "@/types/chat";

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
    console.log("Session clicked:", sessionId);
    console.log("Current URL:", window.location.href);
    console.log("Navigating to:", `/chat?session=${sessionId}`);

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

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setSessions(sessions.filter((s) => s.id !== sessionId));
          if (currentSessionId === sessionId) {
            router.push("/chat");
          }
        }
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
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
        {/* Header - simplified without collapse button */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white">
              Chat History
            </h2>
          )}
        </div>

        {/* New Chat Button with improved styling */}
        <div className={`p-2 ${isCollapsed ? "px-1" : ""}`}>
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center gap-2 p-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
              isCollapsed ? "justify-center px-2" : ""
            }`}
            title={isCollapsed ? "Start New Chat" : ""}
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
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
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No chats yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`space-y-1 p-1 ${isCollapsed ? "px-0.5" : ""}`}>
              {sessions.map((chatSession) => (
                <div key={chatSession.id} className="group relative">
                  {/* Active session indicator */}
                  {selectedSessionId === chatSession.id && !isCollapsed && (
                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r-full animate-pulse" />
                  )}
                  {editingId === chatSession.id ? (
                    // Edit mode
                    !isCollapsed && (
                      <div className="p-1.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleEditSave(chatSession.id);
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          className="w-full px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          autoFocus
                        />
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => handleEditSave(chatSession.id)}
                            className="p-0.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-0.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    // View mode - Make entire container clickable with enhanced current session highlighting
                    <div
                      className={`flex items-center cursor-pointer transition-all duration-200 rounded-md ${
                        selectedSessionId === chatSession.id
                          ? "bg-blue-100 dark:bg-blue-900/40 border-l-3 border-blue-600 dark:border-blue-400 shadow-sm"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700/70 hover:shadow-sm"
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
                          : `Click to open: ${chatSession.title} • ${chatSession._count.messages} messages`
                      }
                    >
                      <div className={`flex-1 ${isCollapsed ? "p-2" : "p-2"}`}>
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
                          <button
                            onClick={(e) => handleEditStart(chatSession, e)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                            title="Edit title"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteSession(chatSession.id, e)
                            }
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom section with user info and collapse button */}
        <div className="mt-auto">
          {/* User Info */}
          {!isCollapsed && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {session.user?.name?.charAt(0) ||
                      session.user?.email?.charAt(0) ||
                      "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p
                    className="text-xs font-medium text-gray-900 dark:text-white"
                    title={session.user?.name || session.user?.email || ""}
                  >
                    {(session.user?.name || session.user?.email || "").length >
                    18
                      ? `${(
                          session.user?.name ||
                          session.user?.email ||
                          ""
                        ).substring(0, 18)}...`
                      : session.user?.name || session.user?.email || ""}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sessions.length} chats
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Collapse Button */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onToggle}
              className={`w-full flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200`}
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
              {!isCollapsed && <span className="ml-2 text-xs">Collapse</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
