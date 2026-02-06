# Responsive Design Audit Report

**Project:** Cache BI Frontend  
**Path:** `frontend/src/`  
**Date:** Generated Audit  
**Scope:** All components except `developer/` folder  

---

## Executive Summary

The frontend **overwhelmingly uses inline `style={{}}` objects** instead of Tailwind utility classes. This is the single biggest systemic issue — inline styles **cannot use responsive breakpoints** like `md:`, `lg:`, `sm:`. Only one component (`ViewerHome.tsx`) uses Tailwind responsive classes. One component (`InteractiveDashboard.tsx`) has a proper custom responsive system with device detection. Everything else is effectively **desktop-only**.

### Severity Legend
- 🔴 **CRITICAL** — Broken or unusable on mobile/tablet
- 🟡 **WARNING** — Partially broken or degraded UX on small screens
- 🟢 **OK** — Responsive or unlikely to cause issues

---

## Systemic Issues

### 1. Inline Styles Prevent Responsive Breakpoints
**Affects:** ~90% of all components  
**Impact:** 🔴 CRITICAL  

Nearly every component uses `style={{}}` rather than Tailwind classes. CSS media queries (`@media`) and Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) are impossible with inline styles. This means layouts, font sizes, paddings, and grids cannot adapt to different screen sizes.

**Recommendation:** Migrate critical layout properties to Tailwind utility classes, or introduce a shared `<style>` block / CSS module with media queries.

### 2. No Global Responsive Breakpoints
**File:** `src/styles/globals.css`  
**Impact:** 🟡 WARNING  

`globals.css` defines theme variables and base typography but contains **zero `@media` queries**. No global responsive utilities exist.

### 3. `useIsMobile` Hook Exists But Is Unused
**File:** `src/components/ui/use-mobile.ts`  
**Impact:** 🟡 WARNING  

A `useIsMobile()` hook exists with a `768px` breakpoint using `matchMedia`, but **no component outside `ui/` imports it**. This hook should be leveraged across admin and viewer components for responsive logic.

---

## Component-by-Component Audit

### Core Files

| File | Status | Notes |
|------|--------|-------|
| `App.tsx` | 🟢 OK | Pure routing, no layout |
| `main.tsx` | 🟢 OK | Provider wrappers only |
| `index.css` | 🟢 OK | Tailwind compiled output |
| `globals.css` | 🟡 WARNING | No `@media` queries |

---

### LandingPage.tsx (580 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| No mobile hamburger menu | 🔴 CRITICAL | Lines ~40–80 (navbar) | Navbar uses `display: 'flex'` with `gap: '32px'` for nav links and `padding: '1rem 2rem'`. On mobile, links will overflow or wrap awkwardly. No hamburger/drawer toggle. |
| Background orbs have fixed sizes | 🟡 WARNING | Lines ~95–130 | Orbs are `500px`, `600px`, `400px` wide. Parent has `overflow: 'hidden'` which prevents horizontal scroll, but they may cause performance issues on mobile. |
| Footer `flexWrap: 'wrap'` | 🟢 OK | Lines ~555–575 | Footer wraps correctly. |
| Hero heading | 🟢 OK | ~Line 175 | Uses `clamp(2.5rem, 8vw, 5rem)` — good responsive sizing. |
| Feature grid | 🟢 OK | ~Line 320 | `repeat(auto-fit, minmax(280px, 1fr))` — responsive. |
| Portal grid | 🟢 OK | ~Line 390 | `repeat(auto-fit, minmax(320px, 1fr))` — responsive. |
| CTA buttons | 🟢 OK | ~Line 260 | `flexWrap: 'wrap'` applied. |

---

### Admin Components

#### AdminLayout.tsx (350 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Sidebar always 260px | 🔴 CRITICAL | ~Line 70 | `width: '260px'` hardcoded. No responsive collapse. Sidebar is always visible on desktop. |
| Hamburger button hidden | 🔴 CRITICAL | ~Line 303 | The mobile menu button has `display: 'none'` as an inline style. Since there are no media queries to override this, it can **never** become visible on mobile. |
| No sidebar overlay on mobile | 🔴 CRITICAL | ~Lines 70–100 | `sidebarOpen` state exists but the toggle button is permanently hidden. Users on mobile cannot toggle the sidebar. |
| Date display in header | 🟡 WARNING | ~Line 325 | Full date string (`weekday, month, day, year`) doesn't hide or truncate on small screens. |

