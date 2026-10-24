# Copilot instructions for Moorpheus

Moorpheus is a boat anchor-drag alarm built on a Raspberry Pi Pico 2 W, a SparkFun NEO-F10N GNSS receiver and a Waveshare 4" Spectra 6 e-paper HAT+ (E).

A second, parallel hardware edition is being planned around the Waveshare ESP32-S3-Touch-LCD-4 (480 × 480 IPS touch LCD with an ESP32-S3). It is documentation and UI sketches only: no ESP32 firmware exists. It does not replace the Pico 2 W edition; keep the two editions' documents separate and say which edition a statement applies to.

## Project stage

The anchor alarm is in design and planning. `examples/display-hello/` contains
the Step 1 display-only Pico SDK sample, which builds for Pico 2 W and has host
checks. Nothing has been assembled or tested on hardware. Later phases build on
this baseline only after the on-device acceptance gate in `docs/display-bring-up.md`.

- Don't describe anything as built, tested, validated or working unless the repository contains evidence of it.
- Code snippets in the component docs have only been syntax-checked against stub headers. Treat them as untested; the separately built Step 1 sample is not hardware-qualified either.
- This is a prototype, not a certified marine safety system. Keep the existing safety caveats when you edit docs.

## Repository map

| Path | Purpose |
|---|---|
| `README.md` | Human-facing overview and current status |
| `docs/display-bring-up.md` | Step 1: USB-only wiring, toolchain, flashing and on-device acceptance |
| `examples/display-hello/` | Standalone display-only C/Pico SDK sample and host checks |
| `docs/pico_2_w_anchor_alarm_build_guide_v2.md` | Main design document: parts, power, GPIO map, firmware approach, display policy, optional variants A and B |
| `docs/esp32_s3_touch_lcd_4_anchor_alarm_build_guide.md` | ESP32-S3 touch edition design (planning only): GPS interface, boat power, terminal allocation, touch and alarm policy |
| `docs/best-language-framework-update-mechanism.md` | Firmware language, framework and update-mechanism decision |
| `docs/data/` | One reference file per component (specs, wiring, programming, power, sources) |
| `docs/data/README.md` | Component index plus **Open discrepancies with the build guide** |
| `layouts/` | Static HTML/JS mockups of the display concepts (`index.html`, `app.js`, `styles.css`) |
| `layouts/touch-lcd/` | Static HTML/JS mockups of five touch concepts for the 480 × 480 ESP32-S3 touch LCD |
| `layouts/screenshots/` | PNG captures of selected layouts, used in the README |

## Working rules

- For any hardware value, use the `moorpheus-hardware-facts` skill before searching online.
- Each build guide and the `docs/data/` files must agree. If you change a pin, part, rail, value or policy in one, check the other. Parts shared by both editions (for example the NEO-F10N, antenna and backup battery) may appear in both guides; check both.
- When usable code arrives (firmware that builds, a tool that runs), update the README in the same change: what works, how to build or run it, and the new status.

## Commits

Keep commits focused and describe the why. Don't commit `.DS_Store` or other OS or editor files.
