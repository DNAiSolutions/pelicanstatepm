# Pelican State PM Dashboard - Supabase Setup Guide

## Quick Start

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Choose your region (US recommended)
5. Set a strong database password
6. Wait for project to initialize (~2 minutes)

### Step 2: Get Your Credentials
1. Go to **Project Settings** → **API**
2. Copy these values:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon (public) key` → `VITE_SUPABASE_ANON_KEY`
3. Add to `/app/.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 3: Run Database Schema
1. In Supabase, go to **SQL Editor** on the left sidebar
2. Click **New Query**
3. Copy the entire contents of `/supabase/schema.sql`
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. Wait for all queries to complete ✅

### Step 4: Set Up Storage (for Historic Doc Photos)
1. In Supabase, go to **Storage** on the left sidebar
2. Click **Create a new bucket**
3. Name: `historic-docs`
4. Make it **Public** (check "public")
5. Click **Create bucket**

### Step 5: Enable Email Authentication
1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it usually is by default)
3. Go to **Settings** → **Email Templates**
4. (Optional) Customize the confirmation email

### Step 6: Create Test Users
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Create these test accounts:

   **Owner (Full Access)**
   - Email: `owner@pelicanstate.org`
   - Password: `TestPass123!`

   **Developer (Full Access)**
   - Email: `developer@pelicanstate.org`
   - Password: `TestPass123!`

   **User (Campus-Limited)**
   - Email: `user@pelicanstate.org`
   - Password: `TestPass123!`

### Step 7: Assign User Roles & Campus
1. Go to **SQL Editor**
2. Run this query to set up the users:

```sql
-- Insert Owner
INSERT INTO users (id, email, role, full_name, campus_assigned)
SELECT id, email, 'Owner', 'Owner User', ARRAY(SELECT id FROM campuses)
FROM auth.users
WHERE email = 'owner@pelicanstate.org';

-- Insert Developer
INSERT INTO users (id, email, role, full_name, campus_assigned)
SELECT id, email, 'Developer', 'Developer User', ARRAY(SELECT id FROM campuses)
FROM auth.users
WHERE email = 'developer@pelicanstate.org';

-- Insert Regular User (Wallace campus only)
INSERT INTO users (id, email, role, full_name, campus_assigned)
SELECT id, email, 'User', 'Regular User', ARRAY(SELECT id FROM campuses WHERE name = 'Wallace')
FROM auth.users
WHERE email = 'user@pelicanstate.org';
```

## Database Schema Overview

### Tables Created

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `campuses` | Three management campuses | name, funding_source, address |
| `users` | Extends Supabase auth with roles | id, email, role, campus_assigned |
| `work_requests` | Facilities work requests | request_number, status, category, is_historic |
| `estimates` | Cost estimates | line_items, total_amount, status |
| `invoices` | Billing records | invoice_number, funding_source, campus_id |
| `historic_docs` | Heritage site documentation | photos, materials_log, method_notes |
| `schedules` | Project timelines | start_date, end_date, milestones |
| `weekly_updates` | Progress tracking | progress, blockers, next_steps |

### Key Features

✅ **Row-Level Security (RLS)** enabled on all tables
- Owner/Developer: See all data across all campuses
- Users: See only data for their assigned campuses

✅ **Auto-Incrementing Numbers**
- Work requests: `WR-2024-001`, `WR-2024-002`, etc.
- Invoices: `INV-2024-001`, `INV-2024-002`, etc.

✅ **Cascading Deletes** - Removing a work request deletes related estimates, docs, etc.

✅ **Updated Timestamps** - All tables auto-update `updated_at` field

## Testing the Connection

After setup, test your Supabase connection:

```bash
cd /Users/dayshablount/.gemini/antigravity/brain/BLAST/PelicanState/PM\ Dashboard/app

# Start development server
npm run dev

# Try logging in with test credentials
# Email: owner@pelicanstate.org
# Password: TestPass123!
```

If successful, you should see:
1. ✅ Login page loads
2. ✅ Can sign in
3. ✅ Dashboard displays
4. ✅ Can see status cards

## Troubleshooting

### "Can't connect to Supabase"
- Check `.env.local` has correct URL and Anon Key
- Make sure Supabase project is running (check dashboard)
- Clear browser cache and try again

### "RLS Policy Error"
- Make sure schema.sql ran completely
- Check Supabase SQL Editor for error messages
- Try running schema.sql again

### "Users table doesn't have my test users"
- Run the user setup SQL query from Step 7
- Make sure emails match exactly

### "Photos won't upload"
- Check if `historic-docs` storage bucket exists
- Make sure it's set to **Public**
- Check if row-level security allows the user to upload

## Next Steps

Once Supabase is set up and you can log in:

1. I'll build the Work Request Intake form with auto-draft saving
2. Implement status transitions with validation
3. Build the Estimate and Invoice builders
4. Add historic documentation upload
5. Set up PDF generation Edge Functions

## Need Help?

If you run into issues:
1. Check the Supabase error logs in the dashboard
2. Run schema.sql again if needed
3. Verify all test users were created
4. Test the RLS policies by logging in as different users

Good luck! 🚀
