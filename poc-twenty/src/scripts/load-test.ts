/**
 * Load Testing Script for Twenty CRM
 *
 * Tests the performance of the repository layer by creating multiple clients
 * with associated activities (notes, emails, tasks) and querying timelines.
 *
 * Usage:
 *   bun run src/scripts/load-test.ts --people 10 --concurrency 5
 */

import pLimit from 'p-limit';
import { apiClient } from '../apiClient';
import { MetricsCollector } from '../utils/MetricsCollector';
import { createInstrumentedHttpClient } from '../utils/InstrumentedHttpClient';
import { ReportGenerator } from '../utils/ReportGenerator';
import { TwentyClientRepository } from '../infrastructure/twenty/repositories/TwentyClientRepository';
import { TwentyNoteRepository } from '../infrastructure/twenty/repositories/TwentyNoteRepository';
import { TwentyTaskRepository } from '../infrastructure/twenty/repositories/TwentyTaskRepository';
import { TwentyEmailRepository } from '../infrastructure/twenty/repositories/TwentyEmailRepository';
import { TwentyTimelineRepository } from '../infrastructure/twenty/repositories/TwentyTimelineRepository';

// CLI configuration interface
interface LoadTestConfig {
  peopleCount: number;
  concurrency: number;
  outputDir: string;
  notesPerPerson: number;
  emailsPerPerson: number;
  tasksPerPerson: number;
  timelineFetches: number;
}

// Parse command line arguments
function parseArgs(argv: string[]): LoadTestConfig {
  const config: LoadTestConfig = {
    peopleCount: 10,
    concurrency: 10,
    outputDir: '/Users/avi/work/poc-twenty/load-test-reports',
    notesPerPerson: 100,
    emailsPerPerson: 100,
    tasksPerPerson: 100,
    timelineFetches: 1000,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      const nextValue = value || argv[i + 1];

      switch (key) {
        case '--people':
          config.peopleCount = parseInt(nextValue, 10);
          if (!value) i++;
          break;
        case '--concurrency':
          config.concurrency = parseInt(nextValue, 10);
          if (!value) i++;
          break;
        case '--output':
          config.outputDir = nextValue;
          if (!value) i++;
          break;
        case '--notes':
          config.notesPerPerson = parseInt(nextValue, 10);
          if (!value) i++;
          break;
        case '--emails':
          config.emailsPerPerson = parseInt(nextValue, 10);
          if (!value) i++;
          break;
        case '--tasks':
          config.tasksPerPerson = parseInt(nextValue, 10);
          if (!value) i++;
          break;
        case '--timeline-fetches':
          config.timelineFetches = parseInt(nextValue, 10);
          if (!value) i++;
          break;
        case '--help':
          console.log(`
Usage: bun run src/scripts/load-test.ts [options]

Options:
  --people N           Number of people to create (default: 10)
  --concurrency N      Concurrent operations (default: 10)
  --output PATH        Output directory for reports (default: ./load-test-reports)
  --notes N            Notes per person (default: 100)
  --emails N           Emails per person (default: 100)
  --tasks N            Tasks per person (default: 100)
  --timeline-fetches N Timeline fetches per person (default: 1000)
  --help               Show this help
          `);
          process.exit(0);
      }
    }
  }

  return config;
}

// Client record interface
interface ClientRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  wealthProfileId?: string;
  riskProfileId?: string;
  noteIds: string[];
  taskIds: string[];
  emailThreadIds: string[];
}

/**
 * Create a single client with profiles
 */
