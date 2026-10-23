# Copilot instructions for Moorpheus

Moorpheus is a boat anchor-drag alarm built on a Raspberry Pi Pico 2 W, a SparkFun NEO-F10N GNSS receiver and a Waveshare 4" Spectra 6 e-paper HAT+ (E).

## Project stage

The project is in design and planning. There is no firmware or other working code yet. Nothing has been built or tested on hardware.

- Don't describe anything as built, tested, validated or working unless the repository contains evidence of it.
- Code snippets in the docs have only been syntax-checked against stub headers. Treat them as untested.
- This is a prototype, not a certified marine safety system. Keep the existing safety caveats when you edit docs.

## Repository map

| Path | Purpose |
|---|---|
| `README.md` | Human-facing overview and current status |
| `docs/pico_2_w_anchor_alarm_build_guide_v2.md` | Main design document: parts, power, GPIO map, firmware approach, display policy, optional variants A and B |
| `docs/best-language-framework-update-mechanism.md` | Firmware language, framework and update-mechanism decision |
| `docs/data/` | One reference file per component (specs, wiring, programming, power, sources) |
| `docs/data/README.md` | Component index plus **Open discrepancies with the build guide** |
| `layouts/` | Static HTML/JS mockups of the display concepts (`index.html`, `app.js`, `styles.css`) |
| `layouts/screenshots/` | PNG captures of selected layouts, used in the README |

## Working rules

- For any hardware value, use the `moorpheus-hardware-facts` skill before searching online.
- The build guide and the `docs/data/` files must agree. If you change a pin, part, rail, value or policy in one, check the other.
- When usable code arrives (firmware that builds, a tool that runs), update the README in the same change: what works, how to build or run it, and the new status.

## Commits

Keep commits focused and describe the why. Don't commit `.DS_Store` or other OS or editor files.
