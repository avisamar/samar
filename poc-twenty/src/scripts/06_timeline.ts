import { apiClient } from '../apiClient';

type Options = {
  limit: number;
  depth: 0 | 1;
  orderBy?: string;
  filter?: string;
  maxPages: number;
  json: boolean;
  startingAfter?: string;
  endingBefore?: string;
  // convenience filters
  personId?: string;
  companyId?: string;
  linkedRecordId?: string;
  name?: string;
};

type TimelineActivity = {
  id: string;
  name?: string;
  happensAt?: string;
  createdAt?: string;
  linkedRecordCachedName?: string;
  linkedRecordId?: string;
  linkedObjectMetadataId?: string;
  properties?: unknown;

  workspaceMemberId?: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  noteId?: string;
  taskId?: string;
  workflowId?: string;
  workflowVersionId?: string;
  workflowRunId?: string;
  dashboardId?: string;
  surveyResultId?: string;
  wealthProfileId?: string;
  riskProfileId?: string;
};

type FindManyResponse = {
  data?: {
    timelineActivities?: TimelineActivity[];
  };
  pageInfo?: {
    hasNextPage?: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount?: number;
};

function quoteFilterValue(value: string): string {
  // OpenAPI examples show date strings quoted: createdAt[gte]:"2023-01-01"
  // We'll quote only when we intentionally build string-valued filters.
  return `"${value.replaceAll('"', '\\"')}"`;
}

function parseArgs(argv: string[]): Options {
  // bun run src/scripts/06_timeline.ts --limit 50 --orderBy 'happensAt[DescNullsLast]' --maxPages 2
  // bun run src/scripts/06_timeline.ts --filter 'personId[eq]:<uuid>'
  const opts: Options = {
    limit: 60,
    depth: 1,
    maxPages: 1,
    json: false,
  };

  const getValue = (i: number): { value?: string; consumed: number } => {
    const arg = argv[i]!;
    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) return { value: arg.slice(eqIdx + 1), consumed: 0 };
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) return { value: undefined, consumed: 0 };
    return { value: next, consumed: 1 };
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith('--')) continue;

    const key = arg.includes('=') ? arg.slice(2, arg.indexOf('=')) : arg.slice(2);
    const { value, consumed } = getValue(i);

    switch (key) {
      case 'limit': {
        const v = Number(value);
        if (Number.isFinite(v) && v >= 0) opts.limit = Math.min(200, Math.floor(v));
        break;
      }
      case 'depth': {
        const v = Number(value);
        opts.depth = v === 0 ? 0 : 1;
        break;
      }
      case 'orderBy':
      case 'order_by': {
        if (value) opts.orderBy = value;
        break;
      }
      case 'filter': {
        if (value) opts.filter = value;
        break;
      }
      case 'maxPages': {
        const v = Number(value);
        if (Number.isFinite(v) && v > 0) opts.maxPages = Math.floor(v);
        break;
      }
      case 'json': {
        opts.json = true;
        break;
      }
      case 'startingAfter':
      case 'starting_after': {
        if (value) opts.startingAfter = value;
        break;
      }
      case 'endingBefore':
      case 'ending_before': {
        if (value) opts.endingBefore = value;
        break;
      }
      // convenience filter flags
      case 'personId': {
        if (value) opts.personId = value;
        break;
      }
      case 'companyId': {
        if (value) opts.companyId = value;
        break;
      }
      case 'linkedRecordId': {
        if (value) opts.linkedRecordId = value;
        break;
      }
      case 'name': {
        if (value) opts.name = value;
        break;
      }
      case 'help': {
        console.log(`
Usage:
  bun run src/scripts/06_timeline.ts [options]

Options:
  --limit <n>                 (default: 60, max: 200)
  --depth <0|1>               (default: 1)
  --orderBy <expr>            (maps to order_by)
  --filter <expr>             (raw filter string)
  --startingAfter <cursor>    (maps to starting_after)
  --endingBefore <cursor>     (maps to ending_before)
  --maxPages <n>              (default: 1)
  --json                      (dump raw items as JSON)

Convenience filters (ignored if --filter is provided):
  --personId <uuid>
  --companyId <uuid>
  --linkedRecordId <uuid>
  --name <string>
`);
        process.exit(0);
      }
      default:
        // ignore unknown flags
        break;
    }

    i += consumed;
  }

  return opts;
}

