# Plan 02: Web Share API & Share Buttons

**Phase:** 2 - Social Sharing & Virality  
**Requirements:** SHARE-02, SHARE-04  
**Plan:** 02 of 03  
**Status:** Not Started

---

## Overview

Implement native sharing via Web Share API (mobile-first) with fallback to platform-specific share buttons (desktop). Enable users to share Daily Demotivations quotes to Facebook, LinkedIn, Twitter/X, and other apps via OS-native share sheets or direct share dialogs.

**Key Decision:** Progressive enhancement approach - Web Share API as primary on mobile, direct buttons as fallback on desktop/unsupported browsers.

---

## Requirements

### Functional Requirements - SHARE-02 (Web Share API)

1. **Share Button**: Primary button that invokes native OS share sheet
2. **Share Data**: Include title, quote text, and current page URL
3. **File Sharing**: Option to share as image (integrates with Plan 01 download)
4. **Feature Detection**: Only show button if Web Share API available
5. **User Activation**: Triggered by button click (not programmatic)
6. **Error Handling**: Handle cancellation, permission denied, unsupported platforms
7. **Mobile-First**: Optimized for iOS Safari and Chrome Android

### Functional Requirements - SHARE-04 (Direct Share Buttons)

1. **Platform Buttons**: Facebook, LinkedIn, Twitter/X share buttons
2. **Pre-filled Data**: URL automatically included, quote text for Twitter
3. **Popup Windows**: Open in popup (800x600), not new tab
4. **Fallback**: Show when Web Share API unavailable
5. **Desktop-First**: Optimized for desktop browsers
6. **Icons**: Official brand colors and recognizable icons

### Technical Requirements

1. **Components**:
   - `WebShareButton.tsx` - Native OS sharing
   - `ShareButtons.tsx` - Platform-specific buttons
   - `ShareContainer.tsx` - Progressive enhancement wrapper

2. **Libraries**: `react-icons` for social platform icons

3. **Client-Side**: All components use `'use client'` directive

4. **Analytics**: Track share button clicks and completion

5. **Accessibility**: WCAG AA compliant, keyboard navigation

### Non-Functional Requirements

1. **Performance**: Share dialog opens in <100ms
2. **Reliability**: 99%+ success rate on supported browsers
3. **Browser Support**: Chrome 128+, Safari 14+, Edge 93+
4. **Mobile Support**: iOS 14+, Android 10+
5. **Graceful Degradation**: Always provide copy-to-clipboard fallback

---

## Technical Design

### Component 1: WebShareButton

```typescript
// src/components/WebShareButton.tsx
'use client';

import { useState } from 'react';
import { FiShare2 } from 'react-icons/fi';

interface WebShareButtonProps {
  quote: string;
  url?: string;
  withImage?: boolean;
  className?: string;
}

export function WebShareButton({ 
  quote, 
  url,
  withImage = false,
  className = '' 
}: WebShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleShare = async () => {
    setIsSharing(true);
    setError(null);
    
    try {
      const shareUrl = url || window.location.href;
      const shareData: ShareData = {
        title: 'Daily Demotivations',
        text: quote,
        url: shareUrl,
      };
      
      // If withImage, fetch and include image file
      if (withImage && navigator.canShare) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const response = await fetch(`/api/download?date=${dateStr}`);
        const blob = await response.blob();
        const file = new File([blob], `daily-demotivation-${dateStr}.png`, { 
          type: 'image/png' 
        });
        
        shareData.files = [file];
        
        // Check if we can share files
        if (!navigator.canShare(shareData)) {
          // Fall back to URL-only sharing
          delete shareData.files;
        }
      }
      
      await navigator.share(shareData);
      console.log('[WebShare] Shared successfully');
      
    } catch (err) {
      const error = err as Error;
      
      if (error.name === 'AbortError') {
        // User cancelled - normal behavior, no error needed
        console.log('[WebShare] User cancelled share');
      } else {
        console.error('[WebShare] Share failed:', error);
        setError('Failed to share. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`
          inline-flex items-center gap-2 px-8 py-4
          bg-white text-gray-900 font-semibold rounded-lg
          hover:bg-white/90
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
          ${className}
        `}
        aria-label="Share quote"
      >
        <FiShare2 className={`w-5 h-5 ${isSharing ? 'animate-pulse' : ''}`} />
        {isSharing ? 'Sharing...' : 'Share'}
      </button>
      
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Component 2: ShareButtons

```typescript
// src/components/ShareButtons.tsx
'use client';

import { FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa';

interface ShareButtonsProps {
  quote: string;
  url?: string;
  className?: string;
}

export function ShareButtons({ quote, url, className = '' }: ShareButtonsProps) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  const handleShare = (platform: 'facebook' | 'linkedin' | 'twitter') => {
    const encoded = encodeURIComponent(shareUrl);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(quote)}&url=${encoded}`,
    };
    
    const popup = window.open(
      shareUrls[platform],
      `${platform}-share-dialog`,
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );
    
    // Track analytics
    console.log(`[Share] ${platform} button clicked`);
    
    // Handle popup blocker
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      alert('Please allow popups to share. You can also copy the URL from the address bar.');
    }
  };
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Facebook */}
      <button
        onClick={() => handleShare('facebook')}
        className="group p-3 rounded-full bg-[#1877f2] hover:bg-[#0d65d9] transition-colors"
        aria-label="Share on Facebook"
      >
        <FaFacebook className="w-5 h-5 text-white" />
      </button>
      
      {/* LinkedIn */}
      <button
        onClick={() => handleShare('linkedin')}
        className="group p-3 rounded-full bg-[#0a66c2] hover:bg-[#004182] transition-colors"
        aria-label="Share on LinkedIn"
      >
        <FaLinkedin className="w-5 h-5 text-white" />
      </button>
      
      {/* Twitter */}
      <button
        onClick={() => handleShare('twitter')}
        className="group p-3 rounded-full bg-[#1da1f2] hover:bg-[#0d8bd9] transition-colors"
        aria-label="Share on Twitter"
      >
        <FaTwitter className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
```

### Component 3: ShareContainer (Progressive Enhancement)

```typescript
// src/components/ShareContainer.tsx
'use client';

import { useEffect, useState } from 'react';
import { WebShareButton } from './WebShareButton';
import { ShareButtons } from './ShareButtons';
import { DownloadButton } from './DownloadButton';

interface ShareContainerProps {
  quote: string;
  url?: string;
}

export function ShareContainer({ quote, url }: ShareContainerProps) {
  const [supportsWebShare, setSupportsWebShare] = useState(false);
  const [supportsFileShare, setSupportsFileShare] = useState(false);
  
  useEffect(() => {
    // Check if Web Share API is available
    const hasWebShare = typeof navigator !== 'undefined' && 
                        typeof navigator.share === 'function';
    setSupportsWebShare(hasWebShare);
    
    // Check if file sharing is supported
    if (hasWebShare && navigator.canShare) {
      const testData = {
        files: [new File([''], 'test.png', { type: 'image/png' })],
      };
      setSupportsFileShare(navigator.canShare(testData));
    }
  }, []);
  
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Primary Share Action */}
      {supportsWebShare ? (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Share with Image (if supported) */}
          {supportsFileShare && (
            <WebShareButton 
              quote={quote} 
              url={url} 
              withImage 
              className="w-full sm:w-auto"
            />
          )}
          
          {/* Share URL */}
          {!supportsFileShare && (
            <WebShareButton 
              quote={quote} 
              url={url} 
              className="w-full sm:w-auto"
            />
          )}
        </div>
      ) : (
        <>
          {/* Fallback: Direct share buttons */}
          <ShareButtons quote={quote} url={url} />
        </>
      )}
      
      {/* Secondary Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <DownloadButton className="w-full sm:w-auto" />
        
        {/* Copy Link button (future enhancement) */}
      </div>
      
      {/* Help text for mobile users */}
      {supportsWebShare && (
        <p className="text-xs text-white/50 text-center max-w-sm">
          Share directly to your favorite apps, or download to share on Instagram
        </p>
      )}
    </div>
  );
}
```

### Integration into QuoteDisplay

```typescript
// src/components/QuoteDisplay.tsx (updated from Plan 01)
import { format } from 'date-fns';
import { ShareContainer } from './ShareContainer';

interface QuoteDisplayProps {
  quote: string;
}

export default function QuoteDisplay({ quote }: QuoteDisplayProps) {
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Date indicator */}
      <time 
        dateTime={today.toISOString()}
        className="block text-white/70 text-sm sm:text-base tracking-widest uppercase font-light"
      >
        {formattedDate}
      </time>
      
      {/* Quote */}
      <blockquote 
        className="
          text-3xl sm:text-4xl md:text-5xl lg:text-6xl
          font-serif font-normal
          text-white 
          leading-relaxed 
          tracking-tight
          drop-shadow-2xl
          px-4
        "
      >
        "{quote}"
      </blockquote>
      
      {/* Share & Download Actions */}
      <div className="pt-8">
        <ShareContainer quote={quote} />
      </div>
      
      {/* Breathing room */}
      <div className="h-12" aria-hidden="true" />
    </div>
  );
}
```

---

## Implementation Steps

### Step 1: Install react-icons (if not done in Plan 01)

```bash
npm install react-icons
```

**Why:** Need social platform icons (Facebook, LinkedIn, Twitter) and share icon

### Step 2: Create WebShareButton Component

**File:** `src/components/WebShareButton.tsx`

1. Create client component with 'use client' directive
2. Add state for isSharing, error
3. Implement handleShare function:
   - Create ShareData object
   - If withImage, fetch from /api/download and add to files array
   - Call navigator.share()
   - Handle AbortError (user cancelled)
   - Handle other errors
4. Style button with Tailwind (prominent, white background)
5. Import FiShare2 icon from react-icons/fi
6. Add loading state (pulse animation)
7. Add error display

**Validation:**
- Button renders
- Click opens native share sheet (test on iOS/Android)
- Cancelling doesn't show error
- File sharing works if supported

### Step 3: Create ShareButtons Component

**File:** `src/components/ShareButtons.tsx`

1. Create client component
2. Add handleShare function with platform parameter
3. Build share URLs for Facebook, LinkedIn, Twitter
4. Open in popup window (window.open with dimensions)
5. Handle popup blocker (check if popup opened)
6. Style buttons with official brand colors:
   - Facebook: #1877f2
   - LinkedIn: #0a66c2
   - Twitter: #1da1f2
7. Import icons: FaFacebook, FaLinkedin, FaTwitter
8. Add circular button style with hover effects
9. Add aria-labels for accessibility

**Validation:**
- Buttons render with correct colors
- Click opens popup (not full tab)
- Popup shows share dialog for each platform
- Popup blocker handled gracefully

### Step 4: Create ShareContainer Component

**File:** `src/components/ShareContainer.tsx`

1. Create client component
2. Add useEffect for feature detection:
   - Check typeof navigator.share === 'function'
   - Check navigator.canShare for file support
3. Conditionally render WebShareButton or ShareButtons
4. Include DownloadButton as secondary action
5. Add help text for mobile users
6. Style with flexbox for responsive layout

**Validation:**
- Shows WebShareButton on mobile
- Shows ShareButtons on desktop/unsupported browsers
- Layout adapts to mobile/desktop
- Feature detection works correctly

### Step 5: Update QuoteDisplay Component

**File:** `src/components/QuoteDisplay.tsx`

1. Import ShareContainer
2. Replace DownloadButton with ShareContainer
3. Pass quote prop to ShareContainer
4. Test responsive layout

**Validation:**
- Share options appear below quote
- Spacing looks correct
- Works on mobile and desktop

### Step 6: Cross-Browser Testing

Test on:

**Desktop:**
- ✅ Chrome (Web Share API supported on macOS 12.3+)
- ✅ Safari (Web Share API supported on macOS 12.3+)
- ✅ Firefox (No Web Share API → shows direct buttons)
- ✅ Edge (Web Share API supported)

**Mobile:**
- ✅ iOS Safari (Web Share API + file sharing)
- ✅ Chrome Android (Web Share API + file sharing)
- ✅ Firefox Android (No Web Share API → shows direct buttons)

**Test cases:**
1. Click share → native sheet opens (mobile)
2. Click share with image → includes image (if supported)
3. Click Facebook → popup opens with share dialog
4. Click LinkedIn → popup opens with share dialog
5. Click Twitter → popup opens with quote pre-filled
6. Cancel share → no error shown
7. Block popups → shows fallback message

### Step 7: Twitter Character Limit Handling

**Issue:** Quote + URL may exceed 280 characters

**Solution:**
```typescript
const handleShare = (platform: 'twitter') => {
  let text = quote;
  const url = encodeURIComponent(shareUrl);
  
  // Twitter t.co short links are ~23 chars, leave room for spacing
  const maxLength = 280 - 25; // 255 chars for quote
  
  if (text.length > maxLength) {
    text = text.substring(0, maxLength - 3) + '...';
  }
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
  window.open(twitterUrl, 'twitter-share-dialog', 'width=550,height=420');
};
```

**Validation:**
- Test with longest quote in collection
- Verify truncation adds ellipsis
- Check quote + URL fits in 280 chars

### Step 8: Analytics Integration (Preparation)

Add console logging for tracking (Phase 3 will connect to analytics):

```typescript
// WebShareButton
console.log('[Analytics] Web Share button clicked', { 
  withImage, 
  timestamp: Date.now() 
});

// ShareButtons
console.log('[Analytics] Share button clicked', { 
  platform, 
  timestamp: Date.now() 
});
```

**Validation:**
- Console logs appear on button click
- Log includes relevant context (platform, timestamp)

### Step 9: Accessibility Audit

1. **Keyboard navigation:**
   - Tab to each button
   - Enter/Space activates button
   - Focus indicator visible

2. **Screen reader:**
   - Buttons have descriptive aria-labels
   - Error messages announced (role="alert")
   - Loading states announced

3. **Color contrast:**
   - Button text meets WCAG AA (4.5:1 ratio)
   - Focus indicators meet contrast requirements

**Tools:**
- Lighthouse accessibility audit
- axe DevTools extension
- Manual keyboard testing

**Validation:**
- Lighthouse accessibility score >95
- No critical axe violations
- Keyboard navigation works

### Step 10: Mobile UX Testing

**Real device testing (critical for Web Share API):**

1. **iOS iPhone:**
   - Open in Safari
   - Click share → iOS share sheet appears
   - Select WhatsApp → quote and URL pre-filled
   - Select Messages → quote and URL pre-filled
   - Select Instagram → "Instagram doesn't support text" shown
   - Click "Share as Image" → Instagram appears in share sheet

2. **Android:**
   - Open in Chrome
   - Click share → Android sharesheet appears
   - Select Gmail → quote and URL in email body
   - Select Telegram → quote and URL pre-filled
   - Click "Share as Image" → Instagram shown, image included

**Validation:**
- Share sheet appears native (matches OS style)
- Quote text preserved
- URL included
- Image included when selected

---

## Testing Checklist

### Functional Tests - Web Share API

- [ ] Share button visible on mobile (iOS Safari, Chrome Android)
- [ ] Click share → native share sheet opens
- [ ] Share sheet includes Daily Demotivations title
- [ ] Share sheet includes quote text
- [ ] Share sheet includes current page URL
- [ ] "Share as Image" includes PNG file
- [ ] Cancel share → no error message
- [ ] Share completes → no error
- [ ] Unsupported browser → button hidden

### Functional Tests - Direct Share Buttons

- [ ] Buttons visible on desktop/unsupported browsers
- [ ] Facebook button opens popup with Facebook share dialog
- [ ] LinkedIn button opens popup with LinkedIn share dialog
- [ ] Twitter button opens popup with quote pre-filled
- [ ] Twitter quote doesn't exceed 280 chars
- [ ] Popup dimensions correct (800x600)
- [ ] Popup blocker handled gracefully
- [ ] URLs encoded correctly (no broken links)

### Progressive Enhancement

- [ ] Feature detection works (Web Share vs Direct Buttons)
- [ ] Mobile shows Web Share button (if supported)
- [ ] Desktop shows Direct Buttons (if Web Share not supported)
- [ ] Never shows both simultaneously
- [ ] DownloadButton always available
- [ ] Layout adapts responsively

### Browser Compatibility

- [ ] Chrome Desktop: Web Share API works (macOS 12.3+, Windows 10+)
- [ ] Safari Desktop: Web Share API works (macOS 12.3+)
- [ ] Firefox Desktop: Shows direct buttons (Web Share not supported)
- [ ] Edge Desktop: Web Share API works
- [ ] iOS Safari: Web Share API + file sharing works
- [ ] Chrome Android: Web Share API + file sharing works
- [ ] Firefox Android: Shows direct buttons

### Error Handling

- [ ] Network error fetching image → shows error message
- [ ] User cancels share → no error (AbortError ignored)
- [ ] Permission denied → shows error message
- [ ] Popup blocker → shows alert
- [ ] Invalid URL → falls back to window.location.href

### Performance

- [ ] Share dialog opens in <100ms
- [ ] Image fetch for file sharing <500ms
- [ ] Popup opens without delay
- [ ] No memory leaks on repeated shares

### Accessibility

- [ ] All buttons keyboard accessible
- [ ] Focus indicators visible
- [ ] aria-labels present and descriptive
- [ ] Error messages announced by screen reader
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets ≥48x48px on mobile

### Social Platform Validation

- [ ] Facebook: Share dialog shows OG preview
- [ ] LinkedIn: Share dialog shows OG preview
- [ ] Twitter: Quote pre-filled, character limit respected
- [ ] WhatsApp: Quote and URL appear in message (via Web Share)
- [ ] Instagram: "Share as Image" includes image file

---

## Edge Cases & Pitfalls

### Edge Case 1: Web Share API Detection False Positive

**Issue:** navigator.share exists but throws error when called (some browsers)

**Solution:**
```typescript
try {
  if (typeof navigator.share !== 'function') {
    throw new Error('Web Share not supported');
  }
  await navigator.share(data);
} catch (err) {
  // Fall back to copy-to-clipboard or direct buttons
  console.error('Web Share failed:', err);
}
```

**Test:** Mock navigator.share that throws

### Edge Case 2: Popup Blocker Aggressive Blocking

**Issue:** Some browsers block all popups by default (Brave, Firefox with strict tracking)

**Solution:**
- Detect if popup failed to open
- Show alert with instructions
- Provide "Copy URL" fallback

**Test:** Enable strict popup blocker, try share buttons

### Edge Case 3: Long Quotes Exceeding Twitter Limit

**Issue:** Quote + URL > 280 characters

**Solution:** Truncate quote at 255 chars, add ellipsis

**Test:** Share longest quote in collection to Twitter

### Edge Case 4: Instagram Doesn't Support Text via Web Share

**Issue:** When sharing via Web Share to Instagram, only images supported (text ignored)

**Solution:**
- Make "Share as Image" prominent
- Add help text: "Instagram requires image sharing"

**Test:** Share to Instagram via Web Share, verify text ignored but image included

### Edge Case 5: iOS Safari Private Browsing

**Issue:** Some APIs restricted in Private Browsing mode

**Solution:**
- Web Share API works in Private Browsing (verified)
- File sharing may be restricted → fall back to URL-only

**Test:** Enable Private Browsing, test share functionality

### Edge Case 6: Network Failure During File Fetch

**Issue:** /api/download fails when "Share as Image" clicked

**Solution:**
- Timeout after 5s
- Fall back to URL-only share
- Show error message

**Test:** Throttle network to Offline, click "Share as Image"

### Edge Case 7: Popup Opens Behind Parent Window

**Issue:** Some browsers open popup behind main window

**Solution:**
- Use window.focus() on popup
- Not critical (user can find popup in taskbar)

**Test:** Open popup, check if it appears in front

### Edge Case 8: Double-Click on Share Button

**Issue:** Rapid clicks open multiple popups/share dialogs

**Solution:**
- Disable button while isSharing=true
- Debounce clicks (handled by disabled state)

**Test:** Rapidly click share button

---

## Success Criteria

### Must Have (Blocking)

- ✅ Web Share API button works on iOS Safari and Chrome Android
- ✅ Direct share buttons work on desktop browsers
- ✅ Progressive enhancement: correct UI shown based on support
- ✅ Share includes quote text and URL
- ✅ "Share as Image" includes PNG file (if supported)
- ✅ Error handling prevents user confusion
- ✅ Accessibility: keyboard navigation and screen reader support

### Should Have (Non-blocking but important)

- ✅ Twitter character limit handled
- ✅ Popup blocker fallback
- ✅ Analytics logging (preparation for Phase 3)
- ✅ Mobile UX optimized (large touch targets, native feel)
- ✅ Desktop UX optimized (direct buttons prominent)

### Nice to Have (Future enhancement)

- ⏳ Copy-to-clipboard button
- ⏳ WhatsApp direct button (desktop)
- ⏳ Pinterest share button
- ⏳ Email share button (mailto: link)
- ⏳ Share history (track what user has shared)

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Web Share API browser support gaps** | High | Medium | Progressive enhancement with direct buttons |
| **File sharing not supported** | Medium | Low | Fall back to URL-only share |
| **Popup blockers prevent direct share** | Medium | Medium | Detect and show instructions |
| **Instagram text sharing ignored** | High | Low | Emphasize "Share as Image" |
| **Twitter character limit exceeded** | Medium | Low | Truncate quote with ellipsis |
| **Network failure during image fetch** | Low | Medium | Timeout and fall back to URL share |
| **Social platform API changes** | Low | High | Monitor platform docs, test regularly |

---

## Dependencies

### External Dependencies

- `react-icons` (new) - Social platform icons and share icon

### Internal Dependencies

- Plan 01: Download API route (for file sharing)
- `src/lib/quotes.ts` - Quote text
- `src/components/DownloadButton.tsx` (from Plan 01)

### Platform Dependencies

- Web Share API (browser)
- Social platform share URLs (Facebook, LinkedIn, Twitter)

---

## Rollback Plan

If share functionality causes issues:

1. **Remove ShareContainer** from QuoteDisplay
2. **Keep components** (doesn't affect homepage if unused)
3. **Revert to Plan 01 state** (DownloadButton only)
4. **Keep API routes** (download still works)

**Time to rollback:** <5 minutes

**Data loss:** None

---

## Monitoring & Observability

### Metrics to Track

1. **Share Button Engagement:**
   - Click-through rate (% of visitors)
   - Completion rate (opened dialog → actual share)
   - Platform breakdown (Facebook vs Twitter vs LinkedIn)
   - Web Share vs Direct Buttons usage

2. **Performance:**
   - Time from click to share dialog open
   - Image fetch time (for file sharing)
   - Error rate

3. **User Behavior:**
   - Most shared quotes
   - Share times (when do people share)
   - Mobile vs desktop sharing patterns

### Logging (Phase 2)

```typescript
// WebShareButton
console.log('[Share] Web Share clicked', {
  withImage,
  platform: 'native',
  timestamp: Date.now(),
});

// ShareButtons
console.log('[Share] Direct button clicked', {
  platform, // facebook, linkedin, twitter
  timestamp: Date.now(),
});
```

### Analytics Integration (Phase 3)

```typescript
// Track share button clicks
analytics.track('Share Button Clicked', {
  method: 'web-share' | 'facebook' | 'linkedin' | 'twitter',
  quote: quote.substring(0, 50) + '...', // First 50 chars
  url: window.location.href,
});

// Track share completion (if possible)
analytics.track('Share Completed', {
  method: 'web-share',
  // Note: We can't track which app user chose via Web Share API
});
```

---

## Documentation

### User-Facing

Add to README.md:

```markdown
### Share Quotes

**On Mobile:**
Tap the "Share" button below any quote to open your device's native share menu. Share directly to:
- WhatsApp, Messages, Email
- Twitter, Facebook, LinkedIn
- Instagram (tap "Share as Image" to include the quote image)

**On Desktop:**
Click the social platform buttons to share:
- Facebook: Share to your timeline or send to friends
- LinkedIn: Post to your feed with your professional network
- Twitter: Tweet the quote (pre-filled, just add your thoughts!)

All shares include the quote and a link back to Daily Demotivations.
```

### Developer-Facing

```typescript
/**
 * ShareContainer Component
 * 
 * Progressive enhancement wrapper that shows Web Share API button on supported
 * browsers/devices, or falls back to platform-specific share buttons.
 * 
 * Uses feature detection (useEffect) to determine which UI to render.
 * 
 * Props:
 * - quote: The quote text to share
 * - url: Optional URL to share (defaults to window.location.href)
 * 
 * Browser Support:
 * - Web Share API: iOS Safari 14+, Chrome Android 89+, Chrome Desktop 93+
 * - Direct Buttons: All browsers (popup-based)
 * 
 * @example
 * <ShareContainer quote="Your daily motivation: It probably won't work anyway." />
 */
```

---

## Related Plans

- **Plan 01:** Download Functionality (dependency for file sharing)
- **Plan 03:** OG Image Enhancements (independent, improves shared URL previews)

---

*Plan created: 2025-02-03*  
*Estimated effort: 6-8 hours*  
*Priority: High (core virality feature)*  
*Dependencies: Plan 01 (for file sharing)*
