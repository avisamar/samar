import { apiClient } from '../apiClient';

/**
 * Script 07: Create / update mock email threads for a Person
 *
 * No CLI flags by design.
 * Edit the CONFIG section below, then run:
 *   bun run src/scripts/07_email_threads.ts
 *
 * Notes:
 * - Message upserts are idempotent via stable `headerMessageId`.
 * - MessageThread create is NOT idempotent by itself (spec exposes no stable unique fields).
 *   To keep the same threads across reruns, copy thread IDs printed by the script into THREAD_ID_BY_KEY.
 */

// =========================
// CONFIG (edit me)
// =========================

// Prefer PERSON_ID if you already know it. Otherwise PERSON_EMAIL is used to look up the Person.
const PERSON_ID: string | undefined = 'f8c19c41-1407-4c31-b136-6e6927a7280c';
const PERSON_EMAIL = 'anita.menon@example.com';

// Change this if you want to avoid collisions across environments/workspaces.
// This gets embedded into headerMessageId for idempotent upserts.
const MOCK_NAMESPACE = 'poc-twenty-email';

// Optional: paste created thread IDs here to keep thread(s) stable across reruns.
// Example:
// const THREAD_ID_BY_KEY: Record<string, string> = {
//   onboarding: '...uuid...',
//   taxPlanning: '...uuid...',
// };
const THREAD_ID_BY_KEY: Record<string, string> = {};

// To make the UI show threads as shared, messages should be attached to an EMAIL messageChannel,
// and that channel should have visibility=SHARE_EVERYTHING.
//
// If MESSAGE_CHANNEL_ID is undefined, the script will auto-pick the first messageChannel where type=email.
// Tip: You can paste a specific channel id here once you know which inbox you want to use.
const MESSAGE_CHANNEL_ID: string | undefined = undefined;

// If true, we log what we'd do without writing.
const DRY_RUN = false;

// =========================
// Mock dataset (edit me)
// =========================

type ParticipantRole = 'from' | 'to' | 'cc' | 'bcc';
type MessageDirection = 'INCOMING' | 'OUTGOING';
type ParticipantSpec =
  | { kind: 'person'; role: ParticipantRole; displayName?: string }
  | { kind: 'external'; role: ParticipantRole; handle: string; displayName?: string };

type MockMessage = {
  key: string; // stable per dataset
  subject: string;
  text: string;
  receivedAt: string; // ISO date-time
  participants: ParticipantSpec[];
};

type MockThread = {
  key: string; // stable per dataset (used for THREAD_ID_BY_KEY)
  label: string;
  messages: MockMessage[];
};

const MOCK_THREADS: MockThread[] = [
  {
    key: 'onboarding',
    label: 'Onboarding / KYC',
    messages: [
      {
        key: 'welcome-1',
        subject: 'Welcome to Samar Capital — next steps',
        text:
          'Hi Rohit,\n\nWelcome aboard. Sharing the onboarding checklist:\n- KYC documents\n- Risk profile questionnaire\n- Bank mandate\n\nRegards,\nAvi',
        receivedAt: '2025-01-12T09:30:00.000Z',
        participants: [
          { kind: 'external', role: 'from', handle: 'avi@samar.example', displayName: 'Avi (RM)' },
          { kind: 'person', role: 'to', displayName: 'Rohit Sharma' },
          { kind: 'external', role: 'cc', handle: 'ops@samar.example', displayName: 'Samar Ops' },
        ],
      },
      {
        key: 'docs-2',
        subject: 'Re: Welcome to Samar Capital — documents received',
        text:
          'Thanks Avi.\n\nAttached:\n- PAN\n- Aadhaar\n- Bank proof\n\nRohit',
        receivedAt: '2025-01-12T11:05:00.000Z',
        participants: [
          { kind: 'person', role: 'from', displayName: 'Rohit Sharma' },
          { kind: 'external', role: 'to', handle: 'avi@samar.example', displayName: 'Avi (RM)' },
        ],
      },
    ],
  },
  {
    key: 'taxPlanning',
    label: 'Tax planning FY25',
    messages: [
      {
        key: 'intro-1',
        subject: 'Tax planning FY25 — quick questions',
        text:
          'Hi Rohit,\n\nBefore we finalize the FY25 plan:\n1) Any change in salary structure?\n2) Any expected capital gains?\n3) Planned large expenses (home, car)?\n\nAvi',
        receivedAt: '2025-02-03T06:15:00.000Z',
        participants: [
          { kind: 'external', role: 'from', handle: 'avi@samar.example', displayName: 'Avi (RM)' },
          { kind: 'person', role: 'to', displayName: 'Rohit Sharma' },
        ],
      },
      {
        key: 'reply-2',
        subject: 'Re: Tax planning FY25 — quick questions',
        text:
          'Hi Avi,\n\n1) No change in salary.\n2) Expect some equity LTCG in Q4.\n3) Considering a down payment in June.\n\nRohit',
        receivedAt: '2025-02-03T07:02:00.000Z',
        participants: [
          { kind: 'person', role: 'from', displayName: 'Rohit Sharma' },
          { kind: 'external', role: 'to', handle: 'avi@samar.example', displayName: 'Avi (RM)' },
        ],
      },
      {
        key: 'nextsteps-3',
        subject: 'Re: Tax planning FY25 — proposed actions',
        text:
          'Got it.\n\nProposed actions:\n- Harvest losses if needed in Q4\n- Increase ELSS/S80C allocation\n- Set aside liquidity for June down payment\n\nLet’s align on a 20-min call.\n\nAvi',
        receivedAt: '2025-02-03T07:25:00.000Z',
        participants: [
          { kind: 'external', role: 'from', handle: 'avi@samar.example', displayName: 'Avi (RM)' },
          { kind: 'person', role: 'to', displayName: 'Rohit Sharma' },
          { kind: 'external', role: 'cc', handle: 'planner@samar.example', displayName: 'Financial Planner' },
        ],
      },
    ],
  },
];

