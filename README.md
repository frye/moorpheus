# Moorpheus

An anchor-drag alarm for a boat, built around a Raspberry Pi Pico 2 W, a GNSS receiver and a small colour e-paper screen.

> [!NOTE]
> **There's no working code here yet.** The repository holds design and planning work only: a build guide, notes on each part and some mockups of what the screens could look like. Nothing has been built or tested on hardware. This README will change once there's firmware you can actually run.

## The idea

You drop anchor, press a button, and the device remembers where the boat is. It keeps checking your GPS position, and if the boat drifts outside the radius you set, it sounds an alarm. The e-paper screen shows the distance and the state at a glance and uses almost no power between updates. A phone view over the boat's local Wi-Fi (PredictWind DataHub) is planned too.

The design is a prototype. It isn't a certified marine safety system, so if you try anything from it on a real boat, keep a second anchor watch running alongside.

## What the screens might look like

These come from the layout mockups in [`layouts/`](layouts/). Three samples:

| Watch Circle · e-paper · normal | Big Number · e-paper · alarm |
|---|---|
| ![Watch Circle layout on the e-paper display, boat inside the circle](layouts/screenshots/watch-circle-epaper-normal.png) | ![Big Number layout on the e-paper display, drag alarm sounding](layouts/screenshots/big-number-epaper-alarm.png) |

<img src="layouts/screenshots/status-ledger-phone-nofix.png" alt="Status Ledger layout on the phone, GPS fix lost" width="300">

*Status Ledger on the phone, after the GPS fix has dropped out.*

There are five concepts in total, each drawn for the 600 × 400 e-paper panel and a phone, in normal, alarm and no-fix states. To browse all of them, open [`layouts/index.html`](layouts/index.html) in a browser. No build step is needed, though the fonts load from the web.

## What's in the repo

- [`docs/pico_2_w_anchor_alarm_build_guide_v2.md`](docs/pico_2_w_anchor_alarm_build_guide_v2.md) is the main document. It covers the parts list, power design, pin assignments, firmware approach, display policy and the two optional variants (a louder piezo alarm, and a version without a battery).
- [`docs/data/`](docs/data/) has one reference file per component: specs, wiring, power notes and sources. It's mostly there so that AI coding agents can look things up without redoing the research each time, but it's readable enough for people too. Its [README](docs/data/README.md) also lists places where the research disagrees with the build guide and still needs sorting out.
- [`layouts/`](layouts/) is the static HTML mockup gallery, with screenshots in [`layouts/screenshots/`](layouts/screenshots/).

## Status

- [x] Build guide drafted
- [x] Component reference notes collected
- [x] Display layout concepts mocked up
- [ ] Resolve the open discrepancies in [`docs/data/README.md`](docs/data/README.md)
- [ ] Breadboard prototype
- [ ] Firmware
