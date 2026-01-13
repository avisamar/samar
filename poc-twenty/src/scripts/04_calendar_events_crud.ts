import { apiClient } from '../apiClient';

/**
 * Script 04: Calendar Events CRUD (mock data)
 *
 * No CLI flags by design.
 * Edit the CONFIG section below, then run:
 *   bun run src/scripts/04_calendar_events_crud.ts
 *
 * What it does:
 * - Generates a deterministic set of mock CalendarEvents (seeded).
 * - For each event: find existing by iCalUID → create (with upsert) → update → delete.
 * - Optionally creates/deletes calendarChannelEventAssociations.
 */

// =========================
// CONFIG (edit me)
// =========================

const DRY_RUN = false;
const DEPTH: 0 | 1 = 0;
const UPSERT = true;
const SOFT_DELETE = true;

// Cleanup behavior
// - If false, events (and their associations/participants) are left in place for UI inspection.
const DELETE_EVENTS_AT_END = false;

// Optional: link each event to a Person via calendarEventParticipants
// (This is useful to validate “event shows up on person timeline / profile” workflows.)
const PERSON_ID: string | undefined = 'f8c19c41-1407-4c31-b136-6e6927a7280c';
const PERSON_HANDLE: string | undefined = undefined; // e.g. email (optional)
const PERSON_DISPLAY_NAME: string | undefined = undefined; // optional
const PERSON_RESPONSE_STATUS: 'NEEDS_ACTION' | 'DECLINED' | 'TENTATIVE' | 'ACCEPTED' = 'ACCEPTED';
const PERSON_IS_ORGANIZER = false;

// Mock generation controls
const MOCK_NAMESPACE = 'poc-twenty-calendar';
const SEED = 42;
const EVENT_COUNT = 5;
const BASE_START_ISO = '2025-01-10T09:00:00.000Z';
const MIN_DURATION_MINUTES = 20;
const MAX_DURATION_MINUTES = 75;
const MIN_GAP_MINUTES = 30;
const MAX_GAP_MINUTES = 180;
const TIMEZONE_HINT: string | undefined = undefined; // informational only

// Optional calendar channel association
const CREATE_CHANNEL_ASSOCIATION = false;
const CALENDAR_CHANNEL_ID: string | undefined = undefined; // if undefined, auto-pick first calendarChannel
const EVENT_EXTERNAL_ID_STRATEGY: 'icaluid' | 'id' = 'icaluid';
const DELETE_CHANNEL_ASSOCIATIONS_AT_END = true;

// To make events show as shared in the UI, the calendarChannel must have visibility=SHARE_EVERYTHING.
// If enabled, we will set the chosen channel visibility accordingly (idempotent).
const ENSURE_CALENDAR_CHANNEL_SHARED = true;
// If true, we will also create channel associations when ENSURE_CALENDAR_CHANNEL_SHARED is enabled,
// even if CREATE_CHANNEL_ASSOCIATION is false.
const AUTO_CREATE_CHANNEL_ASSOCIATION_FOR_VISIBILITY = true;

// Cleanup safeguard (best-effort; uses filter operators supported by Twenty)
const CLEANUP_EXISTING_BY_NAMESPACE = false;

// =========================
// Types (lightweight)
// =========================

type CalendarEventPayload = {
  title?: string;
  isCanceled?: boolean;
  isFullDay?: boolean;
  startsAt?: string;
  endsAt?: string;
  externalCreatedAt?: string;
  externalUpdatedAt?: string;
  description?: string;
  location?: string;
  iCalUID?: string;
  conferenceSolution?: string;
  conferenceLink?: {
    primaryLinkLabel?: string;
    primaryLinkUrl?: string;
    secondaryLinks?: Array<{ url?: string; label?: string }>;
  };
};

type CalendarEventResponse = CalendarEventPayload & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

type CalendarChannelEventAssociationPayload = {
  eventExternalId?: string;
  recurringEventExternalId?: string;
  calendarChannelId: string;
  calendarEventId: string;
};

type CalendarEventParticipantPayload = {
  handle?: string;
  displayName?: string;
  isOrganizer?: boolean;
  responseStatus?: 'NEEDS_ACTION' | 'DECLINED' | 'TENTATIVE' | 'ACCEPTED';
  calendarEventId: string;
  personId?: string;
  workspaceMemberId?: string;
};

