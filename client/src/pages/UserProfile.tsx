import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { usersApi, User, Car } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Camera, MapPin, Car as CarIcon } from "lucide-react";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<{ user: User; cars: Car[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    locationCity: "",
    locationState: "",
    locationCountry: "",
    phone: "",
    website: "",
    instagram: "",
    showEmail: false,
    showPhone: false,
    showCity: false,
    showState: false,
    showCountry: false,
    showWebsite: true,
    showInstagram: true,
    showIdentity: true,
  });

  useEffect(() => {
    if (!userId) return;
    usersApi
      .getById(userId)
      .then((data) => {
        setProfile(data);
        setForm({
          displayName: data.user.displayName || "",
          bio: data.user.bio || "",
          locationCity: data.user.locationCity || "",
          locationState: data.user.locationState || "",
          locationCountry: data.user.locationCountry || "",
          phone: data.user.phone || "",
          website: data.user.website || "",
          instagram: data.user.instagram || "",
          showEmail: data.user.showEmail ?? false,
          showPhone: data.user.showPhone ?? false,
          showCity: data.user.showCity ?? false,
          showState: data.user.showState ?? false,
          showCountry: data.user.showCountry ?? false,
          showWebsite: data.user.showWebsite ?? true,
          showInstagram: data.user.showInstagram ?? true,
          showIdentity: data.user.showIdentity ?? true,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const { user: updated } = await usersApi.updateProfile(form);
      setProfile((prev) => prev ? { ...prev, user: { ...prev.user, ...updated } } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveError(err.message || "Failed to save");
    }
    setSaving(false);
  };

  if (loading) return <LoadingState />;
  if (error) return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h2 className="text-xl font-semibold mb-2">User not found</h2>
      <p className="text-muted-foreground text-sm">{error}</p>
    </div>
  );
  if (!profile) return null;

  const { user } = profile;
  const isOwnProfile = me?.id === user.id;

  // If viewing someone else's profile, show read-only view
  if (!isOwnProfile) {
    return <PublicProfile user={user} />;
  }

  // Own profile — show editable form directly
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-semibold mb-1">My Profile</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage your personal information and privacy settings.</p>

      <div className="space-y-8">
        {/* Avatar + basic */}
        <section className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-semibold shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (user.displayName || user.username).charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.showIdentity}
                  onChange={(e) => setForm({ ...form, showIdentity: e.target.checked })}
                  className="h-4 w-4 rounded border-border bg-background accent-foreground cursor-pointer mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">Show my identity on public car listings</p>
                  <ul className="text-xs text-muted-foreground mt-1.5 space-y-1 list-disc list-inside">
                    <li className="text-sm mb-2 underline">By checking this box, your name will be viewable on this website.</li>
                    <li>You still retain the option of making any of your cars public or not public.</li>
                    <li>You determine which car or cars will be viewable to the public or not viewable to the public, individually by car.</li>
                    <li>If you uncheck this box and keep your cars in Private Mode, no trace of you or your cars will be visible on this website.</li>
                    <li>If you uncheck this box, but make any cars viewable to the public, then a random name will be assigned to your profile in the public view such as USER1234.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us about yourself and your collection..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Contact Information</h2>
          <p className="text-xs text-muted-foreground mb-4">Check the box next to any field you want visible on your public profile.</p>

          <div className="space-y-3">
            <PrivacyField
              label="Email"
              value={user.email || ""}
              isPublic={form.showEmail}
              onToggle={(v) => setForm({ ...form, showEmail: v })}
              readOnly
            />
            <PrivacyField
              label="Phone"
              value={form.phone}
              isPublic={form.showPhone}
              onToggle={(v) => setForm({ ...form, showPhone: v })}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="(555) 555-5555"
            />
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Location</h2>
          <p className="text-xs text-muted-foreground mb-4">Check the box to make each part of your location public.</p>

          <div className="space-y-3">
            <PrivacyField
              label="City"
              value={form.locationCity}
              isPublic={form.showCity}
              onToggle={(v) => setForm({ ...form, showCity: v })}
              onChange={(v) => setForm({ ...form, locationCity: v })}
              placeholder="Dallas"
            />
            <PrivacyField
              label="State / Region"
              value={form.locationState}
              isPublic={form.showState}
              onToggle={(v) => setForm({ ...form, showState: v })}
              onChange={(v) => setForm({ ...form, locationState: v })}
              placeholder="Texas"
            />
            <PrivacyField
              label="Country"
              value={form.locationCountry}
              isPublic={form.showCountry}
              onToggle={(v) => setForm({ ...form, showCountry: v })}
              onChange={(v) => setForm({ ...form, locationCountry: v })}
              placeholder="US"
            />
          </div>
        </section>

        {/* Social & Web */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Social & Web</h2>

          <div className="space-y-3">
            <PrivacyField
              label="Website"
              value={form.website}
              isPublic={form.showWebsite}
              onToggle={(v) => setForm({ ...form, showWebsite: v })}
              onChange={(v) => setForm({ ...form, website: v })}
              placeholder="https://yoursite.com"
            />
            <PrivacyField
              label="Instagram"
              value={form.instagram}
              isPublic={form.showInstagram}
              onToggle={(v) => setForm({ ...form, showInstagram: v })}
              onChange={(v) => setForm({ ...form, instagram: v })}
              placeholder="@username"
            />
          </div>
        </section>

        {/* Save */}
        <div className="space-y-3 pt-2 pb-8">
          {saveError && (
            <div className="text-sm text-red-400 border border-red-400/20 rounded-md p-3 bg-red-400/5">
              {saveError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Read-only view for other users viewing your profile
function PublicProfile({ user }: { user: User }) {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl animate-fade-in">
      <div className="flex items-start gap-6 mb-8">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-semibold shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (user.displayName || user.username).charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{user.displayName || user.username}</h1>
          <p className="text-muted-foreground text-sm mb-2">@{user.username}</p>
          {user.bio && <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{user.bio}</p>}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            {(user.locationCity || user.locationState || user.locationCountry) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[user.locationCity, user.locationState, user.locationCountry].filter(Boolean).join(", ")}
              </span>
            )}
            {user.website && (
              <a href={user.website.startsWith("http") ? user.website : `https://${user.website}`} target="_blank" rel="noopener" className="hover:text-foreground transition-colors">
                🌐 {user.website}
              </a>
            )}
            {user.instagram && (
              <a href={`https://instagram.com/${user.instagram.replace("@","")}`} target="_blank" rel="noopener" className="hover:text-foreground transition-colors">
                📷 @{user.instagram.replace("@","")}
              </a>
            )}
            {user.showEmail && user.email && (
              <span>✉️ {user.email}</span>
            )}
            {user.phone && (
              <span>📞 {user.phone}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivacyField({
  label,
  value,
  isPublic,
  onToggle,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  isPublic: boolean;
  onToggle: (v: boolean) => void;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 shrink-0 w-8">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border-border bg-background accent-foreground cursor-pointer"
          title={isPublic ? "Visible to public" : "Hidden from public"}
        />
      </div>
      <div className="w-28 shrink-0">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1">
        {readOnly ? (
          <span className="text-sm">{value}</span>
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="h-9 text-sm"
          />
        )}
      </div>
      <span className="text-xs w-16 shrink-0 text-right">
        {isPublic ? (
          <span className="text-green-400">Public</span>
        ) : (
          <span className="text-muted-foreground">Private</span>
        )}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="h-7 w-48 bg-secondary rounded animate-pulse mb-2" />
      <div className="h-4 w-72 bg-secondary rounded animate-pulse mb-8" />
      <div className="flex items-start gap-6">
        <div className="h-20 w-20 rounded-full bg-secondary animate-pulse" />
        <div className="space-y-3 flex-1">
          <div className="h-9 w-full bg-secondary rounded animate-pulse" />
          <div className="h-9 w-full bg-secondary rounded animate-pulse" />
          <div className="h-20 w-full bg-secondary rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
