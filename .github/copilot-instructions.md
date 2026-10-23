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
| `docs/data/` | One reference file per component (specs, wiring, programming, power, sources) |
| `docs/data/README.md` | Component index plus **Open discrepancies with the build guide** |
| `layouts/` | Static HTML/JS mockups of the display concepts (`index.html`, `app.js`, `styles.css`) |
| `layouts/screenshots/` | PNG captures of selected layouts, used in the README |
| `.github/skills/` | Agent skills: `moorpheus-hardware-facts` (where to look up hardware facts) and `pico-firmware` (C firmware rules for this stack) |

## Use the reference material before researching

`docs/data/` exists so agents don't have to repeat large research jobs. Before you search the web for a part's specs, pinout, I2C address, current draw or wiring, read the matching file in `docs/data/`. Go online only when the answer isn't there or needs checking against a primary source. If you do find new facts, add them to the right `docs/data/` file with a citation, so the next agent doesn't need to look again.

## Keep the documents consistent

- The build guide and the `docs/data/` files must agree. If you change a pin, part, rail, value or policy in one, check the other.
- When you find a conflict and can't resolve it, add it to the open discrepancies list in `docs/data/README.md`. Remove items from that list only once the build guide has been fixed.
- Section and reference numbers in the build guide (for example §4, [R8]) are linked from other files. Update the links if you renumber anything.

## README upkeep

- The README must say clearly that the repository is design and planning only, for as long as that's true.
- When usable code arrives (firmware that builds, a tool that runs), update the README in the same change: what works, how to build or run it, and the new status.
- Whenever you touch the README, reread it so it sounds like a person wrote it. That means plain, specific sentences and no marketing tone, filler, emoji headings or stacked superlatives. Keep it short and point to the docs for detail.

## Commits

Keep commits focused and describe the why. Don't commit `.DS_Store` or other OS or editor files.