type ResolvedPerson = {
  id: string;
  email?: string;
};

function buildHeaderMessageId(threadKey: string, messageKey: string) {
  return `${MOCK_NAMESPACE}/${threadKey}/${messageKey}`;
}

function buildExternalThreadId(threadKey: string) {
  // Used for MessageChannelMessageAssociation.messageThreadExternalId
  return `${MOCK_NAMESPACE}/${threadKey}`;
}

function inferDirection(message: MockMessage): MessageDirection {
  // Heuristic:
  // - If the Person is the sender ("from"), treat as INCOMING
  // - Else treat as OUTGOING (RM/system -> person)
  return message.participants.some((p) => p.kind === 'person' && p.role === 'from') ? 'INCOMING' : 'OUTGOING';
}

async function resolvePerson(): Promise<ResolvedPerson> {
  if (PERSON_ID) return { id: PERSON_ID, email: PERSON_EMAIL };

  if (!PERSON_EMAIL) {
    throw new Error('CONFIG error: set PERSON_ID or PERSON_EMAIL.');
  }

  const { data } = await apiClient.get('people', {
    params: {
      filter: `emails.primaryEmail[eq]:${PERSON_EMAIL}`,
      limit: 1,
      depth: 0,
    },
  });

  const people = data?.data?.people ?? [];
  const person = people[0];
  const id = person?.id;
  if (!id) {
    throw new Error(`Person not found for email ${PERSON_EMAIL}. Create the Person first (e.g. script 03).`);
  }

  const email = person?.emails?.primaryEmail ?? PERSON_EMAIL;
  return { id, email };
}

async function resolveMessageChannelId(): Promise<string | undefined> {
  if (MESSAGE_CHANNEL_ID) return MESSAGE_CHANNEL_ID;

  const { data } = await apiClient.get('messageChannels', {
    params: {
      filter: 'type[eq]:email',
      limit: 1,
      depth: 0,
    },
  });

  const channels = data?.data?.messageChannels ?? [];
  return channels[0]?.id;
}

async function ensureMessageChannelShared(messageChannelId: string) {
  if (DRY_RUN) {
    console.log('[DRY_RUN] would set messageChannel visibility=SHARE_EVERYTHING:', { messageChannelId });
    return;
  }

  // Setting it every time is safe; it’s idempotent.
  await apiClient.patch(
    `messageChannels/${messageChannelId}`,
    { visibility: 'SHARE_EVERYTHING' },
    { params: { depth: 0 } },
  );
}

async function createThread(): Promise<string> {
  const { data } = await apiClient.post(
    'messageThreads',
    {},
    {
      params: {
        depth: 0,
      },
    },
  );

  const threadId =
    data?.data?.createMessageThread?.id ??
    data?.data?.messageThread?.id ??
    data?.data?.createMessageThreads?.[0]?.id;

  if (!threadId) {
    throw new Error(`Unexpected create messageThread response: ${JSON.stringify(data)}`);
  }

  return threadId;
}

async function upsertMessage(input: {
  threadId: string;
  headerMessageId: string;
  subject: string;
  text: string;
  receivedAt: string;
}): Promise<{ id: string }> {
  const payload = {
    headerMessageId: input.headerMessageId,
    subject: input.subject,
    text: input.text,
    receivedAt: input.receivedAt,
    messageThreadId: input.threadId,
  };

  if (DRY_RUN) {
    console.log('[DRY_RUN] would upsert message:', payload);
    return { id: 'dry-run-message-id' };
  }

  const { data } = await apiClient.post('messages', payload, {
    params: {
      upsert: true,
      depth: 0,
    },
  });

  const messageId =
    data?.data?.createMessage?.id ??
    data?.data?.message?.id ??
    data?.data?.createMessages?.[0]?.id;

  if (!messageId) {
    throw new Error(`Unexpected create message response: ${JSON.stringify(data)}`);
  }

  return { id: messageId };
}

