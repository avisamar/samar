# Client Profile Page — UX Implementation Plan

> Breaking down `/docs/client-profile-ux-guidelines.md` into milestones and tasks

---

## Executive Summary

The UX guidelines describe a **mode-based single-panel layout** with 5 modes (Overview, Capture, Timeline, Tasks, Profile). The current implementation uses a **two-panel layout** (sidebar + tabs). This plan reconciles both approaches and breaks work into independently verifiable tasks.

**Current State:**
- Two-panel layout: Left sidebar (profile sections) + Right tabs (Agent, Notes, Timeline, Meetings)
- Profile Agent (Capture) is functional with proposals, nudges, voice input
- Notes, Timeline, Meetings tabs are placeholders
- No Overview or Tasks mode

**Target State (per UX guidelines):**
- Identity Bar (sticky header)
- Mode Navigation (5 tabs)
- Full-width mode content areas

**Decision:** Adopt UX guidelines layout (full-width mode-based). The existing two-panel layout will be replaced. Profile sections currently in the left sidebar will migrate to the Profile mode.

---

## Milestones Overview

| # | Milestone | Est. Tasks | Dependencies |
|---|-----------|------------|--------------|
| 1 | Foundation & Layout Restructure | 6 | None |
| 2 | Core UI Components | 8 | M1 |
| 3 | Overview Mode | 5 | M1, M2 |
| 4 | Capture Mode (Agentic Experience) | 9 | M1, M2 |
| 5 | Timeline Mode | 5 | M1, M2 |
| 6 | Tasks Mode | 5 | M1, M2 |
| 7 | Profile Mode | 5 | M1, M2 |
| 8 | Empty & Edge States | 6 | M3-M7 |
| 9 | Motion & Feedback | 5 | M3-M7 |
| 10 | Accessibility | 6 | M3-M7 |
| 11 | Mobile Adaptation | 5 | M1-M10 |

---

## Milestone 1: Foundation & Layout Restructure

**Goal:** Establish the core page structure per UX guidelines

### Task 1.1: Create Identity Bar Component
**File:** `components/customers/identity-bar.tsx`

**Requirements:**
- Sticky header with client name, status badge, key attributes
- Back navigation arrow
- Action buttons (call, message, email)
- Overflow menu for secondary actions

**Verification:**
- [ ] Renders client name prominently (`text-xl font-medium`)
- [ ] Status badge is clickable and shows correct relationship stage
- [ ] Action buttons trigger appropriate actions (or show placeholder)
- [ ] Remains sticky on scroll
- [ ] Works in both light/dark mode

---

### Task 1.2: Create Mode Navigation Component
**File:** `components/customers/mode-navigation.tsx`

**Requirements:**
- Horizontal tab bar with 5 modes: Overview, Capture, Timeline, Tasks, Profile
- Active tab styling (`border-b-2 border-primary`)
- Badge support on tabs (e.g., task count on Tasks tab)
- URL updates with mode (`/customers/[id]?mode=capture`)

**Verification:**
- [ ] All 5 tabs render correctly
- [ ] Active tab has correct styling
- [ ] Clicking tab updates URL and switches content
- [ ] Keyboard navigation works (arrow keys)
- [ ] Badge displays on Tasks tab when tasks exist

---

### Task 1.3: Implement Mode Routing
**File:** `app/(dashboard)/customers/[id]/page.tsx` (modify)

**Requirements:**
- Read `mode` query parameter
- Default to "overview" mode
- Pass mode to CustomerProfile component

**Verification:**
- [ ] `/customers/123` defaults to Overview mode
- [ ] `/customers/123?mode=capture` shows Capture mode
- [ ] Invalid mode falls back to Overview
- [ ] Browser back/forward works correctly

---

### Task 1.4: Restructure CustomerProfile Layout
**File:** `components/customers/customer-profile.tsx` (modify)