async function createClient(
  clientRepo: TwentyClientRepository,
  index: number
): Promise<ClientRecord> {
  const timestamp = Date.now();
  const email = `loadtest-${timestamp}-${index}@example.com`;
  const firstName = `LoadTest${index}`;
  const lastName = `User${timestamp}`;

  console.log(`[${index}] Creating client: ${email}`);

  const client = await clientRepo.createClient({
    firstName,
    lastName,
    email,
    phone: `+91-${9000000000 + index}`,
    city: 'Bangalore',
  });

  console.log(`[${index}] ✓ Created person: ${client.id}`);

  // Create wealth profile
  let wealthProfileId: string | undefined;
  try {
    const wealthProfile = await clientRepo.createWealthProfile(client.id, {
      jobTitleDesignation: 'Software Engineer',
      monthlySurplus: 50000 + (index * 1000),
      primaryWealthSource: 'SALARY',
    });
    wealthProfileId = wealthProfile.id;
    console.log(`[${index}] ✓ Created wealth profile`);
  } catch (error: any) {
    console.error(`[${index}] ✗ Failed to create wealth profile: ${error.message}`);
  }

  // Create risk profile
  let riskProfileId: string | undefined;
  try {
    const riskProfile = await clientRepo.createRiskProfile(client.id, {
      name: `${firstName} ${lastName}`,
      riskToleranceScale: 5 + (index % 5),
      taxBracket: 30,
    });
    riskProfileId = riskProfile.id;
    console.log(`[${index}] ✓ Created risk profile`);
  } catch (error: any) {
    console.error(`[${index}] ✗ Failed to create risk profile: ${error.message}`);
  }

  return {
    id: client.id,
    email: client.email,
    firstName: client.firstName,
    lastName: client.lastName,
    wealthProfileId,
    riskProfileId,
    noteIds: [],
    taskIds: [],
    emailThreadIds: [],
  };
}

/**
 * Create notes for a client
 */
async function createNotesForClient(
  noteRepo: TwentyNoteRepository,
  clientRecord: ClientRecord,
  count: number,
  clientIndex: number,
  concurrency: number
): Promise<void> {
  const limit = pLimit(concurrency);
  const notePromises: Promise<void>[] = [];

  console.log(`[${clientIndex}] Creating ${count} notes...`);

  for (let i = 0; i < count; i++) {
    notePromises.push(
      limit(async () => {
        try {
          const note = await noteRepo.createNote({
            title: `Load Test Note ${i + 1} for ${clientRecord.firstName}`,
            content: `This is test note #${i + 1} created during load testing at ${new Date().toISOString()}`,
            linkedPersonIds: [clientRecord.id],
          });
          clientRecord.noteIds.push(note.id);

          if ((i + 1) % 20 === 0) {
            console.log(`[${clientIndex}] ✓ Created ${i + 1}/${count} notes`);
          }
        } catch (error: any) {
          console.error(`[${clientIndex}] ✗ Failed to create note ${i + 1}: ${error.message}`);
        }
      })
    );
  }

  await Promise.all(notePromises);
  console.log(`[${clientIndex}] ✓ Completed all ${count} notes`);
}

/**
 * Create email threads for a client
 */
async function createEmailsForClient(
  emailRepo: TwentyEmailRepository,
  clientRecord: ClientRecord,
  count: number,
  clientIndex: number,
  concurrency: number
): Promise<void> {
  const limit = pLimit(concurrency);
  const emailPromises: Promise<void>[] = [];

  console.log(`[${clientIndex}] Creating ${count} email threads...`);

  for (let i = 0; i < count; i++) {
    emailPromises.push(
      limit(async () => {
        try {
          const thread = await emailRepo.createThread({
            subject: `Load Test Email ${i + 1} - ${clientRecord.firstName}`,
            messages: [
              {
                subject: `Load Test Email ${i + 1} - ${clientRecord.firstName}`,
                text: `This is test email #${i + 1} created during load testing.\n\nTimestamp: ${new Date().toISOString()}`,
                receivedAt: new Date(),
              },
            ],
          });
          clientRecord.emailThreadIds.push(thread.id);

          if ((i + 1) % 20 === 0) {
            console.log(`[${clientIndex}] ✓ Created ${i + 1}/${count} emails`);
          }
        } catch (error: any) {
          console.error(`[${clientIndex}] ✗ Failed to create email ${i + 1}: ${error.message}`);
        }
      })
    );
  }

  await Promise.all(emailPromises);
  console.log(`[${clientIndex}] ✓ Completed all ${count} emails`);
}

