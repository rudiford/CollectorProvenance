import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Users
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  locationCity: text("location_city"),
  locationState: text("location_state"),
  locationCountry: text("location_country"),
  phone: text("phone"),
  website: text("website"),
  instagram: text("instagram"),
  avatarUrl: text("avatar_url"),
  showEmail: integer("show_email", { mode: "boolean" }).notNull().default(false),
  showPhone: integer("show_phone", { mode: "boolean" }).notNull().default(false),
  showCity: integer("show_city", { mode: "boolean" }).notNull().default(false),
  showState: integer("show_state", { mode: "boolean" }).notNull().default(false),
  showCountry: integer("show_country", { mode: "boolean" }).notNull().default(false),
  showWebsite: integer("show_website", { mode: "boolean" }).notNull().default(true),
  showInstagram: integer("show_instagram", { mode: "boolean" }).notNull().default(true),
  showIdentity: integer("show_identity", { mode: "boolean" }).notNull().default(true),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Cars
export const cars = sqliteTable("cars", {
  id: text("id").primaryKey(),
  chassisNumber: text("chassis_number"),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  variant: text("variant"),
  engineNumber: text("engine_number"),
  transmissionNumber: text("transmission_number"),
  factoryColorCode: text("factory_color_code"),
  factoryColorName: text("factory_color_name"),
  factoryInterior: text("factory_interior"),
  factoryOptions: text("factory_options"), // JSON string
  currentStatus: text("current_status", {
    enum: ["original", "restored", "modified", "barn_find", "project"],
  })
    .notNull()
    .default("original"),
  locationState: text("location_state"),
  locationCountry: text("location_country").default("US"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  willingToSell: integer("willing_to_sell", { mode: "boolean" })
    .notNull()
    .default(false),
  currentOwnerId: text("current_owner_id")
    .notNull()
    .references(() => users.id),
  notes: text("notes"),
  heroPhotoUrl: text("hero_photo_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Ownership Records
export const ownershipRecords = sqliteTable("ownership_records", {
  id: text("id").primaryKey(),
  carId: text("car_id")
    .notNull()
    .references(() => cars.id),
  ownerId: text("owner_id").references(() => users.id),
  ownerName: text("owner_name"),
  fromDate: text("from_date").notNull(), // stored as YYYY-MM-DD
  toDate: text("to_date"), // null = current owner
  acquisitionType: text("acquisition_type", {
    enum: [
      "private_sale",
      "auction",
      "dealer",
      "inherited",
      "gift",
      "unknown",
    ],
  })
    .notNull()
    .default("unknown"),
  acquisitionSource: text("acquisition_source"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Condition Logs
export const conditionLogs = sqliteTable("condition_logs", {
  id: text("id").primaryKey(),
  carId: text("car_id")
    .notNull()
    .references(() => cars.id),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD
  mileage: integer("mileage"),
  logType: text("log_type", {
    enum: ["maintenance", "restoration", "observation", "event", "acquisition"],
  })
    .notNull()
    .default("observation"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  shopName: text("shop_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Photo Albums
export const photoAlbums = sqliteTable("photo_albums", {
  id: text("id").primaryKey(),
  carId: text("car_id").notNull().references(() => cars.id),
  createdBy: text("created_by").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Car Photos
export const carPhotos = sqliteTable("car_photos", {
  id: text("id").primaryKey(),
  carId: text("car_id")
    .notNull()
    .references(() => cars.id),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  albumId: text("album_id").references(() => photoAlbums.id),
  url: text("url").notNull(),
  caption: text("caption"),
  category: text("category", {
    enum: [
      "exterior",
      "interior",
      "engine",
      "undercarriage",
      "detail",
      "document",
      "event",
    ],
  })
    .notNull()
    .default("exterior"),
  dateTaken: text("date_taken"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Car Documents
export const carDocuments = sqliteTable("car_documents", {
  id: text("id").primaryKey(),
  carId: text("car_id")
    .notNull()
    .references(() => cars.id),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  url: text("url").notNull(),
  docType: text("doc_type", {
    enum: ["coa", "title", "receipt", "magazine", "appraisal", "other"],
  })
    .notNull()
    .default("other"),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Transfer Codes
export const transferCodes = sqliteTable("transfer_codes", {
  id: text("id").primaryKey(),
  carId: text("car_id")
    .notNull()
    .references(() => cars.id),
  initiatedBy: text("initiated_by")
    .notNull()
    .references(() => users.id),
  code: text("code").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  claimedBy: text("claimed_by").references(() => users.id),
  claimedAt: integer("claimed_at", { mode: "timestamp" }),
  status: text("status", {
    enum: ["pending", "claimed", "expired", "cancelled"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Contact Messages
export const contactMessages = sqliteTable("contact_messages", {
  id: text("id").primaryKey(),
  carId: text("car_id").notNull().references(() => cars.id),
  ownerId: text("owner_id").notNull().references(() => users.id),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  message: text("message").notNull(),
  carDescription: text("car_description").notNull(),
  status: text("status", { enum: ["unread", "read"] }).notNull().default("unread"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cars: many(cars),
  conditionLogs: many(conditionLogs),
  carPhotos: many(carPhotos),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  currentOwner: one(users, {
    fields: [cars.currentOwnerId],
    references: [users.id],
  }),
  ownershipRecords: many(ownershipRecords),
  conditionLogs: many(conditionLogs),
  photos: many(carPhotos),
  documents: many(carDocuments),
  transferCodes: many(transferCodes),
}));

export const ownershipRecordsRelations = relations(
  ownershipRecords,
  ({ one }) => ({
    car: one(cars, {
      fields: [ownershipRecords.carId],
      references: [cars.id],
    }),
    owner: one(users, {
      fields: [ownershipRecords.ownerId],
      references: [users.id],
    }),
  })
);

export const conditionLogsRelations = relations(conditionLogs, ({ one }) => ({
  car: one(cars, {
    fields: [conditionLogs.carId],
    references: [cars.id],
  }),
  author: one(users, {
    fields: [conditionLogs.authorId],
    references: [users.id],
  }),
}));

export const carPhotosRelations = relations(carPhotos, ({ one }) => ({
  car: one(cars, {
    fields: [carPhotos.carId],
    references: [cars.id],
  }),
  uploadedBy: one(users, {
    fields: [carPhotos.uploadedBy],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;
export type OwnershipRecord = typeof ownershipRecords.$inferSelect;
export type NewOwnershipRecord = typeof ownershipRecords.$inferInsert;
export type ConditionLog = typeof conditionLogs.$inferSelect;
export type NewConditionLog = typeof conditionLogs.$inferInsert;
export type CarPhoto = typeof carPhotos.$inferSelect;
export type NewCarPhoto = typeof carPhotos.$inferInsert;
export type TransferCode = typeof transferCodes.$inferSelect;
