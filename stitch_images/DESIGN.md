# The Design System: Editorial Authority

## 1. Overview & Creative North Star: "The Architectural Consultant"
The goal of this design system is to move beyond the "generic SaaS" aesthetic. We are building a visual language of **Architectural Authority**. This system rejects the cluttered, line-heavy interfaces of traditional consulting portals in favor of an expansive, editorial layout that feels curated and intentional.

**Creative North Star: The Digital Atelier**
The UI should feel like a high-end physical workspace—heavy paper textures, soft ambient light, and a sense of "breathe." We achieve this through:
*   **Intentional Asymmetry:** Breaking the 12-column grid with staggered content blocks to lead the eye.
*   **Tonal Depth:** Replacing harsh borders with sophisticated layering of surface colors.
*   **Typographic Gravity:** Using massive, confident display type paired with generous white space to signal expertise and calm.

---

## 2. Color Strategy & The "No-Line" Philosophy
Our palette is anchored by the deep, intellectual **Calypso (#31728D)** and punctuated by the sharp, decisive **Violet Eggplant (#991199)**.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or containers. Lines create visual noise that degrades the premium feel. 
*   **Boundaries:** Define areas solely through background shifts. For example, a `surface-container-low` section should sit directly against a `surface` background.
*   **Signature Textures:** Use subtle linear gradients (e.g., `primary` to `primary-container` at a 135° angle) for hero backgrounds or high-level CTAs to add "soul" and depth that flat hex codes cannot provide.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. Use the surface tokens to create a "nested" ecosystem:
1.  **Base Layer:** `surface` (#f8f9fc) – The canvas.
2.  **Sectional Layer:** `surface-container-low` (#f2f4f6) – Used for large background blocks.
3.  **Component Layer:** `surface-container-lowest` (#ffffff) – Reserved for cards or interactive elements to make them "pop" forward naturally.

---

## 3. Typography: The Hierarchy of Confidence
We pair the structural elegance of **Manrope** for headlines with the functional precision of **Inter** for data and body copy.

*   **Display (Manrope):** Massive scales (`display-lg` at 3.5rem) should be used for key value propositions. Letter-spacing should be set to `-0.02em` to feel tighter and more "designed."
*   **Headline (Manrope):** Used for section starts. These should always have significant top-margin to establish a new "chapter" in the user journey.
*   **Body & Labels (Inter):** These are the workhorses. Use `body-lg` for consulting insights and `label-md` for technical metadata. 
*   **The Contrast Rule:** Use `tertiary` (Violet Eggplant) sparingly for small "Overline" text or category labels to draw the eye without overwhelming the primary blue's professional tone.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are forbidden. We use "Ambient Light" principles to create three-dimensionality.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-highest` element placed on a `surface` background creates a natural focal point without a single pixel of shadow.
*   **Glassmorphism:** For floating navigation or modals, use semi-transparent `surface` colors (80% opacity) with a `20px` backdrop-blur. This allows brand colors to bleed through, making the UI feel integrated rather than "pasted on."
*   **The Ghost Border Fallback:** If a container absolutely requires a boundary for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
*   **Ambient Shadows:** For high-priority floating elements, use a shadow with a 40px blur, 0% spread, and a 5% opacity color derived from `on-surface` (#191c1e).

---

## 5. Components: Precision Elements

### Buttons: The Signature Action
*   **Primary:** A gradient-filled container (`primary` to `primary-container`) with `on-primary` text. Use `md` (0.375rem) roundedness for a modern-corporate feel.
*   **Secondary:** No background, `outline` border (at 20% opacity), and `primary` text.
*   **Tertiary:** Only used for "Danger" or high-visibility accents using the `tertiary` (Violet Eggplant) token.

### Cards & Lists: The "Whitespace" Container
*   **Rule:** Forbid divider lines. Use `surface-container-low` backgrounds for list items on hover, and rely on `24px` to `32px` of vertical padding to separate content blocks.
*   **Imagery:** High-quality business imagery should use the `lg` (0.5rem) corner radius and, where possible, sit "broken" across two background color tiers to emphasize the asymmetrical layout.

### Input Fields
*   **Style:** Minimalist. Use `surface-container-highest` as the fill color with a bottom-only `outline` (at 30% opacity). When focused, the bottom border transitions to `primary` with a 2px weight.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 80px left, 120px right) for hero sections to create an editorial feel.
*   **Do** leverage the `tertiary` (Violet Eggplant) for micro-interactions (e.g., a small dot indicating an active notification).
*   **Do** use "Lead Paragraphs" in `title-lg` to bridge the gap between headlines and body text.

### Don't:
*   **Don't** use 100% black text. Always use `on-surface` (#191c1e) to maintain a soft, premium look.
*   **Don't** use standard "Box-Shadow" presets. If it looks like a default shadow, it’s wrong.
*   **Don't** crowd the interface. If a screen feels "busy," increase the padding of the `surface-container` by 50%.
*   **Don't** use dividers. If you need a line to separate ideas, you haven't used enough white space.

---

## 7. Signature Consulting Components (Custom)
*   **The "Insight" Block:** A `surface-container-lowest` card with a 4px left-accent-border in `tertiary` (Violet Eggplant). Used for key consulting takeaways.
*   **The "Metric" Hero:** Large `display-md` numbers in `primary` blue, paired with a `label-sm` caption in `outline` gray, floating over a subtle glassmorphic background.