/**
 * Create tasks for a client
 */
async function createTasksForClient(
  taskRepo: TwentyTaskRepository,
  clientRecord: ClientRecord,
  count: number,
  clientIndex: number,
  concurrency: number
): Promise<void> {
  const limit = pLimit(concurrency);
  const taskPromises: Promise<void>[] = [];

  console.log(`[${clientIndex}] Creating ${count} tasks...`);

  const statuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

  for (let i = 0; i < count; i++) {
    taskPromises.push(
      limit(async () => {
        try {
          const task = await taskRepo.createTask({
            title: `Load Test Task ${i + 1} for ${clientRecord.firstName}`,
            status: statuses[i % 3],
            dueAt: new Date(Date.now() + (i * 86400000)), // Spread over 100 days
            linkedPersonIds: [clientRecord.id],
          });
          clientRecord.taskIds.push(task.id);

          if ((i + 1) % 20 === 0) {
            console.log(`[${clientIndex}] ✓ Created ${i + 1}/${count} tasks`);
          }
        } catch (error: any) {
          console.error(`[${clientIndex}] ✗ Failed to create task ${i + 1}: ${error.message}`);
        }
      })
    );
  }

  await Promise.all(taskPromises);
  console.log(`[${clientIndex}] ✓ Completed all ${count} tasks`);
}

/**
 * Fetch timeline multiple times for a client
 */
async function fetchTimelineForClient(
  timelineRepo: TwentyTimelineRepository,
  clientRecord: ClientRecord,
  count: number,
  clientIndex: number,
  concurrency: number
): Promise<void> {
  const limit = pLimit(concurrency);
  const timelinePromises: Promise<void>[] = [];

  console.log(`[${clientIndex}] Fetching timeline ${count} times...`);

  for (let i = 0; i < count; i++) {
    timelinePromises.push(
      limit(async () => {
        try {
          await timelineRepo.findActivities({
            personId: clientRecord.id,
            limit: 10,
          });

          if ((i + 1) % 200 === 0) {
            console.log(`[${clientIndex}] ✓ Fetched ${i + 1}/${count} timelines`);
          }
        } catch (error: any) {
          console.error(`[${clientIndex}] ✗ Failed to fetch timeline ${i + 1}: ${error.message}`);
        }
      })
    );
  }

  await Promise.all(timelinePromises);
  console.log(`[${clientIndex}] ✓ Completed all ${count} timeline fetches`);
}

/**
 * Process a single client: create all activities and fetch timeline
 */
async function processClient(
  index: number,
  config: LoadTestConfig,
  repositories: {
    client: TwentyClientRepository;
    notes: TwentyNoteRepository;
    emails: TwentyEmailRepository;
    tasks: TwentyTaskRepository;
    timeline: TwentyTimelineRepository;
  }
): Promise<ClientRecord> {
  const { client, notes, emails, tasks, timeline } = repositories;

  // Step 1: Create client
  const clientRecord = await createClient(client, index);

  // Step 2: Create notes
  await createNotesForClient(notes, clientRecord, config.notesPerPerson, index, config.concurrency);

  // Step 3: Create emails
  await createEmailsForClient(emails, clientRecord, config.emailsPerPerson, index, config.concurrency);

  // Step 4: Create tasks
  await createTasksForClient(tasks, clientRecord, config.tasksPerPerson, index, config.concurrency);

  // Step 5: Fetch timeline
  await fetchTimelineForClient(timeline, clientRecord, config.timelineFetches, index, config.concurrency);

  console.log(`[${index}] ✅ COMPLETED all operations for client ${clientRecord.email}`);

  return clientRecord;
}

/**
 * Main load test execution
 */
