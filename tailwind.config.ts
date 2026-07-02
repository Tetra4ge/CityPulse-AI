/**
 * CityPulse AI — Tailwind Configuration Reference
 *
 * NOTE: With Tailwind CSS v4, the primary theme configuration lives in
 * src/app/globals.css using the @theme directive. This file serves as a
 * human-readable reference mapping all CityPulse design tokens from
 * skills.md Section 2.
 *
 * Token System:
 * - Colors: cp-bg-*, cp-border-*, cp-text-*, cp-accent-*, cp-risk-*
 * - Spacing: cp-1 through cp-16 (4px base half-step, then 8px multiples)
 * - Radius: cp-sm (6px), cp-md (8px), cp-lg (12px), cp-full (9999px)
 * - Shadows: cp-sm, cp-md, cp-lg
 * - Typography: cp-display, cp-h1-h3, cp-body, cp-small, cp-micro, cp-data-*
 * - Fonts: Geist Sans (display/body), Geist Mono (data values)
 */

const citypulseTokens = {
  colors: {
    // Base surfaces (dark mode primary — skills.md §2.1)
    "cp-bg-base": "#0A0E14",
    "cp-bg-surface": "#11161F",
    "cp-bg-surface-raised": "#171D29",
    "cp-bg-overlay": "rgba(10, 14, 20, 0.72)",

    // Borders
    "cp-border-subtle": "#1F2733",
    "cp-border-default": "#2A3340",
    "cp-border-strong": "#3D4856",

    // Text
    "cp-text-primary": "#E8EBF0",
    "cp-text-secondary": "#9AA5B5",
    "cp-text-muted": "#5C6779",
    "cp-text-inverse": "#0A0E14",

    // Brand / accent
    "cp-accent-primary": "#2DD4BF",
    "cp-accent-primary-hover": "#5EEAD4",
    "cp-accent-secondary": "#6366F1",

    // Semantic risk/status (maps to Decision Agent risk_level)
    "cp-risk-low": "#34D399",
    "cp-risk-medium": "#FBBF24",
    "cp-risk-high": "#FB923C",
    "cp-risk-severe": "#F87171",
    "cp-risk-low-bg": "rgba(52, 211, 153, 0.12)",
    "cp-risk-medium-bg": "rgba(251, 191, 36, 0.12)",
    "cp-risk-high-bg": "rgba(251, 146, 60, 0.12)",
    "cp-risk-severe-bg": "rgba(248, 113, 113, 0.12)",
  },

  spacing: {
    "cp-1": "4px",
    "cp-2": "8px",
    "cp-3": "12px",
    "cp-4": "16px",
    "cp-6": "24px",
    "cp-8": "32px",
    "cp-12": "48px",
    "cp-16": "64px",
  },

  borderRadius: {
    "cp-sm": "6px",
    "cp-md": "8px",
    "cp-lg": "12px",
    "cp-full": "9999px",
  },

  boxShadow: {
    "cp-sm": "0 1px 2px rgba(0,0,0,0.4)",
    "cp-md": "0 4px 12px rgba(0,0,0,0.5)",
    "cp-lg": "0 12px 32px rgba(0,0,0,0.6)",
  },

  fontFamily: {
    sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
    mono: ["var(--font-geist-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
  },

  fontSize: {
    "cp-display": ["32px", { lineHeight: "1.2", fontWeight: "500" }],
    "cp-h1": ["24px", { lineHeight: "1.3", fontWeight: "500" }],
    "cp-h2": ["18px", { lineHeight: "1.4", fontWeight: "500" }],
    "cp-h3": ["15px", { lineHeight: "1.4", fontWeight: "500" }],
    "cp-body": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
    "cp-small": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
    "cp-micro": ["11px", { lineHeight: "1.4", fontWeight: "400" }],
    "cp-data-lg": ["28px", { lineHeight: "1.1", fontWeight: "500" }],
    "cp-data-md": ["18px", { lineHeight: "1.2", fontWeight: "500" }],
    "cp-data-sm": ["13px", { lineHeight: "1.3", fontWeight: "400" }],
  },
} as const;

export default citypulseTokens;
