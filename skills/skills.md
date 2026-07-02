# CityPulse AI — Agent Design System & Behavioral Guardrails (`skills.md`)

This file is a binding instruction set for any AI coding agent (Antigravity or otherwise) generating UI code for CityPulse AI. It is not inspiration — it is the contract. Code that violates a rule marked **MUST** is incorrect output and should be revised before being shown to the user, even if it "looks fine."

CityPulse AI is a multi-agent decision intelligence platform for urban health risk. The people using this interface are district health officers, school administrators, and hospital staff making time-pressured public-safety decisions. The UI's job is to make a complex multi-agent reasoning process feel **legible, calm, and trustworthy under pressure** — not to look like a flashy consumer dashboard. Every visual decision in this document is in service of that.

---

## 1. Core Design System Philosophy & Agent Rules

### 1.1 The vibe, named precisely

**"Mission control for public health."** Think air traffic control / NOC (network operations center) dashboards, not a SaaS marketing site and not a consumer wellness app. Specifically:

- Dark-mode-first, data-dense, high information density without clutter
- Calm, controlled color use — color is a semantic signal (risk level), not decoration
- Sharp, confident, slightly technical typography — this is an instrument panel, not a blog
- Motion is purposeful and minimal — it communicates state change (a new agent decision landing, a risk level shifting), never decorative bounce or playfulness
- Glassmorphism is used sparingly and only for layering (modals, agent timeline overlays), never as a default card treatment — overuse of blur reads as "generic AI app" and undermines the command-center feel this product needs

This is explicitly **not**: neobrutalism, playful/rounded consumer UI, pastel wellness aesthetics, or the generic "AI purple/pink gradient" look that has become a tell for templated AI-generated UI. If you (the coding agent) find yourself reaching for a purple-to-pink gradient hero background, stop — that is the single most overused and least appropriate choice for this product.

### 1.2 Before writing any JSX — mandatory pre-flight checklist

The agent **MUST** complete this sequence before generating a single component:

1. **Identify which agent/data domain this UI surface belongs to.** Is this showing Ingestion Agent status, Forecast Agent output, Triage Agent clustering, a Decision Agent recommendation, the Reflection Agent's flags, the Human Approval gate, or the Notification log? Each has a corresponding visual treatment defined in Section 3 — do not invent a new pattern per screen.
2. **Identify the risk/status level being displayed, if any**, and map it to the semantic color tokens in Section 2.1 — never invent a new color for "high risk" because it "felt right" for this screen.
3. **Check token availability before writing a value.** Every color, spacing value, radius, shadow, and font size used **MUST** come from Section 2. If a needed value doesn't exist in the token set, the agent should add it to the token set first (and flag this to the user), not inline a one-off value.
4. **Confirm the component type against Section 3's component specs.** If building a button, card, input, modal, or status alert, the relevant spec in Section 3 is the source of truth, not generic Tailwind defaults or component-library defaults.
5. **Run the Section 4 anti-pattern list as a final check** before presenting code.

### 1.3 Design tokens are stack-agnostic — mapping is mandatory

The tokens defined in Section 2 are **design-agnostic values**, not a specific implementation. They must be properly mapped into the project's actual styling mechanism before use:

- If using **Tailwind CSS**, tokens map to `tailwind.config.ts` `theme.extend` entries (custom color names, spacing scale, `borderRadius`, `boxShadow`) — never hardcode the raw hex/px/rem value directly in a `className` or inline style once a token exists.
- If using **CSS variables / a design-token JSON file**, tokens map 1:1 to `--cp-color-*`, `--cp-space-*`, `--cp-radius-*`, `--cp-shadow-*` custom properties.
- If using a **component library** (shadcn/ui, Radix primitives, etc.), the library's theme configuration must be overridden to consume these tokens — do not leave default library colors/spacing in place alongside CityPulse tokens.

**Rule: a token is defined once, referenced everywhere.** If the agent finds itself typing the same hex code, pixel value, or shadow definition more than once across different files, that is a signal the token system is being bypassed, and the agent should stop and fix the token reference instead of repeating the raw value.

### 1.4 Primary tech stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, configured with the CityPulse token set as custom theme values (see Section 1.3)
- **Language:** TypeScript — all components are typed, no `any` for props
- **Icons:** Lucide React only — outline style, never filled/solid variants, never emoji as icons
- **Charts:** Recharts, themed to consume the CityPulse color tokens (see Section 3.6)
- **Animation:** Framer Motion for the limited, purposeful motion described in 1.1 — not CSS-only bounce/wobble libraries

---

