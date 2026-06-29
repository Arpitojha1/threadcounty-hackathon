# ThreadCounty Database Schema

ThreadCounty uses Supabase (PostgreSQL) for all database, authentication, and storage needs.

## Tables

### 1. `profiles`
Stores extended user profile information, managed alongside Supabase Auth (`auth.users`).

- `id` (uuid, primary key, references auth.users)
- `deleted_at` (timestamp, nullable) - Used for soft deletion. If set, the account is considered pending manual deletion by admins.

### 2. `uploads`
Tracks raw images uploaded by users for analysis.

- `id` (uuid, primary key)
- `user_id` (uuid, references profiles.id)
- `image_url` (text) - Public URL of the image stored in the `fabric-images` bucket.
- `file_name` (text)
- `file_size` (integer) - Bytes
- `status` (text) - e.g., 'completed', 'failed', 'processing'
- `created_at` (timestamp)

### 3. `reports`
Stores the results of the computer vision analysis for a given upload.

- `id` (uuid, primary key)
- `upload_id` (uuid, references uploads.id, unique)
- `user_id` (uuid, references profiles.id)
- `thread_density` (numeric) - Measured in threads per cm²
- `warp_count` (integer)
- `weft_count` (integer)
- `fabric_type` (text) - e.g., 'Plain Weave Linen'
- `confidence_score` (numeric) - 0 to 100
- `ai_suggestions` (jsonb) - Array of strings containing structural analysis notes
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable) - Used for soft deletion. Does not affect quota usage since `uploads` tracking is immutable.

### 4. `subscriptions`
Tracks user billing tiers.
*Note: Due to a missing RLS insert policy during the hackathon phase, the `/pricing` page currently mocks the subscription flow.*

- `id` (uuid, primary key)
- `user_id` (uuid, references profiles.id)
- `tier` (text) - e.g., 'Free', 'Student', 'Professional', 'Enterprise'
- `status` (text) - e.g., 'active', 'canceled'
- `created_at` (timestamp)

### 5. `contact_messages`
Stores messages submitted via the `/contact` form.
*Note: Anonymous inserts require proper RLS configuration which is currently not deployed, so the contact form simulates success on the frontend.*

- `id` (uuid, primary key)
- `name` (text)
- `email` (text)
- `message` (text)
- `created_at` (timestamp)

## Storage Buckets
- `fabric-images`: Public bucket for storing all user-uploaded fabric macro photographs.