#### AdminLogin.tsx (~180 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Card uses `maxWidth: '28rem'`, `width: '100%'`, `padding: '1.5rem'`. Responsive. |

#### AdminOverview.tsx (326 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Status rows | 🟡 WARNING | ~Lines 280–310 | `display: 'flex', justifyContent: 'space-between'` — long text may overlap on narrow screens. |
| KPI grid | 🟢 OK | ~Line 80 | `repeat(auto-fit, minmax(240px, 1fr))` — responsive. |
| Management grid | 🟢 OK | ~Line 175 | `repeat(auto-fit, minmax(300px, 1fr))` — responsive. |

#### UserManagement.tsx (~500 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Header buttons | 🟡 WARNING | ~Line 60 | `justifyContent: 'space-between'` — "Add User" button may overflow on narrow widths. |
| Table | 🟢 OK | — | Has `overflowX: 'auto'` wrapper. |
| Modal | 🟢 OK | — | `maxWidth: '28rem'`, `width: '100%'`. |

#### OrganizationUsers.tsx (~500 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Header uses `flexWrap: 'wrap'`. Table has `overflowX: 'auto'`. Modal properly sized. |

#### DataSourceManagement.tsx (723 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Connection options grid | 🔴 CRITICAL | ~Line 195 | `gridTemplateColumns: 'repeat(3, 1fr)'` — hardcoded 3 columns. Cards will squeeze to unusable widths on mobile. Should be `repeat(auto-fit, minmax(250px, 1fr))`. |
| Data detail grid | 🟡 WARNING | ~Line 635 | `gridTemplateColumns: '1fr 1fr'` for metadata — 2-column grid may squeeze on very narrow screens. |
| Action buttons row | 🟡 WARNING | ~Lines 660–690 | Edit/Refresh/Delete buttons in a flex row with no wrapping — may overflow on small screens. |

#### AccessControl.tsx (~500 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Tables have `overflowX: 'auto'`. Modal: `maxWidth: '32rem'`, `maxHeight: '90vh'`. |

#### AuditLogs.tsx (~300 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Filter grid | 🔴 CRITICAL | ~Line 85 | `gridTemplateColumns: 'repeat(3, 1fr)'` — hardcoded 3 columns. Filters will be crushed on mobile. |
| Stats grid | 🔴 CRITICAL | ~Line 55 | `gridTemplateColumns: 'repeat(3, 1fr)'` — same issue. |
| Search span | 🟡 WARNING | ~Line 90 | `gridColumn: 'span 2'` — depends on the 3-column layout existing. |
| Table | 🟢 OK | — | Has `overflowX: 'auto'`. |

#### APIConfigModal.tsx (1213 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Modal: `maxWidth: '42rem'`, `maxHeight: '90vh'`, flex column with overflow scroll. Long form but scrollable. |

#### ZohoAPIModal.tsx (485 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Same pattern as APIConfigModal. Properly scrollable. |

#### FileUploadModal.tsx (~300 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | `maxWidth: '32rem'`, `width: '100%'`. Drag area is responsive. |

#### EditDatasetModal.tsx (~120 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | `maxWidth: '28rem'`, `width: '100%'`. |

---

### Viewer Components

#### ViewerLayout.tsx (391 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Mobile/desktop toggle partially working | 🟡 WARNING | Lines 370–385 | Has `<style>` block with media queries for `.mobile-menu-btn`, `.desktop-nav`, `.desktop-right`. However, the `@media (max-width: 767px)` rule hides desktop nav but the `@media (max-width: 1023px)` rule shows hamburger at tablet too — there's an inconsistency where desktop-nav hides at 767px but hamburger shows at 1023px, leaving a gap (768–1023px) where both may show. |
| User dropdown fixed width | 🟡 WARNING | ~Line 240 | `width: '220px'` — positioned absolute. Could clip off-screen on small viewports. |
| Main content padding | 🟢 OK | Lines 380–390 | Non-dashboard pages get `padding: '32px 24px'`. Adequate. |

