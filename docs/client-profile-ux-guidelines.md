# Client Profile Page — UI/UX Design Guidelines

> **Version**: 1.0
> **Status**: Draft
> **Last Updated**: 2026-01-29

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [User Personas & Mental Models](#user-personas--mental-models)
3. [Information Hierarchy](#information-hierarchy)
4. [Page Structure](#page-structure)
5. [Navigation & Modes](#navigation--modes)
6. [Component Design](#component-design)
7. [Interaction Patterns](#interaction-patterns)
8. [The Agentic Capture Experience](#the-agentic-capture-experience)
9. [Empty & Edge States](#empty--edge-states)
10. [Motion & Feedback](#motion--feedback)
11. [Accessibility](#accessibility)
12. [Mobile Adaptation](#mobile-adaptation)

---

## Design Philosophy

### Core Principles

| Principle | Application |
|-----------|-------------|
| **Answer "What now?" first** | Actionable items surface before reference data |
| **Speak, don't fill** | Natural language input over form fields |
| **Trust through transparency** | Show where data came from; never surprise the RM |
| **Progressive disclosure** | Overview first, details on demand |
| **One mode, one job** | Each view is optimized for a single workflow |

### Design Tenets

1. **The RM is the authority**
   The system proposes; the RM decides. Every AI suggestion is clearly marked as a suggestion, never as fact.

2. **Density with clarity**
   Pack information without clutter. Use hierarchy, not sprawl.

3. **Context over completeness**
   Show what's relevant now, not everything that exists.

4. **Confidence through consistency**
   Same patterns, same placement, same behaviors across all modes.

---

## User Personas & Mental Models

### Primary Persona: The Relationship Manager (RM)

**Goals:**
- Prepare for client calls quickly
- Capture meeting notes without friction
- Track follow-ups reliably
- Build client knowledge over time

**Mental Model:**
- "I'm managing relationships, not filling databases"
- "Show me what I need to know and what I need to do"
- "Don't make me think about where data goes"

### Key Jobs to Be Done

| Job | Frequency | Time Pressure | Mode |
|-----|-----------|---------------|------|
| Prep for a call | Daily | High | Overview |
| Capture notes after conversation | Daily | Medium | Capture |
| Review what happened | Weekly | Low | Timeline |
| Check/manage follow-ups | Daily | Medium | Tasks |
| Correct or update profile | Occasional | Low | Profile |

---

## Information Hierarchy

### Primary (Always Visible)

- Client name
- Relationship status
- Current mode indicator

### Secondary (One Click Away)

- Key context for call prep
- Pending actions (proposals, tasks, alerts)
- Profile completion summary
- Recent activity preview

### Tertiary (On Demand)

- Full profile fields
- Complete timeline history
- All tasks
- Audit details

### Visual Hierarchy Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 1: Identity Bar (Always visible, sticky)                 │
│  ─────────────────────────────────────────────────────────────  │
│  Client name, status, RM, primary actions                       │
├─────────────────────────────────────────────────────────────────┤
│  LEVEL 2: Mode Navigation                                       │
│  ─────────────────────────────────────────────────────────────  │
│  [Overview] [Capture] [Timeline] [Tasks] [Profile]              │
├─────────────────────────────────────────────────────────────────┤
│  LEVEL 3: Mode Content                                          │
│  ─────────────────────────────────────────────────────────────  │
│  Primary content for current mode                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LEVEL 4: Cards/Sections                                │   │
│  │  Individual content blocks within the mode              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page Structure

### Identity Bar

The persistent header that answers "Who am I looking at?"

```
┌─────────────────────────────────────────────────────────────────┐
│ [←]  Rahul Mehta                          [📞] [💬] [✉️] [⋮]   │
│      OPPORTUNITY  •  Business Owner  •  RM: Priya               │
└─────────────────────────────────────────────────────────────────┘
```

**Elements:**
| Element | Purpose | Behavior |
|---------|---------|----------|
| Back arrow | Return to list | Navigate to client list |
| Client name | Primary identifier | Non-interactive |
| Status badge | Relationship stage | Click to change status |
| Key attributes | Quick context | Non-interactive |
| Action buttons | Primary actions | Open call, message, email |
| Overflow menu | Secondary actions | Edit, delete, export, etc. |

**Visual Specs:**
- Name: `text-xl font-medium`
- Status badge: Colored pill (`primary` for Opportunity)
- Attributes: `text-muted-foreground text-sm`
- Sticky on scroll

### Mode Navigation

Tab bar for switching between workflows.

```
┌─────────────────────────────────────────────────────────────────┐
│  [Overview]  [Capture]  [Timeline]  [Tasks]  [Profile]          │
│      ↑                                                          │
│   Active                                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Visual Specs:**
- Active tab: `border-b-2 border-primary text-foreground`
- Inactive tab: `text-muted-foreground`
- Badge on tab (e.g., Tasks with count): `bg-destructive text-destructive-foreground rounded-full`

**Behavior:**
- Tabs persist state (switching back retains scroll position)
- URL updates with mode (`/clients/123/capture`)
- Keyboard navigable (arrow keys)

---

## Navigation & Modes

### Mode Overview

| Mode | Primary Color | Icon | Purpose |
|------|---------------|------|---------|
| Overview | — | Home | Call prep, at-a-glance |
| Capture | `primary` | Plus/Mic | Add notes, review extractions |
| Timeline | — | Clock | Event history |
| Tasks | — | Checkbox | Follow-up management |
| Profile | — | User | Structured data |

### Mode Switching

**Interaction:**
- Click tab to switch
- Keyboard: `Cmd+1` through `Cmd+5`
- Deep links: `/clients/{id}/{mode}`

**Transitions:**
- Crossfade between modes (150ms)
- No jarring layout shifts
- Preserve scroll position per mode

---

## Component Design

### Cards

The primary container for content groups.

**Standard Card:**
```
┌─────────────────────────────────────────────────────────────────┐
│  CARD TITLE                                    [Action →]       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Card content goes here                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Border: `ring-1 ring-border`
- Border radius: `rounded-lg`
- Padding: `p-4`
- Title: `text-xs font-medium uppercase tracking-wide text-muted-foreground`
- Background: `bg-card`

**Variants:**

| Variant | Use Case | Visual Difference |
|---------|----------|-------------------|
| Default | Standard content | As above |
| Attention | Needs action | `ring-primary` left border accent |
| Success | Positive state | `ring-success` subtle background |
| Warning | Needs review | `ring-warning` subtle background |

### Status Badges

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     NEW      │  │ IN CONVO     │  │ OPPORTUNITY  │  │    CLIENT    │
│    (blue)    │  │   (amber)    │  │   (orange)   │  │   (green)    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Specs:**
- Size: `text-xs font-medium px-2 py-0.5`
- Border radius: `rounded-full`
- Uppercase text

### Progress Bars

For profile completion visualization.

```
Identity & Contact     ████████████░░░░  75%
Professional & Income  ██████████░░░░░░  60%
Goals & Planning       ░░░░░░░░░░░░░░░░   0%
```

**Color Coding:**
| Completion | Color | Token |
|------------|-------|-------|
| 0-24% | Red | `bg-destructive` |
| 25-49% | Amber | `bg-warning` |
| 50-74% | Gray | `bg-muted` |
| 75-100% | Green | `bg-success` |

**Specs:**
- Height: `h-2`
- Border radius: `rounded-full`
- Background: `bg-muted/30`

### Interest Chips

```
┌───────────┐  ┌─────────────────┐  ┌────────────────┐
│ 🏌️ Golf  │  │ 🎓 Education    │  │ 💰 Tax Eff.   │
│  (solid)  │  │  (solid)        │  │  (outlined)    │
│   HIGH    │  │   HIGH          │  │   MEDIUM       │
└───────────┘  └─────────────────┘  └────────────────┘
```

**Confidence Styling:**
| Confidence | Style |
|------------|-------|
| High | Solid background `bg-secondary` |
| Medium | Outlined `border border-border bg-transparent` |
| Low | Dashed border `border-dashed` |

**Specs:**
- Size: `text-sm px-3 py-1`
- Border radius: `rounded-full`
- Icon: Emoji prefix
- Hover: Show tooltip with source

### Action Buttons

**Primary Action (one per view):**
```
┌─────────────────┐
│    Add Note     │  ← Primary: solid background
└─────────────────┘
```

**Secondary Actions:**
```
┌─────────────────┐  ┌─────────────────┐
│    Log Call     │  │    Add Task     │  ← Secondary: outline
└─────────────────┘  └─────────────────┘
```

**Specs:**
- Primary: `bg-primary text-primary-foreground`
- Secondary: `border border-input bg-background`
- Ghost: `hover:bg-accent hover:text-accent-foreground`

---

## Interaction Patterns

### Confirm/Edit/Reject Pattern

Used for all agent extractions.

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Primary Goal                                                │
│  Overseas Education (UK, 3-year horizon)                        │
│                                                                 │
│  "daughter's overseas education... UK universities"             │
│                                                                 │
│                               [Confirm]  [Edit]  [Reject]       │
└─────────────────────────────────────────────────────────────────┘
```

**Button Behaviors:**

| Action | Visual | Result |
|--------|--------|--------|
| **Confirm** | `bg-success` on hover | Save to profile, collapse card with ✓ |
| **Edit** | Opens inline editor | Edit value, then confirm |
| **Reject** | `bg-destructive` on hover | Dismiss card, don't save |

**Keyboard:**
- `Enter` = Confirm
- `E` = Edit
- `Backspace` = Reject

### Inline Editing

For direct field updates in Profile mode.

**Idle State:**
```
│ Full Name        │ Rahul Mehta                 │ [Edit]     │
```

**Edit State:**
```
│ Full Name        │ [Rahul Mehta____________]   │ [Save] [×] │
```

**Specs:**
- Transition: 150ms ease
- Focus: Auto-focus input on edit click
- Save: `Enter` key or Save button
- Cancel: `Escape` key or × button

### Expandable Sections

For progressive disclosure in Profile and Timeline.

**Collapsed:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ▶ Professional & Income                        ██████░░ 60%    │
└─────────────────────────────────────────────────────────────────┘
```

**Expanded:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ▼ Professional & Income                        ██████░░ 60%    │
├─────────────────────────────────────────────────────────────────┤
│   Occupation       │ Business                  │ [Edit]        │
│   Industry         │ Manufacturing             │ [Edit]        │
│   Income Range     │ 50L-1Cr                   │ [Edit]        │
│   Income Nature    │ —                         │ [+ Add]       │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Chevron rotation: 90° (150ms)
- Content reveal: Slide down (200ms)
- Only one section expanded at a time (accordion) OR all can be open (configurable)

### Bulk Actions

For "Confirm All" in Capture mode.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Extraction 1]                                                 │
│  [Extraction 2]                                                 │
│  [Extraction 3]                                                 │
│                                                                 │
│                                           [Confirm All (3)]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Count updates as items are individually confirmed/rejected
- Disabled if no items pending
- Success state: All cards collapse, success toast

---

## The Agentic Capture Experience

### Design Goals

1. **Input feels like texting a colleague** — Not filling a form
2. **Extractions feel like helpful suggestions** — Not automated decisions
3. **Confirmation feels effortless** — One click, not a review process
4. **Trust is built through evidence** — Always show the source quote

### The Capture Flow

**Step 1: Input**

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Just finished a call with Rahul. He confirmed they're    │  │
│  │  going ahead with UK for his daughter. Wants to start     │  │
│  │  a SIP for the next 3 years...                            │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                    [Save Note]  │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Textarea: `min-h-[120px]` expandable
- Placeholder: "Type or speak your notes..."
- Voice button: Microphone icon, top-right

**Step 2: Processing**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [Your note content...]                                   │  │
│  │                                                 ✓ Saved   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Analyzing... ───────────────────────────────────────────┐  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Progress: Indeterminate `animate-pulse`
- Duration: Typically < 2 seconds
- Note saved immediately (extraction is async)

**Step 3: Extraction Results**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─ I picked up a few things ───────────────────────────────┐  │
│  │                                                          │  │
│  │  ┌─ Profile Update ────────────────────────────────────┐ │  │
│  │  │  🎯 Primary Goal                                    │ │  │
│  │  │  Overseas Education (UK, 3-year horizon)            │ │  │
│  │  │                                                     │ │  │
│  │  │  "confirmed they're going ahead with UK...          │ │  │
│  │  │   start a SIP for the next 3 years"                 │ │  │
│  │  │                                                     │ │  │
│  │  │  ● High confidence                                  │ │  │
│  │  │                                                     │ │  │
│  │  │                     [Confirm]  [Edit]  [Reject]     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │                                        [Confirm All (2)] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Extraction Card Anatomy

```
┌─────────────────────────────────────────────────────────────────┐
│  [Icon] [Field/Type Label]                           1. Header  │
│  [Proposed Value]                                    2. Value   │
│                                                                 │
│  "[Evidence quote from note]"                        3. Evidence│
│                                                                 │
│  ● Confidence  ○ Inferred (if applicable)           4. Metadata│
│                                                                 │
│                          [Confirm]  [Edit]  [Reject] 5. Actions │
└─────────────────────────────────────────────────────────────────┘
```

**Visual Specs:**

| Element | Spec |
|---------|------|
| Header icon | Emoji, `text-lg` |
| Header label | `text-sm font-medium text-muted-foreground` |
| Value | `text-base font-medium` |
| Evidence | `text-sm text-muted-foreground italic` in quote block |
| Confidence | `text-xs` with colored dot indicator |
| Actions | Button group, right-aligned |

### Confidence Indicators

| Level | Visual | Meaning |
|-------|--------|---------|
| **High** | `●` Green dot | Explicit in text, high certainty |
| **Medium** | `●` Amber dot | Mentioned but ambiguous |
| **Low** | `○` Gray outline + "Inferred" | Deduced, not stated |

### Inferred vs Explicit

**Explicit extraction:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Primary Goal                                                │
│  Overseas Education (UK)                                        │
│                                                                 │
│  "confirmed they're going ahead with UK for his daughter"       │
│                                                                 │
│  ● High confidence                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Inferred extraction:**
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│  👧 Daughter's Age                                              │
│  ~15-16 years old                                               │
│                                                                 │
│  ○ Inferred — you didn't say this directly                      │
│  (UK university in 3 years → likely 15-16 now)                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Visual difference:**
- Explicit: Solid border
- Inferred: Dashed border + explanation of reasoning

---

## Empty & Edge States

### No Client Selected

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      Select a client                            │
│                                                                 │
│           Choose a client from the list to view                 │
│                    their profile                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### New Client (No Data)

**Overview:**
```
┌─────────────────────────────────────────────────────────────────┐
│  PREP FOR YOUR CALL                                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│                    No context captured yet                      │
│                                                                 │
│        Add a note after your first conversation to              │
│              start building this profile                        │
│                                                                 │
│                      [+ Add Note]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### No Extractions

**Capture (after note saved, nothing extracted):**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [Your note content...]                        ✓ Saved    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │          No profile updates detected                    │   │
│  │                                                         │   │
│  │   Your note has been saved. I didn't find any          │   │
│  │   specific profile information to extract this time.    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### No Tasks

```
┌─────────────────────────────────────────────────────────────────┐
│  TASKS                                            [+ Add Task]  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│                      No tasks yet                               │
│                                                                 │
│       Tasks will appear here as you add them or when            │
│             they're suggested from your notes                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### All Caught Up

**Needs Attention (empty):**
```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ ALL CAUGHT UP                                                │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│       No pending proposals, overdue tasks, or alerts            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Motion & Feedback

### Timing Guidelines

| Action | Duration | Easing |
|--------|----------|--------|
| Tab switch | 150ms | ease-out |
| Card expand/collapse | 200ms | ease-in-out |
| Button hover | 100ms | ease |
| Toast appear | 200ms | ease-out |
| Toast dismiss | 150ms | ease-in |
| Progress bar | 300ms | ease-out |

### Feedback Patterns

**Confirm Action:**
1. Button shows loading state (150ms)
2. Card collapses with ✓ icon
3. Success toast appears (bottom-right)
4. Toast auto-dismisses (3 seconds)

**Reject Action:**
1. Card fades out (150ms)
2. No toast (rejection is quiet)

**Save Note:**
1. Button shows loading state
2. "✓ Saved" appears inline
3. Extraction section animates in below

**Error State:**
1. Shake animation on element (200ms)
2. Error toast with message
3. Element highlighted with `ring-destructive`

### Loading States

**Full page loading:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          ○ ○ ○                                  │
│                       Loading...                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Inline loading (extraction):**
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─ Analyzing... ───────────────────────────────────────────┐  │
│  │  ████████░░░░░░░░░░░░░░░░░░░░░░░░░                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Button loading:**
```
[◐ Saving...]  ← Spinner + text
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between interactive elements |
| `Enter` | Activate button, confirm extraction |
| `Escape` | Cancel edit, close modal |
| `Arrow keys` | Navigate tabs, list items |
| `Cmd+1-5` | Switch modes directly |

### Focus Management

- Focus trap in modals
- Focus returns to trigger after modal close
- Visible focus rings on all interactive elements
- Skip link to main content

### Screen Reader Considerations

- All icons have `aria-label`
- Extraction cards are `role="article"` with descriptive labels
- Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Status changes announced via `aria-live="polite"`

### Color Contrast

- All text meets WCAG AA (4.5:1 for normal text)
- Interactive elements meet 3:1 contrast
- Don't rely on color alone — use icons/text alongside

---

## Mobile Adaptation

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `< 640px` (mobile) | Single column, stacked cards |
| `640px - 1024px` (tablet) | Two columns where appropriate |
| `> 1024px` (desktop) | Full layout as designed |

### Mobile-Specific Changes

**Identity Bar:**
- Condensed to single line
- Actions move to overflow menu
- Status badge becomes icon only

**Mode Navigation:**
- Horizontal scroll if needed
- Active mode always visible
- Bottom tab bar option for native feel

**Cards:**
- Full width
- Stack vertically
- Swipe gestures for actions (swipe to complete task)

**Capture Mode:**
- Full-screen note input
- Extraction cards stack below
- "Confirm All" becomes sticky footer

**Touch Targets:**
- Minimum 44×44px for all interactive elements
- Increased padding on buttons
- Larger hit areas on chips

### Gestures

| Gesture | Action |
|---------|--------|
| Swipe left on task | Complete |
| Swipe right on task | Reschedule |
| Pull down | Refresh |
| Long press on chip | Show source tooltip |

---

## Appendix: Token Reference

### Colors (from design system)

| Token | Usage |
|-------|-------|
| `primary` | Primary actions, active states |
| `secondary` | Secondary elements, chips |
| `muted` | Disabled, placeholder |
| `muted-foreground` | Secondary text |
| `destructive` | Delete, error, overdue |
| `warning` | Amber alerts, medium progress |
| `success` | Confirm, complete, high progress |
| `border` | Card borders, dividers |
| `card` | Card backgrounds |

### Typography

| Element | Spec |
|---------|------|
| Page title | `text-xl font-medium` |
| Card title | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |
| Body text | `text-sm` |
| Secondary text | `text-sm text-muted-foreground` |
| Button text | `text-sm font-medium` |

### Spacing

| Context | Value |
|---------|-------|
| Card padding | `p-4` |
| Card gap | `gap-4` |
| Section gap | `gap-6` |
| Inline element gap | `gap-2` |
| Button padding | `px-4 py-2` |

---

## Appendix: Related Documents

- `client-profile-agent-architecture.md` — System architecture
- `client-profile-ux-spec.md` — Original spec (superseded by this + architecture doc)
- `CLAUDE.md` — Design system principles
