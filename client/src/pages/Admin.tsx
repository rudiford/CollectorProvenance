import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { adminApi, contactApi } from "@/lib/api";
import type { WebmasterMessage } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Users, Image, FileText, Eye, EyeOff, Shield, MapPin, MessageSquare, Trash2, MailOpen } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allCars, setAllCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "users" | "cars" | "webmaster">("overview");
  const [webmasterMsgs, setWebmasterMsgs] = useState<WebmasterMessage[]>([]);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) return;
    Promise.all([
      adminApi.stats(),
      adminApi.users(),
      adminApi.cars(),
      contactApi.getWebmasterMessages(),
    ])
      .then(([s, u, c, w]) => {
        setStats(s);
        setAllUsers(u.users);
        setAllCars(c.cars);
        setWebmasterMsgs(w.messages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-8" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-secondary rounded animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h2 className="text-xl font-semibold mb-2">Error</h2>
      <p className="text-muted-foreground text-sm">{error}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={<Users className="h-5 w-5" />} label="Users" value={stats.totalUsers} />
          <StatCard icon={<Car className="h-5 w-5" />} label="Total Cars" value={stats.totalCars} />
          <StatCard icon={<Eye className="h-5 w-5" />} label="Public Cars" value={stats.publicCars} />
          <StatCard icon={<EyeOff className="h-5 w-5" />} label="Private Cars" value={stats.privateCars} />
          <StatCard icon={<Image className="h-5 w-5" />} label="Photos" value={stats.totalPhotos} />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Log Entries" value={stats.totalLogs} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(["overview", "users", "cars"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={() => setTab("webmaster")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === "webmaster" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Webmaster Messages
          {webmasterMsgs.filter((m) => m.status === "unread").length > 0 && (
            <span className="bg-foreground text-background text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {webmasterMsgs.filter((m) => m.status === "unread").length}
            </span>
          )}
        </button>
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">{allUsers.length} registered users</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-center px-4 py-3 font-medium">Cars</th>
                  <th className="text-center px-4 py-3 font-medium">Public</th>
                  <th className="text-center px-4 py-3 font-medium">Identity</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium">{u.displayName || u.username}</span>
                        {u.isAdmin && <Badge className="ml-2 text-[10px] py-0">Admin</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[u.locationCity, u.locationState, u.locationCountry].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">{u.totalCars}</td>
                    <td className="px-4 py-3 text-center">{u.publicCars}</td>
                    <td className="px-4 py-3 text-center">
                      {u.showIdentity ? (
                        <Eye className="h-4 w-4 text-green-400 mx-auto" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cars tab */}
      {tab === "cars" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">{allCars.length} total cars</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Car</th>
                  <th className="text-left px-4 py-3 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Chassis #</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-center px-4 py-3 font-medium">Visibility</th>
                  <th className="text-center px-4 py-3 font-medium">For Sale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allCars.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/cars/${c.id}`} className="font-medium hover:underline">
                        {c.year} {c.make} {c.model}
                        {c.variant && <span className="text-muted-foreground"> {c.variant}</span>}
                      </Link>
                      {c.factoryColorName && (
                        <p className="text-xs text-muted-foreground">{c.factoryColorName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.ownerDisplayName || c.ownerUsername}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.ownerEmail}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.chassisNumber || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[c.locationState, c.locationCountry].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.isPublic ? (
                        <Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]">Public</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]">Private</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.willingToSell ? "🟢" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Webmaster Messages tab */}
      {tab === "webmaster" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            {webmasterMsgs.length} messages · {webmasterMsgs.filter((m) => m.status === "unread").length} unread
          </p>
          {webmasterMsgs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet.</p>
            </div>
          ) : (
            webmasterMsgs.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg border p-4 transition-colors ${msg.status === "unread" ? "border-border bg-secondary/30" : "border-border/50 bg-card/30"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {msg.status === "unread" && (
                        <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                      )}
                      <span className="font-medium text-sm truncate">{msg.subject}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {msg.senderName} &lt;{msg.senderEmail}&gt; · {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                    {expandedMsg === msg.id ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{msg.message}</p>
                    ) : (
                      <p
                        className="text-sm text-muted-foreground truncate cursor-pointer hover:text-foreground"
                        onClick={() => setExpandedMsg(msg.id)}
                      >
                        {msg.message}
                      </p>
                    )}
                    {expandedMsg === msg.id && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground mt-1"
                        onClick={() => setExpandedMsg(null)}
                      >
                        Collapse
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {msg.status === "unread" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={async () => {
                          await contactApi.markWebmasterRead(msg.id);
                          setWebmasterMsgs((prev) =>
                            prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
                          );
                        }}
                      >
                        <MailOpen className="h-3.5 w-3.5 mr-1" />
                        Mark read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={async () => {
                        await contactApi.deleteWebmasterMessage(msg.id);
                        setWebmasterMsgs((prev) => prev.filter((m) => m.id !== msg.id));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          <p className="text-muted-foreground">Welcome to the admin dashboard. Use the tabs above to view all users and cars, regardless of their privacy settings.</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-3">Recent Users</h3>
              <div className="space-y-2">
                {allUsers.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span>{u.displayName || u.username}</span>
                    <span className="text-muted-foreground text-xs">{u.email}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-3">Recent Cars</h3>
              <div className="space-y-2">
                {allCars.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.year} {c.make} {c.model}</span>
                    <span className="text-muted-foreground text-xs">{c.ownerDisplayName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