#### ViewerLogin.tsx (~180 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Same pattern as AdminLogin. `maxWidth: '28rem'`, centered. |

#### ViewerHome.tsx (388 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Header search/button row | 🟡 WARNING | ~Lines 100–120 | `justifyContent: 'space-between'` with no wrapping — search + button may collide on mobile. |
| Stats grid | 🟢 OK | ~Line 140 | `className="grid grid-cols-1 md:grid-cols-3 gap-6"` — **the only component using proper Tailwind responsive classes**. |
| Dashboard cards | 🟢 OK | ~Line 200 | `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"` — proper responsive grid. |

#### ViewerDashboard.tsx (40 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Pure routing wrapper. |

#### InteractiveDashboard.tsx (689 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | **Best responsive implementation in the codebase.** Uses `getCurrentDevice(viewportSize.width)` with `DeviceType` enum. Mobile gets single-column layout, tablets get 2 columns, desktop uses scaled canvas (1920×1080 → CSS `transform: scale()`). Card/KPI widgets get `calc(50% - gap/2)` on mobile. This is the model all other components should follow. |

---

### Shared Components

#### UnifiedLogin.tsx (~340 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Role cards grid | 🟡 WARNING | ~Line 280 | `gridTemplateColumns: 'repeat(3, 1fr)'` — hardcoded 3 columns for the role info cards (Admin/Developer/Viewer). Cards are small enough to survive, but on very narrow screens (<320px) they'll squeeze. |
| Background orbs | 🟡 WARNING | ~Lines 115–140 | `400px`, `500px`, `300px` fixed sizes. Parent has `overflow: 'hidden'`. |
| Card padding | 🟡 WARNING | ~Line 170 | `padding: '40px'` — generous on desktop but doesn't reduce on mobile. On a 320px screen, 40px padding + borders leaves very little content width. |
| Login card width | 🟢 OK | ~Line 160 | `maxWidth: '440px'`, `width: '100%'`. |

#### LoadingScreen.tsx (306 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Card minimum width | 🟡 WARNING | ~Line 85 | `minWidth: '340px'` — will cause horizontal scroll on screens narrower than 340px (rare but possible on small phones). |
| Progress bar | 🟢 OK | — | `width: '240px'` within card. |

#### ThemeToggle.tsx (~70 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Fixed-size toggle button with sm/md/lg variants. Touch-friendly sizes. |

#### WidgetRenderer.tsx (~120 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | Thin wrapper around ChartRenderer. No layout logic. Passes `isMobile` option through to charts. |

#### powerbiCharts.tsx (1133 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| — | 🟢 OK | — | All chart components use `<ResponsiveContainer width="100%" height="100%">` from Recharts. Charts resize with parent. Font sizes from `getChartTokens()` are fixed at `14px` — could benefit from smaller fonts on mobile but not broken. |

---

### Charts

#### ChartRenderer.tsx (881 lines)

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Card/KPI font size | 🟡 WARNING | — | Card values use fixed font sizes. The `isMobile` option is accepted but only affects which font scale is used — there's no dynamic sizing based on container width. |
| — | 🟢 OK | — | Overall, it renders within parent containers. Responsive behavior depends on parent sizing. |

---

### UI Components (`src/components/ui/`)

| File | Status | Notes |
|------|--------|-------|
| `use-mobile.ts` | 🟢 OK | Provides `useIsMobile()` hook at 768px breakpoint. **Should be used more widely.** |
| All 46 shadcn/ui files | 🟢 OK | Standard shadcn component library. These are designed to be responsive by default. No custom responsive issues. |

---

## Priority Fix List

### 🔴 CRITICAL — Must Fix

