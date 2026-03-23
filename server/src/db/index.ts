import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../../data");

// Ensure data directory exists
mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(join(dataDir, "registry.db"));

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Create tables directly on startup
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    bio TEXT,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT,
    phone TEXT,
    website TEXT,
    instagram TEXT,
    avatar_url TEXT,
    show_email INTEGER NOT NULL DEFAULT 0,
    show_phone INTEGER NOT NULL DEFAULT 0,
    show_city INTEGER NOT NULL DEFAULT 0,
    show_state INTEGER NOT NULL DEFAULT 0,
    show_country INTEGER NOT NULL DEFAULT 0,
    show_website INTEGER NOT NULL DEFAULT 1,
    show_instagram INTEGER NOT NULL DEFAULT 1,
    show_identity INTEGER NOT NULL DEFAULT 1,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cars (
    id TEXT PRIMARY KEY,
    chassis_number TEXT,
    year INTEGER NOT NULL,
    make TEXT NOT NULL DEFAULT 'Porsche',
    model TEXT NOT NULL,
    variant TEXT,
    engine_number TEXT,
    transmission_number TEXT,
    factory_color_code TEXT,
    factory_color_name TEXT,
    factory_interior TEXT,
    factory_options TEXT,
    current_status TEXT NOT NULL DEFAULT 'original',
    location_state TEXT,
    location_country TEXT DEFAULT 'US',
    is_public INTEGER NOT NULL DEFAULT 0,
    willing_to_sell INTEGER NOT NULL DEFAULT 0,
    current_owner_id TEXT NOT NULL REFERENCES users(id),
    notes TEXT,
    hero_photo_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ownership_records (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES cars(id),
    owner_id TEXT REFERENCES users(id),
    owner_name TEXT,
    from_date TEXT NOT NULL,
    to_date TEXT,
    acquisition_type TEXT NOT NULL DEFAULT 'unknown',
    acquisition_source TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS condition_logs (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES cars(id),
    author_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    mileage INTEGER,
    log_type TEXT NOT NULL DEFAULT 'observation',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    shop_name TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS photo_albums (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES cars(id),
    created_by TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS car_photos (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES cars(id),
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    album_id TEXT REFERENCES photo_albums(id),
    url TEXT NOT NULL,
    caption TEXT,
    category TEXT NOT NULL DEFAULT 'exterior',
    date_taken TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS car_documents (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES cars(id),
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    url TEXT NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'other',
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transfer_codes (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES cars(id),
    initiated_by TEXT NOT NULL REFERENCES users(id),
    code TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    claimed_by TEXT REFERENCES users(id),
    claimed_at INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES cars(id),
    owner_id TEXT NOT NULL REFERENCES users(id),
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    message TEXT NOT NULL,
    car_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    created_at INTEGER NOT NULL
  );
`);

console.log("Database tables initialized");

export const db = drizzle(sqlite, { schema });
export default db;