**Requirements:**
- Replace two-panel layout with full-width mode-based layout
- Identity Bar at top (sticky)
- Mode Navigation below
- Mode content area below navigation

**Verification:**
- [ ] Layout matches UX guidelines visual hierarchy
- [ ] Identity Bar stays visible on scroll
- [ ] Mode content fills available space
- [ ] No horizontal scroll on desktop

---

### Task 1.5: Create Mode Content Container
**File:** `components/customers/mode-content.tsx`

**Requirements:**
- Container that renders appropriate mode based on prop
- Handles mode transitions (crossfade 150ms)
- Preserves scroll position per mode

**Verification:**
- [ ] Correct component renders for each mode
- [ ] Transition animation is smooth (150ms crossfade)
- [ ] Scroll position preserved when switching back to a mode

---

### Task 1.6: Keyboard Shortcuts for Mode Switching
**File:** `components/customers/mode-navigation.tsx` (enhance)

**Requirements:**
- `Cmd+1` through `Cmd+5` switches modes
- Works globally when on customer page

**Verification:**
- [ ] `Cmd+1` switches to Overview
- [ ] `Cmd+2` switches to Capture
- [ ] `Cmd+3` switches to Timeline
- [ ] `Cmd+4` switches to Tasks
- [ ] `Cmd+5` switches to Profile

---

## Milestone 2: Core UI Components

**Goal:** Build reusable components specified in UX guidelines

### Task 2.1: Enhanced Card Component
**File:** `components/ui/card.tsx` (extend)

**Requirements:**
- Add variants: default, attention, success, warning
- Attention variant: `ring-primary` left border accent
- Success/Warning: subtle background tint

**Verification:**
- [ ] Default card matches existing behavior
- [ ] Attention card has visible left accent
- [ ] Success card has subtle green tint
- [ ] Warning card has subtle amber tint

---

### Task 2.2: Status Badge Component
**File:** `components/ui/status-badge.tsx`

**Requirements:**
- Four states: NEW (blue), IN CONVO (amber), OPPORTUNITY (orange), CLIENT (green)
- Pill shape (`rounded-full`)
- Uppercase text, `text-xs font-medium`

**Verification:**
- [ ] Each status renders with correct color
- [ ] Text is uppercase and properly sized
- [ ] Clickable variant triggers callback

---

### Task 2.3: Progress Bar Component
**File:** `components/ui/progress-bar.tsx`

**Requirements:**
- Color-coded by completion: 0-24% red, 25-49% amber, 50-74% gray, 75-100% green
- Height: `h-2`, `rounded-full`
- Shows percentage label optionally

**Verification:**
- [ ] 0% shows empty bar with red fill color
- [ ] 50% shows half-filled gray bar
- [ ] 100% shows full green bar
- [ ] Label displays when enabled

---

### Task 2.4: Interest Chip Component
**File:** `components/ui/interest-chip.tsx`

**Requirements:**
- Confidence-based styling: High (solid), Medium (outlined), Low (dashed)
- Emoji prefix support
- Tooltip on hover showing source

**Verification:**
- [ ] High confidence chip has solid background
- [ ] Medium confidence chip has outlined border
- [ ] Low confidence chip has dashed border
- [ ] Hover shows source tooltip

---

### Task 2.5: Confidence Indicator Component
**File:** `components/ui/confidence-indicator.tsx`

**Requirements:**
- Three levels: High (green dot), Medium (amber dot), Low (gray outline + "Inferred")
- Small text with dot indicator

**Verification:**
- [ ] High shows green filled dot
- [ ] Medium shows amber filled dot
- [ ] Low shows gray outline dot with "Inferred" label

---

### Task 2.6: Extraction Card Component
**File:** `components/customers/extraction-card.tsx`

**Requirements:**
- Header with icon and field/type label
- Proposed value display
- Evidence quote block (italic, muted)
- Confidence indicator
- Confirm/Edit/Reject action buttons

