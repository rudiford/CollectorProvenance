import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, Car, Clock } from "lucide-react";

interface ContactMessage {
  id: string;
  carId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  carDescription: string;
  status: "unread" | "read";
  createdAt: string | number;
}

export default function Inbox() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/contact/inbox", { credentials: "include" });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/contact/${id}/read`, { method: "PATCH", credentials: "include" });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: "read" } : m));
  };

  const deleteMsg = async (id: string) => {
    await fetch(`/api/contact/${id}`, { method: "DELETE", credentials: "include" });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMsg?.id === id) setSelectedMsg(null);
  };

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  if (loading) return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="h-8 w-32 bg-secondary rounded animate-pulse mb-6" />
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Inbox</h1>
        {unreadCount > 0 && (
          <Badge className="text-xs">{unreadCount} new</Badge>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-8">Messages from people interested in your cars.</p>

      {messages.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No messages yet</p>
          <p className="text-muted-foreground text-xs mt-1">When someone contacts you about a car, it'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                msg.status === "unread"
                  ? "border-foreground/20 bg-secondary/30"
                  : "border-border hover:bg-secondary/20"
              }`}
              onClick={() => { setSelectedMsg(msg); if (msg.status === "unread") markRead(msg.id); }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{msg.senderName}</span>
                    {msg.status === "unread" && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Car className="h-3 w-3" />
                    <span>Re: {msg.carDescription}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded view */}
              {selectedMsg?.id === msg.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{msg.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>From: {msg.senderName}</span>
                    <a href={`mailto:${msg.senderEmail}`} className="text-foreground hover:underline">
                      {msg.senderEmail}
                    </a>
                  </div>
                  <div className="mt-3">
                    <a href={`mailto:${msg.senderEmail}?subject=Re: ${msg.carDescription} on Collector Provenance`}>
                      <Button size="sm">Reply via Email</Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
