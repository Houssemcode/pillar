# Pillar — Design System & UI/UX Specification (SSOT)

> **Version:** 1.0.0  
> **Target Platforms:** Web (Desktop, Tablet, Mobile / PWA)  
> **Tech Stack:** React 18+, Tailwind CSS 3+, Lucide React / Inline SVG, Django REST Framework  
> **Modules:** Tasks, Habits, Focus, Faith, Calendar  

---

## 1. Core Design Philosophy

Pillar is designed around cognitive calm, purposeful intentionality, and seamless cross-platform continuity. Every interface decision directly supports the user's mental focus and personal rhythm across five life pillars: Tasks, Habits, Focus, Faith, and Calendar.

### 1.1 Zen & Minimalist
* **Visual Quiet:** Ample whitespace, balanced breathing room, and zero ornamental clutter.
* **Content First:** Content takes precedence over borders and chrome. Dividers and borders are whisper-soft (`border-gray-200 dark:border-zinc-800`).
* **High Contrast & Legibility:** Crisp contrast ratios meeting WCAG 2.1 AA standards without harsh starkness. Pure black text on stark white is avoided; deep zinc/gray and off-white backgrounds soften visual fatigue.
* **Deliberate Color:** Color is never purely decorative; it conveys state, category, urgency, or identity.

### 1.2 Cross-Platform Fluidity & Adaptive Architecture
* **Desktop (≥ 1024px `lg`):**
  * Persistent left navigation sidebar (`w-64` or `w-72`).
  * Structured multi-column layouts with dedicated right meta/detail sidebars.
  * Direct inline actions, hover states, and keyboard shortcut acceleration.
* **Tablet (768px – 1023px `md`):**
  * Collapsible or icon-rail sidebar.
  * Adaptive single or double-column layouts.
* **Mobile (< 768px):**
  * **Bottom Navigation Bar:** Fixed bottom bar (`h-16`, safe-area-inset padding) housing core tab destinations.
  * **Off-Canvas Drawers:** Filter panels, list selections, and settings slide in as off-canvas drawers from bottom or side with spring animations.
  * **Floating Action Button (FAB):** Bottom-right speed dial for instantaneous entry (Task, Habit, Session, Deed).
  * **Horizontal Scroll Containers:** Scrollable chip bars (`overflow-x-auto no-scrollbar`) for views, lists, and dates.

---

## 2. Color System & Theming

Pillar features a strict dual-mode light and dark color architecture. Arbitrary hex codes and non-standard utility classes are strictly prohibited outside dynamic entity tinting (tags and list accents).

### 2.1 Surface & Neutral Palette

| Token / Purpose | Light Mode Class | Dark Mode Class | Hex Equivalent (Approx.) |
| :--- | :--- | :--- | :--- |
| **Main Canvas / App Background** | `bg-gray-50` | `bg-[#121212]` | Light: `#F9FAFB`<br/>Dark: `#121212` |
| **Primary Container / Cards** | `bg-white` | `bg-zinc-900` | Light: `#FFFFFF`<br/>Dark: `#18181B` |
| **Secondary / Subtle Container** | `bg-gray-50` / `bg-gray-100` | `bg-zinc-900/50` / `bg-zinc-800/50` | Light: `#F3F4F6`<br/>Dark: `#18181B80` |
| **Hover Surface** | `hover:bg-gray-100` | `hover:bg-zinc-800` | Light: `#F3F4F6`<br/>Dark: `#27272A` |
| **Active / Selected Surface** | `bg-gray-200` | `bg-zinc-700` | Light: `#E5E7EB`<br/>Dark: `#3F3F46` |
| **Borders & Dividers** | `border-gray-200` | `border-zinc-800` | Light: `#E5E7EB`<br/>Dark: `#27272A` |
| **Subtle Inner Borders** | `border-gray-100` | `border-zinc-800/60` | Light: `#F3F4F6`<br/>Dark: `#27272A99` |

### 2.2 Text & Typography Palette

| Token / Purpose | Light Mode Class | Dark Mode Class | Hex Equivalent |
| :--- | :--- | :--- | :--- |
| **Primary Headings & Titles** | `text-gray-900` | `text-white` | `#111827` / `#FFFFFF` |
| **Secondary & Body Copy** | `text-gray-700` | `text-gray-300` | `#374151` / `#D1D5DB` |
| **Muted & Metadata Text** | `text-gray-500` | `text-gray-400` | `#6B7280` / `#9CA3AF` |
| **Subtle / Placeholder Text** | `text-gray-400` | `text-gray-500` | `#9CA3AF` / `#6B7280` |

