# Privacy Policy for Smiley Caret

Smiley Caret ("the Extension") is a productivity tool that converts text emoticons (e.g. :) ) into emoji and provides an in-field search for colon shortcodes.

## Data Collection
- The Extension does **not** collect, transmit, or sell any personal information.
- No analytics, tracking, or remote logging.
- The only persisted data is a single boolean preference (`active`) stored using `chrome.storage.local` on the user's device.

## Permissions
- `storage`: used solely for the on/off toggle preference.
- Content script host access (`<all_urls>` equivalent via matches): required to detect and act inside text fields on any site the user is typing in. This is the core advertised functionality.

## Third Parties
No third-party scripts, beacons, or emoji CDNs are loaded at runtime (native emoji glyphs are used).

## Contact
For questions: see the original author or current maintainer.

Last updated: 2026 (MV3 migration)