async function runLoadTest(): Promise<void> {
  console.log('\n=== TWENTY CRM LOAD TEST ===');
  console.log(`Configuration:`);

  const config = parseArgs(process.argv.slice(2));

  console.log(`  - Number of people: ${config.peopleCount}`);
  console.log(`  - Concurrency: ${config.concurrency}`);
  console.log(`  - Output directory: ${config.outputDir}`);
  console.log(`  - Target operations per person:`);
  console.log(`    • 1 client (person + wealth profile + risk profile)`);
  console.log(`    • ${config.notesPerPerson} notes`);
  console.log(`    • ${config.emailsPerPerson} emails`);
  console.log(`    • ${config.tasksPerPerson} tasks`);
  console.log(`    • ${config.timelineFetches} timeline fetches`);
  console.log('');

  const startTime = Date.now();

  // Initialize metrics collector
  const metricsCollector = new MetricsCollector();

  // Create instrumented HTTP client
  const instrumentedClient = createInstrumentedHttpClient(apiClient, {
    metricsCollector,
    logRequests: false,
  });

  // Initialize repositories with instrumented client
  const clientRepo = new TwentyClientRepository(instrumentedClient);
  const noteRepo = new TwentyNoteRepository(instrumentedClient);
  const emailRepo = new TwentyEmailRepository(instrumentedClient);
  const taskRepo = new TwentyTaskRepository(instrumentedClient);
  const timelineRepo = new TwentyTimelineRepository(instrumentedClient);

  const repositories = {
    client: clientRepo,
    notes: noteRepo,
    emails: emailRepo,
    tasks: taskRepo,
    timeline: timelineRepo,
  };

  // Track created entities
  const clientRecords: ClientRecord[] = [];

  try {
    // Process all clients with concurrency control
    const limit = pLimit(config.concurrency);
    const clientPromises: Promise<ClientRecord>[] = [];

    for (let i = 0; i < config.peopleCount; i++) {
      clientPromises.push(limit(() => processClient(i, config, repositories)));
    }

    const results = await Promise.all(clientPromises);
    clientRecords.push(...results);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log('\n============================');
    console.log('Load Test Complete!');
    console.log('============================\n');
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`People Created: ${clientRecords.length}`);
    console.log(`Total Notes: ${clientRecords.reduce((sum, r) => sum + r.noteIds.length, 0)}`);
    console.log(`Total Emails: ${clientRecords.reduce((sum, r) => sum + r.emailThreadIds.length, 0)}`);
    console.log(`Total Tasks: ${clientRecords.reduce((sum, r) => sum + r.taskIds.length, 0)}`);
    console.log('');

    // Generate reports
    console.log('Generating reports...\n');

    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];

    const reportGenerator = new ReportGenerator({
      outputDir: config.outputDir,
      timestamp,
    });

    const summary = metricsCollector.getSummary();
    const rawMetrics = metricsCollector.getMetrics();

    const clientData = {
      people: clientRecords,
      config,
      timestamp: new Date().toISOString(),
    };

    const { reportDir } = await reportGenerator.generateAllReports(
      summary,
      rawMetrics,
      clientData
    );

    console.log('============================');
    console.log('Reports Generated!');
    console.log('============================\n');
    console.log(`Report Directory: ${reportDir}`);
    console.log(`  - report.json (raw metrics)`);
    console.log(`  - report.html (human-readable)`);
    console.log(`  - report.csv (spreadsheet)`);
    console.log(`  - clients.json (created entities)`);
    console.log('');

    console.log('Summary Metrics:');
    console.log(`  Total Requests: ${summary.totalRequests.toLocaleString()}`);
    console.log(`  Success Rate: ${summary.successRate.toFixed(2)}%`);
    console.log(`  Throughput: ${summary.throughput.toFixed(2)} req/sec`);
    console.log(`  Avg Response Time: ${summary.avgResponseTime.toFixed(2)}ms`);
    console.log('');

    console.log('To view clients in Twenty UI, search for emails starting with "loadtest-"');
    console.log('');

  } catch (error: any) {
    console.error('Load test failed:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  }
}

// Run the load test
runLoadTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
