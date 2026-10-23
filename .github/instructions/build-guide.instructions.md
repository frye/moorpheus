---
applyTo: "docs/*.md"
---

# Build guide

- `docs/pico_2_w_anchor_alarm_build_guide_v2.md` is the source of truth for the design. Read the relevant file in `docs/data/` before changing component specs, wiring or power details.
- Keep the numbered sections and the `[Rn]` reference list intact. If you add a claim taken from a source, add or reuse an `[Rn]` entry in §13.
- Optional A (large piezo alarm) and Optional B (external power only) change the baseline. Check that edits to the baseline still make sense in both variants.
- After you fix something listed under "Open discrepancies with the build guide" in `docs/data/README.md`, remove it from that list.
- Keep the prototype and safety caveats. Don't present the design as tested on hardware.
