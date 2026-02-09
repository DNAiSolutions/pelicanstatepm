# Login Troubleshooting Guide

## ✅ Server Status
- **Dev Server:** Running at http://localhost:5173/
- **Status:** ACTIVE and responding
- **Supabase:** Connected (credentials loaded)

## 🔧 Quick Fix Checklist

### 1. Hard Refresh Browser
- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`

This clears cache and reloads JavaScript.

### 2. Clear Browser Storage
1. Open DevTools: `F12` or `Cmd+Option+I`
2. Go to **Application** tab
3. Click **Storage** → **Clear Site Data**
4. Refresh page

### 3. Check Browser Console for Errors
1. Open DevTools: `F12`
2. Go to **Console** tab
3. Take screenshot of any red errors
4. Share the error message

### 4. Verify Supabase Credentials
The app needs your Supabase credentials to work. Check:

```
File: app/.env.local

Should contain:
VITE_SUPABASE_URL=https://tsiembsbxocszubdmrdi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uIAAvk1ceyqYqF76lzKaFA_QoArYZfT
```

If missing or incomplete, update `.env.local` and restart server.

## 🔍 Verify User Exists in Supabase

Your login won't work if the user doesn't exist in Supabase Authentication.

### Check if User Was Created
1. Go to: https://app.supabase.com
2. Select project: **tsiembsbxocszubdmrdi**
3. Click **Authentication** (left sidebar)
4. Click **Users**
5. Look for: `owner@pelicanstate.org`

**If you don't see it:**
1. Click **"Add user"** button
2. Email: `owner@pelicanstate.org`
3. Password: `TestPass123!`
4. Uncheck "Send invite email"
5. Click **"Create user"**

### Verify User Role Was Assigned
1. Go to **SQL Editor** in Supabase
2. Run this query:
```sql
SELECT id, email, role FROM users WHERE email = 'owner@pelicanstate.org';
```

**If it returns nothing or role is NULL:**
- Run this SQL:
```sql
INSERT INTO users (id, email, role, full_name, campus_assigned)
SELECT id, email, 'Owner', 'Owner User', ARRAY(SELECT id FROM campuses)
FROM auth.users
WHERE email = 'owner@pelicanstate.org'
ON CONFLICT (id) DO UPDATE SET role = 'Owner';
```

## 🌐 What Happens When You Login

1. You enter email/password
2. App sends to Supabase Auth API
3. Supabase verifies credentials
4. Returns JWT token
5. App queries `users` table for role
6. Redirects to dashboard

**If any step fails, you get stuck on login.**

## 🐛 Common Login Issues

### Issue: "Invalid login credentials"
**Cause:** Email doesn't exist in Supabase Auth  
**Fix:** 
1. Go to Supabase Authentication → Users
2. Click "Add user"
3. Create user with correct email/password

### Issue: Login spins forever / doesn't redirect
**Cause:** User doesn't have a role assigned  
**Fix:**
1. Run SQL query above to check role
2. If NULL, run INSERT statement to assign role

### Issue: "Network error" / "CORS error"
**Cause:** Supabase URL/key is wrong  
**Fix:**
1. Check .env.local file
2. Verify URL and key are correct
3. Restart dev server (Ctrl+C, then `npm run dev`)

### Issue: "User profile not found"
**Cause:** User exists in Auth but not in users table  
**Fix:** Run the INSERT SQL to create user profile

## 📋 Step-by-Step Login Test

### Step 1: Verify User Exists
```
In Supabase:
1. Authentication → Users
2. Look for: owner@pelicanstate.org
3. If missing, create it
```

### Step 2: Verify Role Assigned
```
In Supabase SQL Editor:
SELECT * FROM users WHERE email = 'owner@pelicanstate.org';

Should show:
- id: (UUID)
- email: owner@pelicanstate.org
- role: Owner
- campus_assigned: (array of UUIDs)
```

### Step 3: Hard Refresh Page
```
http://localhost:5173/
Press: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Step 4: Try Login
```
Email: owner@pelicanstate.org
Password: TestPass123!
Click: Sign In
```

### Step 5: Check Console
```
F12 → Console tab
Look for any error messages (red text)
Copy error and share it
```

## 🔗 Direct Supabase Project Link
https://app.supabase.com/project/tsiembsbxocszubdmrdi

## 📞 Get Help

If login still doesn't work:

1. **Open browser console:** `F12` → **Console** tab
2. **Screenshot any red errors**
3. **Tell me:**
   - What error message appears?
   - Does page show spinner/loading?
   - Does it redirect anywhere?
   - What's in the browser console?

## 🔄 Full Reset Instructions

If you want to start completely fresh:

1. **Stop dev server:** Press `Ctrl+C` in terminal
2. **Delete cache:**
   ```bash
   cd app
   rm -rf node_modules/.vite
   ```
3. **Restart server:**
   ```bash
   npm run dev
   ```
4. **Hard refresh browser:** `Cmd+Shift+R`
5. **Try login again**

## ✅ Expected Login Flow

**✅ Correct Flow:**
1. Enter email: owner@pelicanstate.org
2. Enter password: TestPass123!
3. Click "Sign In"
4. Page shows spinner for 1-2 seconds
5. Redirects to Dashboard
6. See "Welcome back" message

**❌ If anything else happens:**
- Check console for errors (F12)
- Verify user exists in Supabase Auth
- Verify user role in Supabase SQL
- Try hard refresh
- Restart dev server

---

**Let me know what error message you see and I can help fix it!**
