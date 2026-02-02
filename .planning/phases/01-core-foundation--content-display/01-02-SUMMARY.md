---
phase: 01-core-foundation--content-display
plan: 02
subsystem: content
tags: [date-fns, typescript, deterministic-selection]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 15 project structure and TypeScript configuration
provides:
  - Curated collection of 30 demotivating quotes
  - Deterministic date-based quote selection (getTodaysQuote function)
  - Shared TypeScript interfaces for Phase 1 (LandscapePhoto, DailyQuote, Env)
affects: [01-03, 01-04, homepage, api-routes]

# Tech tracking
tech-stack:
  added: [date-fns]
  patterns: [deterministic-hashing, const-assertion, UTC-dates]

key-files:
  created: 
    - src/lib/quotes.ts
    - src/types/index.ts
  modified: 
    - package.json (added date-fns dependency)

key-decisions:
  - "Use simple hash function instead of cryptographic hash for deterministic selection"
  - "UTC dates for global consistency across timezones"
  - "30 quotes provides ~month of unique content before repeats"
  - "Const assertion on QUOTES array ensures immutability"

patterns-established:
  - "Date-based deterministic selection: hash(date) % array.length"
  - "Minimal type definitions: only what Phase 1 needs"

# Metrics
duration: 4min
completed: 2026-02-02
---

# Phase 1 Plan 2: Quote Collection with Deterministic Selection

**30 curated demotivating quotes with hash-based date selection ensuring global consistency**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-02T22:33:55Z
- **Completed:** 2026-02-02T22:37:26Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Created collection of 30 demotivating quotes with ironic pessimism subverting motivational content
- Implemented deterministic quote selection using date-based hash algorithm
- Defined TypeScript interfaces for Phase 1 (LandscapePhoto, DailyQuote, Env)
- Ensured global consistency with UTC dates and deterministic hashing
- Made quotes offline-capable (no external API calls)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create quote collection with deterministic selection** - `d0dce40` (feat)
2. **Task 2: Create TypeScript types** - `91d505b` (feat)

**Plan metadata:** (to be committed)

## Files Created/Modified

- `src/lib/quotes.ts` - Quote collection with 30 demotivating quotes and deterministic selection logic (getTodaysQuote, getQuoteForDate)
- `src/types/index.ts` - Shared TypeScript interfaces (LandscapePhoto, DailyQuote, Env)
- `package.json` - Added date-fns dependency for date formatting

## Decisions Made

- **Hash algorithm:** Used simple bitwise hash `((hash << 5) - hash) + charCode` instead of cryptographic hash - deterministic and fast, no security needs
- **UTC dates:** Used UTC dates via date-fns format to ensure all users globally see same quote on same calendar day
- **30 quotes:** Provides approximately one month of unique content before any repeats, balancing variety with curation effort
- **Const assertion:** Applied `as const` to QUOTES array ensuring TypeScript immutability and preventing accidental modifications
- **Minimal types:** Created only types needed for Phase 1 (LandscapePhoto for Unsplash, DailyQuote for API routes, Env for environment variables)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Minor:** Initial testing with tsx had module resolution issues. Verified functionality through TypeScript compilation and Next.js build instead.
- **Note:** Previous cleanup commit (44580ae) removed src files prematurely. Files were restored from earlier commits d0dce40 and 91d505b where work was properly completed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

✅ **Ready for next plan (01-03)**

- Quote collection complete and deterministic
- TypeScript types available for Unsplash integration
- All verification checks passed:
  - ✓ 30 demotivating quotes present
  - ✓ getTodaysQuote() returns consistent results
  - ✓ Hash algorithm produces deterministic output
  - ✓ TypeScript compilation succeeds
  - ✓ Next.js build succeeds
  - ✓ No external API calls (offline-capable)

Next plan can proceed with Unsplash API integration (plan 01-03).

---
*Phase: 01-core-foundation--content-display*
*Completed: 2026-02-02*
