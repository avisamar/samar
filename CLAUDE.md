# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product: Agentic Customer Profile Capture (POC)

Samar Capital is a wealth management firm building an RM (Relationship Manager) led advisory model. This POC validates an **agentic workflow for progressive customer profile enrichment**.

### Problem Being Solved

Traditional CRMs require upfront, form-based data entry. In practice, customer information emerges gradually through meetings, calls, and informal conversations. This system helps RMs capture client context naturally without forcing rigid workflows.

### Core Capabilities

1. **Multi-modal input ingestion** - Text notes, voice dictation, meeting summaries
2. **Intelligent extraction** - Map unstructured inputs to structured profile fields
3. **Context retention** - Store unstructured notes/tags when data doesn't fit schema
4. **Adaptive questioning** - Agent identifies profile gaps and asks targeted follow-ups
5. **Progressive profiling** - Profiles enrich incrementally across multiple interactions

### Agent Workflow Loop

For every input: **Ingest → Interpret → Compare → Decide → Act → Persist**

- **Ingest**: Normalize input, attach metadata (source, timestamp, RM, customer ID)
- **Interpret**: Identify structured values, context, ambiguities, conflicts
- **Compare**: Check against current profile (known, missing, needs confirmation)
- **Decide**: Propose updates, store as notes, ask follow-up, or defer
- **Act**: Present proposed updates for RM confirmation OR ask one targeted question
- **Persist**: Save structured fields and/or unstructured context on RM approval

### Customer Profile Schema

Profile fields are defined at docs/customer_profile.csv. Each field has:

| Attribute | Purpose |
|-----------|---------|
| `data_key` | Canonical field identifier (API name) |
| `display_name` | Human-friendly label for UI/prompts |
| `data_type` | `text`, `date`, `enum`, `number`, `boolean`, `multi_select`, `json` |
| `priority` | `High` / `Medium` / `Low` - what to capture now vs defer |
| `field_class` | `FACT` (objective), `SIGNAL` (behavioral), `OPINION` (subjective), `SYSTEM` |
| `source` | `client_declared`, `rm_observed`, `questionnaire`, `system` |
| `Section` | Logical grouping (Identity, Goals, Risk, etc.) |

### Dual-Track Data Storage

1. **Structured fields** - Data mapping to `data_key`s in schema
2. **Unstructured context** - Timestamped notes + tags for everything else

### Key Constraints

- **RM-in-the-loop**: RM confirms/edits/rejects all proposed updates; never auto-save sensitive data
- **Interview mode**: One question at a time, contextual, exits when clarified or deferred
- **Risk profiling out of scope**: Handled by separate deterministic questionnaire (not this agent)
- **No advisory logic**: POC validates capture workflow only, not recommendations

### Success Criteria

- RM shares notes without thinking about CRM fields
- Agent produces structured output aligned to profile schema
- Extra context captured (not discarded)
- Follow-up questions are relevant, minimal, non-intrusive
- Profile completeness improves over successive interactions

## Development Commands

```bash
bun run dev      # Start development server
bun run build    # Production build
bun start        # Run production server
bun run lint     # Run ESLint
```

Package manager is Bun (use `bun install` for dependencies).

## Architecture Overview

This is a Next.js 16 full-stack application with AI/LLM capabilities, using the App Router.

### Key Technologies
- **Framework**: Next.js 16.1.1 with React 19
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication**: BetterAuth with email/password
- **AI/LLM**: LangChain with Anthropic Claude integration
- **UI**: shadcn/ui components (radix-nova style), Tailwind CSS v4

### Directory Structure

- `app/` - Next.js App Router pages and API routes
  - `api/auth/[...all]/` - BetterAuth handler
- `components/` - React components
  - `ui/` - shadcn/ui base components
- `lib/` - Utilities and configurations
  - `auth.ts` - Server-side BetterAuth config
  - `auth-client.ts` - Client-side auth client
  - `utils.ts` - Helper functions (cn for classNames)
- `db/` - Database layer
  - `schema.ts` - Drizzle schema (user, session, account, verification tables)
  - `index.ts` - Database instance

