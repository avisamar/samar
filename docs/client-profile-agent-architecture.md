# Client Profile Page — Agent Architecture

> **Version**: 1.0
> **Status**: Draft
> **Last Updated**: 2026-01-29
> **Companion Doc**: `client-profile-ux-spec.md`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Principle](#core-principle)
3. [Workflows Analysis](#workflows-analysis)
4. [Page Architecture](#page-architecture)
5. [Mode Specifications](#mode-specifications)
6. [Agent Boundaries](#agent-boundaries)
7. [System-Level Features](#system-level-features)
8. [Data Flow](#data-flow)
9. [Confirmation & Trust Model](#confirmation--trust-model)
10. [Implementation Priorities](#implementation-priorities)

---

## Executive Summary

This document defines the architecture for integrating an **agentic capture flow** into the client profile page without disrupting other essential workflows.

**The core insight**: The profile page serves multiple workflows. The AI agent excels at one (capture and extraction) but shouldn't colonize the rest. Each workflow deserves purpose-built UX.

**The solution**: A **multi-mode page architecture** where:
- The agent operates exclusively in **Capture mode**
- Other modes (Overview, Timeline, Tasks, Profile) use traditional UX patterns
- System-level features (reminders, reports, exports) operate independently

---

## Core Principle

> **The agent is a capture specialist, not a general assistant.**

| What the Agent Does | What the Agent Doesn't Do |
|--------------------|---------------------------|
| Accepts natural language input | Manage tasks |
| Extracts structured profile data | Display timeline history |
| Suggests interests and signals | Generate reports |
| Catches implied tasks | Schedule meetings |
| Gets RM confirmation | Send reminders |
| | Export data for advisory |

The agent is **powerful but contained**. It does one thing brilliantly and doesn't interfere with other workflows.

---

## Workflows Analysis

### Workflow Inventory

| Workflow | User Need | Agent Helpful? | Optimal UX Pattern |
|----------|-----------|----------------|-------------------|
| **Call prep** | Quick summary, key points, gaps to explore | No | Curated read-only dashboard |
| **Note capture** | Frictionless input, smart extraction, confirmation | **Yes** | Conversational canvas |
| **Task management** | Create, view, complete, reschedule tasks | No | Standard task list |
| **Timeline review** | Chronological history of all events | No | Filterable timeline |
| **Profile editing** | Direct field corrections and updates | Partially | Form-based CRUD |
| **Meeting scheduling** | Calendar, availability, invites | No | Calendar integration |
| **Report generation** | Structured export based on profile/interests | No | Template-based builder |
| **Advisory handoff** | Dump of all client data | No | Structured data export |
| **Engagement reminders** | "No contact in X weeks" nudge | No | Rule-based notifications |

### Key Insight

The agent adds value only in the **capture workflow**. For all other workflows, it either adds friction or introduces unnecessary complexity.

---

## Page Architecture

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Client Name  •  Status  •  RM: Name            [Actions Menu]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Overview]  [Capture]  [Timeline]  [Tasks]  [Profile]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mode Summary

| Mode | Purpose | Primary Action | Agent Present |
|------|---------|---------------|---------------|
| **Overview** | Call prep, at-a-glance context | Read | No |
| **Capture** | Add notes, extract data | Write | **Yes** |
| **Timeline** | Review history, audit trail | Read | No |
| **Tasks** | Manage follow-ups | CRUD | No |
| **Profile** | View/edit structured fields | CRUD | No |

### Information Flow

```
                    ┌─────────────┐
                    │   CAPTURE   │
                    │   (Agent)   │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ PROFILE  │   │ TIMELINE │   │  TASKS   │
     │ (Fields) │   │ (Events) │   │ (Todos)  │
     └──────────┘   └──────────┘   └──────────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  OVERVIEW   │
                    │  (Summary)  │
                    └─────────────┘
```

**Capture feeds into everything else.** Overview reads from Profile, Timeline, and Tasks to generate summaries.

---

## Mode Specifications

### Mode 1: Overview

**Purpose**: Enable RM to prepare for calls and get at-a-glance context.

**Design Philosophy**: Read-optimized. No input here — just smart summaries.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  PREP FOR YOUR CALL                                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Key Context                                                    │
│  • [Top 3-5 most relevant facts for this call]                  │
│  • [Recent changes or updates]                                  │
│  • [Relationship dynamics to remember]                          │
│                                                                 │
│  You Promised                                                   │
│  • [Commitments from previous conversations]                    │
│                                                                 │
│  Gap to Explore                                                 │
│  • [High-priority field not yet captured]                       │
│                                                                 │
│  Last Contact: [X days ago] ([type], [duration])                │
│                                                                 │
├──────────────────────────────┬──────────────────────────────────┤
│  PROFILE SNAPSHOT            │  INTERESTS                       │
│  [Section progress bars]     │  [Interest chips]                │
│  [View Full Profile →]       │  [+ Add]                         │
├──────────────────────────────┼──────────────────────────────────┤
│  TASKS                       │  RECENT ACTIVITY                 │
│  [Active tasks list]         │  [Last 3-5 events]               │
│  [+ Add Task]                │  [View Timeline →]               │
├──────────────────────────────┴──────────────────────────────────┤
│  NEEDS ATTENTION                                                │
│  [Agent proposals pending]                                      │
│  [Engagement alerts]                                            │
│  [Overdue tasks]                                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Components

| Component | Content | Source |
|-----------|---------|--------|
| **Prep for Your Call** | AI-generated summary of key context | Profile + Notes |
| **You Promised** | Extracted commitments from notes | Agent extraction |
| **Gap to Explore** | Highest-priority unfilled field | Profile schema |
| **Profile Snapshot** | Section completion percentages | Profile |
| **Interests** | Confirmed personal/financial interests | Interests store |
| **Tasks** | Active tasks for this client | Tasks |
| **Recent Activity** | Last 3-5 timeline events | Timeline |
| **Needs Attention** | Pending proposals, alerts, overdue | Multiple sources |

#### Behavior

- **Read-only** — No inline editing
- **Smart summaries** — "Key Context" is generated, not just listed fields
- **Deep links** — Every section links to its full view
- **Call prep focused** — Optimized for "what do I need to know right now?"

---

### Mode 2: Capture (Agent Mode)

**Purpose**: Frictionless note input with intelligent extraction and RM confirmation.

**Design Philosophy**: Conversational input, structured output, human-gated persistence.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  CAPTURE                                           [Voice 🎤]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Type or speak your notes...                             │  │
│  │                                                          │  │
│  │  [Note content appears here as RM types/speaks]          │  │
│  │                                                          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                    [Save Note]  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─ I picked up ────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  [Extraction Card 1 - Profile Update]                    │  │
│  │  [Extraction Card 2 - Interest]                          │  │
│  │  [Extraction Card 3 - Implied Task]                      │  │
│  │                                                          │  │
│  │                                          [Confirm All]   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  PREVIOUS NOTES                                                 │
│  [List of recent notes with unconfirmed extraction indicators]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Extraction Card Types

**Profile Update Card**
```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 [Field Name]                                                │
│  [Proposed Value]                                               │
│                                                                 │
│  "[Exact quote from note that supports this extraction]"        │
│                                                                 │
│  ● Confidence: High | Medium | Low                              │
│  ○ Inferred (if not explicit)                                   │
│                                                                 │
│                                     [Confirm] [Edit] [Reject]   │
└─────────────────────────────────────────────────────────────────┘
```

**Interest Card**
```
┌─────────────────────────────────────────────────────────────────┐
│  💡 New Interest: [Interest Label]                              │
│  Type: Personal | Financial                                     │
│                                                                 │
│  "[Exact quote from note]"                                      │
│                                                                 │
│  ● Confidence: High | Medium | Low                              │
│                                                                 │
│                                     [Confirm] [Edit] [Reject]   │
└─────────────────────────────────────────────────────────────────┘
```

**Implied Task Card**
```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Suggested Task                                              │
│  [Task description]                                             │
│                                                                 │
│  "[Exact quote suggesting this task]"                           │
│  e.g., "I should send him some material"                        │
│                                                                 │
│  Due: [Suggested date]                                          │
│                                                                 │
│                                       [Add Task] [Dismiss]      │
└─────────────────────────────────────────────────────────────────┘
```

#### Extraction Logic

| Extraction Type | Trigger | Confidence Factors |
|-----------------|---------|-------------------|
| **Profile field** | Mention of data matching schema field | Explicit statement > Implicit mention |
| **Interest** | Hobby, goal, concern, preference mentioned | Repeated mentions increase confidence |
| **Task** | "I should...", "Need to...", "Will send...", commitment language | Specificity of action |

#### Confirmation States

| State | Visual | Meaning |
|-------|--------|---------|
| **Proposed** | Card visible with actions | Agent extracted, awaiting RM decision |
| **Confirmed** | Success toast, card collapses | Saved to structured data |
| **Edited** | Inline edit, then confirm | Modified by RM, then saved |
| **Rejected** | Card dismissed | Discarded, not saved, not shown again |
| **Deferred** | Remains in "Previous Notes" | RM didn't act; can confirm later |

#### Voice Input

- Press-and-hold or toggle for voice recording
- Real-time transcription displayed
- Transcription editable before save
- Agent processes transcription same as typed text

---

### Mode 3: Timeline

**Purpose**: Chronological, filterable history of all client interactions and changes.

**Design Philosophy**: Audit-grade accuracy. Every event traceable.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TIMELINE                      [Filter ▼]  [Search]  [Export]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filter: [All] [Notes] [Calls] [Status] [Profile] [Tasks]       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Today                                                          │
│  │                                                              │
│  ├─ 10:45 AM  📝 Note added                                     │
│  │            [Note preview text...]                            │
│  │            ├─ ✓ Goal: Overseas Education confirmed           │
│  │            ├─ ✓ Interest: Tax Efficiency added               │
│  │            └─ ✓ Task: Send material created                  │
│  │                                                              │
│  Yesterday                                                      │
│  │                                                              │
│  ├─ 3:00 PM   ✓ Status: In Conversation → Opportunity           │
│  │            Changed by: Priya (RM)                            │
│  │                                                              │
│  ├─ 2:45 PM   📞 Call logged                                    │
│  │            Duration: 12 minutes                              │
│  │            [Linked note]                                     │
│  │                                                              │
│  ├─ 2:30 PM   📝 Note added                                     │
│  │            [Note preview text...]                            │
│  │            └─ 2 unconfirmed extractions [Review →]           │
│  │                                                              │
│  Jan 20                                                         │
│  │                                                              │
│  └─ 11:00 AM  ⭐ Lead created                                    │
│               Created by: Priya (RM)                            │
│                                                                 │
│  [Load more...]                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Event Types

| Event Type | Icon | Tracked Data |
|------------|------|--------------|
| **Note added** | 📝 | Content preview, extractions, confirmation status |
| **Call logged** | 📞 | Duration, linked note |
| **Meeting** | 📅 | Duration, attendees, linked note |
| **Status change** | ✓ | From → To, changed by |
| **Profile update** | ✏️ | Field, old value → new value, source |
| **Task created** | 📋 | Task description, source |
| **Task completed** | ✅ | Task description, completion date |
| **Interest added** | 💡 | Interest label, source |
| **Lead created** | ⭐ | Created by, initial data |

#### Filtering

- **By type**: Notes, Calls, Status, Profile, Tasks
- **By date range**: Custom date picker
- **By actor**: RM, System, Agent
- **Search**: Full-text search across notes and events

---

### Mode 4: Tasks

**Purpose**: Manage follow-ups and action items for this client.

**Design Philosophy**: Standard task management with context linking.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TASKS                                            [+ Add Task]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Overdue (2)                                                    │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ ○ Follow up on tax planning discussion                      │
│  │   Due: Jan 27 (2 days overdue)  •  From note on Jan 25      │
│  │   [Complete] [Reschedule] [Edit] [Delete]                   │
│  ├─────────────────────────────────────────────────────────────┤
│  │ ○ Send education planning options                           │
│  │   Due: Jan 28 (1 day overdue)  •  From note on Jan 28       │
│  │   [Complete] [Reschedule] [Edit] [Delete]                   │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  Upcoming (3)                                                   │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ ○ Send tax harvesting material                              │
│  │   Due: Feb 1  •  From note on Jan 29                        │
│  ├─────────────────────────────────────────────────────────────┤
│  │ ○ Schedule quarterly review                                 │
│  │   Due: Feb 15  •  Manual                                    │
│  ├─────────────────────────────────────────────────────────────┤
│  │ ○ Check on daughter's university applications               │
│  │   Due: Mar 1  •  From note on Jan 29                        │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  Completed (5)                                         [Show ▼] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Task Properties

| Property | Description |
|----------|-------------|
| **Title** | Task description |
| **Due date** | When it should be done |
| **Source** | "From note on [date]" or "Manual" |
| **Status** | Open, Completed |
| **Created** | Timestamp |
| **Completed** | Timestamp (if done) |

#### Task Creation

- **Manual**: Click "+ Add Task", fill form
- **Agent-suggested**: Extracted from notes in Capture mode
- **From timeline**: Any note can have tasks added

---

### Mode 5: Profile

**Purpose**: Direct view and edit of all structured profile fields.

**Design Philosophy**: Complete access for corrections, audits, and exports.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  PROFILE                          [Export ▼]  [View Audit Log]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Overall Completion: 58%  ████████████░░░░░░░░░                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  IDENTITY & CONTACT                                ████████ 75% │
│  [Expanded section with all fields]                             │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Field            │ Value              │ Source    │ Action  │
│  ├──────────────────┼────────────────────┼───────────┼─────────┤
│  │ Salutation       │ Mr                 │ Manual    │ [Edit]  │
│  │ Full Name        │ Rahul Mehta        │ Manual    │ [Edit]  │
│  │ Mobile           │ +91 98765 43210    │ Manual    │ [Edit]  │
│  │ Email            │ rahul@example.com  │ Manual    │ [Edit]  │
│  │ Preferred Name   │ —                  │ —         │ [+ Add] │
│  │ Language         │ English            │ Agent     │ [Edit]  │
│  │ Channel          │ WhatsApp           │ Agent     │ [Edit]  │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  PROFESSIONAL & INCOME                             ██████░░ 60% │
│  [Collapsed — click to expand]                                  │
│                                                                 │
│  INVESTMENT ORIENTATION                            ████░░░░ 50% │
│  [Collapsed — click to expand]                                  │
│                                                                 │
│  BEHAVIORAL & MINDSET                              ██░░░░░░ 25% │
│  [Collapsed — click to expand]                                  │
│                                                                 │
│  GOALS & PLANNING                                  ░░░░░░░░  0% │
│  [Collapsed — click to expand]                                  │
│                                                                 │
│  COMMUNICATION PREFERENCES                         ████░░░░ 40% │
│  [Collapsed — click to expand]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Field Display

| Column | Content |
|--------|---------|
| **Field** | Display name from schema |
| **Value** | Current value or "—" if empty |
| **Source** | Manual, Agent, Note, System |
| **Action** | Edit (if editable), + Add (if empty) |

#### Source Indicators

| Source | Meaning | Visual |
|--------|---------|--------|
| **Manual** | RM entered directly | Plain text |
| **Agent** | Extracted and confirmed | Small robot icon |
| **Note** | Linked to specific note | Link icon |
| **System** | Auto-generated | Lock icon |

#### Export Options

- **PDF Report**: Formatted client summary
- **JSON**: Full structured data for advisory systems
- **CSV**: Spreadsheet-compatible export
- **Audit Log**: Complete change history

---

## Agent Boundaries

### Where Agent Operates

| Context | Agent Active | Notes |
|---------|-------------|-------|
| Capture mode | **Yes** | Full extraction and suggestion |
| Note saved anywhere | **Yes** | Background processing |
| Overview mode | No | Read-only summaries |
| Timeline mode | No | Display only |
| Tasks mode | No | Standard CRUD |
| Profile mode | No | Direct field editing |

### What Agent Extracts

| Extraction | Target | Confirmation Required |
|------------|--------|----------------------|
| Profile field values | Profile store | **Yes** |
| Interests (personal/financial) | Interests store | **Yes** |
| Implied tasks | Tasks store | **Yes** |
| Commitments ("You promised") | Displayed in Overview | No (display only) |

### What Agent Does NOT Do

- Manage tasks
- Send notifications
- Schedule meetings
- Generate reports
- Make recommendations
- Contact clients
- Auto-persist any data

---

## System-Level Features

These operate independently of the agent:

### Reminder System

**Rule-based**, not agent-based.

| Rule | Trigger | Action |
|------|---------|--------|
| No contact | 4 weeks since last note/call | Show in Needs Attention |
| Task overdue | Due date passed | Show in Needs Attention |
| Profile incomplete | High-priority fields empty after 30 days | Show in Needs Attention |
| Follow-up due | Scheduled follow-up date | Show in Needs Attention |

#### Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│  ENGAGEMENT RULES (Settings)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☑ Alert if no contact in [4] weeks                             │
│  ☑ Alert if high-priority fields incomplete after [30] days     │
│  ☑ Alert [2] days before scheduled follow-up                    │
│  ☑ Alert on task overdue                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Report Generation

**Template-based**, not agent-generated.

| Report Type | Content | Trigger |
|-------------|---------|---------|
| Client Summary | Profile + Interests + Recent Activity | Manual |
| Portfolio Review | Profile + Investment data | Manual |
| Compliance Export | Full audit trail | Manual / Scheduled |
| Advisory Handoff | All structured data | Manual |

### Meeting Scheduling

**Calendar integration**, not agent-managed.

- "Schedule Meeting" button in header
- Opens calendar integration (Google, Outlook)
- Meeting logged to timeline when confirmed
- Optional: Link note to meeting

---

## Data Flow

### Write Path (Capture → Storage)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   RM Input  │ ──▶ │   Agent     │ ──▶ │   Draft     │
│ (Note/Voice)│     │ Extraction  │     │   Layer     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ RM Confirms │
                                        └──────┬──────┘
                                               │
                    ┌──────────────────────────┼─────────────────────┐
                    │                          │                     │
                    ▼                          ▼                     ▼
             ┌─────────────┐           ┌─────────────┐       ┌─────────────┐
             │   Profile   │           │  Interests  │       │    Tasks    │
             │   Store     │           │   Store     │       │   Store     │
             └─────────────┘           └─────────────┘       └─────────────┘
                    │                          │                     │
                    └──────────────────────────┼─────────────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Timeline   │
                                        │   (Event)   │
                                        └─────────────┘
```

### Read Path (Storage → Display)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Profile   │     │  Interests  │     │    Tasks    │
│   Store     │     │   Store     │     │   Store     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Overview   │
                    │  (Summary)  │
                    └─────────────┘
```

---

## Confirmation & Trust Model

### The Three States of Truth

| State | Location | Regulatory Status | Visible To |
|-------|----------|-------------------|------------|
| **Raw** | Note text | Source material | RM, Audit |
| **Draft** | Extraction layer | Not usable | RM only |
| **Confirmed** | Profile/Interests/Tasks | Basis for advisory | All systems |

### Confirmation Requirements

| Data Type | Confirmation Required | Rationale |
|-----------|----------------------|-----------|
| Profile field (explicit) | **Yes** | Regulatory requirement |
| Profile field (inferred) | **Yes** | Higher risk of error |
| Interest | **Yes** | Affects personalization |
| Task | **Yes** | Affects RM workflow |
| Note content | No | Raw input, always saved |
| Timeline event | No | System-generated |

### Audit Trail

Every confirmed item records:

```json
{
  "field": "primary_goal",
  "value": "Overseas Education (UK)",
  "source_type": "agent_extraction",
  "source_note_id": "note_12345",
  "evidence": "daughter's overseas education... UK universities",
  "confidence": "high",
  "extraction_type": "explicit",
  "extracted_at": "2026-01-29T10:42:00Z",
  "confirmed_by": "user_priya",
  "confirmed_at": "2026-01-29T10:43:00Z"
}
```

---

## Implementation Priorities

### Phase 1: Foundation

1. **Page shell with tab navigation**
2. **Overview mode** (read-only dashboard)
3. **Profile mode** (direct CRUD)
4. **Timeline mode** (event display)
5. **Tasks mode** (standard task list)

### Phase 2: Agent Integration

1. **Capture mode** (note input)
2. **Agent extraction pipeline**
3. **Confirmation UI**
4. **Draft layer management**

### Phase 3: Intelligence

1. **"Prep for Your Call" generation**
2. **Commitment extraction ("You promised")**
3. **Task inference**
4. **Reminder rules**

### Phase 4: Polish

1. **Voice input**
2. **Export/reporting**
3. **Calendar integration**
4. **Mobile optimization**

---

## Appendix: Component Library Reference

| Component | Used In | shadcn/ui Base |
|-----------|---------|---------------|
| Tab navigation | Page shell | `Tabs` |
| Progress bar | Profile Summary | `Progress` |
| Extraction card | Capture mode | `Card` + custom |
| Timeline event | Timeline mode | Custom |
| Task row | Tasks mode | Custom |
| Field editor | Profile mode | `Input`, `Select`, etc. |
| Interest chip | Overview, Interests | `Badge` |
| Needs Attention item | Overview | `Alert` variant |

---

## Appendix: Related Documents

- `client-profile-ux-spec.md` — Visual design specifications
- `docs/customer_profile.csv` — Complete field schema
- Notion PRD 4 — Agentic Progressive Profiling requirements
- Notion PRD 2 — Lead Profile, Notes & Activity Timeline