async function upsertCalendarEventParticipant(payload: CalendarEventParticipantPayload): Promise<{ id: string } | undefined> {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would upsert calendarEventParticipant:', payload);
    return { id: `dry-run-participant-${payload.calendarEventId}` };
  }

  const { data } = await apiClient.post('calendarEventParticipants', payload, {
    params: {
      depth: 0,
      upsert: true,
    },
  });

  const p = data?.data?.createCalendarEventParticipant ?? data?.data?.calendarEventParticipant;
  const id: string | undefined = p?.id;
  return id ? { id } : undefined;
}

// =========================
// Helpers
// =========================

function quoteFilterValue(value: string): string {
  // OpenAPI examples quote string filters: createdAt[gte]:"2023-01-01"
  return `"${value.replaceAll('"', '\\"')}"`;
}

function minutesToMs(minutes: number) {
  return minutes * 60_000;
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutesToMs(minutes)).toISOString();
}

function clampInt(n: number, min: number, max: number): number {
  const v = Math.floor(n);
  return Math.min(max, Math.max(min, v));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const idx = Math.floor(rng() * items.length);
  return items[Math.min(items.length - 1, Math.max(0, idx))]!;
}

function randIntInclusive(rng: () => number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

function buildMockICalUid(index: number): string {
  // stable identifier derived from (namespace, seed, index)
  return `${MOCK_NAMESPACE}/${SEED}/${index}`;
}

function buildMockEvents(input: {
  baseStartIso: string;
  count: number;
  minGapMinutes: number;
  maxGapMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
}): CalendarEventPayload[] {
  const rng = mulberry32(SEED);

  const verbs = ['Review', 'Discuss', 'Plan', 'Finalize', 'Sync', 'Kickoff'] as const;
  const topics = [
    'Portfolio rebalancing',
    'Tax planning',
    'KYC follow-up',
    'Risk profile update',
    'Quarterly check-in',
    'Investment thesis',
    'Goal mapping',
  ] as const;
  const locations = ['Zoom', 'Google Meet', 'Samar HQ', 'Client office', 'Phone call'] as const;

  const events: CalendarEventPayload[] = [];
  let cursor = input.baseStartIso;

  for (let i = 0; i < input.count; i++) {
    const gap = randIntInclusive(rng, input.minGapMinutes, input.maxGapMinutes);
    cursor = addMinutes(cursor, gap);

    const duration = randIntInclusive(rng, input.minDurationMinutes, input.maxDurationMinutes);
    const startsAt = cursor;
    const endsAt = addMinutes(cursor, duration);

    const verb = pick(rng, verbs);
    const topic = pick(rng, topics);
    const location = pick(rng, locations);

    const iCalUID = buildMockICalUid(i);
    const title = `Mock ${i + 1}/${input.count}: ${verb} — ${topic}`;
    const description = `Mock calendar event generated by ${MOCK_NAMESPACE} (seed=${SEED}, index=${i}).`;

    const includeConference = rng() < 0.6;
    const conferenceLink = includeConference
      ? {
          primaryLinkLabel: 'Join',
          primaryLinkUrl: `https://example.invalid/${encodeURIComponent(MOCK_NAMESPACE)}/${SEED}/${i}`,
          secondaryLinks: [],
        }
      : undefined;

    events.push({
      title,
      isCanceled: false,
      isFullDay: false,
      startsAt,
      endsAt,
      description,
      location,
      iCalUID,
      conferenceSolution: includeConference ? 'CUSTOM' : undefined,
      conferenceLink,
    });
  }

  return events;
}

async function findCalendarEventByICalUid(iCalUID: string): Promise<CalendarEventResponse | undefined> {
  const { data } = await apiClient.get('calendarEvents', {
    params: {
      filter: `iCalUID[eq]:${quoteFilterValue(iCalUID)}`,
      limit: 1,
      depth: 0,
    },
  });

  const events = data?.data?.calendarEvents ?? [];
  return events[0];
}

async function createCalendarEvent(payload: CalendarEventPayload): Promise<CalendarEventResponse> {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would create calendarEvent:', payload);
    return { ...(payload as CalendarEventResponse), id: `dry-run-${payload.iCalUID ?? 'calendarEvent'}` };
  }

  const { data } = await apiClient.post('calendarEvents', payload, {
    params: {
      depth: DEPTH,
      upsert: UPSERT,
    },
  });

  const created: CalendarEventResponse | undefined =
    data?.data?.createCalendarEvent ?? data?.data?.calendarEvent ?? data?.data?.createCalendarEvents?.[0];

  if (!created?.id) {
    throw new Error(`Unexpected create calendarEvent response: ${JSON.stringify(data)}`);
  }

  return created;
}

