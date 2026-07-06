# [smiley-caret](https://github.com/macedot/smiley-caret)
Chrome Extension for turning emoticons :) into emoji 🙂

This is a maintained fork of the original [smiley-caret](https://github.com/yandodov/smiley-caret) by Hristiyan Dodov.

**Thanks to the original author** for creating this useful extension!

## Development

- `npm install`
- `npm run build` — build the extension bundles
- `npm run package` — build + create a ready-to-upload zip (`smiley-caret-vX.Y.Z.zip`)
- Load `extension/` as unpacked extension in `chrome://extensions`

Manifest V3 migration completed (2026). See plan for details.

## Privacy (for Chrome Web Store)
Smiley Caret does not collect, store, or transmit any personal data.
The only use of storage is `chrome.storage.local` for the on/off preference (no sync).
No network requests for functionality except (optional) emoji rendering via system fonts.

## Credits
This is a maintained fork of the original project by **Hristiyan Dodov**:

- Original repository: https://github.com/yandodov/smiley-caret

**Thanks to the original author** for creating this handy extension! Many of the core ideas and the emoji data live on from the original work.