| # | Component | Issue | Fix |
|---|-----------|-------|-----|
| 1 | **AdminLayout.tsx** ~L303 | Hamburger button has `display: 'none'` inline — permanently hidden | Add a `<style>` block with `@media (max-width: 768px)` to show it, or use `useIsMobile()` from `ui/use-mobile.ts` |
| 2 | **AdminLayout.tsx** ~L70 | Sidebar is always 260px, no responsive collapse | On mobile: hide sidebar by default, show as overlay when toggled. Use the existing `sidebarOpen` state. |
| 3 | **AuditLogs.tsx** ~L55, ~L85 | Hardcoded `repeat(3, 1fr)` grids | Change to `repeat(auto-fit, minmax(200px, 1fr))` |
| 4 | **DataSourceManagement.tsx** ~L195 | Hardcoded `repeat(3, 1fr)` grid | Change to `repeat(auto-fit, minmax(250px, 1fr))` |
| 5 | **LandingPage.tsx** ~L40–80 | No mobile navigation (hamburger/drawer) | Add a mobile menu toggle with responsive hiding of the desktop nav links |

### 🟡 WARNING — Should Fix

| # | Component | Issue | Fix |
|---|-----------|-------|-----|
| 6 | **UnifiedLogin.tsx** ~L170 | `padding: '40px'` doesn't shrink on mobile | Reduce to `24px` on mobile via `useIsMobile()` or media query |
| 7 | **UnifiedLogin.tsx** ~L280 | Role cards `repeat(3, 1fr)` | Consider `repeat(auto-fit, minmax(100px, 1fr))` or stack on mobile |
| 8 | **ViewerLayout.tsx** ~L370–385 | Inconsistent breakpoints (767px vs 1023px) | Align both mobile-menu-btn display and desktop-nav hide to the same breakpoint (e.g., 768px) |
| 9 | **AdminLayout.tsx** ~L325 | Full date string in header | Hide or truncate on mobile |
| 10 | **LoadingScreen.tsx** ~L85 | `minWidth: '340px'` | Reduce to `minWidth: '280px'` or use `max-width: 100%` |
| 11 | **DataSourceManagement.tsx** ~L660–690 | Action buttons don't wrap | Add `flexWrap: 'wrap'` |
| 12 | **ViewerHome.tsx** ~L100–120 | Header row doesn't wrap | Add `flexWrap: 'wrap'` |
| 13 | **AdminOverview.tsx** ~L280–310 | Status row text overlap | Add `flexWrap: 'wrap'` or truncate text |

---

## Architecture Recommendations

1. **Adopt a responsive strategy** — Either:
   - (a) Migrate layout-critical inline styles to Tailwind classes (preferred), or
   - (b) Add `<style>` blocks with `@media` queries in each component (current pattern in ViewerLayout), or
   - (c) Use the existing `useIsMobile()` hook for conditional rendering

2. **Use `InteractiveDashboard.tsx` as the model** — It properly detects device type, adjusts columns, padding, and font sizes. Replicate this pattern in AdminLayout and ViewerLayout.

3. **Leverage the `useIsMobile()` hook** in `ui/use-mobile.ts` — Import it in AdminLayout, LandingPage, UnifiedLogin, AuditLogs, and DataSourceManagement to toggle between mobile and desktop layouts.

4. **Replace all hardcoded `repeat(N, 1fr)` grids** with `repeat(auto-fit, minmax(Xpx, 1fr))` for automatic responsive columns.

5. **Add a global responsive stylesheet** in `globals.css` with utility classes or media query patterns that components can reference.

---

## Files Audited

| Directory | Files Reviewed | Files Skipped |
|-----------|---------------|---------------|
| `src/` (root) | App.tsx, main.tsx, index.css | — |
| `src/styles/` | globals.css | — |
| `src/contexts/` | AuthContext.tsx | ThemeContext (no UI) |
| `src/components/` | LandingPage.tsx | — |
| `src/components/admin/` | All 13 files | — |
| `src/components/viewer/` | All 5 files | — |
| `src/components/shared/` | All 5 files | — |
| `src/components/charts/` | ChartRenderer.tsx | — |
| `src/components/ui/` | use-mobile.ts | 46 shadcn files (standard library) |
| `src/components/developer/` | — | **Excluded per request** |