async function updateCalendarEvent(id: string, update: CalendarEventPayload): Promise<CalendarEventResponse> {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would update calendarEvent:', { id, update });
    return { ...(update as CalendarEventResponse), id };
  }

  const { data } = await apiClient.patch(`calendarEvents/${id}`, update, {
    params: {
      depth: DEPTH,
    },
  });

  const updated: CalendarEventResponse | undefined =
    data?.data?.updateCalendarEvent ?? data?.data?.calendarEvent ?? data?.data?.updateCalendarEvents?.[0];

  if (!updated?.id) {
    throw new Error(`Unexpected update calendarEvent response: ${JSON.stringify(data)}`);
  }

  return updated;
}

async function deleteCalendarEvent(id: string): Promise<{ id: string }> {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would delete calendarEvent:', { id, soft_delete: SOFT_DELETE });
    return { id };
  }

  const { data } = await apiClient.delete(`calendarEvents/${id}`, {
    params: {
      soft_delete: SOFT_DELETE,
    },
  });

  const deleted = data?.data?.deleteCalendarEvent ?? data?.data?.deleteCalendarEvents?.[0];
  const deletedId: string | undefined = deleted?.id;
  if (!deletedId) {
    throw new Error(`Unexpected delete calendarEvent response: ${JSON.stringify(data)}`);
  }
  return { id: deletedId };
}

async function resolveCalendarChannelId(): Promise<string | undefined> {
  if (CALENDAR_CHANNEL_ID) return CALENDAR_CHANNEL_ID;

  const { data } = await apiClient.get('calendarChannels', {
    params: {
      limit: 1,
      depth: 0,
    },
  });

  const channels = data?.data?.calendarChannels ?? [];
  return channels[0]?.id;
}

async function ensureCalendarChannelShared(calendarChannelId: string) {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would set calendarChannel visibility=SHARE_EVERYTHING:', { calendarChannelId });
    return;
  }

  // Setting it every time is safe; it’s idempotent.
  await apiClient.patch(
    `calendarChannels/${calendarChannelId}`,
    { visibility: 'SHARE_EVERYTHING' },
    { params: { depth: 0 } },
  );
}

async function createCalendarChannelAssociation(
  payload: CalendarChannelEventAssociationPayload,
): Promise<{ id: string } | undefined> {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would create calendarChannelEventAssociation:', payload);
    return { id: `dry-run-assoc-${payload.calendarEventId}` };
  }

  const { data } = await apiClient.post('calendarChannelEventAssociations', payload, {
    params: {
      depth: 0,
      upsert: true,
    },
  });

  const assoc = data?.data?.createCalendarChannelEventAssociation ?? data?.data?.calendarChannelEventAssociation;
  const id: string | undefined = assoc?.id;
  return id ? { id } : undefined;
}

async function deleteCalendarChannelAssociation(id: string): Promise<void> {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would delete calendarChannelEventAssociation:', { id, soft_delete: SOFT_DELETE });
    return;
  }

  await apiClient.delete(`calendarChannelEventAssociations/${id}`, {
    params: {
      soft_delete: SOFT_DELETE,
    },
  });
}

async function cleanupExistingEventsBestEffort(): Promise<void> {
  if (!CLEANUP_EXISTING_BY_NAMESPACE) return;

  // We don’t rely on this for correctness; it’s just a convenience.
  // Twenty supports complex filters (see OpenAPI `filter` examples); `startsWith` may vary by backend.
  // We attempt an ilike prefix match first.
  const prefix = `${MOCK_NAMESPACE}/${SEED}/`;
  const likePattern = `${prefix}%`;

  console.log('Cleanup enabled. Attempting best-effort cleanup by iCalUID prefix:', prefix);

  const { data } = await apiClient.get('calendarEvents', {
    params: {
      filter: `iCalUID[ilike]:${quoteFilterValue(likePattern)}`,
      limit: 200,
      depth: 0,
    },
  });

  const events: Array<{ id?: string; iCalUID?: string }> = data?.data?.calendarEvents ?? [];
  const ids = events.map((e) => e.id).filter((id): id is string => typeof id === 'string' && id.length > 0);

  if (!ids.length) {
    console.log('Cleanup: no matching events found.');
    return;
  }

  console.log(`Cleanup: deleting ${ids.length} event(s)...`);
  for (const id of ids) await deleteCalendarEvent(id);
}