**Verification:**
- [ ] All anatomy elements render correctly
- [ ] Evidence quote styled distinctly
- [ ] Confirm button triggers confirmation
- [ ] Edit button opens inline editor
- [ ] Reject button dismisses card

---

### Task 2.7: Inline Editor Component
**File:** `components/ui/inline-editor.tsx`

**Requirements:**
- Idle state: displays value with Edit button
- Edit state: input field with Save/Cancel buttons
- Transition: 150ms ease
- Keyboard: Enter saves, Escape cancels

**Verification:**
- [ ] Click Edit enters edit mode
- [ ] Input auto-focuses on edit
- [ ] Enter key saves value
- [ ] Escape key cancels without saving
- [ ] Save button updates value

---

### Task 2.8: Expandable Section Component
**File:** `components/ui/expandable-section.tsx`

**Requirements:**
- Collapsed/expanded states with chevron rotation
- Optional progress bar in header
- Slide down animation (200ms)
- Accordion mode optional (only one open at a time)

**Verification:**
- [ ] Click header toggles section
- [ ] Chevron rotates 90° on expand
- [ ] Content slides down smoothly
- [ ] Accordion mode limits to one open section

---

## Milestone 3: Overview Mode

**Goal:** Build the "call prep, at-a-glance" mode

### Task 3.1: Overview Mode Container
**File:** `components/customers/modes/overview-mode.tsx`

**Requirements:**
- Layout container for Overview mode cards
- Responsive grid layout

**Verification:**
- [ ] Renders when Overview mode is active
- [ ] Contains all Overview cards
- [ ] Responsive on different screen sizes

---

### Task 3.2: Prep For Call Card
**File:** `components/customers/overview/prep-card.tsx`

**Requirements:**
- Key context for call prep
- Last interaction summary
- Primary goal reminder
- Important notes/flags

**Verification:**
- [ ] Shows last meeting date and summary
- [ ] Displays primary goal prominently
- [ ] Shows important flags/notes
- [ ] Empty state when no data

---

### Task 3.3: Needs Attention Card
**File:** `components/customers/overview/needs-attention-card.tsx`

**Requirements:**
- Pending proposals count
- Overdue tasks
- Alerts/flags requiring action
- "All caught up" state when empty

**Verification:**
- [ ] Shows count of pending proposals
- [ ] Lists overdue tasks with due dates
- [ ] Shows "All caught up" when nothing pending
- [ ] Each item is clickable to navigate

---

### Task 3.4: Profile Completion Summary Card
**File:** `components/customers/overview/completion-card.tsx`

**Requirements:**
- Overall completion percentage
- Per-section progress bars
- Quick actions to fill gaps

**Verification:**
- [ ] Shows overall % prominently
- [ ] Lists each section with progress bar
- [ ] Click on section navigates to Profile mode

---

### Task 3.5: Recent Activity Card
**File:** `components/customers/overview/recent-activity-card.tsx`

**Requirements:**
- Last 3-5 interactions preview
- Date, type, and summary for each
- "View all" link to Timeline mode

**Verification:**
- [ ] Shows recent interactions chronologically
- [ ] Each entry shows date and type icon
- [ ] "View all" navigates to Timeline mode

---

## Milestone 4: Capture Mode (Agentic Experience)

**Goal:** Build the note input and extraction workflow

### Task 4.1: Capture Mode Container
**File:** `components/customers/modes/capture-mode.tsx`

**Requirements:**
- Layout for Capture mode
- Note input area at top
- Extraction results below

**Verification:**
- [ ] Renders when Capture mode is active
- [ ] Note input is prominently placed
- [ ] Extraction area shows below input

---

### Task 4.2: Note Input Component
**File:** `components/customers/capture/note-input.tsx`

**Requirements:**
- Expandable textarea (`min-h-[120px]`)
- Placeholder: "Type or speak your notes..."
- Voice button (microphone icon)
- Save Note button

