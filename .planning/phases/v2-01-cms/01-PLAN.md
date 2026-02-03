# Execution Plan 01: Database Setup & Schema

**Phase:** V2 Phase 1 - Content Management System  
**Plan:** 01 of 05  
**Status:** Ready for Execution  
**Date:** 2025-02-03

---

## 1. Goal

Set up PostgreSQL database infrastructure with Prisma ORM, define schema for quotes/images/pairings, run migrations, and seed initial data from existing hardcoded quotes. This establishes the foundation for the CMS without affecting the live site.

---

## 2. Requirements Covered

- **DB-01:** PostgreSQL database (Vercel Postgres)
- **DB-02:** Schema for quotes table
- **DB-03:** Schema for images table
- **DB-04:** Schema for pairings table
- **CMS-04:** Database migration from hardcoded to persistent storage

---

## 3. Dependencies

**Prerequisites:**
- Vercel account with project deployed
- Access to Vercel Dashboard or CLI
- Node.js 18+ installed locally

**No code dependencies:** This plan creates new infrastructure without modifying existing code.

---

## 4. Estimated Time

- **Setup:** 30 minutes (provision database, configure environment)
- **Schema Design:** 45 minutes (write Prisma schema, validate)
- **Migration:** 15 minutes (run migrations, verify)
- **Seeding:** 30 minutes (create seed script, import 30 quotes)
- **Testing:** 30 minutes (verify connections, query data)
- **Total:** 2.5 hours

---

## 5. Deliverables

### 5.1 Infrastructure
- [ ] Vercel Postgres database provisioned
- [ ] Environment variables configured (local + production)

### 5.2 Prisma Configuration
- [ ] `prisma/schema.prisma` - Database schema with 3 models
- [ ] `src/lib/prisma.ts` - Singleton Prisma client
- [ ] Migration files in `prisma/migrations/`

### 5.3 Data Seeding
- [ ] `prisma/seed.ts` - Seed script for initial quotes
- [ ] 30 quotes migrated from `QUOTES` array
- [ ] `package.json` updated with seed script

### 5.4 Documentation
- [ ] `.env.example` - Template for environment variables
- [ ] Database connection verification script

---

## 6. Technical Approach

### 6.1 Database Provisioning

**Option A: Vercel Dashboard (Recommended)**
```bash
1. Go to Vercel Dashboard → Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Name: daily-demotivations-db
4. Region: Auto (nearest to deployment)
5. Click "Create"
6. Copy DATABASE_URL and DIRECT_DATABASE_URL
```

**Option B: Vercel CLI**
```bash
vercel storage create postgres daily-demotivations-db
vercel env pull .env.local
```

### 6.2 Environment Variables

**Production (Vercel Dashboard):**
- `DATABASE_URL` - Automatically added by Vercel Postgres
- `DIRECT_DATABASE_URL` - Automatically added by Vercel Postgres
- `SESSION_SECRET` - Generate 32+ char string: `openssl rand -base64 32`
- `ADMIN_PASSWORD` - Strong password (12+ chars)

**Local (.env.local):**
```bash
# Postgres connection (from Vercel)
DATABASE_URL="postgres://default:***@***-pooler.aws-us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"
DIRECT_DATABASE_URL="postgres://default:***@***-direct.aws-us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"

# Session encryption (generate: openssl rand -base64 32)
SESSION_SECRET="your-32-character-secret-key-here-minimum"

# Admin authentication
ADMIN_PASSWORD="your-strong-password-here"

# Unsplash (existing)
UNSPLASH_ACCESS_KEY="your-existing-key"
```

### 6.3 Install Dependencies

```bash
npm install @vercel/postgres @prisma/client
npm install -D prisma tsx
```

### 6.4 Prisma Schema

**File: `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// Quotes table - stores all demotivational quotes
model Quote {
  id        String   @id @default(cuid())
  text      String   @db.Text
  author    String?  @db.VarChar(255)
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  pairings  Pairing[]
  
  // Indexes for performance
  @@index([active])
  @@index([createdAt(sort: Desc)])
  @@map("quotes")
}

// Images table - stores landscape image URLs with attribution
model Image {
  id               String   @id @default(cuid())
  url              String   @db.Text
  photographerName String   @map("photographer_name") @db.VarChar(255)
  photographerUrl  String?  @map("photographer_url") @db.Text
  source           String   @default("unsplash") @db.VarChar(50)
  active           Boolean  @default(true)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  // Relations
  pairings         Pairing[]
  
  // Indexes
  @@index([active])
  @@index([source])
  @@map("images")
}

// Pairings table - assigns quote + image to specific date
model Pairing {
  id        String   @id @default(cuid())
  quoteId   String   @map("quote_id")
  imageId   String   @map("image_id")
  date      DateTime @db.Date
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relations
  quote     Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  image     Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  
  // Constraints
  @@unique([date])
  @@index([quoteId])
  @@index([imageId])
  @@index([date(sort: Desc)])
  @@map("pairings")
}
```