async function main() {
  console.log('Script 04: Calendar Events CRUD (mock data)');
  const deleteEventsAtEnd = DELETE_EVENTS_AT_END;
  // If you keep events for UI inspection, keep their channel associations too; otherwise they’ll appear “Not shared”.
  const deleteAssociationsAtEnd = DELETE_CHANNEL_ASSOCIATIONS_AT_END && deleteEventsAtEnd;

  console.log('Config:', {
    DRY_RUN,
    DEPTH,
    UPSERT,
    SOFT_DELETE,
    DELETE_EVENTS_AT_END,
    PERSON_ID: PERSON_ID ?? null,
    PERSON_HANDLE: PERSON_HANDLE ?? null,
    PERSON_DISPLAY_NAME: PERSON_DISPLAY_NAME ?? null,
    PERSON_RESPONSE_STATUS,
    PERSON_IS_ORGANIZER,
    MOCK_NAMESPACE,
    SEED,
    EVENT_COUNT,
    BASE_START_ISO,
    MIN_DURATION_MINUTES,
    MAX_DURATION_MINUTES,
    MIN_GAP_MINUTES,
    MAX_GAP_MINUTES,
    TIMEZONE_HINT: TIMEZONE_HINT ?? null,
    CLEANUP_EXISTING_BY_NAMESPACE,
    CREATE_CHANNEL_ASSOCIATION,
    CALENDAR_CHANNEL_ID: CALENDAR_CHANNEL_ID ?? null,
    EVENT_EXTERNAL_ID_STRATEGY,
    DELETE_CHANNEL_ASSOCIATIONS_AT_END: deleteAssociationsAtEnd,
    ENSURE_CALENDAR_CHANNEL_SHARED,
    AUTO_CREATE_CHANNEL_ASSOCIATION_FOR_VISIBILITY,
  });

  if (EVENT_COUNT <= 0) {
    throw new Error('CONFIG error: EVENT_COUNT must be > 0.');
  }

  if (Number.isNaN(Date.parse(BASE_START_ISO))) {
    throw new Error('CONFIG error: BASE_START_ISO must be a valid ISO timestamp.');
  }

  const minDur = clampInt(MIN_DURATION_MINUTES, 1, 24 * 60);
  const maxDur = clampInt(MAX_DURATION_MINUTES, 1, 24 * 60);
  if (minDur > maxDur) throw new Error('CONFIG error: MIN_DURATION_MINUTES must be <= MAX_DURATION_MINUTES.');

  const minGap = clampInt(MIN_GAP_MINUTES, 0, 7 * 24 * 60);
  const maxGap = clampInt(MAX_GAP_MINUTES, 0, 7 * 24 * 60);
  if (minGap > maxGap) throw new Error('CONFIG error: MIN_GAP_MINUTES must be <= MAX_GAP_MINUTES.');

  if (CLEANUP_EXISTING_BY_NAMESPACE) {
    await cleanupExistingEventsBestEffort();
  }

  const mockEvents = buildMockEvents({
    baseStartIso: BASE_START_ISO,
    count: EVENT_COUNT,
    minGapMinutes: minGap,
    maxGapMinutes: maxGap,
    minDurationMinutes: minDur,
    maxDurationMinutes: maxDur,
  });
  console.log(`Generated ${mockEvents.length} mock event(s).`);

  const wantsCalendarChannel = CREATE_CHANNEL_ASSOCIATION || ENSURE_CALENDAR_CHANNEL_SHARED;
  const calendarChannelId = wantsCalendarChannel ? await resolveCalendarChannelId() : undefined;
  if (wantsCalendarChannel && !calendarChannelId) {
    console.warn(
      '⚠️ A calendarChannel is required (association or sharing) but none was found. ' +
        'Skipping associations (GET /calendarChannels returned empty).',
    );
  } else if (calendarChannelId) {
    console.log('Using calendarChannel:', calendarChannelId);
  }

  if (ENSURE_CALENDAR_CHANNEL_SHARED && calendarChannelId) {
    await ensureCalendarChannelShared(calendarChannelId);
  }

  const createdOrFound: Array<{ iCalUID: string; id: string; title?: string; startsAt?: string; endsAt?: string }> = [];
  const associationIds: string[] = [];
  const participantIds: string[] = [];

  // 1) Find/create
  for (const ev of mockEvents) {
    const iCalUID = ev.iCalUID;
    if (!iCalUID) throw new Error('Internal error: generated event missing iCalUID.');

    const existing = await findCalendarEventByICalUid(iCalUID);
    const created = existing
      ? (console.log('Found existing calendarEvent for iCalUID:', iCalUID, '->', existing.id), existing)
      : await createCalendarEvent(ev);

    createdOrFound.push({
      iCalUID,
      id: created.id,
      title: created.title ?? ev.title,
      startsAt: created.startsAt ?? ev.startsAt,
      endsAt: created.endsAt ?? ev.endsAt,
    });

    // Optional: link to person
    if (PERSON_ID) {
      const participant = await upsertCalendarEventParticipant({
        calendarEventId: created.id,
        personId: PERSON_ID,
        handle: PERSON_HANDLE,
        displayName: PERSON_DISPLAY_NAME,
        responseStatus: PERSON_RESPONSE_STATUS,
        isOrganizer: PERSON_IS_ORGANIZER,
      });
      if (participant?.id) participantIds.push(participant.id);
    }

    // Optional: associate to a calendar channel
    const shouldAssociate =
      Boolean(calendarChannelId) &&
      (CREATE_CHANNEL_ASSOCIATION || (ENSURE_CALENDAR_CHANNEL_SHARED && AUTO_CREATE_CHANNEL_ASSOCIATION_FOR_VISIBILITY));

    if (shouldAssociate && calendarChannelId) {
      const eventExternalId = EVENT_EXTERNAL_ID_STRATEGY === 'id' ? created.id : iCalUID;
      const assoc = await createCalendarChannelAssociation({
        calendarChannelId,
        calendarEventId: created.id,
        eventExternalId,
      });
      if (assoc?.id) associationIds.push(assoc.id);
    }
  }

  // 2) Update (derived; no manual details)
  const updatedIds: string[] = [];
  for (const item of createdOrFound) {
    // Extend the event by +15 minutes (relative to its existing endsAt).
    // Fallbacks ensure endsAt remains >= startsAt even if the API omits fields.
    const nowIso = new Date().toISOString();
    const baseEnd = item.endsAt;
    const baseStart = item.startsAt;
    const updateEndsAt = baseEnd
      ? addMinutes(baseEnd, 15)
      : baseStart
        ? addMinutes(baseStart, 60)
        : addMinutes(nowIso, 15);

    const update: CalendarEventPayload = {
      title: `${item.title ?? 'Mock Event'} (Updated)`,
      location: `Updated @ ${nowIso}`,
      endsAt: updateEndsAt,
      externalUpdatedAt: nowIso,
    };

    const updated = await updateCalendarEvent(item.id, update);
    updatedIds.push(updated.id);
  }

  // 3) Delete (and optionally association deletes)
  if (deleteAssociationsAtEnd && associationIds.length) {
    console.log(`Deleting ${associationIds.length} calendarChannelEventAssociation(s)...`);
    for (const assocId of associationIds) await deleteCalendarChannelAssociation(assocId);
  }

  const deletedIds: string[] = [];
  if (deleteEventsAtEnd) {
    for (const item of createdOrFound) {
      const deleted = await deleteCalendarEvent(item.id);
      deletedIds.push(deleted.id);
    }
  }

  console.log(
    '\nDone. Summary:\n',
    JSON.stringify(
      {
        namespace: MOCK_NAMESPACE,
        seed: SEED,
        count: EVENT_COUNT,
        participantIds,
        createdOrFound,
        updatedIds,
        associationIds: deleteAssociationsAtEnd ? [] : associationIds,
        deletedIds: deleteEventsAtEnd ? deletedIds : [],
      },
      null,
      2,
    ),
  );
}

main().catch((error: any) => {
  const status = error?.response?.status;
  const body = error?.response?.data;
  console.error('❌ Script failed.', {
    status,
    message: error?.message ?? String(error),
    body,
  });
  process.exitCode = 1;
});

