import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Search, MessageSquare, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  project_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  projectId: string | null;
}

export default function Messages() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const channel = supabase
      .channel("messages-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === selectedConversation) {
            setMessages((prev) => [...prev, newMsg]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!allMessages?.length) { setConversations([]); return; }

    const convMap = new Map<string, Message[]>();
    allMessages.forEach((msg) => {
      const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!convMap.has(otherUserId)) convMap.set(otherUserId, []);
      convMap.get(otherUserId)!.push(msg);
    });

    const userIds = Array.from(convMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    const convList: Conversation[] = Array.from(convMap.entries()).map(([otherUserId, msgs]) => {
      const unreadCount = msgs.filter((m) => m.recipient_id === user.id && !m.read_at).length;
      const lastMsg = msgs[0];
      return {
        otherUserId,
        otherUserName: profileMap.get(otherUserId) || "User",
        lastMessage: lastMsg.content.slice(0, 80) + (lastMsg.content.length > 80 ? "..." : ""),
        lastMessageTime: lastMsg.created_at,
        unreadCount,
        projectId: lastMsg.project_id,
      };
    });

    setConversations(convList);
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", otherUserId)
      .eq("recipient_id", user.id)
      .is("read_at", null);

    fetchConversations();
  };

  useEffect(() => {
    if (selectedConversation) fetchMessages(selectedConversation);
  }, [selectedConversation]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: selectedConversation,
      content: newMessage.trim(),
      project_id: conversations.find((c) => c.otherUserId === selectedConversation)?.projectId || null,
    });
    if (!error) { setNewMessage(""); fetchMessages(selectedConversation); }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(diff / (1000 * 60));
    return mins > 0 ? `${mins}m ago` : "Just now";
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) => c.otherUserName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const selectedUser = conversations.find((c) => c.otherUserId === selectedConversation);
  const showSidebar = !isMobile || !selectedConversation;
  const showThread = !isMobile || !!selectedConversation;

  if (loading || !user) return null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className={cn("flex flex-col border-r bg-card", isMobile ? "w-full" : "w-80 lg:w-96")}>
            <div className="border-b p-4">
              <h2 className="mb-3 text-lg font-semibold">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No conversations match your search" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.otherUserId}
                      onClick={() => setSelectedConversation(conv.otherUserId)}
                      className={cn(
                        "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                        selectedConversation === conv.otherUserId && "bg-accent"
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {conv.otherUserName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-sm", conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                            {conv.otherUserName}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatTime(conv.lastMessageTime)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("truncate text-xs", conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {conv.lastMessage}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px]">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Thread */}
        {showThread && (
          <div className="flex flex-1 flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {selectedUser?.otherUserName.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{selectedUser?.otherUserName ?? "User"}</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="mx-auto max-w-2xl space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={cn("flex", msg.sender_id === user.id ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                          msg.sender_id === user.id
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn(
                            "mt-1 text-[10px]",
                            msg.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={handleSend} className="border-t p-4">
                  <div className="mx-auto flex max-w-2xl gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="mb-4 h-16 w-16 text-muted-foreground/20" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose from your existing conversations to start chatting</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
