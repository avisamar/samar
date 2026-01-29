# json-render Integration for Profile Agent

> **Status:** Implemented

## Overview

[json-render](https://json-render.dev) is a Vercel Labs framework that enables AI to generate user interfaces constrained to developer-defined components. This document describes the integration with the Samar profile capture agent.

## What is json-render?

json-render follows a simple workflow:
1. **Define a component catalog** — Zod schemas specify which components AI can use
2. **Users prompt** — Natural language requests describe desired UI
3. **AI outputs JSON** — Constrained to your catalog, never arbitrary code
4. **Components render** — Progressive streaming as JSON arrives

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Guardrailed** | AI can only use components in your catalog. No arbitrary code generation. |
| **Predictable** | JSON output matches your schema every time. Actions are declared by name. |
| **Fast** | Stream and render progressively as the model responds. |

## Installation

```bash
bun add @json-render/core @json-render/react
```

**Peer dependencies:**
- `react` ^19.0.0 (already in project)
- `zod` ^4.0.0

**For AI integration:**
```bash
bun add ai  # Vercel AI SDK
```

---

## How json-render Works

### 1. Catalog Definition

Define available components and actions using Zod schemas:

```typescript
import { createCatalog } from '@json-render/core';
import { z } from 'zod';

export const catalog = createCatalog({
  components: {
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      hasChildren: true,
    },
    Button: {
      props: z.object({
        label: z.string(),
        action: z.string(),
      }),
    },
  },
  actions: {
    submit: { params: z.object({ formId: z.string() }) },
    navigate: { params: z.object({ url: z.string() }) },
  },
});
```

### 2. Component Registry

Map catalog definitions to React implementations:

```typescript
export const registry = {
  Card: ({ element, children }) => (
    <div className="p-4 border rounded-lg">
      <h2 className="font-bold">{element.props.title}</h2>
      {element.props.description && (
        <p className="text-muted-foreground">{element.props.description}</p>
      )}
      {children}
    </div>
  ),
  Button: ({ element, onAction }) => (
    <button onClick={() => onAction(element.props.action, {})}>
      {element.props.label}
    </button>
  ),
};
```

### 3. Streaming API Route

```typescript
import { generateCatalogPrompt, streamText } from '@json-render/core';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const systemPrompt = generateCatalogPrompt(catalog);

  const result = streamText({
    model: 'anthropic/claude-haiku-4.5',
    system: systemPrompt,
    prompt,
  });

  return new Response(result.textStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### 4. Client Rendering

```typescript
import { useUIStream, Renderer } from '@json-render/react';

function DynamicUI() {
  const { tree, isLoading, generate } = useUIStream({ api: '/api/generate' });
  return <Renderer tree={tree} components={registry} />;
}
```

---

## Key Features

### Data Binding

Two-way binding using JSON Pointer paths (RFC 6901):

```typescript
// Read-only access
const name = useDataValue('/customer/name');

// Read-write access
const [email, setEmail] = useDataBinding('/customer/email');

// Full control
const { data, setValue, getValue } = useData();
```

In JSON UI trees, AI can reference data:
```json
{
  "type": "TextField",
  "props": {
    "label": "Annual Income",
    "valuePath": "/profile/income",
    "format": "currency"
  }
}
```

### Actions

Actions are declared by name — AI specifies intent, you control implementation:

```typescript
// Catalog definition
actions: {
  confirm_update: {
    params: z.object({
      fieldKey: z.string(),
      newValue: z.any()
    }),
    description: 'Confirm a profile field update',
  },
  reject_update: {
    params: z.object({ fieldKey: z.string() }),
    description: 'Reject a proposed update',
  },
}

// Handler implementation
<ActionProvider handlers={{
  confirm_update: async ({ fieldKey, newValue }) => {
    await updateProfileField(customerId, fieldKey, newValue);
    toast.success('Profile updated');
  },
  reject_update: ({ fieldKey }) => {
    dismissProposal(fieldKey);
  },
}} />
```

### Visibility

Conditional rendering based on data or auth state:

```json
{
  "type": "Button",
  "props": { "label": "Approve All", "action": "approve_all" },
  "visibility": {
    "and": [
      { "path": "/pendingUpdates", "op": "gt", "value": 0 },
      { "auth": "signedIn" }
    ]
  }
}
```

### Validation

Built-in validators: `required`, `email`, `minLength`, `maxLength`, `pattern`, `min`, `max`

```json
{
  "type": "TextField",
  "props": {
    "label": "Email",
    "checks": [
      { "fn": "required", "message": "Email is required" },
      { "fn": "email", "message": "Invalid email format" }
    ],
    "validateOn": "blur"
  }
}
```

### Streaming

Uses JSONL streaming with patch operations (`set`, `add`, `replace`, `remove`) for real-time UI updates.

```typescript
const { tree, isLoading, abort, generate } = useUIStream({
  api: '/api/profile-ui'
});
```

---

## Integration with Profile Agent

### Use Case 1: Dynamic Profile Update Proposals

When the agent extracts structured data from notes, json-render can generate a review UI:

```typescript
// Catalog for profile updates
const profileCatalog = createCatalog({
  components: {
    UpdateProposal: {
      props: z.object({
        fieldKey: z.string(),
        fieldLabel: z.string(),
        currentValue: z.any().nullable(),
        proposedValue: z.any(),
        confidence: z.enum(['high', 'medium', 'low']),
        source: z.string(),
      }),
    },
    ProposalGroup: {
      props: z.object({
        title: z.string(),
        section: z.string(),
      }),
      hasChildren: true,
    },
    ConfirmButton: {
      props: z.object({
        label: z.string(),
        fieldKey: z.string(),
        value: z.any(),
      }),
    },
    RejectButton: {
      props: z.object({
        label: z.string(),
        fieldKey: z.string(),
      }),
    },
  },
  actions: {
    confirm_field: { params: z.object({ fieldKey: z.string(), value: z.any() }) },
    reject_field: { params: z.object({ fieldKey: z.string() }) },
    confirm_all: { params: z.object({ fieldKeys: z.array(z.string()) }) },
    edit_value: { params: z.object({ fieldKey: z.string() }) },
  },
});
```

**AI prompt example:**
```
Based on these extracted values from the meeting notes, generate a review UI:
- full_name: "Rajesh Sharma" (high confidence)
- occupation: "Software Engineer" (medium confidence)
- investment_horizon: "10 years" (low confidence - needs confirmation)

Current profile has: full_name: null, occupation: "IT Professional"
```

**Generated UI would show:**
- New field proposals with confirm/reject buttons
- Conflict resolution for occupation (current vs proposed)
- Low-confidence items highlighted for explicit confirmation

### Use Case 2: Adaptive Interview Questions

The agent can generate contextual follow-up questions based on profile gaps:

```typescript
const interviewCatalog = createCatalog({
  components: {
    Question: {
      props: z.object({
        text: z.string(),
        fieldKey: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        context: z.string().optional(),
      }),
    },
    TextInput: {
      props: z.object({
        placeholder: z.string(),
        fieldKey: z.string(),
      }),
    },
    SelectInput: {
      props: z.object({
        options: z.array(z.object({
          label: z.string(),
          value: z.string()
        })),
        fieldKey: z.string(),
      }),
    },
    SkipButton: {
      props: z.object({ fieldKey: z.string() }),
    },
  },
  actions: {
    submit_answer: { params: z.object({ fieldKey: z.string(), value: z.any() }) },
    skip_question: { params: z.object({ fieldKey: z.string() }) },
    defer_question: { params: z.object({ fieldKey: z.string() }) },
  },
});
```

**AI prompt example:**
```
Profile gaps for customer 123:
- risk_tolerance (high priority, no data)
- investment_horizon (medium priority, conflicting data)
- source_of_wealth (high priority, no data)

Generate ONE targeted follow-up question based on the most important gap.
Previous conversation context: Customer mentioned being conservative with money.
```

### Use Case 3: Profile Summary Dashboard

Generate dynamic profile completion dashboards:

```typescript
const dashboardCatalog = createCatalog({
  components: {
    ProfileSection: {
      props: z.object({
        title: z.string(),
        completeness: z.number(), // 0-100
        fieldCount: z.number(),
        missingCount: z.number(),
      }),
      hasChildren: true,
    },
    FieldStatus: {
      props: z.object({
        label: z.string(),
        status: z.enum(['complete', 'missing', 'stale', 'conflicting']),
        lastUpdated: z.string().optional(),
      }),
    },
    CompletionMeter: {
      props: z.object({
        percentage: z.number(),
        label: z.string(),
      }),
    },
    SuggestedAction: {
      props: z.object({
        text: z.string(),
        action: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
      }),
    },
  },
});
```

### Use Case 4: Context Notes Display

For unstructured data that doesn't fit the schema:

```typescript
const notesCatalog = createCatalog({
  components: {
    NoteCard: {
      props: z.object({
        content: z.string(),
        timestamp: z.string(),
        source: z.enum(['meeting', 'call', 'email', 'manual']),
        tags: z.array(z.string()),
      }),
    },
    TagChip: {
      props: z.object({
        label: z.string(),
        color: z.enum(['blue', 'green', 'yellow', 'red']),
      }),
    },
    RelatedField: {
      props: z.object({
        fieldKey: z.string(),
        fieldLabel: z.string(),
        relevance: z.enum(['direct', 'indirect']),
      }),
    },
  },
});
```

---

## Architecture Recommendations

### Catalog Organization

```
lib/
  json-render/
    catalogs/
      profile-updates.ts    # Update proposal UI
      interview.ts          # Follow-up questions
      dashboard.ts          # Profile summary
      notes.ts              # Unstructured context
    registries/
      profile-updates.tsx   # React components for updates
      interview.tsx         # Question components
      dashboard.tsx         # Dashboard components
      notes.tsx             # Note display components
    actions/
      profile-actions.ts    # Action handlers
    index.ts                # Exports
```

### Integration Points

1. **After Note Ingestion** — Generate update proposal UI
2. **Profile Gap Detection** — Generate interview question UI
3. **Profile View** — Generate dynamic dashboard
4. **Context Storage** — Display related notes with tags

### API Routes

```
app/
  api/
    profile-ui/
      updates/route.ts      # POST: Generate update proposals
      interview/route.ts    # POST: Generate follow-up questions
      dashboard/route.ts    # POST: Generate profile summary
```

---

## Benefits for Profile Agent

| Benefit | Description |
|---------|-------------|
| **RM-in-the-loop** | AI generates proposal UI, RM confirms via actions. Never auto-saves. |
| **Adaptive UI** | Questions and forms adapt to profile state and conversation context. |
| **Type Safety** | Zod schemas ensure AI output matches expected structure. |
| **Progressive Disclosure** | Show one question at a time; reveal more as needed. |
| **Streaming UX** | UI appears progressively, feels responsive even for complex generations. |
| **No Arbitrary Code** | AI cannot generate unsafe code, only predefined components. |
| **Exportable** | Generated UIs can be exported as standalone React code if needed. |

---

## Implementation Checklist

- [x] Install dependencies: `@json-render/core`, `@json-render/react`
- [x] Define catalog with component and action schemas
- [x] Create component registry using shadcn/ui components
- [x] Implement action handlers connecting to profile persistence layer
- [x] Create transform functions for agent output to JSON trees
- [x] Integrate with existing profile agent workflow
- [x] Add context providers for state management
- [x] Remove old hardcoded dynamic UI components

---

## Current Implementation

### File Structure

```
lib/json-render/
├── catalog.ts       # Component & action schemas (Zod)
├── components.tsx   # React component implementations
├── transforms.ts    # Agent output → JSON tree transforms
├── renderer.tsx     # JSON tree renderer
└── index.ts         # Module exports

components/customers/
├── json-render-proposal-card.tsx  # ProposalCard wrapper
└── json-render-nudges-card.tsx    # NudgesCard wrapper
```

### Key Components

**Catalog (`lib/json-render/catalog.ts`)**
- Defines all component schemas: ProposalCard, NudgesCard, ConfidenceGroup, FieldUpdateCard, etc.
- Defines action schemas: acceptField, rejectField, editField, applyUpdates, etc.

**Components (`lib/json-render/components.tsx`)**
- `ProfileAgentProvider` - Context provider managing all UI state
- Component implementations using shadcn/ui (Button, Card, Badge, Input, etc.)
- Full interactivity: accept/reject, inline editing, validation

**Transforms (`lib/json-render/transforms.ts`)**
- `transformProposalToTree()` - Converts ProfileUpdateProposal to JSON tree
- `transformNudgesToTree()` - Converts ExtractionWithNudges to JSON tree
- Helper functions for extracting IDs for state initialization

**Renderer (`lib/json-render/renderer.tsx`)**
- `ProposalRenderer` - Renders proposal trees with proper section handling
- `NudgesRenderer` - Renders nudge question trees

### Usage

```typescript
// In profile-agent-chat.tsx
import { NudgesCard } from "./json-render-nudges-card";
import { ProposalCard } from "./json-render-proposal-card";

// NudgesCard renders follow-up questions
<NudgesCard
  extraction={extractionWithNudges}
  onFinalize={handleFinalizeProposal}
  submitted={isAlreadySubmitted}
/>

// ProposalCard renders profile update proposals
<ProposalCard
  proposal={profileUpdateProposal}
  customerId={customerId}
/>
```

### Removed Files

The following hardcoded dynamic UI components were removed:
- `components/customers/proposal-card.tsx`
- `components/customers/confidence-group.tsx`
- `components/customers/field-update-card.tsx`
- `components/customers/additional-data-card.tsx`
- `components/customers/note-proposal-card.tsx`
- `components/customers/nudges/nudges-card.tsx`
- `components/customers/nudges/nudge-question-card.tsx`
- `components/customers/nudges/progress-indicator.tsx`

---

## Resources

- **Documentation**: https://json-render.dev/docs
- **GitHub**: https://github.com/vercel-labs/json-render
- **License**: Apache-2.0
