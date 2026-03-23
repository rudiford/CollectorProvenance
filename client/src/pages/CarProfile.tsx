import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { carsApi, photosApi, albumsApi, CarDetail, CarPhoto, PhotoAlbum, ConditionLogWithAuthor, OwnershipRecord } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Plus, Camera, Edit2, Eye, EyeOff, Tag,
  MapPin, Calendar, Gauge, Wrench, Star, Flame, FileText,
  ChevronLeft, ChevronRight, User, ArrowRightLeft, Upload, Save,
  FolderPlus, FolderOpen, Folder, Mail, X
} from "lucide-react";
import {
  carTitle, statusLabel, formatDate, logTypeLabel, logTypeColor, acquisitionLabel
} from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function CarProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesFileRef = useRef<HTMLInputElement>(null);
  const [uploadingNotePhoto, setUploadingNotePhoto] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ senderName: "", senderEmail: "", message: "" });
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [unorganizedCount, setUnorganizedCount] = useState(0);
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadAlbumId, setUploadAlbumId] = useState<string>("");
  const modalFileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const d = await carsApi.get(id!);
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAlbums = async (carId: string) => {
    try {
      const { albums: a, unorganizedCount: u } = await albumsApi.list(carId);
      setAlbums(a);
      setUnorganizedCount(u);
    } catch {}
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (data?.car?.notes !== undefined) setNotes(data.car.notes || "");
    if (data?.car?.id) {
      loadAlbums(data.car.id);
    }
  }, [data]);

  // When selected album changes, pre-set the upload album target
  useEffect(() => {
    if (selectedAlbum && selectedAlbum !== "unorganized") {
      setUploadAlbumId(selectedAlbum);
    } else {
      setUploadAlbumId("");
    }
  }, [selectedAlbum]);

  const doUpload = async (file: File, albumId?: string) => {
    if (!data) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("category", "exterior");
    if (albumId) fd.append("albumId", albumId);
    await photosApi.upload(data.car.id, fd);
    await load();
    await loadAlbums(data.car.id);
    setUploading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !data) return;
    // If we have albums, show the modal to pick which album
    if (albums.length > 0) {
      setShowUploadModal(true);
      // Store file for modal to use
      (fileRef.current as any)._pendingFile = file;
    } else {
      await doUpload(file);
    }
  };

  const handleModalUpload = async () => {
    const file = (fileRef.current as any)?._pendingFile;
    if (!file) return;
    setShowUploadModal(false);
    await doUpload(file, uploadAlbumId || undefined);
    (fileRef.current as any)._pendingFile = null;
  };

  const togglePublic = async () => {
    if (!data) return;
    await carsApi.update(data.car.id, { isPublic: !data.car.isPublic });
    await load();
  };

  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  const { car, owner, photos, logs, ownership, isOwner } = data;
  const heroUrl = photos[activePhoto]?.url || car.heroPhotoUrl;

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await carsApi.update(car.id, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
    setSavingNotes(false);
  };

  const handleNotesPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !data) return;
    setUploadingNotePhoto(true);
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("category", "detail");
    await photosApi.upload(data.car.id, fd);
    await load();
    setUploadingNotePhoto(false);
  };

  const createAlbum = async (name: string) => {
    if (!name.trim()) return;
    setCreatingAlbum(true);
    await albumsApi.create(car.id, { name: name.trim() });
    setNewAlbumName("");
    setShowNewAlbum(false);
    setCreatingAlbum(false);
    await loadAlbums(car.id);
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Upload Album Picker Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upload to folder</h3>
              <button
                onClick={() => { setShowUploadModal(false); (fileRef.current as any)._pendingFile = null; }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Choose a folder for this file, or leave empty to keep it unsorted.</p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              <button
                onClick={() => setUploadAlbumId("")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm border transition-colors text-left",
                  !uploadAlbumId ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/50"
                )}
              >
                <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Unsorted</span>
              </button>
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => setUploadAlbumId(album.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm border transition-colors text-left",
                    uploadAlbumId === album.id ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/50"
                  )}
                >
                  <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="truncate">{album.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">{album.photoCount ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleModalUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowUploadModal(false); (fileRef.current as any)._pendingFile = null; }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Image */}
      <div className="relative w-full bg-zinc-900" style={{ minHeight: 320 }}>
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={carTitle(car)}
            className="w-full max-h-[70vh] object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <div className="text-center">
              <div className="text-8xl mb-4 opacity-10">🏎</div>
              {isOwner && (
                <>
                  <p className="text-muted-foreground text-sm mb-4">No photos yet</p>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" />
                    Add first photo
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />



        {/* Left/Right arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActivePhoto((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActivePhoto((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Photo thumbnails */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.slice(0, 8).map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActivePhoto(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === activePhoto ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Car info */}
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 py-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-3xl font-semibold">{car.year} {car.make} {car.model}</h1>
              {car.variant && (
                <span className="text-2xl text-muted-foreground">{car.variant}</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="capitalize">{statusLabel(car.currentStatus)}</Badge>
              {car.factoryColorName && (
                <span className="text-sm text-muted-foreground">{car.factoryColorName}</span>
              )}
              {car.willingToSell && (
                <Badge variant="secondary" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
                  <Tag className="h-3 w-3 mr-1" />
                  For sale
                </Badge>
              )}
              {car.locationState && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {car.locationState}
                </span>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Add photo"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePublic}
                className={cn(
                  "gap-1.5",
                  car.isPublic
                    ? "border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-400"
                    : "border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                )}
              >
                {car.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {car.isPublic ? "Public" : "Private"}
              </Button>
              <Link href={`/cars/${car.id}/log/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add log
                </Button>
              </Link>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*,.pdf,application/pdf"
          ref={fileRef}
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Chassis number + contact */}
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            {car.chassisNumber && (
              <code className="text-xs bg-secondary px-2 py-1 rounded font-mono text-muted-foreground">
                {car.chassisNumber}
              </code>
            )}
            <span className="text-xs text-muted-foreground">
              Registered by{" "}
              <Link href={`/u/${owner?.id}`} className="hover:text-foreground transition-colors">
                {owner?.displayName || owner?.username}
              </Link>
            </span>
          </div>
          {!isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContactForm(!showContactForm)}
              className="gap-1.5"
            >
              <Mail className="h-4 w-4" />
              Contact Owner
            </Button>
          )}
        </div>

        {/* Contact form */}
        {showContactForm && !isOwner && (
          <div className="rounded-lg border border-border bg-card p-5 my-4">
            <h3 className="text-sm font-medium mb-1">Contact the owner</h3>
            <p className="text-xs text-muted-foreground mb-4">Your message will be sent privately. The owner's contact info will not be revealed.</p>
            {contactSent ? (
              <div className="text-sm text-green-400 border border-green-400/20 rounded-md p-3 bg-green-400/5">
                ✓ Your message has been sent. The owner will receive it and can choose to respond.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Your name"
                    value={contactForm.senderName}
                    onChange={(e) => setContactForm({ ...contactForm, senderName: e.target.value })}
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={contactForm.senderEmail}
                    onChange={(e) => setContactForm({ ...contactForm, senderEmail: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Your message to the owner..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="min-h-[100px]"
                />
                {contactError && (
                  <div className="text-sm text-red-400 border border-red-400/20 rounded-md p-3 bg-red-400/5">{contactError}</div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={sendingContact || !contactForm.senderName || !contactForm.senderEmail || !contactForm.message}
                    onClick={async () => {
                      setSendingContact(true);
                      setContactError("");
                      try {
                        await fetch(`/api/contact/car/${car.id}`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(contactForm),
                        }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); });
                        setContactSent(true);
                      } catch (err: any) {
                        setContactError(err.message);
                      }
                      setSendingContact(false);
                    }}
                  >
                    {sendingContact ? "Sending..." : "Send Message"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowContactForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="specs" className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="specs">Specs</TabsTrigger>
            <TabsTrigger value="photos">
              Photos & Files {photos.length > 0 && <span className="ml-1.5 text-muted-foreground">({photos.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="history">
              History {logs.length > 0 && <span className="ml-1.5 text-muted-foreground">({logs.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="ownership">Ownership</TabsTrigger>
            {isOwner && <TabsTrigger value="actions">Actions</TabsTrigger>}
          </TabsList>

          {/* Specs */}
          <TabsContent value="specs" className="pb-12">
            <div className="grid md:grid-cols-2 gap-8">
              <SpecGroup title="Identification">
                <SpecRow label="Chassis" value={car.chassisNumber} mono />
                {car.engineNumber && <SpecRow label="Engine" value={car.engineNumber} mono />}
                {car.transmissionNumber && <SpecRow label="Transmission" value={car.transmissionNumber} mono />}
              </SpecGroup>
              <SpecGroup title="Factory Spec">
                {car.factoryColorCode && <SpecRow label="Paint Code" value={car.factoryColorCode} />}
                {car.factoryColorName && <SpecRow label="Color" value={car.factoryColorName} />}
                {car.factoryInterior && <SpecRow label="Interior" value={car.factoryInterior} />}
              </SpecGroup>
              <SpecGroup title="Current Status">
                <SpecRow label="Condition" value={statusLabel(car.currentStatus)} />
                {car.locationState && <SpecRow label="Location" value={`${car.locationState}${car.locationCountry ? ", " + car.locationCountry : ""}`} />}
                <SpecRow label="Visibility" value={car.isPublic ? "Public" : "Private"} />
                <SpecRow label="For sale" value={car.willingToSell ? "Yes" : "No"} />
              </SpecGroup>
            </div>

            {/* Details & Notes */}
            <Separator className="my-8" />
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Details & Notes</h3>
              {isOwner ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add details, history, stories, or anything noteworthy about this car..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[160px] resize-y text-sm leading-relaxed"
                  />
                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingNotes ? "Saving..." : notesSaved ? "Saved ✓" : "Save notes"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => notesFileRef.current?.click()} disabled={uploadingNotePhoto}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingNotePhoto ? "Uploading..." : "Upload image"}
                    </Button>
                    <input
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      ref={notesFileRef}
                      className="hidden"
                      onChange={handleNotesPhotoUpload}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {notes ? (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added yet.</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Photos & Files */}
          <TabsContent value="photos" className="pb-12">
            {/* Toolbar */}
            {isOwner && (
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload file"}
                </Button>
                {showNewAlbum ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="Folder name (e.g. Rally 2024)"
                      className="h-8 w-52 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createAlbum(newAlbumName);
                        if (e.key === "Escape") { setShowNewAlbum(false); setNewAlbumName(""); }
                      }}
                    />
                    <Button size="sm" disabled={!newAlbumName.trim() || creatingAlbum} onClick={() => createAlbum(newAlbumName)}>
                      {creatingAlbum ? "Creating..." : "Create"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowNewAlbum(false); setNewAlbumName(""); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowNewAlbum(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New folder
                  </Button>
                )}
              </div>
            )}

            {/* Folder list */}
            {albums.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedAlbum(null)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors",
                      selectedAlbum === null
                        ? "border-foreground/50 bg-secondary text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    All
                    <span className="text-xs opacity-60">{photos.length}</span>
                  </button>
                  {albums.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => setSelectedAlbum(album.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors",
                        selectedAlbum === album.id
                          ? "border-foreground/50 bg-secondary text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <FolderOpen className={cn("h-3.5 w-3.5", selectedAlbum === album.id ? "text-amber-400" : "text-amber-400/60")} />
                      {album.name}
                      <span className="text-xs opacity-60">{album.photoCount ?? 0}</span>
                    </button>
                  ))}
                  {unorganizedCount > 0 && (
                    <button
                      onClick={() => setSelectedAlbum("unorganized")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors",
                        selectedAlbum === "unorganized"
                          ? "border-foreground/50 bg-secondary text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <Folder className="h-3.5 w-3.5" />
                      Unsorted
                      <span className="text-xs opacity-60">{unorganizedCount}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Photo / file grid */}
            {(() => {
              const filteredPhotos = selectedAlbum === null
                ? photos
                : selectedAlbum === "unorganized"
                  ? photos.filter((p) => !p.albumId)
                  : photos.filter((p) => p.albumId === selectedAlbum);

              return filteredPhotos.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-lg">
                  <Camera className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {photos.length === 0 ? "No files yet" : "No files in this folder"}
                  </p>
                  {isOwner && photos.length === 0 && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => fileRef.current?.click()}>
                      Upload first file
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredPhotos.map((photo) => {
                    const isPdf = photo.url.toLowerCase().endsWith(".pdf");
                    return isPdf ? (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-md overflow-hidden border border-border hover:border-border/80 flex flex-col items-center justify-center bg-secondary/30 hover:bg-secondary/60 transition-all group"
                      >
                        <FileText className="h-10 w-10 text-muted-foreground/60 group-hover:text-muted-foreground mb-2 transition-colors" />
                        <span className="text-xs text-muted-foreground px-2 text-center truncate w-full">
                          {photo.caption || "Document"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-wider">PDF</span>
                      </a>
                    ) : (
                      <button
                        key={photo.id}
                        onClick={() => setActivePhoto(photos.indexOf(photo))}
                        className={cn(
                          "aspect-square rounded-md overflow-hidden border-2 transition-all",
                          photos.indexOf(photo) === activePhoto
                            ? "border-foreground"
                            : "border-transparent hover:border-border"
                        )}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || "Car photo"}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    );
                  })}
                  {isOwner && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-border/60 hover:bg-secondary/30 transition-all text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-xs">Add file</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* History — timeline journal */}
          <TabsContent value="history" className="pb-12">
            {isOwner && (
              <div className="flex justify-end mb-8">
                <Link href={`/cars/${car.id}/log/new`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add entry
                  </Button>
                </Link>
              </div>
            )}

            {logs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-1">No log entries yet</p>
                <p className="text-muted-foreground/60 text-xs">Every service, restoration, and event — documented here.</p>
                {isOwner && (
                  <Link href={`/cars/${car.id}/log/new`}>
                    <Button variant="outline" size="sm" className="mt-5">Add first entry</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="relative pl-8">
                {/* Vertical timeline rail */}
                <div className="absolute left-3 top-2 bottom-2 w-px bg-border/60" />

                <div className="space-y-0">
                  {logs.map((log, i) => (
                    <LogEntry key={log.id} log={log} isLast={i === logs.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Ownership */}
          <TabsContent value="ownership" className="pb-12">
            {ownership.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No ownership history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ownership.map((record, i) => (
                  <OwnershipEntry
                    key={record.id}
                    record={record}
                    isCurrent={!record.toDate}
                    isFirst={i === 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Owner Actions */}
          {isOwner && (
            <TabsContent value="actions" className="pb-12">
              <div className="max-w-md space-y-3">
                <Link href={`/cars/${car.id}/transfer`} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Transfer ownership</p>
                      <p className="text-xs text-muted-foreground">Generate a transfer code for the new owner</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link href={`/cars/${car.id}/edit`} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Edit2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Edit car details</p>
                      <p className="text-xs text-muted-foreground">Update specs, color, status, and privacy</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function SpecGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SpecRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function LogEntry({ log, isLast }: { log: ConditionLogWithAuthor; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const dotColors: Record<string, string> = {
    maintenance: "bg-blue-400",
    restoration: "bg-amber-400",
    event: "bg-purple-400",
    acquisition: "bg-green-400",
    observation: "bg-zinc-500",
  };

  return (
    <div className={cn("relative pb-8", isLast && "pb-0")}>
      {/* Timeline dot — sits on the rail at left-3 */}
      <div className={cn(
        "absolute -left-5 top-[7px] w-2.5 h-2.5 rounded-full border-2 border-background z-10",
        dotColors[log.logType] ?? "bg-zinc-500"
      )} />

      <div className="bg-card/50 border border-border/60 rounded-lg p-4 hover:border-border transition-colors">
        {/* Header row */}
        <div className="flex items-start gap-2 flex-wrap mb-2">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", logTypeColor(log.logType))}>
            {logTypeLabel(log.logType)}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">{formatDate(log.date)}</span>
          {log.mileage && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 ml-auto">
              <Gauge className="h-3 w-3" />
              {log.mileage.toLocaleString()} mi
            </span>
          )}
        </div>

        <h4 className="font-medium text-sm mb-1.5">{log.title}</h4>

        {log.description.length > 240 && !expanded ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {log.description.slice(0, 240)}…{" "}
            <button onClick={() => setExpanded(true)} className="text-foreground hover:underline whitespace-nowrap">
              Read more
            </button>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{log.description}</p>
        )}

        <div className="flex items-center gap-4 mt-3">
          {log.shopName && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" />
              {log.shopName}
            </span>
          )}
          {log.authorUsername && (
            <span className="text-xs text-muted-foreground ml-auto">
              by{" "}
              <Link href={`/u/${log.authorUsername}`} className="hover:text-foreground transition-colors">
                {log.authorDisplayName || log.authorUsername}
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnershipEntry({
  record,
  isCurrent,
  isFirst,
}: {
  record: OwnershipRecord;
  isCurrent: boolean;
  isFirst: boolean;
}) {
  const ownerName = record.displayName || record.username || record.ownerName || "Unknown";

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-colors",
      isCurrent ? "border-foreground/20 bg-secondary/30" : "border-border"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {record.username ? (
                <Link href={`/u/${record.ownerId}`} className="text-sm font-medium hover:underline">
                  {ownerName}
                </Link>
              ) : (
                <span className="text-sm font-medium">{ownerName}</span>
              )}
              {isCurrent && (
                <Badge variant="outline" className="text-xs py-0">Current</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDate(record.fromDate)}
                {" — "}
                {record.toDate ? formatDate(record.toDate) : "Present"}
              </span>
            </div>
            {record.acquisitionSource && (
              <p className="text-xs text-muted-foreground mt-1">{record.acquisitionSource}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0 capitalize">
          {acquisitionLabel(record.acquisitionType)}
        </Badge>
      </div>
      {record.notes && (
        <p className="text-xs text-muted-foreground mt-3 pl-11">{record.notes}</p>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="w-full bg-zinc-900 animate-pulse" style={{ height: 480 }} />
      <div className="container mx-auto px-4 max-w-5xl py-6 space-y-4">
        <div className="h-9 w-80 bg-secondary rounded animate-pulse" />
        <div className="h-5 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-10 w-64 bg-secondary rounded animate-pulse mt-6" />
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="container mx-auto px-4 py-24 text-center max-w-md">
      <h2 className="text-xl font-semibold mb-2">Could not load car</h2>
      <p className="text-muted-foreground text-sm mb-6">{error}</p>
      <Link href="/dashboard">
        <Button variant="outline">Back to garage</Button>
      </Link>
    </div>
  );
}
