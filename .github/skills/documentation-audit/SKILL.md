---
name: documentation-audit
description: Audit Moorpheus documentation against current source code and report evidence-backed gaps in one upstream GitHub issue. Use for documentation checks, drift audits or Copilot app automation runs.
---

# Documentation audit

Audit and report only; do not modify repository files, flash hardware or install tools.

1. Fetch the current default branch of upstream `frye/moorpheus` and record its commit SHA. Audit that revision's files, not a stale automation checkout or unmerged changes; use `git show` if needed without switching or resetting the worktree. Stop and report access failures rather than auditing stale content.
2. Compare `README.md`, `docs/`, `.github/copilot-instructions.md` and `.github/skills/` with first-party source, build configuration and tests that actually exist at that revision, including `layouts/` and `examples/display-hello/` if present. Step 1 has display-only firmware, a Pico SDK build and host checks; do not infer that alarm services exist or that hardware acceptance has passed. Audit available artifacts and say which categories are absent. Read the hardware-facts skill and `docs/data/README.md` for known discrepancies. Check documented status, setup/build commands, dependencies, interfaces, defaults, pins, power modes, alarm/control behavior, display policy, persistence and updates wherever code implements them.
3. Find both incorrect documentation and implemented behavior missing from documentation. Report every distinct, evidence-backed gap; group duplicates. Design plans and documentation snippets are not implementation: missing planned firmware alone is not a documentation gap. Code is evidence of behavior, not proof of hardware correctness; flag unresolved design/code conflicts rather than assuming the docs must change.
4. For each finding give the documentation location (or where missing documentation belongs), source evidence, mismatch, impact and suggested correction. Link existing files and line ranges at the audited commit using `https://github.com/frye/moorpheus/blob/<sha>/<path>#L<n>`. Separate confirmed gaps from questions needing hardware or human evidence. State coverage and any uninspected areas; do not claim completeness when blocked.

## Upstream issue

- Search open issues in `frye/moorpheus` for the exact title **Documentation gaps against source** and the body marker `<!-- moorpheus-documentation-audit -->`. Use `gh issue list --repo frye/moorpheus --state open --search "in:title Documentation gaps against source"` and inspect each candidate with `gh issue view <number> --repo frye/moorpheus --json body,url`. Reuse only one unambiguous match. If issue access fails, multiple matches exist, or a same-title issue lacks valid markers, stop and report the conflict; do not create a duplicate.
- If findings exist and no matching issue exists, create one with `gh issue create --repo frye/moorpheus --title "Documentation gaps against source" --body-file <tempfile>`, following any applicable upstream issue template. If `gh` is unavailable or authorization fails, stop and report the error; do not claim the issue was created. Put the entire audit report between both markers:
  `<!-- moorpheus-documentation-audit -->` and `<!-- /moorpheus-documentation-audit -->`.
  Include the audited SHA, coverage, all findings and any unresolved questions. Do not file an issue for questions alone.
- On later runs, replace only the report between both markers, preserving all text outside them. Issue comments are separate; do not edit or delete them. Use `gh issue edit <number> --repo frye/moorpheus --body-file <tempfile>` with the matched issue number; stop on read/write errors. If either marker is missing or duplicated, report the conflict and do not overwrite.
- If there are no gap findings, **never create an issue**. If one unambiguous matching issue already exists, update only its marked report to say no gaps were found at the audited SHA. Do not automatically close issues. End with the issue link, or a concise no-gaps result, and any limitations.
