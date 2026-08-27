# MASTER-01 design evidence

Scope is limited to the two skeleton landing surfaces. Both permanently render the demo/test-funds banner and non-withdrawable TSC disclosure. Shared Midnight Emerald tokens provide high contrast, visible keyboard focus, responsive typography at 390–1440 px, semantic headings/navigation, and reduced-motion handling.

Playwright infrastructure runs both surfaces at desktop (1440×900) and mobile (390×844), executes axe accessibility analysis, verifies keyboard navigation, and captures full-page PNG evidence beneath `test-results/playwright`. CI installs Chromium before the quality command. Evidence was not generated in the current Codex run because npm registry access is blocked; no visual PASS or ≥92 critic score is claimed until those browser tests execute and screenshots are reviewed.