**Verification:**
- [ ] Textarea expands as content grows
- [ ] Placeholder text displays correctly
- [ ] Voice button is visible and clickable
- [ ] Save Note button submits content

---

### Task 4.3: Voice Input Integration
**File:** `components/customers/capture/voice-input.tsx`

**Requirements:**
- Microphone button starts recording
- Visual feedback during recording
- Transcription via existing AWS Transcribe integration
- Transcribed text populates note input

**Verification:**
- [ ] Click mic starts recording with visual indicator
- [ ] Recording can be stopped
- [ ] Transcription appears in textarea
- [ ] Works on supported browsers

---

### Task 4.4: Processing State Component
**File:** `components/customers/capture/processing-state.tsx`

**Requirements:**
- Indeterminate progress bar with `animate-pulse`
- "Analyzing..." text
- Shows after note saved, during extraction

**Verification:**
- [ ] Appears after Save Note clicked
- [ ] Pulsing animation is visible
- [ ] Disappears when extraction completes

---

### Task 4.5: Extraction Results Container
**File:** `components/customers/capture/extraction-results.tsx`

**Requirements:**
- "I picked up a few things" header
- List of extraction cards
- "Confirm All" bulk action button
- Empty state: "No profile updates detected"

**Verification:**
- [ ] Header displays when extractions exist
- [ ] Multiple extraction cards render
- [ ] Confirm All button shows count
- [ ] Empty state shows appropriate message

---

### Task 4.6: Extraction Card Interactions
**File:** `components/customers/extraction-card.tsx` (enhance)

**Requirements:**
- Confirm: saves to profile, collapses with checkmark
- Edit: opens inline editor, then confirm
- Reject: dismisses card without saving
- Keyboard: Enter=Confirm, E=Edit, Backspace=Reject

**Verification:**
- [ ] Confirm saves field and collapses card
- [ ] Edit mode allows value modification
- [ ] Reject removes card from list
- [ ] Keyboard shortcuts work when focused

---

### Task 4.7: Inferred vs Explicit Styling
**File:** `components/customers/extraction-card.tsx` (enhance)

**Requirements:**
- Explicit: solid border
- Inferred: dashed border + reasoning explanation
- Visual distinction clear

**Verification:**
- [ ] Explicit extractions have solid borders
- [ ] Inferred extractions have dashed borders
- [ ] Inferred shows "you didn't say this directly" + reasoning

---

### Task 4.8: Bulk Confirm Action
**File:** `components/customers/capture/bulk-actions.tsx`

**Requirements:**
- "Confirm All (n)" button
- Count updates as items confirmed/rejected
- Disabled when no pending items
- Success state: all cards collapse, toast

**Verification:**
- [ ] Button shows accurate pending count
- [ ] Click confirms all pending extractions
- [ ] Button disabled when count is 0
- [ ] Success toast appears after bulk confirm

---

### Task 4.9: Saved Note Display
**File:** `components/customers/capture/saved-note.tsx`

**Requirements:**
- Shows saved note content
- "Saved" checkmark indicator
- Timestamp of when saved

**Verification:**
- [ ] Note content displays after save
- [ ] Checkmark and "Saved" label visible
- [ ] Timestamp is accurate

---

## Milestone 5: Timeline Mode

**Goal:** Build the chronological event history view

### Task 5.1: Timeline Mode Container
**File:** `components/customers/modes/timeline-mode.tsx`

**Requirements:**
- Vertical timeline layout
- Filter controls at top
- Infinite scroll or pagination

**Verification:**
- [ ] Renders when Timeline mode is active
- [ ] Timeline entries display vertically
- [ ] Scroll loads more entries

---

### Task 5.2: Timeline Entry Component
**File:** `components/customers/timeline/timeline-entry.tsx`

**Requirements:**
- Entry types: note, meeting, call, profile update, task completion
- Icon + timestamp + summary
- Expandable for full details

