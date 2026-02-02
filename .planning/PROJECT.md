# Daily Demotivations

## What This Is

A humorous daily quote website that subverts the "daily affirmations" format by presenting demotivating quotes over serene romantic landscapes. Users visit daily to see today's demotivating quote beautifully displayed on a calming background image, creating an absurd contrast. The site allows sharing these quotes as images to social media platforms.

## Core Value

Users get a daily laugh from the juxtaposition of demotivating content presented in the earnest, polished aesthetic of inspirational quote sites.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User visits site and sees today's demotivating quote
- [ ] Quote is displayed over a romantic landscape background image
- [ ] Same quote shows for everyone on the same day (deterministic by date)
- [ ] Background image fetched daily from free image API (Unsplash or similar)
- [ ] User can download the quote+image as a single image file
- [ ] User can share the quote+image directly to Facebook, LinkedIn, Instagram
- [ ] Shareable image generated server-side with quote overlaid on landscape
- [ ] Site uses sophisticated, polished design mimicking "daily affirmations" aesthetic
- [ ] Quotes are curated and hardcoded in v1 (static list)

### Out of Scope

- User accounts/authentication — Keep it simple, anonymous visitors only
- User-submitted quotes — Defer to v2, start with curated content
- Admin CMS for quote management — Static quotes for v1, CMS in v2
- Historical quote browsing — Just today's quote for v1
- Platform-specific image formats — One universal format for v1 (1200x630), optimize for each platform in v2
- Moderation system — Not needed until user submissions exist

## Context

**Humor through contrast:** The core joke relies on presenting demotivating, cynical, or absurdist quotes using the same earnest, beautiful presentation as inspirational content. The design should look sincere and polished.

**Daily calendar pattern:** Like "word of the day" or "daily horoscope" — people return daily to see what today brings. The deterministic nature (same quote for everyone on a given day) enables shared social experience.

**Viral potential:** Shareable images are key to awareness. The absurdity + shareability could drive organic growth through social media.

**Free image resources:** Using royalty-free APIs (Unsplash, Pexels) keeps costs zero and provides variety without manual curation.

## Constraints

- **Hosting**: Vercel — existing hosting platform for similar projects
- **Cost**: Free tier — use free image APIs, no paid services required for v1
- **Timeline**: Ship fast — static quotes, no database initially, minimal complexity
- **Tech stack**: Vercel-compatible — Next.js/React ecosystem likely fits well

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static quotes in v1 | Ship faster, validate concept before building CMS | — Pending |
| Server-side image generation | Consistent output across platforms, better quality control | — Pending |
| No authentication | Reduces complexity, removes barrier to entry, fits anonymous viral sharing | — Pending |
| Defer user submissions to v2 | Validate core concept and sharing mechanics before adding moderation complexity | — Pending |
| Universal image format (1200x630) | Works reasonably on most platforms, avoid premature optimization | — Pending |

---
*Last updated: 2025-01-15 after initialization*