async function upsertMessageChannelAssociation(input: {
  messageChannelId: string;
  messageId: string;
  messageExternalId: string;
  messageThreadExternalId: string;
  direction: MessageDirection;
}) {
  const payload = {
    messageExternalId: input.messageExternalId,
    messageThreadExternalId: input.messageThreadExternalId,
    direction: input.direction,
    messageChannelId: input.messageChannelId,
    messageId: input.messageId,
  };

  if (DRY_RUN) {
    console.log('[DRY_RUN] would upsert messageChannelMessageAssociation:', payload);
    return;
  }

  await apiClient.post('messageChannelMessageAssociations', payload, {
    params: {
      upsert: true,
      depth: 0,
    },
  });
}

async function upsertParticipant(input: {
  messageId: string;
  role: ParticipantRole;
  handle?: string;
  displayName?: string;
  personId?: string;
}): Promise<{ id: string }> {
  const payload: Record<string, unknown> = {
    role: input.role,
    messageId: input.messageId,
  };

  if (input.handle) payload.handle = input.handle;
  if (input.displayName) payload.displayName = input.displayName;
  if (input.personId) payload.personId = input.personId;

  if (DRY_RUN) {
    console.log('[DRY_RUN] would upsert participant:', payload);
    return { id: 'dry-run-participant-id' };
  }

  const { data } = await apiClient.post('messageParticipants', payload, {
    params: {
      upsert: true,
      depth: 0,
    },
  });

  const participantId =
    data?.data?.createMessageParticipant?.id ??
    data?.data?.messageParticipant?.id ??
    data?.data?.createMessageParticipants?.[0]?.id;

  if (!participantId) {
    throw new Error(`Unexpected create messageParticipant response: ${JSON.stringify(data)}`);
  }

  return { id: participantId };
}

async function main() {
  console.log('Script 07: Creating/updating mock email threads...');
  console.log('Config:', {
    PERSON_ID: PERSON_ID ?? null,
    PERSON_EMAIL,
    MOCK_NAMESPACE,
    MESSAGE_CHANNEL_ID: MESSAGE_CHANNEL_ID ?? null,
    DRY_RUN,
    THREAD_ID_BY_KEY,
  });

  const person = await resolvePerson();
  console.log('Resolved person:', person);

  const messageChannelId = await resolveMessageChannelId();
  if (!messageChannelId) {
    console.warn(
      '⚠️ No email messageChannel found (GET /messageChannels?filter=type[eq]:email returned empty). ' +
        'Emails may remain "Not shared" in the UI until you have a connected email inbox / messageChannel.',
    );
  } else {
    await ensureMessageChannelShared(messageChannelId);
    console.log('Using messageChannel:', messageChannelId);
  }

  const results: Array<{
    threadKey: string;
    threadId: string;
    messageIds: string[];
  }> = [];

  for (const thread of MOCK_THREADS) {
    const existingThreadId = THREAD_ID_BY_KEY[thread.key];
    const threadId = existingThreadId ?? (DRY_RUN ? `dry-run-thread-${thread.key}` : await createThread());

    if (!existingThreadId) {
      console.log(
        `Created thread "${thread.label}" (${thread.key}) -> ${threadId}. ` +
          `Tip: paste this into THREAD_ID_BY_KEY to keep it stable across reruns.`,
      );
    } else {
      console.log(`Using existing thread "${thread.label}" (${thread.key}) -> ${threadId}`);
    }

    const messageIds: string[] = [];

    for (const m of thread.messages) {
      const headerMessageId = buildHeaderMessageId(thread.key, m.key);
      const messageThreadExternalId = buildExternalThreadId(thread.key);
      const direction = inferDirection(m);

      const { id: messageId } = await upsertMessage({
        threadId,
        headerMessageId,
        subject: m.subject,
        text: m.text,
        receivedAt: m.receivedAt,
      });

      messageIds.push(messageId);

      if (messageChannelId) {
        await upsertMessageChannelAssociation({
          messageChannelId,
          messageId,
          messageExternalId: headerMessageId,
          messageThreadExternalId,
          direction,
        });
      }

      for (const p of m.participants) {
        if (p.kind === 'person') {
          await upsertParticipant({
            messageId,
            role: p.role,
            personId: person.id,
            handle: person.email, // helps readability / matching
            displayName: p.displayName,
          });
        } else {
          await upsertParticipant({
            messageId,
            role: p.role,
            handle: p.handle,
            displayName: p.displayName,
          });
        }
      }
    }

    results.push({ threadKey: thread.key, threadId, messageIds });
  }

  console.log('\nDone. Summary:\n', JSON.stringify({ person, results }, null, 2));
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

