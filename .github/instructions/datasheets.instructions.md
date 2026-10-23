---
applyTo: "docs/data/**/*.md"
---

# Component reference files

These files are mainly for agents. They let agents answer hardware questions without repeating web research.

- Use one file per component, named in kebab-case with the vendor first (for example `sparkfun-qwiic-buzzer.md`). Add each new file to the table in `docs/data/README.md`.
- Follow the existing structure: a title naming the part, a quote line giving the part number, role in the project and configuration, then numbered sections (overview, key specifications table with a Source column, wiring, programming, power and so on) and a numbered source list.
- Every number needs a citation. Prefer manufacturer datasheets and product pages over forums or resellers.
- Mark values that nobody has measured as "unverified" or "measure". Don't present estimates as measurements.
- When a file conflicts with the build guide, record it under "Open discrepancies with the build guide" in `docs/data/README.md` rather than quietly changing either document.
