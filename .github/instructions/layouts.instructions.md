---
applyTo: "layouts/**"
---

# Display layout mockups

- `layouts/` is a static gallery with no build step: `index.html`, `app.js` and `styles.css`. Open `index.html` directly in a browser.
- `app.js` defines the concepts (`CONCEPTS`), the states (normal, alarm, nofix) and two targets: `epaper`, a 600 × 400 Spectra 6 panel, and `phone`.
- The e-paper mock must stay realistic for the Waveshare 4" HAT+ (E): six colours only (black, white, red, yellow, green, blue), no animation, and refresh timings that match `docs/data/waveshare-4in-epaper-hat-plus-e.md`.
- If you change a layout that appears in `layouts/screenshots/`, recapture that screenshot so the README stays accurate. Name screenshots `<concept-name>-<target>-<state>.png`, for example `watch-circle-epaper-normal.png`.

## Touch LCD gallery (`layouts/touch-lcd/`)

- A separate static gallery for the planned ESP32-S3 touch edition: the Waveshare ESP32-S3-Touch-LCD-4, a 480 × 480 IPS panel with 65K colour and capacitive touch. Keep it separate from the e-paper gallery and reuse the same shared scenario values so the two are comparable.
- Each concept renders an exact 480 × 480 screen in normal, alarm and no-fix states, with a day and a night (dim, red-shifted) palette. `?shot=1` renders the bare screen at 1:1 for screenshots.
- Keep touch targets large (about 48 px or more), make acknowledgement deliberate (for example slide-to-acknowledge) rather than a single tap, and respect `prefers-reduced-motion`.
- Screenshots use the `touch` target name, for example `watch-circle-touch-normal.png`. Check panel facts in `docs/data/waveshare-esp32-s3-touch-lcd-4.md`.

## Third-party designs and licences

- Before drawing on another project's design, icons, fonts or code, log it in `docs/ui-design-references.md`: source URL and commit, licence, what was used and what was not.
- A repository with no licence is all rights reserved: take ideas only, implemented in our own code and palette, and credit it in the concept caption. Copy code or assets only when the licence permits, and keep any required notice with them.
