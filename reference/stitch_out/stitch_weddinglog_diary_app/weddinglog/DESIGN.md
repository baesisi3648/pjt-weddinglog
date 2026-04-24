---
name: WeddingLog
colors:
  surface: '#fff8f1'
  surface-dim: '#e2d9ca'
  surface-bright: '#fff8f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2e3'
  surface-container: '#f6eddd'
  surface-container-high: '#f0e7d8'
  surface-container-highest: '#ebe1d2'
  on-surface: '#1f1b12'
  on-surface-variant: '#524340'
  inverse-surface: '#353026'
  inverse-on-surface: '#f9f0e0'
  outline: '#85736f'
  outline-variant: '#d7c2bd'
  surface-tint: '#894f41'
  primary: '#894f41'
  on-primary: '#ffffff'
  primary-container: '#e89f8e'
  on-primary-container: '#693529'
  inverse-primary: '#ffb4a3'
  secondary: '#5f5e5f'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe0'
  on-secondary-container: '#636263'
  tertiary: '#8c4d3f'
  on-tertiary: '#ffffff'
  tertiary-container: '#ed9d8c'
  on-tertiary-container: '#6c3327'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#370e05'
  on-primary-fixed-variant: '#6d382b'
  secondary-fixed: '#e5e2e3'
  secondary-fixed-dim: '#c8c6c7'
  on-secondary-fixed: '#1c1b1c'
  on-secondary-fixed-variant: '#474647'
  tertiary-fixed: '#ffdad3'
  tertiary-fixed-dim: '#ffb4a4'
  on-tertiary-fixed: '#390c04'
  on-tertiary-fixed-variant: '#70362a'
  background: '#fff8f1'
  on-background: '#1f1b12'
  surface-variant: '#ebe1d2'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  display-md:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Pretendard
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono-id:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 800px
  gutter: 20px
---

## Brand & Style

This design system is built upon the concept of "Digital Archiving with Tactile Warmth." It avoids the coldness of traditional SaaS by adopting a **Tactile / Minimalist** hybrid style. The brand personality is sentimental, intimate, and intentional, designed to evoke the feeling of running ones fingers over a high-quality letter pad. 

The UI prioritizes a physical metaphor where the screen acts as a desk and the application surfaces act as layered sheets of premium ivory paper. It is aimed at couples who value the journey of planning as much as the event itself, providing a calm, focused environment for shared reflection.

## Colors

The palette is anchored in a high-contrast "Ink on Paper" relationship. The **Ink** (#0F0F10) provides a grounded, authoritative weight for all meaningful content and interactions. The **Background** (#F5F0E6) sets a warm, non-glare foundation that reduces digital eye strain and mimics aged vellum.

**Accent Usage:**
The **Soft Coral** (#E89F8E) is reserved exclusively for emotional milestones and functional confirmations. It appears in the heart of the brand mark, the "Checked" states of diary tasks, and the D-day countdown. It is never used for decorative elements, ensuring that when color appears, it signifies progress or love.

## Typography

This design system utilizes a sophisticated typographic pairing to balance editorial elegance with functional clarity. 

- **Fraunces** serves as the emotional voice. Use the lighter weights (300) for large displays to emphasize the serif's unique curves, and medium weights (500) for section headers. 
- **Pretendard** handles the heavy lifting of the UI. It is chosen for its exceptional readability in a digital diary format.
- **JetBrains Mono** is strictly utilitarian, used only for system-level identifiers (e.g., Order IDs, Reference Codes) to distinguish technical data from personal entries.

All headlines should favor a slightly looser letter-spacing to enhance the "luxury stationery" aesthetic.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to maintain the proportions of a physical diary page. The primary content container is constrained to 800px and centered, creating a focused "reading and writing" lane.

Spacing is generous. Vertical rhythm relies on larger gaps (40px+) between diary entries to allow the content to breathe. Use the `Background soft` color for horizontal full-width bands to differentiate between the "Diary" section and "Planning" tools without needing heavy borders.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering** rather than traditional elevation. Most elements sit flat on the `Background` ivory paper. 

**Exceptions for Depth:**
- **Polaroid Frames:** Images are treated as physical objects "dropped" onto the page. They utilize a dual-shadow approach (a crisp 1px tint and a soft 8px spread) to create a subtle lift.
- **Floating Action Button (FAB):** As the primary entry point for new memories, it receives a soft, diffused shadow to ensure it floats above the "paper" surface.
- **Flat Borders:** Everything else uses the 1px `Hairline` (#E3DBC8) to define boundaries, maintaining a clean, blueprint-like feel.

## Shapes

The shape language is intentional and varied to signal different levels of interaction:
- **Cards & Surfaces:** 8px radius. This is the standard "paper" corner.
- **CTAs & FABs:** 12px radius. A rounder, softer shape that invites a press and feels more modern and "squishy" compared to the static page.
- **Inline Elements:** Tags and small indicators use a sharper 2-4px radius to feel like small stickers or stamps pinned to the page.

## Components

### Buttons & Interaction
Primary buttons in "emotional moments" (Save Entry, Share Diary) use the **Soft Coral** fill with white text. Functional UI buttons (Settings, Edit) use an **Ink** outline or ghost style. All icons use a consistent 1.5px stroke weight to match the "Hairline" border aesthetic.

### Polaroid Cards
Photos must be wrapped in a `Paper` (#FFFFFF) border with a bottom-heavy margin (simulating a Polaroid). These cards are the only elements allowed to have a shadow.

### Input Fields
Inputs are minimalist, using only a 1px bottom border in `Hairline` color when inactive, and shifting to `Ink` when focused. This mimics the lines of a ruled notebook.

### Checkboxes
The checkbox is a key brand moment. When checked, the box should fill with `Soft Coral` and display a custom 1.5px stroke checkmark. Completed text should immediately transition to `Muted strike` (#B5AEA0) with a subtle strikethrough.

### Navigation
Active navigation items are indicated by a 2px horizontal line in **Soft Coral** beneath the label, reminiscent of a bookmark or a highlighter stroke.