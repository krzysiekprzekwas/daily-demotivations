# Web Share API & Share Buttons - Testing Guide

## Testing Checklist

### ✅ Desktop Browser Testing (Direct Share Buttons)

**Chrome/Edge/Firefox on Desktop:**
1. Visit http://localhost:3000
2. Should see "Share" button with share icon
3. Click "or share directly" link
4. Should see 3 platform buttons: Facebook (blue), Twitter (light blue), LinkedIn (dark blue)
5. Click Facebook button:
   - Opens new popup window
   - URL contains facebook.com/sharer
   - URL parameter includes current page URL
6. Click Twitter button:
   - Opens new popup window
   - Tweet text includes quote (truncated if >220 chars) + "- Daily Demotivations"
   - URL is appended
7. Click LinkedIn button:
   - Opens new popup window
   - URL contains linkedin.com/sharing

**Safari on Desktop:**
- Web Share API may be available on macOS Monterey+
- Should show "Share" button initially
- Clicking opens native macOS share sheet (if supported)
- Otherwise falls back to direct buttons

### ✅ Mobile Browser Testing (Web Share API)

**iOS Safari (iOS 12.2+):**
1. Open http://localhost:3000 on iPhone/iPad
2. Should see "Share" button with share icon
3. Click "Share" button:
   - Shows iOS native share sheet
   - Should include quote image file (1200x1200 PNG)
   - Can share to: Messages, Mail, Instagram, Facebook, Twitter, etc.
   - Text includes: `"[quote]"\n\nDaily Demotivations`
   - URL is included

**Chrome Android (v61+):**
1. Open http://localhost:3000 on Android device
2. Should see "Share" button with share icon
3. Click "Share" button:
   - Shows Android native share sheet
   - Should include quote image file (if supported)
   - Can share to: WhatsApp, Gmail, Facebook, Twitter, etc.
   - Text includes: `"[quote]"\n\nDaily Demotivations`
   - URL is included

**Samsung Internet Android:**
- Similar behavior to Chrome Android
- Native share sheet with image support

### ✅ Error Handling

**Test 1: User Cancellation**
- Click Share button
- Cancel the share sheet without selecting an app
- Should NOT show error message
- Should return to normal state

**Test 2: Network Error**
- Disconnect internet before clicking Share
- Click Share button
- Should show error: "Failed to share. Please try again."
- Should automatically show fallback buttons

**Test 3: File Sharing Not Supported**
- On older mobile browsers without file sharing
- Should gracefully fall back to text+URL only
- No error shown to user

### ✅ Accessibility Testing

**Keyboard Navigation:**
- Tab to Share button (should have visible focus ring)
- Press Enter/Space to activate
- Tab to direct share buttons (should have focus rings)
- Press Enter/Space to activate each button

**Screen Reader:**
- Share button announces: "Share today's demotivation"
- Facebook button announces: "Share on Facebook"
- Twitter button announces: "Share on Twitter"
- LinkedIn button announces: "Share on LinkedIn"
- Loading state announces: "Preparing..."
- Error messages are announced via role="alert"

**Color Contrast:**
- All buttons meet WCAG AA contrast requirements
- Platform colors have sufficient contrast against background

### ✅ Visual/Layout Testing

**Responsive Design:**
- Mobile (320px-640px): Buttons stack vertically
- Tablet (640px-1024px): Buttons side by side
- Desktop (1024px+): Buttons side by side with comfortable spacing

**Loading States:**
- Share button shows spinner when preparing
- Button disabled during loading
- Text changes to "Preparing..."

**Hover States:**
- Desktop: All buttons show hover effect (increased opacity/border)
- Platform buttons show color-specific hover states

## Feature Detection

The component checks for:
1. `navigator.share` exists (basic Web Share API)
2. `navigator.canShare` exists (Level 2 with file support check)
3. `navigator.canShare({ files: [file] })` returns true (file sharing supported)

**Fallback Strategy:**
1. Try Web Share with image file (Level 2)
2. If file fails, try Web Share with text+URL (Level 1)
3. If Web Share not supported, show direct buttons
4. If user clicks "or share directly", show direct buttons

## Browser Support Matrix

| Browser | Version | Web Share | File Sharing | Fallback |
|---------|---------|-----------|--------------|----------|
| Safari iOS | 12.2+ | ✅ | ✅ | N/A |
| Safari macOS | 12.1+ | ✅ | ✅ | N/A |
| Chrome Android | 61+ | ✅ | 75+ | Text only |
| Chrome Desktop | No | ❌ | ❌ | Direct buttons |
| Edge Android | 79+ | ✅ | ✅ | N/A |
| Firefox Android | No | ❌ | ❌ | Direct buttons |
| Firefox Desktop | No | ❌ | ❌ | Direct buttons |
| Samsung Internet | 8+ | ✅ | 11+ | Text only |

## Development Testing Tools

### Browser DevTools
```javascript
// Check Web Share API support
console.log('Web Share supported:', 'share' in navigator);
console.log('Can share files:', 'canShare' in navigator);

// Test share programmatically
if (navigator.share) {
  navigator.share({
    title: 'Test',
    text: 'Test share',
    url: 'https://example.com'
  }).then(() => console.log('Shared'))
    .catch(err => console.error('Error:', err));
}
```

### Mobile Testing Options
1. **Real Devices** (recommended for Web Share API)
   - Use ngrok or similar to expose localhost
   - Test on actual iPhone and Android devices

2. **BrowserStack/Sauce Labs**
   - Cloud-based real device testing
   - Test Web Share API on various devices

3. **Chrome DevTools Device Mode**
   - Only for visual testing
   - Web Share API doesn't work in emulation

## Known Limitations

1. **Web Share API requires HTTPS** (or localhost for dev)
   - Production must be served over HTTPS
   - localhost:3000 works for development

2. **File sharing may fail silently**
   - Some apps don't support receiving files via Web Share
   - Component handles this gracefully

3. **User must interact with page first**
   - Can't auto-trigger share on page load
   - Requires user click/tap

4. **Twitter character limit**
   - Quotes >220 chars are truncated with "..."
   - Prevents tweet overflow

## Success Criteria

- ✅ Web Share API works on iOS Safari and Chrome Android
- ✅ Image file is shared when supported
- ✅ Graceful fallback to text+URL when file sharing fails
- ✅ Direct share buttons work on all desktop browsers
- ✅ No errors shown for user cancellation
- ✅ Accessible via keyboard and screen reader
- ✅ Proper loading and error states
- ✅ Responsive design on all screen sizes

## Next Steps After Testing

1. Deploy to Vercel with HTTPS
2. Test on real devices with production URL
3. Validate OG images appear in platform previews
4. Monitor share button engagement analytics
5. Consider A/B testing button placement/styling