**Verification:**
- [ ] Each type has distinct icon
- [ ] Timestamp formatted correctly
- [ ] Click expands to show details
- [ ] Profile updates show field changes

---

### Task 5.3: Timeline Filter Component
**File:** `components/customers/timeline/timeline-filter.tsx`

**Requirements:**
- Filter by entry type
- Date range filter
- Search within entries

**Verification:**
- [ ] Type filter shows/hides entry types
- [ ] Date range limits visible entries
- [ ] Search highlights matching text

---

### Task 5.4: Profile Change Entry
**File:** `components/customers/timeline/profile-change-entry.tsx`

**Requirements:**
- Shows field name and old → new value
- Source of change (note, RM edit, etc.)
- Confidence level when applicable

**Verification:**
- [ ] Field name prominently displayed
- [ ] Before/after values clearly shown
- [ ] Source attribution visible

---

### Task 5.5: Timeline Data Integration
**File:** `lib/crm/timeline.ts`

**Requirements:**
- Query to fetch timeline data
- Combine notes, meetings, profile changes
- Sort chronologically

**Verification:**
- [ ] API returns combined timeline data
- [ ] All event types included
- [ ] Sorted by timestamp descending

---

## Milestone 6: Tasks Mode

**Goal:** Build the follow-up management view

### Task 6.1: Tasks Mode Container
**File:** `components/customers/modes/tasks-mode.tsx`

**Requirements:**
- Task list with filters
- Add Task button
- Status sections (pending, completed)

**Verification:**
- [ ] Renders when Tasks mode is active
- [ ] Tasks grouped by status
- [ ] Add Task button visible

---

### Task 6.2: Task Item Component
**File:** `components/customers/tasks/task-item.tsx`

**Requirements:**
- Checkbox for completion
- Task title and due date
- Priority indicator
- Quick actions (edit, delete, reschedule)

**Verification:**
- [ ] Checkbox toggles completion
- [ ] Due date shows with overdue styling
- [ ] Actions appear on hover
- [ ] Priority color-coded

---

### Task 6.3: Add Task Dialog
**File:** `components/customers/tasks/add-task-dialog.tsx`

**Requirements:**
- Task title input
- Due date picker
- Priority selector
- Notes field (optional)

**Verification:**
- [ ] Dialog opens from Add Task button
- [ ] All fields function correctly
- [ ] Save creates new task
- [ ] Cancel closes without saving

---

### Task 6.4: Task Filters
**File:** `components/customers/tasks/task-filters.tsx`

**Requirements:**
- Filter by status (all, pending, completed)
- Sort by due date, priority, created
- Search tasks

**Verification:**
- [ ] Status filter works
- [ ] Sort options reorder list
- [ ] Search filters visible tasks

---

### Task 6.5: Tasks Data Integration
**File:** `lib/crm/tasks.ts`

**Requirements:**
- CRUD operations for tasks
- Filter and sort queries
- Link tasks to customer

**Verification:**
- [ ] Create task saves to database
- [ ] Update task modifies correctly
- [ ] Delete task removes from list
- [ ] Tasks scoped to customer

---

## Milestone 7: Profile Mode

**Goal:** Build the structured data editing view

### Task 7.1: Profile Mode Container
**File:** `components/customers/modes/profile-mode.tsx`

**Requirements:**
- All profile sections as expandable sections
- Section completion indicators
- Edit capabilities per field

**Verification:**
- [ ] Renders when Profile mode is active
- [ ] All 10+ sections displayed
- [ ] Completion % per section visible

---

### Task 7.2: Profile Section Component
**File:** `components/customers/profile/profile-section.tsx` (refactor existing)

**Requirements:**
- Expandable with progress bar in header
- Field list with inline editing
- Empty field shows "+ Add" button

**Verification:**
- [ ] Section expands/collapses
- [ ] Progress bar in header accurate
- [ ] Fields show current values
- [ ] Empty fields have Add button

---

