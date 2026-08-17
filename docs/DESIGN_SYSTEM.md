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
- `IconButton` is for icon-only actions and must provide an accessible `aria-label`.
- `Input`, `Select`, `Checkbox`, `RadioGroup`, and `Switch` provide native/Radix semantics; do not replace them with clickable `div` elements.
- Interactive primitives must expose visible `:focus-visible` states.
- Disabled state is represented by both interaction blocking and reduced visual emphasis.
- Validation should use `aria-invalid` and a visible text explanation; do not rely on color alone.
- Dialogs, menus, popovers, tabs, and other composite widgets should continue to use Radix primitives for keyboard and focus management.

## RTL / LTR

Use logical properties and utilities where possible: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, and direction-aware flex layouts. Directional icons must be reviewed when they communicate movement or navigation.

The locale layout already supplies a document direction through the direction provider. Components should not override `dir` unless they have a specific, documented reason.

## Responsive rules

Design mobile-first. Controls should remain practical for touch, content should avoid accidental horizontal overflow, and dialogs should fit within the viewport with scrollable content when necessary.

Use the repository breakpoints rather than introducing feature-specific media queries unless the interaction genuinely requires one.

## Motion and reduced motion

Motion should communicate state changes. Keep transitions short and purposeful. The global foundation disables long-running motion and smooth scrolling when `prefers-reduced-motion: reduce` is active.

Do not add decorative infinite animation to routine commerce UI.

## Accessibility

Target WCAG 2.2 AA quality. Use native semantics before ARIA. Every control needs an accessible name; every form control needs an associated label or explicit accessible name; errors must be described in text; focus must remain visible; and keyboard operation must not depend on pointer-only interactions.

Never use color as the only signal for status. Combine color with text, iconography, or state attributes.

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
- animation that continues indefinitely without conveying state.

## Compatibility policy

Existing public primitive APIs are kept backward-compatible unless a change is unavoidable and all consumers can be migrated safely. Legacy visual aliases may remain during migration, but new code should not expand the legacy surface.
