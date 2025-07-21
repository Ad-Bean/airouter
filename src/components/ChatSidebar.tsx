'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
} from 'lucide-react';
import { ChatSession } from '@/types/chat';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatSidebarProps {
  currentSessionId?: string;
  onNewChat: () => void;
  onSessionSelect?: (sessionId: string) => void; // Callback when a session is selected
  isCollapsed: boolean;
  onToggle: () => void;
  onSessionsRefresh?: () => void; // Optional callback when sessions are refreshed
  refreshTrigger?: number; // Trigger to force refresh
}

export function ChatSidebar({
  currentSessionId,
  onNewChat,
  onSessionSelect,
  isCollapsed,
  onToggle,
  onSessionsRefresh,
  refreshTrigger,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(currentSessionId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSessionId(currentSessionId);
  }, [currentSessionId]);

  const fetchSessions = useCallback(async () => {
    try {
      // setLoading(true);
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        onSessionsRefresh?.(); // Notify parent if callback provided
      } else {
        console.error('Failed to fetch sessions:', response.status);
        // Don't show error to user for session fetching failures
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      setSessions([]);
    } finally {
      // setLoading(false);
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

  // Refresh sessions when refreshTrigger changes
  useEffect(() => {
    if (session && refreshTrigger !== undefined) {
      fetchSessions();
    }
  }, [session, refreshTrigger, fetchSessions]);

  const handleNewChat = () => {
    onNewChat();
    // Update URL without triggering navigation for smoother experience
    const newUrl = '/chat';
    window.history.replaceState({ ...window.history.state, url: newUrl }, '', newUrl);
    fetchSessions(); // Refresh sessions after creating new chat
  };

  const handleSessionClick = (sessionId: string) => {
    // Immediately update local state for instant visual feedback
    setSelectedSessionId(sessionId);

    // Call the callback to load the session (if provided)
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    }

    // Update URL without triggering navigation for smoother experience
    const newUrl = `/chat?session=${sessionId}`;
    window.history.replaceState({ ...window.history.state, url: newUrl }, '', newUrl);

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
        method: 'DELETE',
      });
      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionToDelete));
        if (currentSessionId === sessionToDelete) {
          // If we're deleting the current session, go back to empty chat
          onNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle }),
      });
      if (response.ok) {
        setSessions(sessions.map((s) => (s.id === sessionId ? { ...s, title: editTitle } : s)));
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    } finally {
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (!session) return null;

  // Always treat as loaded
  return (
    <>
      {/* Sidebar with improved transitions */}
      <div
        className={`flex h-screen flex-col border-r border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 ${isCollapsed ? 'w-12' : 'w-64'} `}
      >
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-2">
            {!isCollapsed && (
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Go to home page"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg">
                  <ImageIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                </div>
              </button>
            )}

            <button
              onClick={onToggle}
              className="rounded-md p-2 text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              title={
                isCollapsed ? 'Expand sidebar (Click to show chat history)' : 'Collapse sidebar'
              }
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu
                className={`h-4 w-4 transition-transform duration-200 ${
                  isCollapsed ? 'rotate-90' : ''
                }`}
              />
            </button>
          </div>

          {/* Navigation buttons */}
          {!isCollapsed && (
            <div className="space-y-1 px-2 pb-2">
              <button
                onClick={handleNewChat}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                <span>New Chat</span>
              </button>
              <button
                onClick={() => router.push('/gallery')}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ImageIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Gallery</span>
              </button>
              <button
                onClick={() => router.push('/models')}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Cpu className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Models</span>
              </button>
            </div>
          )}

          {/* Chats title and toggle */}
          {!isCollapsed && (
            <div className="mt-4 px-2 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Chats
                </h2>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {sessions.length === 0 ? (
            <div className={`p-2 ${isCollapsed ? 'px-1' : ''}`}>
              {!isCollapsed && (
                <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="mx-auto mb-1 h-6 w-6 opacity-50" />
                  <p className="text-xs">No chats yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`space-y-1 p-1 ${isCollapsed ? 'px-0.5' : ''}`}>
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
                            if (e.key === 'Enter') handleEditSave(chatSession.id);
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                          className="h-7 text-xs"
                          autoFocus
                        />
                        <div className="mt-1 flex gap-1">
                          <Button
                            onClick={() => handleEditSave(chatSession.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={handleEditCancel}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div
                      className={`flex cursor-pointer items-center rounded-md transition-all duration-200 ${
                        selectedSessionId === chatSession.id
                          ? 'bg-blue-100 dark:bg-blue-800'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleSessionClick(chatSession.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
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
                      <div className={`flex-1 p-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
                        <div className="flex items-center gap-2">
                          <MessageSquare
                            className={`flex-shrink-0 ${
                              selectedSessionId === chatSession.id
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                            } ${isCollapsed ? 'h-4 w-4' : 'h-3 w-3'}`}
                          />
                          {!isCollapsed && (
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div
                                className={`text-xs font-medium ${
                                  selectedSessionId === chatSession.id
                                    ? 'font-semibold text-blue-800 dark:text-blue-200'
                                    : 'text-gray-900 dark:text-white'
                                }`}
                                title={chatSession.title}
                              >
                                {chatSession.title.length > 20
                                  ? `${chatSession.title.substring(0, 20)}...`
                                  : chatSession.title}
                              </div>
                              <div
                                className={`mt-0.5 flex items-center gap-1 text-xs ${
                                  selectedSessionId === chatSession.id
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400'
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
                          className="flex gap-1 pr-2 opacity-0 transition-all duration-200 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            onClick={(e) => handleEditStart(chatSession, e)}
                            size="sm"
                            variant="ghost"
                            className="p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                            title="Edit title"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDelete(chatSession.id);
                              setDeleteDialogOpen(true);
                            }}
                            size="sm"
                            variant="ghost"
                            className="p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                            title="Delete session"
                          >
                            <Trash2 className="h-3 w-3" />
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
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSessionToDelete(null);
        }}
        title="Delete Chat Session"
        description="Are you sure you want to delete this chat? This action cannot be undone and all messages in this conversation will be permanently lost."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteSession}
      />
    </>
  );
}
