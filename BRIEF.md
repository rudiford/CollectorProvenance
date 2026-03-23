# Collector Provenance — MVP Build Brief

**Domain:** collectorprovenance.com
**Brand:** Collector Provenance

## Concept
CellarTracker meets CarFax for collector cars. A provenance and inventory database where collectors document their cars, track condition over time, and build a verifiable chain of title. Starting with Porsche.

## Tech Stack
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives)
- **Routing:** Wouter
- **Backend:** Express.js + TypeScript
- **Database:** Supabase (PostgreSQL) + Drizzle ORM
- **Auth:** Supabase Auth
- **Image storage:** Supabase Storage
- **Deployment:** Railway

## Data Model

### Cars
- `id` (uuid, PK)
- `chassis_number` (unique — supports pre-1981 Porsche format AND modern 17-digit VIN)
- `year` (integer)
- `make` (string — "Porsche" for now, future expansion)
- `model` (string — "911", "356", "914", etc.)
- `variant` (string — "Carrera RS", "S", "Turbo", etc.)
- `engine_number` (string, optional)
- `transmission_number` (string, optional)
- `factory_color_code` (string, optional)
- `factory_color_name` (string, optional)
- `factory_interior` (string, optional)
- `factory_options` (text/json, optional — option codes)
- `current_status` (enum: original, restored, modified, barn_find, project)
- `location_state` (string, optional)
- `location_country` (string, default "US")
- `is_public` (boolean, default false — the privacy toggle)
- `willing_to_sell` (boolean, default false)
- `current_owner_id` (uuid, FK → users)
- `created_at`, `updated_at` (timestamps)

### Ownership Records
- `id` (uuid, PK)
- `car_id` (uuid, FK → cars)
- `owner_id` (uuid, FK → users, nullable for historical/unknown owners)
- `owner_name` (string, nullable — for historical records where owner isn't a user)
- `from_date` (date)
- `to_date` (date, nullable — null means current owner)
- `acquisition_type` (enum: private_sale, auction, dealer, inherited, gift, unknown)
- `acquisition_source` (string, optional — "RM Sotheby's Monterey 2023", "Bring a Trailer", etc.)
- `notes` (text, optional)
- `created_at` (timestamp)

### Condition Logs ("Tasting Notes")
- `id` (uuid, PK)
- `car_id` (uuid, FK → cars)
- `author_id` (uuid, FK → users)
- `date` (date)
- `mileage` (integer, optional)
- `log_type` (enum: maintenance, restoration, observation, event, acquisition)
- `title` (string)
- `description` (text)
- `shop_name` (string, optional — mechanic/shop who did the work)
- `created_at` (timestamp)

### Car Photos
- `id` (uuid, PK)
- `car_id` (uuid, FK → cars)
- `uploaded_by` (uuid, FK → users)
- `url` (string — Supabase storage URL)
- `caption` (string, optional)
- `category` (enum: exterior, interior, engine, undercarriage, detail, document, event)
- `date_taken` (date, optional)
- `created_at` (timestamp)

### Car Documents
- `id` (uuid, PK)
- `car_id` (uuid, FK → cars)
- `uploaded_by` (uuid, FK → users)
- `url` (string)
- `doc_type` (enum: coa, title, receipt, magazine, appraisal, other)
- `title` (string)
- `description` (text, optional)
- `date` (date, optional)
- `created_at` (timestamp)

### Transfer Codes
- `id` (uuid, PK)
- `car_id` (uuid, FK → cars)
- `initiated_by` (uuid, FK → users)
- `code` (string, unique — short alphanumeric)
- `expires_at` (timestamp — 7 days from creation)
- `claimed_by` (uuid, FK → users, nullable)
- `claimed_at` (timestamp, nullable)
- `status` (enum: pending, claimed, expired, cancelled)
- `created_at` (timestamp)

### Users (extended from Supabase auth)
- `id` (uuid, PK — matches Supabase auth.users.id)
- `username` (string, unique)
- `display_name` (string, optional)
- `bio` (text, optional)
- `location_state` (string, optional)
- `location_country` (string, optional)
- `avatar_url` (string, optional)
- `created_at` (timestamp)

## MVP Pages (Phase 1)

1. **Landing page** — Hero, value prop, email waitlist signup
2. **Auth** — Sign up / Sign in (Supabase Auth)
3. **Dashboard** — "My Garage" — list of user's cars
4. **Add Car** — Form: year, model, variant, chassis #, engine #, photos, status, public/private toggle
5. **Car Profile** — Full detail view: specs, photos, ownership chain, condition log timeline
6. **Add Condition Log** — Form to add a dated entry with type, description, mileage, photos
7. **Browse/Search** — Search all public cars by year, model, variant, color, location
8. **User Profile** — Public page showing username, bio, and their public cars
9. **Transfer Ownership** — Generate code / Enter code flow

## Design Direction
- Clean, minimal, premium feel. Think Hodinkee (watches) not AutoTrader.
- Dark mode default — car photos look better on dark backgrounds.
- Typography-forward. Let the cars and data speak.
- Mobile-first responsive.

## What NOT to Build Yet
- Payment/subscriptions
- Dealer accounts
- Provenance report PDF generation
- Data import from auctions
- Multi-marque support (schema supports it, UI doesn't need to yet)
- Messaging between users
- Admin panel
