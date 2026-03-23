const BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Auth
export const auth = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/auth/me"),
};

// Cars
export const carsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ cars: CarSummary[] }>(`/cars${qs}`);
  },
  get: (id: string) => request<CarDetail>(`/cars/${id}`),
  mine: () => request<{ cars: Car[] }>("/cars/user/mine"),
  create: (body: Partial<Car>) =>
    request<{ car: Car }>("/cars", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Car>) =>
    request<{ car: Car }>(`/cars/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => request<{ ok: boolean }>(`/cars/${id}`, { method: "DELETE" }),
};

// Condition Logs
export const logsApi = {
  list: (carId: string) => request<{ logs: ConditionLogWithAuthor[] }>(`/logs/car/${carId}`),
  create: (carId: string, body: Partial<ConditionLog>) =>
    request<{ log: ConditionLog }>(`/logs/car/${carId}`, { method: "POST", body: JSON.stringify(body) }),
  delete: (id: string) => request<{ ok: boolean }>(`/logs/${id}`, { method: "DELETE" }),
};

// Photos
export const photosApi = {
  list: (carId: string) => request<{ photos: CarPhoto[] }>(`/photos/car/${carId}`),
  upload: (carId: string, formData: FormData) =>
    fetch(`${BASE}/photos/car/${carId}`, { method: "POST", body: formData, credentials: "include" }).then((r) =>
      r.json()
    ),
  delete: (id: string) => request<{ ok: boolean }>(`/photos/${id}`, { method: "DELETE" }),
  setHero: (carId: string, photoId: string) =>
    request<{ ok: boolean }>(`/photos/car/${carId}/hero/${photoId}`, { method: "PATCH" }),
};

// Transfers
export const transfersApi = {
  generate: (carId: string) => request<{ transfer: TransferCode }>(`/transfers/generate/${carId}`, { method: "POST" }),
  claim: (code: string) => request<{ car: Car; message: string }>(`/transfers/claim`, { method: "POST", body: JSON.stringify({ code }) }),
  cancel: (transferId: string) => request<{ ok: boolean }>(`/transfers/cancel/${transferId}`, { method: "POST" }),
  getForCar: (carId: string) => request<{ transfer: TransferCode | null }>(`/transfers/car/${carId}`),
};

// Users
export const usersApi = {
  getProfile: (username: string) => request<{ user: User; cars: Car[] }>(`/users/${username}`),
  getById: (id: string) => request<{ user: User; cars: Car[] }>(`/users/id/${id}`),
  updateProfile: (body: Partial<User>) =>
    request<{ user: User }>(`/users/me/profile`, { method: "PATCH", body: JSON.stringify(body) }),
};

// Admin
export const adminApi = {
  stats: () => request<{ totalUsers: number; totalCars: number; publicCars: number; privateCars: number; totalPhotos: number; totalLogs: number }>("/admin/stats"),
  users: () => request<{ users: any[] }>("/admin/users"),
  cars: () => request<{ cars: any[] }>("/admin/cars"),
  getUser: (id: string) => request<{ user: any; cars: any[] }>(`/admin/users/${id}`),
};

// Contact (webmaster)
export const contactApi = {
  sendWebmaster: (body: { senderName: string; senderEmail: string; subject: string; message: string }) =>
    request<{ ok: boolean; message: string }>("/contact/webmaster", { method: "POST", body: JSON.stringify(body) }),
  getWebmasterMessages: () => request<{ messages: WebmasterMessage[] }>("/contact/webmaster"),
  markWebmasterRead: (id: string) => request<{ ok: boolean }>(`/contact/webmaster/${id}/read`, { method: "PATCH" }),
  deleteWebmasterMessage: (id: string) => request<{ ok: boolean }>(`/contact/webmaster/${id}`, { method: "DELETE" }),
};

// Albums
export const albumsApi = {
  list: (carId: string) => request<{ albums: PhotoAlbum[]; unorganizedCount: number }>(`/albums/car/${carId}`),
  create: (carId: string, body: { name: string; description?: string }) =>
    request<{ album: PhotoAlbum }>(`/albums/car/${carId}`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<PhotoAlbum>) =>
    request<{ album: PhotoAlbum }>(`/albums/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => request<{ ok: boolean }>(`/albums/${id}`, { method: "DELETE" }),
  movePhoto: (photoId: string, albumId: string | null) =>
    request<{ ok: boolean }>(`/albums/photo/${photoId}/move`, { method: "PATCH", body: JSON.stringify({ albumId }) }),
};

