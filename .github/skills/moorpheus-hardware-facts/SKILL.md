---
name: moorpheus-hardware-facts
description: Look up Moorpheus hardware facts (parts, pins, rails, I2C addresses, timings, current draw, wiring) from the repository docs before researching online. Use for any firmware, docs or layout task that depends on a hardware value.
---

# Moorpheus hardware facts

Don't copy values from memory or from this skill. Read them from the docs, in this order:

1. **Open discrepancies with the build guide** in `docs/data/README.md`. Treat any listed conflict or unresolved question as open until the relevant evidence is reviewed.
2. **The component file** in `docs/data/`. The table in `docs/data/README.md` maps each part to its file.
3. **The build guide** for the edition you're working on:
   - Pico 2 W edition, `docs/pico_2_w_anchor_alarm_build_guide_v2.md`: §5 power, §6 GPIO allocation, §8 firmware and power modes, §9 display policy, §12 acceptance, and Optional A and B for the variants.
   - ESP32-S3 touch edition (planning only), `docs/esp32_s3_touch_lcd_4_anchor_alarm_build_guide.md`: boat power, terminal and interface allocation, GPS connection, touch and alarm policy. Board facts are in `docs/data/waveshare-esp32-s3-touch-lcd-4.md` and SoC facts in `docs/data/espressif-esp32-s3.md`.
4. **The firmware stack and update design**, `docs/best-language-framework-update-mechanism.md` (Pico edition). The ESP32 edition's firmware approach is a proposal in §8 of its guide.

Values differ between editions (pins, rails, buses, power entry). Don't carry a value from one edition to the other without checking.

Search online only when the docs don't answer the question, and prefer manufacturer sources. Add what you find to the matching `docs/data/` file with a citation, and mark values nobody has measured as "unverified" or "measure". If a new fact conflicts with the build guide, add it to the open discrepancies list instead of quietly changing either document.