function buildFilter(opts: Options): string | undefined {
  if (opts.filter) return opts.filter;

  const parts: string[] = [];
  if (opts.personId) parts.push(`personId[eq]:${opts.personId}`);
  if (opts.companyId) parts.push(`companyId[eq]:${opts.companyId}`);
  if (opts.linkedRecordId) parts.push(`linkedRecordId[eq]:${opts.linkedRecordId}`);
  if (opts.name) parts.push(`name[eq]:${quoteFilterValue(opts.name)}`);

  return parts.length > 0 ? parts.join(',') : undefined;
}

function compactJson(value: unknown): string {
  try {
    if (value == null) return '';
    const s = JSON.stringify(value);
    return s.length > 160 ? `${s.slice(0, 157)}...` : s;
  } catch {
    return '';
  }
}

function formatActivityLine(a: TimelineActivity): string {
  const when = a.happensAt ?? a.createdAt ?? '';
  const name = a.name ?? '';
  const record = a.linkedRecordCachedName ?? '';
  const recordId = a.linkedRecordId ?? '';

  const related: string[] = [];
  const relatedKeys: Array<keyof TimelineActivity> = [
    'personId',
    'companyId',
    'opportunityId',
    'noteId',
    'taskId',
    'workflowId',
    'workflowVersionId',
    'workflowRunId',
    'dashboardId',
    'surveyResultId',
    'wealthProfileId',
    'riskProfileId',
  ];
  for (const k of relatedKeys) {
    const v = a[k];
    if (typeof v === 'string' && v.length > 0) related.push(`${k}=${v}`);
  }

  const props = compactJson(a.properties);
  const parts = [
    when,
    name,
    `record=${record}${recordId ? ` (${recordId})` : ''}`,
    related.length ? related.join(' ') : '',
    props ? `properties=${props}` : '',
  ].filter(Boolean);

  return parts.join(' | ');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const filter = buildFilter(opts);

  console.log('Reading timeline activities...');
  console.log('Options:', {
    limit: opts.limit,
    depth: opts.depth,
    order_by: opts.orderBy,
    filter,
    starting_after: opts.startingAfter,
    ending_before: opts.endingBefore,
    maxPages: opts.maxPages,
    json: opts.json,
  });

  try {
    let page = 0;
    let cursor: string | undefined = opts.startingAfter;
    let printed = 0;
    let totalCount: number | undefined;

    while (page < opts.maxPages) {
      page += 1;

      const { data } = await apiClient.get('timelineActivities', {
        params: {
          limit: opts.limit,
          depth: opts.depth,
          order_by: opts.orderBy,
          filter,
          starting_after: cursor,
          ending_before: opts.endingBefore,
        },
      });

      const activities = data?.data?.timelineActivities ?? [];
      console.log(JSON.stringify(activities[0], null, 2));
      totalCount = typeof data?.totalCount === 'number' ? data.totalCount : totalCount;
      const pageInfo = data?.pageInfo;

      console.log(`\n--- Page ${page} ---`);
      console.log(`Fetched ${activities.length} timeline activities.`);
      if (typeof totalCount === 'number') console.log(`Total count: ${totalCount}`);
      if (pageInfo) console.log('Page info:', pageInfo);

      if (opts.json) {
        // Print page-by-page so large result sets don't buffer huge arrays.
        console.log(JSON.stringify(activities, null, 2));
      } else {
        for (const a of activities) console.log(formatActivityLine(a));
      }

      printed += activities.length;

      const hasNextPage = Boolean(pageInfo?.hasNextPage);
      const endCursor = pageInfo?.endCursor;

      if (!hasNextPage) break;
      if (!endCursor) {
        console.warn('⚠️ hasNextPage=true but endCursor is missing; stopping pagination.');
        break;
      }
      cursor = endCursor;
    }

    console.log(`\nDone. Printed ${printed} timeline activities across ${page} page(s).`);
  } catch (error: any) {
    const status = error.response?.status;
    const body = error.response?.data;
    console.error('❌ Failed to read timeline activities.', {
      status,
      message: error.message,
      body,
    });
    process.exitCode = 1;
  }
}

main();