### Database Schema

Four main tables for authentication:
- `user` - User accounts with email verification
- `session` - User sessions with token management
- `account` - OAuth provider accounts
- `verification` - Email/token verification

### Path Aliases

TypeScript paths configured in tsconfig.json:
- `@/*` maps to root directory

shadcn/ui aliases in components.json:
- `@/components`, `@/ui`, `@/lib`, `@/utils`, `@/hooks`

### Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth session encryption key
- `BETTER_AUTH_URL` - Base URL for auth callbacks
- `AWS_ACCESS_KEY_ID` - AWS access key for Transcribe
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for Transcribe
- `AWS_REGION` - AWS region for Transcribe (default `ap-south-1`)
- `AWS_SESSION_TOKEN` - Optional session token for AWS credentials

## Frontend Design System

Follow these principles when creating UI components and pages.

### Design Philosophy (Linear-inspired)

**Core Principles:**
- **Reduce cognitive load** - One clear path, minimal choices, logical progression
- **Craft over features** - Every pixel matters; avoid visual noise
- **Opinionated defaults** - Make decisions for users; don't expose unnecessary options
- **Density with clarity** - Pack information without clutter; use hierarchy to guide focus

**Interaction Patterns:**
- Instant feedback on all actions (no loading states longer than 100ms without indicator)
- Keyboard-first: all actions accessible via keyboard shortcuts
- Subtle animations (150-200ms) for state changes; never decorative
- Progressive disclosure: show advanced options only when needed

### Color System

Uses oklch color space for perceptual uniformity. Primary is warm orange/amber.

**Semantic Colors (use these, not raw values):**
- `primary` - Main actions, links, focus states (warm orange)
- `secondary` - Secondary actions, less emphasis
- `muted` / `muted-foreground` - Disabled states, helper text
- `destructive` - Delete, error states
- `accent` - Hover backgrounds, subtle highlights
- `border` - Dividers, input borders
- `card` - Elevated surfaces

**Usage Rules:**
- Primary color sparingly - only for main CTAs and key interactive elements
- Most UI should be neutral (background, foreground, muted)
- Dark mode is first-class; always verify both themes
- High contrast between text and background (check `foreground` on `background`)

### Typography

- **Font stack**: Inter (sans), Geist Mono (code)
- **Hierarchy**: Use font-weight and size, not color, for emphasis
- **Body text**: `text-sm` (14px) default; `text-base` for long-form
- **Headings**: `text-lg` to `text-2xl`; use `font-medium` not bold
- **Muted text**: `text-muted-foreground` for secondary information

### Spacing & Layout

- **Base unit**: 4px (`p-1`); prefer multiples: 8, 12, 16, 24, 32, 48
- **Component padding**: `p-4` standard; `p-3` for compact; `p-6` for spacious
- **Gaps**: `gap-4` between sections; `gap-2` within groups
- **Max content width**: `max-w-md` for forms; `max-w-2xl` for content; full-width for dashboards
- **Consistent alignment**: Left-align text; center only for hero/empty states

### Component Patterns

**Buttons:**
```tsx
<Button>Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Danger</Button>
```
- One primary button per view; others should be outline/ghost
- Size `default` for most; `sm` in dense UIs; `lg` for hero CTAs

**Cards:**
- Use for grouping related content
- Subtle ring border (`ring-foreground/10`), not heavy shadows
- Consistent padding with `CardHeader`, `CardContent`, `CardFooter`

**Forms:**
- Labels above inputs, not inline
- `space-y-4` between form fields
- Error messages in `text-destructive text-sm` below input
- Disabled states: `opacity-50` with `pointer-events-none`

**Empty States:**
- Center content vertically and horizontally
- Icon + heading + description + action button
- Use `text-muted-foreground` for description

### Component Creation Checklist

When building new components:
1. Check if shadcn/ui has it first (`components/ui/`)
2. Support both light and dark themes
3. Use semantic color tokens, never hardcoded colors
4. Include focus-visible states for accessibility
5. Prefer composition over configuration (slots > props)
6. Keep components small and single-purpose
