"use client";

import { useState, useEffect } from "react";
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

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

interface ChatSidebarProps {
  currentSessionId?: string;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function ChatSidebar({
  currentSessionId,
  onNewChat,
  isCollapsed,
  onToggle,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (session) {
      fetchSessions();
    }
  }, [session]);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/chat/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    router.push("/chat");
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat?session=${sessionId}`);
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
      {/* Sidebar */}
      <div
        className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full transition-all duration-300 flex flex-col
        ${isCollapsed ? "w-10" : "w-64"}
      `}
      >
        {/* Header */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white">
              Chat History
            </h2>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className={`p-2 ${isCollapsed ? "px-1" : ""}`}>
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center gap-2 p-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors ${
              isCollapsed ? "justify-center px-1" : ""
            }`}
            title={isCollapsed ? "New Chat" : ""}
          >
            <Plus className="w-3 h-3 flex-shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
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
            <div className={`space-y-0.5 p-1 ${isCollapsed ? "px-0.5" : ""}`}>
              {sessions.map((chatSession) => (
                <div
                  key={chatSession.id}
                  className={`group relative rounded-md transition-colors ${
                    currentSessionId === chatSession.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
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
                    // View mode
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSessionClick(chatSession.id)}
                        className={`flex-1 p-1.5 text-left ${
                          isCollapsed ? "justify-center" : ""
                        }`}
                        title={
                          isCollapsed
                            ? chatSession.title
                            : `${chatSession.title} • ${chatSession._count.messages} messages`
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 flex-shrink-0 text-gray-400" />
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                {chatSession.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <span>{chatSession._count.messages} msgs</span>
                                <span>•</span>
                                <span>{formatDate(chatSession.updatedAt)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                          <button
                            onClick={(e) => handleEditStart(chatSession, e)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            title="Edit title"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteSession(chatSession.id, e)
                            }
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
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

        {/* Compact Footer */}
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
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {session.user?.name || session.user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {sessions.length} chats
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
