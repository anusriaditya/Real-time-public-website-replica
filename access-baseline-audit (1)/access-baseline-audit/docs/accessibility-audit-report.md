# Accessibility Baseline Audit

**Target:** Metropolitan Transport Corporation (Chennai) Ltd — [mtcbus.tn.gov.in](https://mtcbus.tn.gov.in)
**Type:** Government transit portal, public-facing, Tamil Nadu state undertaking
**Date audited:** 2026-09-13
**Auditor:** Anu — Team Pentagon
**Scope:** Homepage (`/`), first-load content only

## Methodology (read this before the findings)

Two different audit methods were used on purpose, because they catch
different things:

- **Live content retrieval** of the homepage — used to find *structural and
  semantic* defects: heading logic, redundant/duplicate labeling, language
  handling, document accessibility. This is the harder, higher-value manual
  work a senior audit is actually for, because a linter can't tell you that
  sixteen list items announce the same name.
- **Lighthouse + axe DevTools + a physical keyboard pass**, run by you in
  Chrome, to catch what static analysis is bad at: exact contrast ratios,
  computed focus-order, whether a specific widget traps focus at runtime.
  I did not fabricate scores or screenshots for these — that's dishonest on
  a submission where "screenshots" are explicitly graded evidence, and it
  also means you never actually learn to run the tool. **Section "Your
  turn" below tells you exactly what to run and what to screenshot.**

Five issues are documented below. Each has a remediation priority based on
(a) how many users are blocked vs. inconvenienced, and (b) whether it's a
WCAG 2.1 Level A conformance failure (blocking) or AA/best-practice (quality).

---

## Issue #1 — Tamil-script content has no `lang` attribute scoping

**WCAG:** 3.1.2 Language of Parts (Level AA)
**Priority:** Medium

**Evidence:** The homepage opens with a Thirukural couplet rendered directly
in Tamil script, inline with English UI text and English news items, with no
apparent language boundary in the markup around the switch.

**Expected behavior:** The page's base `lang` is (presumably) `lang="en"`.
Any run of text in a different language should be wrapped in an element
carrying its own `lang` attribute — `<span lang="ta">...</span>` — so a
screen reader switches its pronunciation/voice engine at that boundary.

**Actual behavior:** No language switching is exposed in the rendered
content structure. A screen reader running an English voice will attempt to
sound out Tamil script phonetically as English, producing output that is not
just wrong but actively unintelligible — for the exact demographic (Tamil
Nadu residents, many Tamil-first screen reader users) this portal serves.

**Why Medium and not High:** it degrades comprehension rather than blocking
access outright — sighted-and-hearing users and English-first AT users are
unaffected. It's still a real, avoidable Level AA failure with a one-line fix.

**Remediation:**
```html
<!-- Before -->
<p>வாய்மை எனப்படுவது யாதெனின் யாதொன்றும் தீமை இலாத சொலல் — Thirukural</p>

<!-- After -->
<p><span lang="ta">வாய்மை எனப்படுவது யாதெனின் யாதொன்றும் தீமை இலாத சொலல்</span> — Thirukural</p>
```
In a componentized rebuild, this becomes a `<Trans lang="ta">` wrapper or
equivalent so translators can't accidentally strip it later.

---

## Issue #2 — Every item in the "Latest News" feed shares one non-descriptive accessible name

**WCAG:** 1.1.1 Non-text Content, 2.4.6 Headings and Labels (Level A/AA)
**Priority:** High

**Evidence:** The homepage's news feed contains 16+ distinct announcements
(driving school notices, fare changes, route diversions, awards). In the
retrieved content, every single item is prefixed with the identical token
**"direction"** — consistent with a repeating bullet icon or icon-font glyph
that carries the same `alt` text or `aria-label` on every occurrence, with no
per-item differentiation.

**Expected behavior:** Decorative repeating icons should be `alt=""` /
`aria-hidden="true"` (silent, since the adjacent text already carries the
meaning) — or, if the icon is meant to be announced, it needs a name unique
enough to be useful, which a static "direction" bullet cannot provide across
16 different topics.

**Actual behavior:** A screen reader user tabbing or arrow-reading through
this list hears "direction, direction, direction, direction..." 16 times in
a row before reaching any distinguishing content — on the single largest
content section of the homepage, every day it's visited.

**Remediation:**
```html
<!-- Before: every <li> repeats an announced icon -->
<li><span class="icon-direction" aria-label="direction"></span> MTC Driving School, Chrompet - ...</li>

<!-- After: the icon is silenced, the link/text itself remains the one accessible name -->
<li>
  <span class="icon-direction" aria-hidden="true"></span>
  <a href="/notices/driving-school-chrompet-hmv">
    MTC Driving School, Chrompet — Application &amp; Syllabus for Heavy Motor Vehicle
  </a>
</li>
```
This repo's fix for the equivalent pattern is in
[`ServiceAlertList.tsx`](../client/src/components/ServiceAlertList.tsx):
every alert card's heading is built from `routeCode + routeName`, so no two
items can ever collide on their announced name — see the E2E test
`every route alert has a unique accessible name` in
[`homepage-accessibility.spec.ts`](../test/e2e/specs/homepage-accessibility.spec.ts),
which fails the build if that regresses.

---

## Issue #3 — No skip-navigation mechanism before repeated content blocks

**WCAG:** 2.4.1 Bypass Blocks (Level A)
**Priority:** Medium

**Evidence:** The homepage's content flow runs directly from the masthead
into the 16+ item news feed, then into the four primary navigation tiles,
with no distinct "skip to main content" text detected at the start of the
retrieved content stream — a mechanism that, when present, is almost always
the very first thing in reading/DOM order (visually hidden until focused).
Combined with this being one of the most commonly missing patterns on
legacy government portals in this class, this is flagged as high-confidence
but should be confirmed with a live keyboard test (see "Your turn" below —
first Tab press, watch what gets focus).

**Expected behavior:** The first Tab press on page load should reveal a
"Skip to main content" (or equivalent) link, letting a keyboard user jump
past the repeated news/nav block directly to unique page content.

**Actual behavior:** Without it, a keyboard-only user must Tab through
every news item and every nav link on every single page load, every visit,
to reach anything below the fold.

**Remediation:** implemented in this repo as the template pattern —
[`SkipLink.tsx`](../client/src/components/SkipLink.tsx), first element
rendered in [`App.tsx`](../client/src/App.tsx), CSS in
[`global.css`](../client/src/styles/global.css) (`.skip-link`):
```css
.skip-link { position: absolute; top: -3rem; left: 0; }
.skip-link:focus { top: 0; } /* only becomes visible on keyboard focus */
```

---

## Issue #4 — Safety/mobility-critical documents are published as PDF-only, with no accessible HTML alternative

**WCAG:** 1.1.1 Non-text Content (Level A) — and PDF/UA if the PDF itself is checked
**Priority:** High

**Evidence:** The news feed explicitly references "Application & Syllabus
for Heavy Motor Vehicle" and "...for Light Motor Vehicle" as documents
"available in our website" — i.e., driving-school enrollment material,
which gates a resident's ability to apply for a livelihood-relevant
certification. This is the single most common Level A failure on Indian
government portals: these documents are near-universally scanned images
placed inside a PDF wrapper, with no OCR text layer, no tags, and no
heading structure.

**Expected vs. actual:** Expected — a sighted user, a screen reader user, and
a switch-access user can all extract the same enrollment requirements.
Actual (pending confirmation, see below) — if the PDF is a scanned image, a
screen reader announces nothing at all; the content is 100% unreachable to
that user, full stop, not degraded — unreachable.

**How to confirm (do this before you present):** open the linked PDF, try
Ctrl+F for a word you can visually see on the page. If search finds nothing,
it's an image with no text layer — confirmed failure. Run it through Adobe
Acrobat's built-in accessibility checker (`Tools → Accessibility → Full
Check`) for a formal report.

**Remediation:**
1. Short-term: publish the same content as a real HTML page alongside the
   PDF — same information, actually parseable by AT. Do not describe the
   PDF as "the accessible version"; it's a stopgap, not a fix.
2. If the PDF must remain canonical (e.g., it's a legal form): re-export it
   from source (Word/InDesign) with tags enabled, run OCR with a text layer
   if it started as a scan, and add a document title + heading structure
   via Acrobat's Tags panel. Verify with the checker above until it reports
   zero errors.

---

## Issue #5 — No discernible heading hierarchy / no single primary `<h1>`

**WCAG:** 1.3.1 Info and Relationships (Level A), 2.4.6 Headings and Labels (Level AA)
**Priority:** High

**Evidence:** The retrieved homepage content shows "MTC", a quote block,
"Latest News", a flat run of 16+ items, then four tile sections — none of
which read as a nested heading structure in the content flow. This is
consistent with sections being styled `<div>`s rather than `<h1>`–`<h6>`
elements, which is the default outcome when a page is built visually
(font-size and font-weight in CSS) rather than semantically.

**Expected behavior:** Exactly one `<h1>` identifying the page's primary
purpose, with every subsequent section heading nested one level below its
parent (`h1 → h2 → h3`, never skipping). Screen reader users rely on
jumping between headings (a single keystroke, e.g. `H` in NVDA/JAWS) as
their primary way to scan a content-heavy page — arguably the single most
used AT navigation pattern that exists.

**Actual behavior:** Without real heading elements, that navigation
shortcut returns nothing, forcing a full linear read of the entire page to
find "Latest News" or the route-info tiles.

**Remediation:**
```html
<!-- Before: visual-only structure -->
<div class="section-title">Latest News</div>
<div class="news-item">...</div>

<!-- After -->
<h1>Metropolitan Transport Corporation (Chennai)</h1>
...
<h2>Latest News</h2>
<ul>
  <li><a href="...">...</a></li>
</ul>
```
This repo enforces the fix directly: [`App.tsx`](../client/src/App.tsx) has
exactly one `<h1>`, [`ServiceAlertList.tsx`](../client/src/components/ServiceAlertList.tsx)
nests at `<h3>` under the `<h2>` it lives inside, and
`homepage-accessibility.spec.ts` has a standing test —
`exactly one h1, and heading levels never skip` — that fails CI on
regression instead of relying on someone remembering to check.

---

## Your turn: closing the loop with graded evidence

This report is the manual layer. The assignment's expected proof
(screenshots) needs the automated layer too — takes about 10 minutes:

1. Open the target site in Chrome → DevTools (`F12`) → **Lighthouse** tab →
   check "Accessibility" → **Analyze page load**. Screenshot the score and
   the flagged items panel.
2. Install the **axe DevTools** extension → run it on the same page →
   screenshot the issues list (it will likely surface contrast ratios and
   missing-`alt` instances that this manual report deliberately didn't
   duplicate, since axe already finds those for free).
3. Unplug your mouse. Starting from the address bar, press **Tab**
   repeatedly. Screenshot: (a) whether a skip link appears on the first
   press, (b) whether focus is ever visually invisible, (c) whether any
   widget (menu, carousel) swallows focus and won't let Tab move past it.

Put all three screenshots in `docs/evidence/` in your submission repo.