// Types
export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string | null;
  bio?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  avatarUrl?: string | null;
  showEmail?: boolean;
  showPhone?: boolean;
  showCity?: boolean;
  showState?: boolean;
  showCountry?: boolean;
  showWebsite?: boolean;
  showInstagram?: boolean;
  showIdentity?: boolean;
  isAnonymous?: boolean;
  isAdmin?: boolean;
  createdAt: string | number;
}

export interface Car {
  id: string;
  chassisNumber: string;
  year: number;
  make: string;
  model: string;
  variant?: string | null;
  engineNumber?: string | null;
  transmissionNumber?: string | null;
  factoryColorCode?: string | null;
  factoryColorName?: string | null;
  factoryInterior?: string | null;
  factoryOptions?: string | null;
  currentStatus: "original" | "restored" | "modified" | "barn_find" | "project";
  locationState?: string | null;
  locationCountry?: string | null;
  isPublic: boolean;
  willingToSell: boolean;
  currentOwnerId: string;
  notes?: string | null;
  heroPhotoUrl?: string | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface CarSummary {
  id: string;
  chassisNumber: string;
  year: number;
  make: string;
  model: string;
  variant?: string | null;
  factoryColorName?: string | null;
  currentStatus: string;
  locationState?: string | null;
  locationCountry?: string | null;
  willingToSell: boolean;
  heroPhotoUrl?: string | null;
  ownerUsername?: string | null;
  ownerDisplayName?: string | null;
}

export interface CarDetail {
  car: Car;
  owner: { id: string; username: string; displayName?: string | null };
  photos: CarPhoto[];
  logs: ConditionLogWithAuthor[];
  ownership: OwnershipRecord[];
  isOwner: boolean;
}

export interface ConditionLog {
  id: string;
  carId: string;
  authorId: string;
  date: string;
  mileage?: number | null;
  logType: "maintenance" | "restoration" | "observation" | "event" | "acquisition";
  title: string;
  description: string;
  shopName?: string | null;
  createdAt: string | number;
}

export interface ConditionLogWithAuthor extends ConditionLog {
  authorUsername?: string | null;
  authorDisplayName?: string | null;
}

export interface PhotoAlbum {
  id: string;
  carId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  photoCount?: number;
  createdAt: string | number;
}

export interface CarPhoto {
  id: string;
  carId: string;
  uploadedBy: string;
  albumId?: string | null;
  url: string;
  caption?: string | null;
  category: "exterior" | "interior" | "engine" | "undercarriage" | "detail" | "document" | "event";
  dateTaken?: string | null;
  createdAt: string | number;
}

export interface OwnershipRecord {
  id: string;
  carId: string;
  ownerId?: string | null;
  ownerName?: string | null;
  fromDate: string;
  toDate?: string | null;
  acquisitionType: string;
  acquisitionSource?: string | null;
  notes?: string | null;
  createdAt: string | number;
  username?: string | null;
  displayName?: string | null;
}

export interface WebmasterMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: "unread" | "read";
  createdAt: string | number;
}

export interface TransferCode {
  id: string;
  carId: string;
  initiatedBy: string;
  code: string;
  expiresAt: string | number;
  claimedBy?: string | null;
  claimedAt?: string | number | null;
  status: "pending" | "claimed" | "expired" | "cancelled";
  createdAt: string | number;
}
