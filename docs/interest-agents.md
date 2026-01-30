## Executive Summary

Allow RMs to capture and view important personal and financial interests about a Lead — such as hobbies, lifestyle preferences, goals, or concerns — in a simple, visible way that supports better recall and personalisation, without forcing everything into rigid CRM fields.

## Problem Statement

RMs often learn valuable information during conversations that doesn’t belong in standard profile fields. Today, this information gets buried in notes or forgotten. We need a way to surface and reuse this context without turning it into hard facts or automated decisions.

## What This Is

This feature lets the system show important interests or themes about a Lead in one place, such as:

- “Plays golf regularly”
- “Interested in overseas education for children”
- “Concerned about tax efficiency”

Each item:

- Is easy to read
- Links back to where it came from
- Can be confirmed or edited by the RM

## What This Is NOT

- These are not confirmed profile facts
- These do not trigger recommendations
- These do not replace structured profile fields
- These do not result in automated messages

## Scope (MVP)

- Support two types of interests:
    - Personal interests (hobbies, lifestyle, preferences)
    - Financial interests (goals, curiosities, concerns)
- Each interest includes:
    - A short label (e.g. “Golf”, “Education planning”)
    - A short description for context
    - Where it came from (note / conversation)
    - How confident the system is
- Interests can be:
    - Suggested by the system, or
    - Added manually by the RM
- Interests are visible on the Lead profile

## Why This Matters

This helps RMs:

- Prepare better for meetings
- Remember what matters to a client
- Write more thoughtful follow-ups
- Avoid rereading long notes

## Design Principles (Plain English)

- Capture context, not conclusions
- Show meaning, not just labels
- Let RMs decide what’s correct
- Never surprise the RM


## Requirements

### **R5.1 - Display Personal and Financial Interests on the Lead Profile**

### Description

Show confirmed personal and financial interests in a clear, dedicated section on the Lead profile so RMs can quickly recall what matters about the Lead.

### Behaviour / Rules

- The Lead profile includes a dedicated section for **Personal Interests** and **Financial Interests**
- Only **RM-confirmed** interests are shown in these sections
- Each interest is displayed as a short, readable item (e.g. “Tennis”, “Education planning”)
- Interests are visible without requiring the RM to open notes or conversations
- Interests do not block or alter any other Lead actions

### Edge cases

- A Lead has no confirmed interests
- A Lead has many confirmed interests over time

### Acceptance criteria

- RM can see Personal and Financial Interests directly on the Lead profile
- Interests are clearly grouped into Personal and Financial sections
- Only confirmed interests are displayed
- When no interests exist, the profile clearly indicates this state

### **R5.2 - Represent Each Interest with a Label, Context, and Source**

### Description

Represent each interest with a short label, supporting context, and a clear reference to where it came from, so the RM understands both *what* the interest is and *why* it exists.

### Behaviour / Rules

- Each interest includes:
    - A **short label** (e.g. “Tennis”, “Education planning”)
    - A **brief description** providing context (e.g. “Plays tennis on weekends”)
    - A **source reference** (e.g. note or conversation where it was mentioned)
- The label is concise and consistent across Leads
- The context preserves nuance and avoids over-interpretation
- The source reference allows the RM to trace the interest back to its origin

### Edge cases

- An interest is mentioned briefly with very little detail
- Multiple notes reference the same interest

### Acceptance criteria

- Each displayed interest shows a label and supporting context
- RM can identify where the interest originated
- Interests remain understandable even without opening the original note
- Multiple references to the same interest do not create confusion in the profile view


### **R5.3 - Add Interests via System Suggestions or Manual Entry**

### Description

Allow interests to be added to a Lead either through system suggestions (from notes) or directly by the RM.

### Behaviour / Rules

- Interests can be added in two ways:
    - **Suggested by the system** after the RM reviews profile updates
    - **Manually added by the RM** at any time from the Lead profile
- Manually added interests require the RM to provide:
    - A short label
    - Optional supporting context
- System-suggested interests follow the same confirmation rules as other agent proposals
- Manually added interests are treated as **RM-confirmed by default**

### Edge cases

- RM adds an interest that was never mentioned in notes
- RM manually adds an interest similar to an existing one
- RM chooses not to act on a system-suggested interest

### Acceptance criteria

- RM can add a new interest manually from the Lead profile
- RM can confirm a system-suggested interest to add it to the profile
- Manually added interests appear immediately in the profile
- System-suggested interests do not appear unless confirmed by the RM

### **R5.4 - Allow RM to Confirm, Edit, or Remove Interests**

### Description

Allow the RM to control which interests appear on the Lead profile by confirming, editing, or removing them.

### Behaviour / Rules

- The RM can:
    - **Confirm** a suggested interest
    - **Edit** an interest’s label or context
    - **Remove** an interest from the profile
- Only **confirmed** interests appear on the Lead profile
- Editing an interest updates how it appears going forward
- Removing an interest removes it from the profile but does not delete the original notes or conversations

### Edge cases

- RM edits an interest to clarify or soften wording
- RM removes an interest that was previously confirmed
- RM revisits and updates an interest over time

### Acceptance criteria

- RM can confirm a suggested interest so it appears on the profile
- RM can edit an existing interest and see the updated version immediately
- RM can remove an interest from the profile
- Removing an interest does not affect underlying notes or history

### **R5.5 - Make Interests Available for Summaries and Personalised Documents**

### Description

Make confirmed interests available for use in summaries and personalised documents to help RMs communicate more thoughtfully.

### Behaviour / Rules

- Confirmed interests can be used as contextual inputs when generating:
    - Meeting summaries
    - Post-meeting notes
    - Personalised documents
- Interests are used as **supporting context**, not as instructions or decisions
- Only RM-confirmed interests are eligible for use
- Use of interests does not trigger any automated client communication

### Edge cases

- An interest has low confidence but is confirmed by the RM
- A Lead has very few or no confirmed interests

### Acceptance criteria

- Confirmed interests are accessible to summary or document generation flows
- Unconfirmed interests are not used
- Interests are presented as context rather than facts or recommendations
- No document is generated or sent without RM initiation

### **R5.6 - Record Interest Changes for Audit and Safety**

### Description

Record all additions, edits, and removals of interests to ensure traceability and maintain a conservative compliance posture.

### Behaviour / Rules

- Every interest action is recorded, including:
    - Creation (system-suggested and manually added)
    - Confirmation
    - Edit
    - Removal
- Each record includes:
    - Action type
    - Timestamp
    - Acting RM
- Audit records are immutable once created
- Audit records do not alter or replace Lead activity timeline entries
- Interests are always treated as contextual information and never as advice or decisions

### Edge cases

- RM edits an interest multiple times over its lifecycle
- RM removes an interest that was previously confirmed
- System-suggested interest is never confirmed

### Acceptance criteria

- All interest-related actions are captured in audit records
- Audit records accurately reflect the sequence of changes
- Interest audit does not interfere with Lead activity timeline clarity
- No interest is treated as advice, instruction, or automated trigger