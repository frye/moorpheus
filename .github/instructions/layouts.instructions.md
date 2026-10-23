---
applyTo: "layouts/**"
---

# Display layout mockups

- `layouts/` is a static gallery with no build step: `index.html`, `app.js` and `styles.css`. Open `index.html` directly in a browser.
- `app.js` defines the concepts (`CONCEPTS`), the states (normal, alarm, nofix) and two targets: `epaper`, a 600 × 400 Spectra 6 panel, and `phone`.
- The e-paper mock must stay realistic for the Waveshare 4" HAT+ (E): six colours only (black, white, red, yellow, green, blue), no animation, and refresh timings that match `docs/data/waveshare-4in-epaper-hat-plus-e.md`.
- If you change a layout that appears in `layouts/screenshots/`, recapture that screenshot so the README stays accurate. Name screenshots `<concept-name>-<target>-<state>.png`, for example `watch-circle-epaper-normal.png`.