## 2. Global Foundation

### 2.1 Color tokens

Color in CityPulse is **semantic first, aesthetic second**. Every color has a defined meaning. The agent **MUST NOT** use a risk/status color for purely decorative purposes, and **MUST NOT** use a decorative/neutral color to convey risk or status.

#### Base surface tokens (dark mode is the default and primary mode)

| Token | Value | Usage |
|---|---|---|
| `cp-bg-base` | `#0A0E14` | App background, deepest layer |
| `cp-bg-surface` | `#11161F` | Card / panel background |
| `cp-bg-surface-raised` | `#171D29` | Elevated surfaces — modals, popovers, the agent timeline panel |
| `cp-bg-overlay` | `rgba(10, 14, 20, 0.72)` | Modal backdrop only |
| `cp-border-subtle` | `#1F2733` | Default hairline borders between panels |
| `cp-border-default` | `#2A3340` | Card borders, input borders (resting state) |
| `cp-border-strong` | `#3D4856` | Hover / focus borders |

#### Text tokens

| Token | Value | Usage |
|---|---|---|
| `cp-text-primary` | `#E8EBF0` | Headings, primary content, key numbers |
| `cp-text-secondary` | `#9AA5B5` | Supporting text, descriptions, timestamps |
| `cp-text-muted` | `#5C6779` | Disabled states, placeholder text, tertiary metadata |
| `cp-text-inverse` | `#0A0E14` | Text on light/colored fills (e.g. text inside a solid amber badge) |

#### Brand / accent tokens

| Token | Value | Usage |
|---|---|---|
| `cp-accent-primary` | `#2DD4BF` (teal) | Primary interactive accent — primary buttons, active nav state, key data highlights, the "brain" of the system (forecast lines, AI-generated content markers) |
| `cp-accent-primary-hover` | `#5EEAD4` | Hover state for primary accent elements |
| `cp-accent-secondary` | `#6366F1` (indigo) | Secondary accent — used specifically for agent-to-agent communication visuals (the agent activity timeline, handoff arrows, orchestrator elements) so it is visually distinct from the risk-color system below |

#### Semantic risk/status tokens — the most important token group in this system

These map directly to the Decision Agent's risk classification (`low | medium | high | severe`) and **MUST** be used consistently everywhere risk appears — the dashboard map, status badges, alert banners, recommendation cards.

| Token | Value | Meaning |
|---|---|---|
| `cp-risk-low` | `#34D399` (green) | Risk level: Low. Also reused for "approved," "healthy data," "online" states |
| `cp-risk-medium` | `#FBBF24` (amber) | Risk level: Medium. Also reused for "needs review," "degraded confidence," "pending approval" |
| `cp-risk-high` | `#FB923C` (orange) | Risk level: High |
| `cp-risk-severe` | `#F87171` (red) | Risk level: Severe. Also reused for "conflict detected," "data source failed," "rejected" |
| `cp-risk-low-bg` | `rgba(52, 211, 153, 0.12)` | Background fill for low-risk badges/cards |
| `cp-risk-medium-bg` | `rgba(251, 191, 36, 0.12)` | Background fill for medium-risk badges/cards |
| `cp-risk-high-bg` | `rgba(251, 146, 60, 0.12)` | Background fill for high-risk badges/cards |
| `cp-risk-severe-bg` | `rgba(248, 113, 113, 0.12)` | Background fill for severe-risk badges/cards |

**Rule:** a risk-level color and its corresponding `-bg` variant are always paired together (solid color for text/icon/border, the `-bg` tint for the container fill). Never use a solid risk color as a large background fill — it should always be the lighter `-bg` tint with the solid color reserved for text, icons, borders, and small indicator dots.

#### Light mode (secondary, supported but not primary)

Light mode exists for accessibility/preference but is not the default design target. When generating light mode, invert the surface tokens to a neutral off-white scale (`#FFFFFF` / `#F4F6F8` / `#E9ECF1`) and keep the semantic risk tokens and accent tokens identical — risk colors do not change meaning between modes.

### 2.2 Typography scale

**Font families:**
- Display/heading: `Geist Sans` (or `Inter` as fallback) — geometric, technical, confident
- Body: `Geist Sans` / `Inter` — same family as display, differentiated by weight and size only, to keep the instrument-panel feel consistent
- Monospace (for data values, AQI numbers, timestamps, agent IDs): `Geist Mono` / `JetBrains Mono` — numeric data in this product should almost always be set in mono to reinforce the "instrument reading" feel and ensure tabular alignment

