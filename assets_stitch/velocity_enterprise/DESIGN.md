---
name: Velocity Enterprise
colors:
  surface: '#101418'
  surface-dim: '#101418'
  surface-bright: '#353a3e'
  surface-container-lowest: '#0a0f13'
  surface-container-low: '#181c20'
  surface-container: '#1c2024'
  surface-container-high: '#262a2f'
  surface-container-highest: '#31353a'
  on-surface: '#dfe3e8'
  on-surface-variant: '#bfc7d2'
  inverse-surface: '#dfe3e8'
  inverse-on-surface: '#2d3135'
  outline: '#89929b'
  outline-variant: '#3f4850'
  surface-tint: '#93ccff'
  primary: '#93ccff'
  on-primary: '#003351'
  primary-container: '#3198dc'
  on-primary-container: '#002c47'
  inverse-primary: '#006398'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#ffb875'
  on-tertiary: '#4b2800'
  tertiary-container: '#d07d1c'
  on-tertiary-container: '#412200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb875'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#101418'
  on-background: '#dfe3e8'
  surface-variant: '#31353a'
typography:
  display:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-base:
    fontFamily: Inter
    fontSize: 13.3px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  mono:
    fontFamily: ui-monospace
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base-unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  shell-sidebar: 240px
  shell-header: 56px
---

## Brand & Style

This design system is engineered for high-performance enterprise environments where information density and data integrity are paramount. The brand personality is **Professional, Reliable, and Systematic**, favoring utility and speed over decorative flair. 

The aesthetic follows a **Modern Corporate** style with influences from **Minimalism** and **Atomic Design**. It prioritizes a clear visual hierarchy to support complex workflows in ERP and CRM contexts. Integration with conversational AI is treated as a core utility, represented through subtle motion and dedicated persistent zones rather than disruptive overlays. The system is optimized for expert users who require maximum data visibility and rapid keyboard-driven navigation.

## Colors

The palette is anchored by a deep **Slate-900 (#0f172a)** background, providing a high-contrast environment that reduces eye strain during long working sessions. The **Sky-600 (#0284c7)** primary brand color is used sparingly for action intent and focus states to maintain a calm, professional atmosphere.

- **Primary:** Actionable elements, primary buttons, and active navigation states.
- **Surface Muted:** Used for light-mode text contrast or subtle background layering in specialized UI modules.
- **Functional Colors:** Success, Warning, and Destructive colors follow industry standards to ensure immediate cognitive recognition of system statuses and data alerts.
- **Neutrals:** A scale of Slate grays is used to define borders, secondary text, and iconography.

## Typography

This design system utilizes **Inter** as its primary typeface, chosen for its exceptional legibility at small sizes and high x-height. The base size is strictly set to **10pt (13.3px)** to facilitate high information density required for complex data tables and multi-column forms.

For Windows environments, the system falls back gracefully to **Segoe UI**. 
- **Headlines:** Use semi-bold weights with tighter letter spacing for a grounded, authoritative feel.
- **Labels:** Small, all-caps or medium-weight labels are used for form headers and metadata to distinguish them from user-generated content.
- **Monospace:** Reserved for IDs, SKU numbers, and financial figures where character alignment is critical.

## Layout & Spacing

The layout employs a **Fixed Shell** model, occupying **100vh** height with `overflow: hidden` on the body. This creates an "App-like" experience where the sidebar and header remain locked, and individual panels or data tables handle their own scrolling.

- **Sidebar:** Fixed at 240px. Collapsible to 64px (icon-only).
- **Grid:** Content follows a 12-column internal grid for dashboard layouts, but defaults to a flexible "Slot and Pane" system for CRM record views.
- **Density:** We utilize a 4px baseline grid. Gutters are restricted to 16px to maximize horizontal space for data columns.
- **AI Sidebar:** A secondary right-hand drawer (320px) is reserved for conversational AI interactions and contextual assistance.

## Elevation & Depth

To maintain a flat, performant aesthetic, this design system avoids heavy shadows. Depth is communicated through **Tonal Layers** and **Crisp Outlines**:

- **Level 0 (Background):** Slate-900 for the core application shell.
- **Level 1 (Card/Section):** Slate-800 or Slate-900 with a 1px border (#1e293b).
- **Level 2 (Popovers/Modals):** Slate-800 with a subtle ambient shadow (0 4px 12px rgba(0,0,0,0.5)) and a light border to separate from the background.
- **Borders:** Every container is defined by a 1px solid border. High contrast between the border color and surface color is used to maintain structural clarity.

## Shapes

The shape language is disciplined and geometric. A **4px border radius (rounded-md)** is the system default for all standard components (buttons, inputs, cards).

- **Strictness:** Sharp corners are avoided to prevent a "raw" brutalist look, but large radii are excluded to preserve the professional, space-efficient intent.
- **Focus Rings:** Elements use a 2px offset ring in **Sky-500** to ensure high visibility during keyboard navigation.
- **Interactive Elements:** Buttons and inputs share the same height and radius tokens to ensure perfect horizontal alignment in toolbars.

## Components

All components are built to be **Shadcn/ui** and **Tailwind CSS** compliant.

- **Buttons:** 
  - *Primary:* Solid Sky-600, white text.
  - *Secondary:* Ghost style with Slate-700 borders. 
  - *Size:* "Compact" (32px height) is the default for toolbars.
- **Input Fields:** Background is Slate-950, 1px border. Focus state triggers the Sky-500 ring. Placeholder text uses Slate-500.
- **Data Tables:** The core of the system. Borders between rows are #1e293b. Header rows use a slightly lighter background (Slate-800/50) and semi-bold text.
- **Chips/Badges:** Small (10px font), 4px radius, low-saturation backgrounds with high-saturation text for status (e.g., "Invoiced", "Pending").
- **AI Interface:** Uses a distinct subtle gradient border or a "shimmer" effect on the container to denote an AI-active zone without breaking the professional layout.
- **Lists:** High-density list items (36px height) with subtle hover states (#1e293b).