**Key Design Decisions:**
- **Primary Keys:** `cuid()` for sortable, URL-friendly IDs
- **Active Flag:** Soft delete via `active` boolean
- **Cascade Deletes:** Orphaned pairings auto-deleted
- **Date Type:** `@db.Date` stores date only (no time) to avoid timezone issues
- **Indexes:** Optimized for common queries (active filter, recent items, date lookups)

### 6.5 Prisma Client Singleton

**File: `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Test database connection
 * @returns true if connected, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
```

**Why Singleton?**
- Prevents "too many connections" error in development (hot reloads)
- Single client instance reused across requests
- Development logging for debugging

### 6.6 Seed Script

**File: `prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import { QUOTES } from '../src/lib/quotes';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with 30 hardcoded quotes...');
  
  // Check if quotes already exist
  const existingCount = await prisma.quote.count();
  
  if (existingCount > 0) {
    console.log(`⚠️  Database already has ${existingCount} quotes.`);
    console.log('   Delete existing quotes? (y/n)');
    
    // For automation, skip if quotes exist
    // Manual run can use: npx prisma db seed --force
    return;
  }
  
  // Seed all 30 quotes from QUOTES array
  let created = 0;
  for (const text of QUOTES) {
    await prisma.quote.create({
      data: {
        text,
        author: null, // Original quotes have no author
        active: true,
      },
    });
    created++;
    
    // Progress indicator
    if (created % 10 === 0) {
      console.log(`   Created ${created} quotes...`);
    }
  }
  
  console.log(`✅ Successfully seeded ${created} quotes`);
  
  // Display sample
  const samples = await prisma.quote.findMany({
    take: 3,
    select: { id: true, text: true },
  });
  
  console.log('\n📝 Sample quotes:');
  samples.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q.text.substring(0, 60)}...`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Update `package.json`:**
```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:reset": "prisma migrate reset"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 6.7 Migration Commands

```bash
# Initialize Prisma (creates schema file)
npx prisma init

# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client types
npx prisma generate

# Run seed script
npm run db:seed