**Two weights only:** 400 (regular) and 500 (medium). Never use 600/700/800 — bold weights read as consumer-app loud, not instrument-panel precise. Emphasis is created with color, size, or mono treatment, not boldness.

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `cp-text-display` | 32px | 500 | 1.2 | Page-level titles only ("CityPulse AI — Zone Overview") |
| `cp-text-h1` | 24px | 500 | 1.3 | Section headers |
| `cp-text-h2` | 18px | 500 | 1.4 | Card titles, panel headers |
| `cp-text-h3` | 15px | 500 | 1.4 | Sub-section labels, agent names in the timeline |
| `cp-text-body` | 14px | 400 | 1.6 | Default body copy, descriptions, rationale text |
| `cp-text-small` | 13px | 400 | 1.5 | Supporting metadata, timestamps, helper text |
| `cp-text-micro` | 11px | 400 | 1.4 | Badge labels, tag text — absolute floor, never go smaller |
| `cp-text-data-lg` | 28px | 500 | 1.1 | Mono. Hero metric values (current AQI, risk score) |
| `cp-text-data-md` | 18px | 500 | 1.2 | Mono. Secondary metric values, table figures |
| `cp-text-data-sm` | 13px | 400 | 1.3 | Mono. Inline data references, agent timestamps |

### 2.3 Spacing / grid rhythm

8px base unit. All spacing **MUST** be a multiple of this scale — no arbitrary values like `13px` or `22px`.

| Token | Value |
|---|---|
| `cp-space-1` | 4px (half-step, used only for icon-to-text gaps and tight badge padding) |
| `cp-space-2` | 8px |
| `cp-space-3` | 12px |
| `cp-space-4` | 16px |
| `cp-space-6` | 24px |
| `cp-space-8` | 32px |
| `cp-space-12` | 48px |
| `cp-space-16` | 64px |

**Grid:** 12-column grid, max content width `1440px`, gutter `cp-space-6` (24px). Dashboard panels snap to the grid — a panel is never an arbitrary width, it spans a defined column count (3, 4, 6, 8, or 12 columns).

### 2.4 Border radius

| Token | Value | Usage |
|---|---|---|
| `cp-radius-sm` | 6px | Badges, tags, small buttons, input fields |
| `cp-radius-md` | 8px | Default — buttons, cards, dropdowns |
| `cp-radius-lg` | 12px | Modals, large panels, the agent timeline container |
| `cp-radius-full` | 9999px | Pills, avatar/status dots, the human-approval toggle only |

No other radius values. Never `rounded-none` (0px) on interactive elements, never radius above 12px except `cp-radius-full` for pills/dots.

### 2.5 Shadow tokens

Shadows are subtle and cool-toned (never warm/brown-tinted default shadows) to stay consistent with the dark, technical surface palette.

