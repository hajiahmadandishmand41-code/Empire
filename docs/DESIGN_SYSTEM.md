# Empire Design System

This document defines the shared visual and interaction foundation for the Empire marketplace. Product features should consume semantic design tokens and reusable UI primitives rather than inventing feature-local colors, spacing, radii, shadows, or focus treatments.

## Architecture

```text
Foundation
  ├─ src/styles/globals.css      semantic tokens + global behavior
  ├─ tailwind.config.ts          utility aliases and responsive primitives
  └─ src/lib/fonts.ts             self-hosted Inter + Vazirmatn

Primitives
  └─ src/components/ui/          Radix/shadcn-compatible reusable UI

Composites
  └─ src/components/layout,
     src/components/feedback,
     src/components/seller, etc.

Features
  └─ src/features/                business-specific UI and behavior
```

Design-system primitives must not depend on database, authentication, cart, seller, or other business-domain state.

## Ownership and governance

`src/components/ui` is the ownership boundary for reusable interaction primitives. A feature component may compose these primitives, but it must not silently introduce a parallel token, radius, shadow, focus, or interaction system.

Add a new shared primitive only when at least two independent product areas need the same interaction model, or when the interaction is foundational (for example Dialog, Select, Tabs, or Tooltip). Keep one-off business UI feature-local.

Add a new token only when an existing semantic token cannot correctly express the intended meaning. New color values should be rare; prefer a semantic role over a raw palette name. Breaking primitive API changes require consumer migration, tests, documentation, and a deliberate review before merge.

Every new or changed primitive is expected to cover the states that apply: default, hover, focus-visible, active, selected, open/closed, disabled, loading, invalid/error, success, and read-only. Not every component needs every state, but the applicable states must be explicit.

## Semantic tokens

Use semantic tokens for new UI:

- `--color-brand-primary` / `--color-brand-primary-hover`
- `--color-brand-secondary`
- `--color-background`
- `--color-surface` / `--color-surface-muted`
- `--color-foreground` / `--color-foreground-muted`
- `--color-border` / `--color-border-strong`
- `--color-focus`
- `--color-success`, `--color-warning`, `--color-danger`, `--color-info`

The legacy shadcn variables (`--primary`, `--background`, `--card`, etc.) remain as compatibility aliases. New component code should use semantic Tailwind aliases such as `bg-background`, `bg-card`, `text-foreground`, `border-border`, and `ring-ring`.

## Primitive inventory

The shared inventory includes the following groups and should be treated as the review surface for Section 01:

- Foundation: Button, IconButton, Label, Separator
- Forms: Input, Textarea, Select, Checkbox, RadioGroup, Switch, Form
- Overlays: Dialog, Drawer, Sheet, DropdownMenu, Popover, Tooltip, ContextMenu, HoverCard
- Navigation: Tabs, Accordion, Breadcrumb, Pagination, NavigationMenu, Menubar
- Feedback: Alert, AlertDialog, Toast/Sonner, Progress, Skeleton, Spinner/Loading, Empty/Error states
- Data display: Card, Badge, Avatar, Table
- Composite utilities: Command, Calendar, Carousel, Collapsible, Toggle, ToggleGroup, ScrollArea, Slider and other Radix-backed shared primitives present in the repository

A primitive is not considered production-ready solely because the file compiles. Its API, states, accessibility semantics, RTL/LTR behavior, responsive behavior, and real consumers must also be reviewed.

## Typography

Inter is the preferred Latin/UI face and Vazirmatn is the preferred Persian/Arabic-script face. Typography should generally use the existing Tailwind scale rather than introducing one-off font sizes.

Recommended hierarchy:

| Role | Typical utility |
| --- | --- |
| Display | `text-4xl` to `text-6xl`, selectively |
| Page title | `text-2xl` to `text-3xl` |
| Section heading | `text-xl` to `text-2xl` |
| Body | `text-sm` to `text-base` |
| Supporting text | `text-sm text-muted-foreground` |
| Caption / metadata | `text-xs text-muted-foreground` |
| Actions / labels | `text-sm font-medium` |

Avoid all-caps UI copy for multilingual surfaces unless it is part of a brand treatment.

## Spacing, shape, and elevation

Prefer the existing Tailwind spacing scale. Avoid arbitrary pixel values when a standard token exists. The core radius hierarchy is intentionally restrained: `rounded-md` for controls, `rounded-lg` for containers, and `rounded-full` for pills/avatars.

Shadows should describe elevation instead of decoration. Prefer `shadow-sm` or `shadow-lg` only when a component is actually elevated. Avoid persistent glow shadows, large colored halos, and stacked shadow effects.

## Component conventions

