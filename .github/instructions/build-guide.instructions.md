---
applyTo: "docs/*.md"
---

# Build guide

- `docs/pico_2_w_anchor_alarm_build_guide_v2.md` is the source of truth for the design. Read the relevant file in `docs/data/` before changing component specs, wiring or power details.
- Keep the numbered sections and the `[Rn]` reference list intact. If you add a claim taken from a source, add or reuse an `[Rn]` entry in §13. Other files link to section and reference numbers (for example §4, [R8]), so update those links if you renumber anything.
- Optional A (large piezo alarm) and Optional B (external power only) change the baseline. Check that edits to the baseline still make sense in both variants.
- After you resolve a conflict listed under "Open discrepancies with the build guide" in `docs/data/README.md`, remove it from that list. Keep measurements and installation-specific choices open until supported by evidence.
- Keep the prototype and safety caveats. Don't present the design as tested on hardware.