| Token | Value | Usage |
|---|---|---|
| `cp-shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Resting cards |
| `cp-shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` | Hover state on cards, dropdowns |
| `cp-shadow-lg` | `0 12px 32px rgba(0,0,0,0.6)` | Modals, the human-approval dialog |
| `cp-shadow-glow-risk` | `0 0 0 1px var(--risk-color), 0 0 16px -4px var(--risk-color)` | Reserved exclusively for an active/new severe-risk alert that needs to draw attention — used sparingly, never as a default card treatment |

---

## 3. Component-Specific Specs

### 3.1 Buttons

- **Primary button:** `cp-accent-primary` solid fill, `cp-text-inverse` text, `cp-radius-md`, height 40px, padding `cp-space-3` `cp-space-4`. Hover: background shifts to `cp-accent-primary-hover`, `cp-shadow-sm` appears, 150ms ease transition. Used for the single most important action on a screen (e.g. "Approve recommendation").
- **Secondary button:** transparent background, `cp-border-default` 1px border, `cp-text-primary` text. Hover: border becomes `cp-border-strong`, background tints to `cp-bg-surface-raised`.
- **Destructive button (reject/escalate):** transparent or `cp-risk-severe-bg` fill, `cp-risk-severe` text and border. Reserved for "Reject recommendation" and similar irreversible negative actions — never used for routine navigation.
- **Ghost/tertiary button:** no border, no fill, `cp-text-secondary` text, used for inline actions like "View agent reasoning."
- All buttons: `cursor: pointer`, visible focus ring (`2px solid cp-accent-primary` with 2px offset) for keyboard navigation, disabled state at 40% opacity with `cursor: not-allowed`.
- Button text is always `cp-text-body` weight 500, never uppercase (uppercase button labels read as dated/corporate, not instrument-panel).

### 3.2 Cards / panels

This is the most-used surface in the product (agent status cards, zone risk cards, recommendation cards) so consistency here matters most.

- Base: `cp-bg-surface` fill, `cp-border-subtle` 1px border, `cp-radius-md`, padding `cp-space-6`.
- Hover (only on interactive/clickable cards): border transitions to `cp-border-strong`, `cp-shadow-md` appears, 200ms ease. Static/non-interactive cards (e.g. a metric display) do not get a hover state — only add hover treatment to cards that are actually clickable.
- **Risk-level cards** (zone cards, recommendation cards) additionally get a 3px left border accent in the matching risk color (`cp-risk-low` / `medium` / `high` / `severe`), with the card's background tinted to the corresponding `-bg` token at low opacity. This left-border-accent pattern is the **one and only** way risk is indicated on a card — do not also change the entire card background to a saturated risk color, and do not use a colored top border as an alternative (left border only, for visual consistency across the whole product).
- Glassmorphism (`backdrop-blur-md` + semi-transparent background) is reserved for **exactly two surfaces**: the modal/dialog backdrop layer, and the agent activity timeline when it's shown as a floating overlay panel. It is never used for standard dashboard cards — standard cards are solid `cp-bg-surface`.

### 3.3 Inputs (text fields, selects, sliders — including the what-if simulation control)

- Base: `cp-bg-base` fill (one step darker than surrounding card, to read as "recessed"), `cp-border-default` 1px border, `cp-radius-sm`, height 40px, padding `cp-space-3`.
- Focus state: border becomes `cp-accent-primary`, plus a `0 0 0 3px rgba(45, 212, 191, 0.15)` focus ring. No focus state may be removed or suppressed for any reason.
- Placeholder text: `cp-text-muted`.
- Label: `cp-text-small`, `cp-text-secondary`, positioned above the input with `cp-space-2` gap, never inside the input as the only label (floating-label-only patterns hurt accessibility).
- **What-if slider specifically:** track uses `cp-border-default`, filled portion uses `cp-accent-secondary` (indigo, to visually tie it to "this triggers agent re-computation" rather than the teal primary-accent which means "AI-generated content"), thumb is a `cp-radius-full` circle with `cp-shadow-sm`. The current value is always shown live in `cp-text-data-md` mono next to the slider, not only as a tooltip on drag.

### 3.4 Modals (including the Human Approval dialog — the most important modal in the product)

- Backdrop: `cp-bg-overlay` with `backdrop-blur-sm`.
- Container: `cp-bg-surface-raised`, `cp-radius-lg`, `cp-shadow-lg`, max-width 560px for standard modals, 720px for the Human Approval dialog (it needs room for the Decision Agent's rationale and the Reflection Agent's flags).
- Header: `cp-text-h2`, `cp-space-6` padding, bottom border `cp-border-subtle`.
- The **Human Approval dialog** specifically **MUST** always show, in this order: (1) the risk level as a card per Section 3.2's risk-card pattern, (2) the Decision Agent's rationale text, (3) any Reflection Agent flags as small warning badges (Section 3.5 pattern, medium/amber styling), (4) the Approve and Reject buttons per Section 3.1, with Reject always rendered to the visual left of Approve to avoid making rejection feel like an afterthought.
- Entrance animation: fade + slight scale (0.96 → 1.0) over 200ms, never slide-from-edge (slide-in reads as a notification toast, not a deliberate decision checkpoint).

### 3.5 Status alerts / badges

Two distinct visual families exist and **MUST NOT** be conflated:

**Risk badges** (show a `low/medium/high/severe` classification): pill shape (`cp-radius-full`), `cp-text-micro` weight 500, `cp-space-1` `cp-space-3` padding, solid risk color text on the matching `-bg` tint, with a small `cp-radius-full` dot (6px) of the solid color preceding the text.

**System/agent status alerts** (banner-style — e.g. "Data source degraded," "Conflict detected, requesting supplementary data," "Recommendation approved"): full-width or card-width banner, `cp-radius-md`, left-border-accent pattern matching Section 3.2 (not the pill pattern), icon (Lucide, matching semantic color) + message text in `cp-text-body`. Used specifically for agent-generated system messages, distinct from the static risk-level pill.

Toast notifications (transient, e.g. "Notification dispatched to 3 zones"): slide up from bottom-right, `cp-bg-surface-raised`, `cp-shadow-lg`, auto-dismiss after 5s with a visible countdown progress bar in `cp-accent-primary`, manually dismissible via an `X` icon at all times.

### 3.6 Charts and the Agent Activity Timeline

- Charts (Recharts) consume the token set directly: gridlines `cp-border-subtle`, axis labels `cp-text-secondary` at `cp-text-small`, data lines/bars use `cp-accent-primary` for the primary series (e.g. forecasted AQI) and risk tokens for any threshold bands.
- The **Agent Activity Timeline** is a vertical list, each entry showing: agent name (`cp-text-h3`), a `cp-radius-full` icon badge colored by agent type (Ingestion/Forecast/Triage = `cp-accent-secondary` tint family; Decision/Reflection = `cp-accent-primary` tint family; Human Approval = neutral `cp-text-primary`), timestamp in `cp-text-data-sm` mono, and the action description in `cp-text-body`. New entries animate in with a 150ms fade + 8px upward slide — this is the one place a slide animation is appropriate, since it's literally showing new events arriving in sequence.

---

## 4. Anti-Patterns — Strict "What NOT To Do"

The agent **MUST NOT** do any of the following. If generated code violates one of these, it must be corrected before being presented.

1. **No raw hex codes, rgba values, or arbitrary pixel values in component code.** Every color, spacing, radius, and shadow value must reference a token from Section 2 (via Tailwind config, CSS variables, or theme object) — never `style={{ color: '#2DD4BF' }}` or `className="text-[#2DD4BF]"` inline arbitrary values.
2. **No purple/pink AI-cliché gradients.** No `from-purple-500 to-pink-500` style backgrounds anywhere in this product. This is the single most common tell of generic AI-generated UI and is explicitly banned.
3. **No inconsistent spacing.** Every margin/padding/gap value must be from the 8px-based scale in Section 2.3. No `mt-[13px]`, no mixing 8px-scale spacing with arbitrary values in the same component.
4. **No using risk colors decoratively.** `cp-risk-severe` (red) must never appear on a UI element that isn't actually communicating severe risk, a rejection, a conflict, or a failure state. Don't reach for it because "it's a strong color for emphasis."
5. **No solid, saturated risk-color backgrounds covering large areas.** Risk colors fill small accents, borders, dots, and icons, and pair with their `-bg` tint for container fills — never a full-saturation red/amber/green card background.
6. **No bold font weights above 500.** No `font-bold`, `font-extrabold`, or `font-black` anywhere.
7. **No uppercase body or button text.** This product communicates through calm precision, not shouting.
8. **No emoji as icons, ever**, including in status indicators, agent avatars, or empty states. Use Lucide icons exclusively.
9. **No glassmorphism/backdrop-blur on standard dashboard cards.** Reserved exclusively for modal backdrops and the floating agent timeline overlay, per Section 3.2.
10. **No skipping the risk-card left-border-accent pattern in favor of a different risk-indication method per screen.** One consistent pattern for showing risk on a card, everywhere.
11. **No removing or visually suppressing focus states** for keyboard accessibility, even if a designer-agent thinks it "looks cleaner" without them.
12. **No inventing a new component pattern when an existing spec in Section 3 already covers the use case.** If a new alert-like element is needed, it is either a risk badge, a system status alert, or a toast — not a fourth pattern invented ad hoc.
13. **No mixing the mono data font into prose/body text**, and no setting numeric data values (AQI numbers, confidence percentages, timestamps) in the regular sans body font instead of mono.
14. **No slide-in-from-edge animation on modals.** Modals fade + scale only (Section 3.4); slide-from-edge is reserved for toasts only.
15. **No radius values outside the defined scale** (6 / 8 / 12 / full). No `rounded-2xl`/`rounded-3xl` defaults from a component library left unconfigured.
16. **No light-mode-first design.** Dark mode (Section 2.1 base tokens) is the primary, default target. Light mode is a supported secondary mode, not the design starting point.
17. **No decorative motion.** Animation always communicates a state change (new data arriving, a value updating, a modal opening) — never bounce, wobble, or attention-seeking motion for its own sake.
18. **No placeholder Lorem Ipsum or fake-looking dummy data left in delivered code** without clearly flagging it as a placeholder — given this is a public-safety decision tool, even demo data should look like plausible real AQI/zone/complaint data, not "Lorem ipsum dolor sit amet."

---

## 5. Quick-reference summary for the agent

Before shipping any UI surface, confirm: dark surface tokens used, risk shown only via the left-border-accent + badge system in Section 3.2/3.5, mono font used for all data values, two font weights only (400/500), 8px spacing scale only, four radius values only, no purple/pink gradient anywhere, no raw hex/px values outside the token system, Human Approval dialog follows its mandatory content order, and every interactive element has a visible hover and focus state.