# Open Prisma Studio to view data
npm run db:studio
```

---

## 7. Testing Checklist

### 7.1 Database Connection
- [ ] Verify `DATABASE_URL` connects (pooled connection)
- [ ] Verify `DIRECT_DATABASE_URL` connects (direct connection for migrations)
- [ ] Test connection from local machine: `npx prisma db execute --stdin`
- [ ] Test connection from Vercel deployment

### 7.2 Schema Validation
- [ ] Run `npx prisma validate` - no errors
- [ ] Check generated migration SQL: `prisma/migrations/*/migration.sql`
- [ ] Verify all indexes created: `\d quotes` in psql
- [ ] Verify foreign keys: `\d pairings` shows quote_id and image_id constraints

### 7.3 Seeding
- [ ] Run seed script: `npm run db:seed`
- [ ] Verify 30 quotes in database: `npx prisma studio`
- [ ] Query quotes: `await prisma.quote.count()` returns 30
- [ ] Check all quotes have `active: true`
- [ ] Verify timestamps populated (`createdAt`, `updatedAt`)

### 7.4 Prisma Client
- [ ] Import `prisma` from `@/lib/prisma` works
- [ ] TypeScript autocomplete works for models
- [ ] Simple query works:
  ```typescript
  const quotes = await prisma.quote.findMany({ take: 5 });
  console.log(quotes);
  ```
- [ ] Connection singleton prevents multiple clients

### 7.5 Performance
- [ ] Query 30 quotes: < 50ms
- [ ] Index scan used for `WHERE active = true`: Run `EXPLAIN ANALYZE`
- [ ] Date index on pairings: Run `EXPLAIN SELECT * FROM pairings WHERE date = '2025-02-03'`

### 7.6 Error Handling
- [ ] Invalid `DATABASE_URL` → connection error caught
- [ ] Database timeout (5s) → graceful error
- [ ] Duplicate constraint violation → `PrismaClientKnownRequestError` P2002

---

## 8. Risks

### 8.1 Database Provisioning Failures

**Risk:** Vercel Postgres provisioning fails or free tier unavailable  
**Likelihood:** Low  
**Impact:** High (blocks all CMS work)  

**Mitigation:**
- Use Vercel Dashboard (more reliable than CLI)
- Have local Postgres as backup: `docker run -d -p 5432:5432 postgres:15`
- Document manual database setup for non-Vercel hosts

### 8.2 Migration Failures

**Risk:** Prisma migration fails due to invalid schema  
**Likelihood:** Low  
**Impact:** Medium (need to fix and retry)  

**Mitigation:**
- Run `npx prisma validate` before migrating
- Test locally first, then production
- Use `prisma migrate dev` (creates migration + applies)
- Keep migration files in git for rollback

### 8.3 Connection Issues

**Risk:** Database unreachable from Vercel deployment  
**Likelihood:** Low  
**Impact:** High (site breaks if no fallback)  

**Mitigation:**
- Test connection from both local and Vercel
- Implement graceful fallback (Plan 05)
- Set connection timeout (5s max)
- Use pooled connection (`DATABASE_URL`)

### 8.4 Seed Script Errors

**Risk:** Seed script fails halfway through  
**Likelihood:** Low  
**Impact:** Low (can reset and retry)  

**Mitigation:**
- Check existing quotes before seeding
- Use transaction for atomic seeding (all or nothing)
- Provide `db:reset` command to start fresh
- Log progress for debugging

### 8.5 Free Tier Limits

**Risk:** Exceed Vercel Postgres free tier (60 hours compute/month)  
**Likelihood:** Low (for personal project)  
**Impact:** Low (can upgrade or throttle)  

**Mitigation:**
- Monitor usage in Vercel Dashboard
- Optimize queries with indexes
- Cache results via Next.js ISR (reduces DB queries)
- Document upgrade path if needed

---

## 9. Rollback

### 9.1 Database Rollback

**If migration fails:**
```bash
# Option 1: Reset to clean state
npx prisma migrate reset

# Option 2: Rollback to specific migration
# (Manually drop tables, then reapply previous migration)
psql $DATABASE_URL -c "DROP TABLE pairings, images, quotes, _prisma_migrations;"
npx prisma migrate deploy
```

### 9.2 Code Rollback

**If Prisma client causes issues:**
```bash
# Remove Prisma
npm uninstall prisma @prisma/client
rm -rf prisma node_modules/.prisma

# Restore package.json
git checkout package.json package-lock.json
npm install
```

### 9.3 Database Deletion

**If need to start over:**
```bash
# Via Vercel Dashboard
1. Go to Storage → Postgres
2. Select database
3. Settings → Delete Database

# Via CLI
vercel storage rm daily-demotivations-db
```

**Note:** Deleting database is safe - no code depends on it yet (this plan only sets up infrastructure).

---

## 10. Success Criteria

✅ Plan is complete when:

1. **Infrastructure Ready**
   - Vercel Postgres database provisioned
   - Environment variables configured (local + production)
   - Connection verified from both environments

2. **Schema Deployed**
   - 3 tables created: `quotes`, `images`, `pairings`
   - All indexes created
   - Foreign key constraints active
   - Migration files committed to git

3. **Data Seeded**
   - 30 quotes imported from `QUOTES` array
   - All quotes have `active: true`
   - Sample queries return data

4. **Developer Experience**
   - Prisma Studio works (`npm run db:studio`)
   - TypeScript autocomplete works for models
   - `prisma` client importable from any file
   - Documentation complete (`.env.example`)

5. **No Breaking Changes**
   - Existing site continues to work (no code modified)
   - `src/lib/quotes.ts` unchanged
   - Public routes unaffected

---

## 11. Next Steps

After completing this plan:

→ **Plan 02: Authentication & Session Management**
- Implement iron-session for admin auth
- Create login page
- Protect `/admin/*` routes with middleware

This plan creates the database foundation but doesn't modify any public-facing code. The site continues to use hardcoded quotes until Plan 05 integrates the database.

---

## 12. Validation Commands

Run these commands to verify completion:

```bash
# Check Prisma schema is valid
npx prisma validate

# View database structure
npx prisma studio

# Count seeded quotes
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM quotes;"

# Test connection
node -e "const { testConnection } = require('./src/lib/prisma'); testConnection().then(console.log);"

# Check indexes
npx prisma db execute --stdin <<< "SELECT indexname FROM pg_indexes WHERE tablename = 'quotes';"
```

---

**Estimated Completion:** 2.5 hours  
**Blockers:** None (standalone infrastructure setup)  
**Dependencies for Next Plan:** Database must be provisioned and seeded before building auth layer