### 2.3 Brand & Semantic Colors

| Role | Light Mode Class | Dark Mode Class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary / Brand** | `text-emerald-600`<br/>`bg-emerald-600` | `text-emerald-400`<br/>`bg-emerald-500` | Primary CTA, active states, milestones |
| **Brand Surface Accent** | `bg-emerald-50` | `bg-emerald-950/30` | Active menu pills, selected tabs |
| **Success / Completed** | `text-emerald-500`<br/>`bg-emerald-500` | `text-emerald-400`<br/>`bg-emerald-500` | Completed checkmarks, finished streaks |
| **Warning / Due Soon** | `text-amber-500`<br/>`bg-amber-500` | `text-amber-400`<br/>`bg-amber-500` | Upcoming deadlines, medium priorities |
| **Danger / Overdue** | `text-rose-500`<br/>`bg-rose-500` | `text-rose-400`<br/>`bg-rose-500` | Overdue indicators, delete actions |
| **Info / Focus Accent** | `text-blue-500`<br/>`bg-blue-500` | `text-blue-400`<br/>`bg-blue-500` | Deep work sessions, date links |

---

## 3. Typography & Rhythm

Pillar utilizes a modern, humanist sans-serif stack optimized for variable rendering, high legibility across dense dashboard grids, and RTL script balance (for Arabic prayer and adhkar typography).

### 3.1 Font Family Stack
* **Latin / Default:**  
  `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`
* **Arabic / Islamic Content (Faith Module):**  
  `font-family: "Amiri", "Scheherazade New", -apple-system, "Segoe UI", sans-serif;`
* **Monospace / Time Indicators (Focus Timers, Time Pickers):**  
  `font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;`

### 3.2 Type Scale

| Scale Name | Tailwind Class | Font Size / Line Height | Font Weight | Standard Context |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `text-3xl lg:text-4xl` | `30px / 36px` (`2.25rem`) | `font-bold` | Dashboard welcome, Focus timer display |
| **Page Title** | `text-2xl` | `24px / 32px` (`1.5rem`) | `font-bold` | Main view header (e.g., "Tasks", "Faith") |
| **Section Header** | `text-lg font-semibold` | `18px / 28px` (`1.125rem`) | `font-semibold` | Card headers, sidebar category groups |
| **Subheader / Title** | `text-sm font-semibold` | `14px / 20px` (`0.875rem`) | `font-semibold` | Task list titles, Habit titles |
| **Body Default** | `text-sm` | `14px / 20px` (`0.875rem`) | `font-normal` | Description paragraphs, modal bodies |
| **Metadata / Badges** | `text-xs font-medium` | `12px / 16px` (`0.75rem`) | `font-medium` | Due dates, subtask counters, tags |
| **Micro / Subtext** | `text-[11px]` | `11px / 14px` | `font-semibold` | Overdue tags, uppercase section dividers |

---

## 4. Component Architecture & Specifications

### 4.1 Cards & Panels
Every standalone card or grouping container must follow this standard blueprint:
* **Border Radius:** Always `rounded-2xl` (`1rem`).
* **Border:** `border border-gray-200 dark:border-zinc-800`.
* **Background:** `bg-white dark:bg-zinc-900/50`.
* **Elevation / Shadow:** `shadow-sm dark:shadow-none`.
* **Padding:** `p-4 sm:p-5 lg:p-6`.

```jsx
// Standard Card Specification
<div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm dark:shadow-none transition-colors">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Section Title</h3>
  </div>
  <div>{children}</div>
</div>
```

### 4.2 Modals & Dialogs
Modals must never feel claustrophobic or overpower the screen with pitch-black sheets.
* **Backdrop Overlay:** Soft, tinted blur.  
  `fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4`
* **Dialog Container:**  
  `w-full max-w-sm sm:max-w-md rounded-2xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden`
* **Dialog Header:** Clean layout with title, optional subtitle, and muted close icon button.
* **Accent Strip (Optional):** Dynamic top border `height: 4px` reflecting the entity's accent color.

```jsx
// Standard Modal Shell Specification
<div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  </div>
</div>
```

