# UI design references and licence log

This page lists outside projects, fonts and other material consulted for the
Moorpheus screen mockups (`layouts/` and `layouts/touch-lcd/`), what was taken
from each, and the licence that applies. Add an entry before using any
third-party design, asset or code in a mockup or in firmware.

Rules:

- Ideas and general layout conventions may be used when they are written up and implemented independently in our own code and palette.
- Code, images, icons, fonts, design files and exact colour or asset values may be copied only when the source's licence allows it. Record the licence and any attribution it requires here, and keep the licence text with the copied material.
- A repository without a licence is **all rights reserved**. Use it for ideas only.

## 1. Marine-Displays (Boating with the Baileys)

| Item | Detail |
|---|---|
| Source | [Boatingwiththebaileys/Marine-Displays](https://github.com/Boatingwiththebaileys/Marine-Displays), reviewed at commit [`22f1f5f`](https://github.com/Boatingwiththebaileys/Marine-Displays/tree/22f1f5f2c78c73198f9e8ee392407172ae29d951) (20 October 2026) |
| What it is | Open-source marine displays for Waveshare ESP32-S3 boards, using SignalK or NMEA 2000 data. The `ESP32-S3_Square_Display` folder targets the same ESP32-S3-Touch-LCD-4 (V3 and V4) as our touch edition and includes an anchor-alarm page. |
| Licence | **None.** No LICENSE file at the reviewed commit, and the GitHub API reports no licence. Treat as all rights reserved. Bundled third-party libraries in its `lib/` folders carry their own licences; we use none of them from this repository. |
| What we took | Ideas only, described below in our own words and implemented from scratch in [`layouts/touch-lcd/`](../layouts/touch-lcd/). |
| What we did not take | Code, PNG or `.bin` backgrounds, icons, Figma files, embedded font files, photographs, enclosure design and exact colour values. Nothing from the repository is copied into Moorpheus. |
| Related links | Author's videos and enclosure are linked from that repository's README; not used. |

Ideas noted from its square-display anchor page and other pages:

- Draw the alarm ring at a fixed fraction of the screen, so the map scale follows the chosen radius rather than the other way round.
- Plot the track as dots that fade with age, with the boat as a heading arrow and the anchor at the centre.
- Show maximum drift since arming beside distance, bearing and radius.
- Change the radius with large − and + buttons in fixed steps, and use separate "drop anchor here" and alarm on/off controls.
- Colour the ring by state: red when armed, a muted colour when disarmed.
- Use swipeable full-screen pages, single, dual and quad large-number layouts, a position page with selectable coordinate formats, and a sweeping heading tape with a fixed pointer.
- Signal alerts by changing icon colour as well as sounding the buzzer.

One behaviour we deliberately **do not** adopt: that anchor page sets the anchor where the map is tapped. On a wet cockpit screen an accidental tap could move the anchor reference without anyone noticing. Moorpheus moves the anchor only after a deliberate hold or slide confirmation (see §9 of the [ESP32-S3 touch edition guide](esp32_s3_touch_lcd_4_anchor_alarm_build_guide.md)).

Where these ideas appear: the **Anchor Chart (MFD style)** concept in the touch gallery, whose caption credits this project, and the max-drift readout added to **Watch Circle**.

## 2. Fonts

| Font | Used in | Licence | How it's used |
|---|---|---|---|
| [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | `layouts/` and `layouts/touch-lcd/` | [SIL Open Font License 1.1](https://openfontlicense.org) | Loaded from Google Fonts at view time; no font files are stored in this repository |

Check this table before embedding any font in firmware, because embedding redistributes the font file.

## 3. Hardware vendor material

Waveshare and Espressif datasheets, schematics and wiki pages are cited as facts in [`docs/data/`](data/README.md) and in the build guides. No vendor code is copied into the touch-edition documents or mockups. The Pico edition's display sample keeps Waveshare's own licence beside the code it adapts ([`examples/display-hello/WAVESHARE-LICENSE.txt`](../examples/display-hello/WAVESHARE-LICENSE.txt)).
