# Phase 1 CMS - Implementation Decisions

**Date:** 2026-02-03  
**Status:** Decisions Finalized

## Open Questions - Resolved

### 1. Admin Password Strength
**Decision:** Strong password (12+ characters with special characters)  
**Rationale:** User will use password manager, so complexity is not a UX issue. Better security.  
**Implementation:**
- Environment variable: `ADMIN_PASSWORD` (min 12 chars, complexity enforced)
- Validation on first deployment
- Documentation recommends password manager

---

### 2. Session Duration
**Decision:** 24 hours  
**Rationale:** Balance between security and convenience. Admin can work all day without re-login.  
**Implementation:**
- iron-session TTL: 86400 seconds (24 hours)
- Cookie expires after 24h of inactivity
- "Remember me" checkbox NOT needed (always 24h)

---

### 3. Duplicate Quote Detection
**Decision:** Exact text match only  
**Rationale:** Simple, fast, no false positives. Admin can manually check for similar quotes.  
**Implementation:**
```typescript
// Check for exact duplicate
const existing = await prisma.quote.findFirst({
  where: { text: formData.get('text') }
});

if (existing) {
  return { error: 'Quote already exists' };
}
```
- No fuzzy matching (Levenshtein distance)
- No similarity threshold
- Case-sensitive exact match

---

### 4. Image URL Validation
**Decision:** Skip validation (trust admin input)  
**Rationale:** Admin is trusted user, validation adds latency. Broken URLs handled gracefully by frontend fallback.  
**Implementation:**
- No HTTP HEAD request on save
- No background validation job
- Admin responsible for testing URLs
- Frontend already has fallback to Unsplash random if image fails to load

---

### 5. Pairing Bulk Operations
**Decision:** One date at a time (no bulk operations)  
**Rationale:** Simpler implementation, admin workflow is manageable with single-date assignment.  
**Implementation:**
- Form: Select quote dropdown + Select image dropdown + Date input
- Submit creates one pairing
- No "assign next 10 days" feature
- **Future:** Can add bulk operations in v3 if admin requests it

---

### 6. Delete vs Deactivate
**Decision:** Hard delete only (no soft delete/active flag)  
**Rationale:** Simpler UX, less clutter. Active flag still exists but only used for future "draft" feature.  
**Implementation:**
- Delete button permanently removes record
- Cascading deletes handled by database (`onDelete: Cascade`)
- Warning modal: "Delete quote? This will unpair it from X dates."
- No "deactivate" toggle in admin UI
- **Note:** Active flag remains in schema for future use (drafts, scheduled publishing)

---

## Updated Database Schema

Based on decisions, the `active` field remains in schema but is NOT used in Phase 1:

```prisma
model Quote {
  id        String   @id @default(cuid())
  text      String   @db.Text
  author    String?  @db.VarChar(255)
  active    Boolean  @default(true) // Reserved for future use (drafts)
  // ... rest of schema
}
```

**Phase 1 Behavior:**
- All quotes default to `active: true`
- Admin UI shows all quotes regardless of active status
- Delete removes record (no toggle)

**Future (v3+):**
- Could add "Draft" feature using active flag
- Could add "Archive" feature (soft delete)
- Schema already supports it

---

## Implementation Priorities

Based on decisions, the implementation order is:

1. **Database Setup** (Week 1)
   - Provision Vercel Postgres
   - Prisma schema with all three tables
   - Seed 30 existing quotes
   - Migration scripts

2. **Authentication** (Week 1)
   - iron-session setup (24h TTL)
   - Login page with strong password validation
   - Middleware protecting /admin/*
   - Logout action

3. **Admin CRUD** (Week 2)
   - Quotes: List + Add + Edit + Delete
   - Images: List + Add + Edit + Delete
   - No URL validation, no duplicate fuzzy matching
   - Simple Server Actions + Server Components

4. **Pairings** (Week 2)
   - Single-date assignment form
   - 5-day repetition validation
   - Dashboard showing upcoming pairings
   - Delete pairing with cascade warning

5. **Frontend Integration** (Week 3)
   - Update getTodaysQuote() to use database
   - Graceful fallback to hardcoded quotes
   - Feature flag for gradual rollout

6. **Testing & Deployment** (Week 3-4)
   - Staging tests
   - Production deployment with monitoring
   - Rollback plan ready

---

## Environment Variables

```bash
# .env.local (local development)
DATABASE_URL="postgres://..." # From Vercel Postgres
DIRECT_DATABASE_URL="postgres://..." # For migrations

ADMIN_PASSWORD="[strong-password-here]" # Min 12 chars, special chars required

USE_DATABASE="false" # Feature flag: 'true' to enable CMS, 'false' to use hardcoded

# Optional
SESSION_SECRET="[random-32-char-string]" # For iron-session encryption
```

---

## Success Criteria

Phase 1 is complete when:

- [x] Admin can log in with strong password (24h session)
- [x] Admin can CRUD quotes (exact duplicate prevention)
- [x] Admin can CRUD images (no URL validation)
- [x] Admin can assign quote+image to specific date (one at a time)
- [x] 5-day repetition validation warns admin before saving
- [x] Admin can delete quotes/images (hard delete with cascade warning)
- [x] Dashboard shows upcoming 10 pairings
- [x] Homepage uses database with fallback to hardcoded
- [x] Zero downtime: database failure doesn't break site

---

**Next Step:** Create execution plans (3-5 plans) breaking Phase 1 into implementable tasks.