### 4.3 Tags & Badges (CRITICAL PATTERN)
Tags and categories must **never** be rendered as plain text or solid flat gray badges. They must strictly adhere to the translucent pill pattern derived from each tag’s hex color code.

#### Visual Architecture:
* **Shape:** `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border`.
* **Prefix:** `#` prepended directly before the label name.
* **Inner Dot:** `w-1.5 h-1.5 rounded-full shrink-0` colored with the exact solid hex color.
* **Translucent Background:** Tag hex color with `1A` (10% opacity) in inactive state, or `33` (20% opacity) in active state.
* **Translucent Border:** Tag hex color with `33` (20% opacity) in inactive state, or solid `tagColor` when active.
* **Foreground Text:** Exact tag hex color.

```jsx
// Absolute SSOT Specification for Tag Pills
const hexColor = (tag.color && tag.color.startsWith('#')) ? tag.color.slice(0, 7) : '#10B981';

<span
  key={tag.name}
  role="button"
  tabIndex={0}
  onClick={() => onToggleTag(tag.name)}
  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:brightness-125 select-none"
  style={{
    backgroundColor: isActive ? `${hexColor}33` : `${hexColor}1A`,
    borderColor: isActive ? hexColor : `${hexColor}33`,
    color: hexColor,
  }}
>
  <span 
    className="w-1.5 h-1.5 rounded-full shrink-0" 
    style={{ backgroundColor: hexColor }} 
  />
  #{tag.name}
</span>
```

### 4.4 Inputs & Form Fields
Inputs must blend effortlessly into cards while offering clear focus states.
* **Input Styling:**  
  `w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`
* **Labels:**  
  `block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5`
* **Helper / Error Text:**  
  `text-xs text-rose-500 mt-1`

### 4.5 Checkboxes & Toggle Controls
* **Checkboxes:** Custom rounded checkbox `w-5 h-5 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800`.
* **Checked State:** `bg-emerald-500 border-emerald-500 text-white` with a clean SVG checkmark stroke.

---

## 5. Interactive Elements & Mobile Patterns

### 5.1 Floating Action Button (FAB) System
On mobile and tablet viewports, primary creation actions are driven by a bottom-right FAB.
* **Position:** `fixed bottom-20 right-5 z-40 lg:hidden`.
* **Dimensions:** `w-14 h-14 rounded-full shadow-lg`.
* **Color:** `bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center`.
* **Speed Dial Overlay:** Tap reveals mini-action triggers (New Task, New List, New Tag) stacked vertically with soft staggered entry animations.

### 5.2 Mobile Bottom Navigation
* **Placement:** `fixed bottom-0 inset-x-0 h-16 z-40 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-t border-gray-200 dark:border-zinc-800 lg:hidden`.
* **Items:** 5 primary tabs (Today, Tasks, Habits, Focus, Faith).
* **Active Indicator:** Active icon and text use `text-emerald-500 dark:text-emerald-400 font-semibold`; inactive uses `text-gray-500 dark:text-gray-400`.

### 5.3 Mobile Off-Canvas Drawers
* **Overlay:** `fixed inset-0 z-50 bg-black/50 backdrop-blur-xs`.
* **Drawer Panel:** `bg-white dark:bg-[#121212] text-gray-900 dark:text-white border-l border-gray-200 dark:border-zinc-800 w-4/5 max-w-sm h-full flex flex-col`.
* **Header:** `px-4 py-3.5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between`.
* **Close Control:** `p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-400`.

### 5.4 Hover & Active States
* **Standard Button Hover:** `transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg`.
* **Icon Button:** `p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors`.

---

## 6. Iconography Standards

Pillar uses **Lucide React** (or strictly matching, lightweight inline SVGs) for visual iconography.

### 6.1 Sizing Conventions
* **Micro / Inline (`12px` - `14px`):** Used inside badges, subtask counts, and inline chips (`w-3.5 h-3.5`).
* **Standard Action (`16px` - `18px`):** Used inside inputs, buttons, list item prefixes, and table rows (`w-4 h-4` or `w-4.5 h-4.5`).
* **Navigation / Tab (`20px` - `24px`):** Used in the persistent sidebar and mobile bottom nav (`w-5 h-5` or `w-6 h-6`).
* **Empty State Hero (`32px` - `48px`):** Used in empty placeholders and celebration modals (`w-10 h-10` or `w-12 h-12`).

