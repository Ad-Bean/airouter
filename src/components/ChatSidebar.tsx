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
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isCollapsed ? "-translate-x-full" : "translate-x-0"}
        ${isCollapsed ? "w-0" : "w-80"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat History
              </h2>
              <button
                onClick={onToggle}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="w-full mt-3 flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chat history yet</p>
                <p className="text-xs">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="p-2">
                {sessions.map((chatSession) => (
                  <div
                    key={chatSession.id}
                    onClick={() => handleSessionClick(chatSession.id)}
                    className={`
                      group relative p-3 mb-2 rounded-lg cursor-pointer transition-colors
                      ${
                        currentSessionId === chatSession.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }
                    `}
                  >
                    {editingId === chatSession.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleEditSave(chatSession.id);
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditSave(chatSession.id)}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {chatSession.title || "Untitled Chat"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(chatSession.updatedAt)}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                •
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {chatSession._count.messages} messages
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleEditStart(chatSession, e)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) =>
                                handleDeleteSession(chatSession.id, e)
                              }
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {session.user?.name?.charAt(0) ||
                    session.user?.email?.charAt(0) ||
                    "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.user?.name || session.user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {sessions.length} conversations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle button for collapsed sidebar */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}
    </>
  );
}