- `Button` is the default action primitive.
- `IconButton` is for icon-only actions and must provide an accessible `aria-label` or equivalent accessible naming mechanism.
- `Input`, `Select`, `Checkbox`, `RadioGroup`, and `Switch` provide native/Radix semantics; do not replace them with clickable `div` elements.
- Interactive primitives must expose visible `:focus-visible` states.
- Disabled state is represented by both interaction blocking and reduced visual emphasis.
- Validation should use `aria-invalid` and a visible text explanation; do not rely on color alone.
- Dialogs, menus, popovers, tabs, and other composite widgets should continue to use Radix primitives for keyboard and focus management.
- Directional icons must use the shared direction-aware convention when they communicate movement or navigation.

## State matrix

For every interactive primitive, explicitly review the states that apply:

| State | Visual | Semantic | Keyboard/pointer | RTL/LTR | Theme |
| --- | --- | --- | --- | --- | --- |
| Default | Yes | Yes | Yes | Yes | Yes |
| Hover | If pointer applies | Yes | n/a | Yes | Yes |
| Focus-visible | Yes | Yes | Yes | Yes | Yes |
| Active/pressed | If applicable | Yes | Yes | Yes | Yes |
| Selected/open | If applicable | Yes | Yes | Yes | Yes |
| Disabled | Yes | Yes | No interaction | Yes | Yes |
| Loading | If applicable | Yes | Defined explicitly | Yes | Yes |
| Invalid/error | If applicable | Yes | Yes | Yes | Yes |
| Success | If applicable | Yes | Yes | Yes | Yes |
| Read-only | If applicable | Yes | Limited | Yes | Yes |

Never communicate a critical state using color alone.

## RTL / LTR

Use logical properties and utilities where possible: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, and direction-aware flex layouts. Directional icons must be reviewed when they communicate movement or navigation.

The locale layout already supplies a document direction through the direction provider. Components should not override `dir` unless they have a specific, documented reason.

Physical `left/right` values are acceptable when the API itself expresses a physical placement, such as a Sheet's explicit `side="left|right"`. They are not acceptable merely because a previous implementation used them for generic spacing or alignment.

## Responsive rules

Design mobile-first. Controls should remain practical for touch, content should avoid accidental horizontal overflow, and dialogs should fit within the viewport with scrollable content when necessary.

Use the repository breakpoints rather than introducing feature-specific media queries unless the interaction genuinely requires one.

## Motion and reduced motion

Motion should communicate state changes. Keep transitions short and purposeful. The global foundation disables long-running motion and smooth scrolling when `prefers-reduced-motion: reduce` is active.

Do not add decorative infinite animation to routine commerce UI.

## Accessibility

Target WCAG 2.2 AA quality. Use native semantics before ARIA. Every control needs an accessible name; every form control needs an associated label or explicit accessible name; errors must be described in text; focus must remain visible; and keyboard operation must not depend on pointer-only interactions.

Never use color as the only signal for status. Combine color with text, iconography, or state attributes.

Source inspection is not equivalent to WCAG conformance. Browser-level testing and automated accessibility tooling are required before claiming formal compliance.

## Creating a new component

1. Reuse an existing primitive before creating a new abstraction.
2. Give the component a semantic API and keep business data out of it.
3. Use semantic tokens and the standard spacing/radius scale.
4. Define only the variants the component genuinely needs.
5. Specify focus, hover, active, disabled, loading, error, selected, and open states that apply.
6. Check both RTL and LTR layout behavior.
7. Verify keyboard access and the accessible name.
8. Add or update tests for the public API and interaction states.
9. Check all current consumers before changing an existing primitive API.
10. Prefer composition over adding a new global token or variant.

## Anti-patterns

Avoid introducing:

- new hard-coded brand colors when a semantic token exists;
- large gradient backgrounds for ordinary cards and controls;
- excessive `backdrop-filter` / glass effects;
- arbitrary one-off radii and shadow values;
- left/right positioning where logical properties are sufficient;
- emoji as UI icons;
- `aria-*` attributes that duplicate or contradict native semantics;
- feature-specific forks of core primitives;
- animation that continues indefinitely without conveying state;
- a second feature-local design token system that duplicates the shared foundation.

## Compatibility policy

Existing public primitive APIs are kept backward-compatible unless a change is unavoidable and all consumers can be migrated safely. Legacy visual aliases may remain during migration, but new code should not expand the legacy surface.

## Section 01 lock criteria

Section 01 may be marked **GREEN** only when the repository has evidence for all of the following:

- primitive inventory and duplication/drift audit completed;
- affected consumers checked or migrated;
- state and accessibility review completed;
- RTL/LTR and responsive behavior tested in a real browser where tooling is available;
- reduced-motion behavior verified;
- documentation matches implementation;
- `npm ci`, lint, typecheck, tests, and build executed successfully, or equivalent CI evidence is available;
- no intentional TypeScript or lint suppression was introduced;
- no known critical design-system regression remains.

If browser automation or project CI is unavailable, the status must remain **YELLOW** rather than being represented as fully production-ready.
