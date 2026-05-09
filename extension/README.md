EngagED Thread Builder (Chrome extension) - scaffold

How to load locally in Chrome/Edge:

1. Open `chrome://extensions` (or Edge's extensions page).
2. Enable "Developer mode".
3. Click "Load unpacked" and choose this folder: `extension/`.

What is included:
- `manifest.json` - extension manifest (v3)
- `popup.html` - UI for generating threads
- `popup.js` - popup logic
- `content.js` - content script that provides page context
- `threadFormatter.js` - pure formatter function used by the popup
- `background.js` - minimal service worker