### Task 7.3: Field Row Component
**File:** `components/customers/profile/field-row.tsx` (refactor existing)

**Requirements:**
- Label + value + edit button layout
- Different input types (text, date, enum, etc.)
- Inline editing capability

**Verification:**
- [ ] All field types render correctly
- [ ] Edit enters inline edit mode
- [ ] Save persists change
- [ ] Validation for required fields

---

### Task 7.4: Profile Save All Button
**File:** `components/customers/profile/profile-actions.tsx`

**Requirements:**
- Sticky footer with Save All button
- Shows unsaved changes count
- Disabled when no changes

**Verification:**
- [ ] Button appears when changes exist
- [ ] Save All persists all changes
- [ ] Count updates as fields modified

---

### Task 7.5: Profile Audit Trail
**File:** `components/customers/profile/audit-info.tsx`

**Requirements:**
- Per-field: last updated date and source
- Expandable audit history
- Links to source note/meeting

**Verification:**
- [ ] Hover shows last updated info
- [ ] Expand shows change history
- [ ] Source links navigate correctly

---

## Milestone 8: Empty & Edge States

**Goal:** Handle all empty and edge cases gracefully

### Task 8.1: No Client Selected State
**File:** `components/customers/empty-states/no-client.tsx`

**Verification:**
- [ ] Displays when no customer ID in URL
- [ ] Clear message and action to select client

---

### Task 8.2: New Client State
**File:** `components/customers/empty-states/new-client.tsx`

**Verification:**
- [ ] Shows when client has no data
- [ ] Prompt to add first note
- [ ] Button navigates to Capture mode

---

### Task 8.3: No Extractions State
**File:** `components/customers/empty-states/no-extractions.tsx`

**Verification:**
- [ ] Shows after note saved but nothing extracted
- [ ] Clear, non-alarming message
- [ ] Note is confirmed as saved

---

### Task 8.4: No Tasks State
**File:** `components/customers/empty-states/no-tasks.tsx`

**Verification:**
- [ ] Shows in Tasks mode when empty
- [ ] Add Task button prominent
- [ ] Explanation of how tasks appear

---

### Task 8.5: All Caught Up State
**File:** `components/customers/empty-states/all-caught-up.tsx`

**Verification:**
- [ ] Shows in Needs Attention when nothing pending
- [ ] Positive, celebratory tone
- [ ] Checkmark icon

---

### Task 8.6: Error States
**File:** `components/customers/empty-states/error-state.tsx`

**Verification:**
- [ ] Generic error display
- [ ] Retry button when applicable
- [ ] Error message is user-friendly

---

## Milestone 9: Motion & Feedback

**Goal:** Implement animations and feedback per guidelines

### Task 9.1: Tab Switch Animation
**Verification:**
- [ ] 150ms crossfade between modes
- [ ] No jarring layout shifts

---

### Task 9.2: Card Expand/Collapse Animation
**Verification:**
- [ ] 200ms ease-in-out animation
- [ ] Chevron rotates smoothly

---

### Task 9.3: Button Loading States
**Verification:**
- [ ] Spinner + text during loading
- [ ] 150ms transition to loading state

---

### Task 9.4: Toast Notifications
**Verification:**
- [ ] Success toast on confirm actions
- [ ] Error toast with shake animation
- [ ] 3-second auto-dismiss
- [ ] Bottom-right placement

---

### Task 9.5: Inline Loading States
**Verification:**
- [ ] Full page: centered spinner
- [ ] Inline: progress bar animation
- [ ] Button: spinner with text

---

## Milestone 10: Accessibility

**Goal:** Meet accessibility requirements

### Task 10.1: Keyboard Navigation
**Verification:**
- [ ] Tab moves between elements
- [ ] Enter activates buttons
- [ ] Escape cancels/closes
- [ ] Arrow keys navigate tabs

---

### Task 10.2: Focus Management
**Verification:**
- [ ] Focus trap in modals
- [ ] Focus returns after modal close
- [ ] Visible focus rings
- [ ] Skip link to main content