### 6.2 Stroke & Optical Weight
* **Stroke Width:** Consistently `strokeWidth={2}` for standard states; `strokeWidth={2.5}` for emphasis or active indicators.
* **Line Caps:** Always `strokeLinecap="round"` and `strokeLinejoin="round"`.

---

## 7. Accessibility & Motion Guidelines

### 7.1 Contrast & Readability
* Foreground text must strictly achieve at least a **4.5:1** contrast ratio against its card background.
* Secondary/muted text (`text-gray-500` on `bg-white` and `text-gray-400` on `bg-zinc-900`) strictly satisfies a minimum **3:1** ratio for secondary information.

### 7.2 Focus Rings & Keyboard Navigation
* All interactive items (buttons, inputs, selectable cards, tag pills) must provide high-visibility keyboard focus rings:  
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900`
* Tab indices (`tabIndex={0}`) and `role="button"` are mandatory for non-button interactive elements, accompanied by `onKeyDown` handlers listening for `Enter` and `Space`.

### 7.3 Motion & Transitions
* **Durations:** Snappy and lightweight: `150ms` for color fades, `200ms` for drawer sliding, `250ms` for modal scaling.
* **Reduced Motion:** Always respect OS-level preferences:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## 8. Module-Specific Guidelines

### 8.1 Tasks Module
* **View Modes:** List, Kanban, and Timeline. Switching to a list dynamically honors its saved `default_view`.
* **Sidebar Lists:** Folder icon rendered using the list's chosen `accent_color`.
* **Tag Badges on Cards:** Strict translucent pill pattern matching the sidebar and creation preview.
* **Batch Action Bar:** Fixed floating bar at the bottom center when tasks are selected (`bg-zinc-900 text-white rounded-2xl shadow-2xl px-4 py-2.5`).

### 8.2 Habits Module
* **Heatmaps & Grid:** Consistent `w-8 h-8 rounded-lg` completion cells with progressive opacity tinting based on habit color.
* **Progress Panel:** `rounded-2xl bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800`.
* **Stats Cards:** Never use solid white backgrounds in dark mode. Always use `bg-white dark:bg-zinc-800/50`.

### 8.3 Focus Module
* **Timer Hero:** Massive clean timer display (`text-6xl font-mono tracking-tight font-bold`).
* **Controls:** Tactile, pill-shaped action buttons (`rounded-full px-8 py-3 bg-emerald-600 text-white font-semibold`).
* **Session Log:** Quiet minimalist timeline entries.

### 8.4 Faith Module
* **Layout Structure:**
  * Desktop: Multi-column arrangement. Morning & Evening Adhkar summary cards housed in right sidebar stack (`flex flex-col gap-6`). Main column holds Prayer Schedule Card, Hadith Card, and Today's Deeds List.
  * Mobile: Main column displays first; Adhkar summary cards fold underneath seamlessly.
* **Arabic Typography:** Enhanced line-height (`leading-loose` / `leading-relaxed`) with Amiri font stack for Quran and Hadith passages.

### 8.5 Calendar Module
* **Grid:** Seamless monthly and weekly grids using `border-gray-200 dark:border-zinc-800`.
* **Event Chips:** Translucent pills mirroring the tag badge system, tinted by event category or linked list color.

---

## 9. Developer Do's & Don'ts

| Do | Don't |
| :--- | :--- |
| **DO** use `rounded-2xl` on all cards and containers. | **DON'T** use `rounded-md` or `rounded-lg` on major outer cards. |
| **DO** use `border-gray-200 dark:border-zinc-800` for container borders. | **DON'T** use harsh `border-black` or high-contrast borders. |
| **DO** use `bg-[#121212]` for the core dark mode app background. | **DON'T** use pure `#000000` black for main window backgrounds. |
| **DO** use soft modal overlays (`bg-black/20 dark:bg-black/40 backdrop-blur-sm`). | **DON'T** use opaque or `bg-black/80` dark modal sheets. |
| **DO** format tags as translucent pills (`hexColor + '1A'` bg, `hexColor + '33'` border, `#` prefix, and inner dot). | **DON'T** render tags as plain raw text or generic gray chips. |
| **DO** use `bg-white dark:bg-zinc-800/50` for inner nested stat boxes. | **DON'T** hardcode `bg-white` without dark mode variant in nested cards. |
| **DO** test both Light and Dark themes rigorously across every screen. | **DON'T** hardcode dark-only or light-only utility classes. |
