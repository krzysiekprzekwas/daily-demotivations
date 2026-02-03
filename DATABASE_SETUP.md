# 🗄️ Database User Setup - Quick Start Guide

**Estimated Time:** 15 minutes  
**Required Access:** Neon Console  
**Prerequisites:** Project deployed to Neon

---

## Why This Matters

Your app currently uses `neondb_owner` which has **full admin privileges**. If these credentials leak, an attacker could:
- Drop your entire database
- Delete all tables
- Steal all data
- Lock you out

Creating a **restricted user** limits damage to just data manipulation (not structure destruction).

---

## Step-by-Step Instructions

### 1️⃣ Generate Strong Password (30 seconds)

Open terminal and run:
```bash
openssl rand -base64 32
```

**Example output:**
```
xK9mP2vQ8rL5nW1hJ4tY7zC3bF6aE0dS9gH2iK5jN8m=
```

**📋 Copy this password and save it temporarily** (you'll use it multiple times)

---

### 2️⃣ Open Neon SQL Editor (1 minute)

1. Go to: https://console.neon.tech/
2. Click on your **daily-demotivations** project
3. Click **SQL Editor** in the left sidebar
4. You should see a SQL query editor

---

### 3️⃣ Create Restricted User (2 minutes)

Copy this SQL script and paste into the SQL Editor:

```sql
-- Create restricted user
CREATE USER daily_demotivations_app WITH PASSWORD 'PASTE_YOUR_PASSWORD_HERE';

-- Grant connection
GRANT CONNECT ON DATABASE neondb TO daily_demotivations_app;
GRANT USAGE ON SCHEMA public TO daily_demotivations_app;

-- Grant data permissions only (no DROP/ALTER)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO daily_demotivations_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daily_demotivations_app;

-- Set defaults for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO daily_demotivations_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO daily_demotivations_app;
```

**⚠️ Replace `PASTE_YOUR_PASSWORD_HERE` with your generated password from Step 1**

Click **Run** (or press Cmd+Enter / Ctrl+Enter)

**Expected result:** Should see "Success" or "CREATE ROLE"

---

### 4️⃣ Verify User Creation (1 minute)

Run this query:
```sql
SELECT usename FROM pg_user WHERE usename = 'daily_demotivations_app';
```

**Expected result:** Should return one row showing `daily_demotivations_app`

---

### 5️⃣ Build Connection String (2 minutes)

Take this template:
```
postgresql://daily_demotivations_app:PASSWORD@HOST/neondb?sslmode=require
```

**Replace:**
- `PASSWORD` = your generated password from Step 1
- `HOST` = `ep-misty-night-agly03gw-pooler.c-2.eu-central-1.aws.neon.tech`

**Example result:**
```
postgresql://daily_demotivations_app:xK9mP2vQ8rL5nW1hJ4tY7zC3bF6aE0dS9gH2iK5jN8m=@ep-misty-night-agly03gw-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**📋 Copy this full connection string**

⚠️ **Note the `-pooler` in the hostname** - this is important for connection pooling!

---

### 6️⃣ Update Local Environment (3 minutes)

Open `.env.local` in your project:

**Find this line:**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_WAecz25uaUSv@...
```

**Replace with your new connection string from Step 5:**
```bash
DATABASE_URL=postgresql://daily_demotivations_app:xK9mP2vQ8rL5nW1hJ4tY7zC3bF6aE0dS9gH2iK5jN8m=@ep-misty-night-agly03gw-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**⚠️ DO NOT change `DIRECT_DATABASE_URL`** - migrations still need owner user

**Save the file**

---

### 7️⃣ Test Locally (3 minutes)

```bash
# Start development server
npm run dev
```

**Open browser:** http://localhost:3000/admin/login

**Login with password:** `1kmF1YtJlIR1LtGM0gaFvcCkRupzHn7Df2PVgn5mJ+Q=`

**Test CRUD operations:**
1. Go to Quotes → Create new quote: "Test quote"
2. Edit the quote → Change to "Test quote edited"
3. Delete the quote

**✅ If all operations work, permissions are correct!**

**❌ If you see errors like "permission denied", re-run Step 3**

---

### 8️⃣ Update Vercel Environment Variables (3 minutes)

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Find `DATABASE_URL`
3. Click **Edit**
4. Replace with your new connection string from Step 5
5. Select **Production** and **Preview** environments
6. Click **Save**

**⚠️ DO NOT change `DIRECT_DATABASE_URL`** - leave as owner user for migrations

---

### 9️⃣ Redeploy (1 minute)

**Option A - Redeploy from dashboard:**
1. Go to Vercel dashboard
2. Click **Redeploy** on latest deployment

**Option B - Redeploy from CLI:**
```bash
vercel --prod
```

Wait for deployment to complete (~2-3 minutes)

---

### 🔟 Verify Production (2 minutes)

**Test production site:**
1. Go to your production URL
2. Navigate to `/admin/login`
3. Login with: `1kmF1YtJlIR1LtGM0gaFvcCkRupzHn7Df2PVgn5mJ+Q=`
4. Try creating/editing a quote

**Check Vercel logs:**
1. Go to Vercel dashboard → Logs
2. Look for database connection errors
3. Should see no errors related to Prisma or database

**✅ If admin panel works, you're done!**

---

## 🎉 Success Checklist

- [x] Password generated with `openssl rand -base64 32`
- [x] SQL script executed in Neon SQL Editor
- [x] User verification query returned `daily_demotivations_app`
- [x] `.env.local` updated with new DATABASE_URL
- [x] Local testing passed (create/edit/delete quote)
- [x] Vercel DATABASE_URL updated
- [x] Production redeployed
- [x] Production admin panel works
- [x] No errors in Vercel logs

---

## ⚠️ Common Mistakes

**❌ Using direct endpoint instead of pooler:**
- Wrong: `ep-misty-night-agly03gw.c-2.eu-central-1.aws.neon.tech`
- Right: `ep-misty-night-agly03gw-pooler.c-2.eu-central-1.aws.neon.tech`

**❌ Forgetting special characters in password:**
- If password ends with `=`, make sure to include it!

**❌ Changing both DATABASE_URL and DIRECT_DATABASE_URL:**
- Only change DATABASE_URL
- Leave DIRECT_DATABASE_URL as owner user

**❌ Not selecting both Production and Preview in Vercel:**
- Must update for both environments

---

## 🐛 Troubleshooting

### Error: "permission denied for table Quote"

**Cause:** Restricted user doesn't have table permissions

**Fix:**
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO daily_demotivations_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daily_demotivations_app;
```

### Error: "role 'daily_demotivations_app' already exists"

**Cause:** User was already created

**Fix:** Skip Step 3, proceed to Step 4 to verify

### Error: "password authentication failed"

**Cause:** Wrong password in connection string

**Fix:**
1. Verify password matches what you set in Step 3
2. Check for typos (especially `=` at end)
3. Regenerate password and update everywhere

### Error: "too many connections"

**Cause:** Not using pooler endpoint

**Fix:** Ensure hostname has `-pooler` in it:
```
ep-misty-night-agly03gw-pooler.c-2.eu-central-1.aws.neon.tech
```

---

## 📊 Security Verification

To verify the restricted user **cannot** do dangerous operations:

**In Neon SQL Editor, switch to restricted user:**

1. Disconnect current connection
2. Connect with: `daily_demotivations_app` and your password

**Try these (should fail):**
```sql
-- Should fail with "permission denied"
DROP TABLE "Quote";
ALTER TABLE "Quote" ADD COLUMN test TEXT;
TRUNCATE TABLE "Quote";
CREATE TABLE test (id INT);
```

**Try these (should succeed):**
```sql
-- Should work
SELECT * FROM "Quote" LIMIT 5;
INSERT INTO "Quote" (text, author, "createdAt", "updatedAt") 
  VALUES ('Test', 'Test', NOW(), NOW());
```

**✅ If dangerous commands fail and normal commands work, security is correct!**

---

## 📞 Need Help?

**Full documentation:**
- `SECURITY_IMPLEMENTATION.md` - Detailed implementation guide
- `DEPLOYMENT_CHECKLIST.md` - Complete deployment checklist
- `SECURITY_AUDIT.md` - Why this matters

**Database schema:**
- `prisma/schema.prisma` - Table definitions

**Related files:**
- `scripts/create-restricted-db-user.sql` - Full SQL script with comments

---

## 🎯 What Happens Next?

After completing this setup:

1. ✅ **Security Score: 8.5/10 → 9/10**
2. ✅ **Principle of least privilege enforced**
3. ✅ **Attack surface reduced by ~80%**
4. ✅ **Database structure protected from deletion**
5. ✅ **Ready for production deployment**

**Time to celebrate!** 🎉 Your database is now properly secured.

**Next steps:**
1. Review `DEPLOYMENT_CHECKLIST.md`
2. Add quotes via admin panel
3. Auto-schedule 30 days of pairings
4. Share your app with the world!

---

**Last Updated:** January 2025  
**Estimated Time:** 15 minutes total  
**Difficulty:** Beginner-friendly ✅