---

### Task 10.3: Screen Reader Labels
**Verification:**
- [ ] All icons have aria-label
- [ ] Extraction cards have role="article"
- [ ] Progress bars have aria-value attributes

---

### Task 10.4: Live Regions
**Verification:**
- [ ] Status changes use aria-live="polite"
- [ ] Toast announcements work

---

### Task 10.5: Color Contrast
**Verification:**
- [ ] Text meets WCAG AA (4.5:1)
- [ ] Interactive elements meet 3:1
- [ ] No color-only indicators

---

### Task 10.6: Screen Reader Testing
**Verification:**
- [ ] Test with VoiceOver (macOS)
- [ ] All actions accessible
- [ ] Navigation understandable

---

## Milestone 11: Mobile Adaptation

**Goal:** Responsive design for all breakpoints

### Task 11.1: Mobile Breakpoint Styles
**Verification:**
- [ ] `< 640px`: single column, stacked cards
- [ ] `640-1024px`: two columns where appropriate
- [ ] `> 1024px`: full desktop layout

---

### Task 11.2: Mobile Identity Bar
**Verification:**
- [ ] Condensed to single line
- [ ] Actions in overflow menu
- [ ] Status badge icon only

---

### Task 11.3: Mobile Mode Navigation
**Verification:**
- [ ] Horizontal scroll if needed
- [ ] Active mode always visible
- [ ] Touch targets 44×44px minimum

---

### Task 11.4: Mobile Capture Mode
**Verification:**
- [ ] Full-screen note input
- [ ] Sticky footer for Confirm All
- [ ] Touch-friendly buttons

---

### Task 11.5: Touch Gestures
**Verification:**
- [ ] Swipe left on task to complete
- [ ] Swipe right on task to reschedule
- [ ] Pull down to refresh
- [ ] Long press shows tooltips

---

## Critical Files Summary

| File | Milestone | Action |
|------|-----------|--------|
| `app/(dashboard)/customers/[id]/page.tsx` | M1 | Modify |
| `components/customers/customer-profile.tsx` | M1 | Modify |
| `components/customers/identity-bar.tsx` | M1 | Create |
| `components/customers/mode-navigation.tsx` | M1 | Create |
| `components/customers/mode-content.tsx` | M1 | Create |
| `components/customers/modes/*.tsx` | M3-M7 | Create |
| `components/customers/capture/*.tsx` | M4 | Create/Modify |
| `components/customers/timeline/*.tsx` | M5 | Create |
| `components/customers/tasks/*.tsx` | M6 | Create |
| `components/customers/profile/*.tsx` | M7 | Modify |
| `components/ui/status-badge.tsx` | M2 | Create |
| `components/ui/progress-bar.tsx` | M2 | Create |
| `components/ui/interest-chip.tsx` | M2 | Create |
| `components/ui/confidence-indicator.tsx` | M2 | Create |
| `components/ui/inline-editor.tsx` | M2 | Create |
| `components/ui/expandable-section.tsx` | M2 | Create |

---

## Verification Strategy

Each task can be verified by:
1. **Visual inspection** — Component renders correctly
2. **Interaction testing** — Click/keyboard actions work
3. **State verification** — Data persists correctly
4. **Accessibility audit** — Screen reader and keyboard work
5. **Responsive check** — Works on mobile/tablet/desktop

---

## Recommended Implementation Order

1. **M1** Foundation (required for everything else)
2. **M2** Core Components (reusable across modes)
3. **M4** Capture Mode (existing agent functionality)
4. **M3** Overview Mode (simple, high value)
5. **M7** Profile Mode (refactor existing)
6. **M5** Timeline Mode
7. **M6** Tasks Mode
8. **M8** Empty States
9. **M9** Motion & Feedback
10. **M10** Accessibility
11. **M11** Mobile Adaptation
