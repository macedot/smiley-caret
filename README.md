# smiley-caret
Chrome Extension for turning emoticons :) into emoji 🙂

## Development

- `npm install`
- `npm run build` (uses esbuild)
- Load `extension/` as unpacked extension in `chrome://extensions`

Manifest V3 migration completed (2026). See plan for details.

## Privacy (for Chrome Web Store)
Smiley Caret does not collect, store, or transmit any personal data.
The only use of storage is `chrome.storage.local` for the on/off preference (no sync).
No network requests for functionality except (optional) emoji rendering via system fonts.
