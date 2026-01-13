/**
 * Create sample notes and tasks that persist in the UI
 * This script creates activities without deleting them for UI verification
 */

import { TwentyClientRepository } from '../infrastructure/twenty/repositories/TwentyClientRepository';
import { TwentyNoteRepository } from '../infrastructure/twenty/repositories/TwentyNoteRepository';
import { TwentyTaskRepository } from '../infrastructure/twenty/repositories/TwentyTaskRepository';
import { apiClient } from '../apiClient';

async function main() {
  const clientRepo = new TwentyClientRepository(apiClient);
  const noteRepo = new TwentyNoteRepository(apiClient);
  const taskRepo = new TwentyTaskRepository(apiClient);

  console.log('\n📝 Creating sample activities for UI verification...\n');

  // Create a test person
  console.log('Creating person...');
  const client = await clientRepo.createClient({
    firstName: 'John',
    lastName: 'Doe',
    email: `john.doe.${Date.now()}@example.com`,
    city: 'Bangalore',
  });
  console.log(`✅ Created person: ${client.firstName} ${client.lastName} (ID: ${client.id})`);

  // Create a note linked to this person
  console.log('\nCreating note...');
  const note = await noteRepo.createNote({
    title: 'Important Meeting Notes',
    content: `**Meeting Summary**

Date: ${new Date().toLocaleDateString()}

## Key Points
- Discussed Q4 objectives
- Reviewed budget allocations
- Planned next steps

## Action Items
- [ ] Follow up with finance team
- [ ] Schedule follow-up meeting
- [ ] Update project documentation`,
    linkedPersonIds: [client.id],
  });
  console.log(`✅ Created note: "${note.title}" (ID: ${note.id})`);
  console.log(`   Linked to person: ${client.id}`);

  // Create a task linked to this person
  console.log('\nCreating task...');
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

  const task = await taskRepo.createTask({
    title: 'Follow up with John Doe',
    status: 'TODO',
    dueAt: dueDate,
    linkedPersonIds: [client.id],
  });
  console.log(`✅ Created task: "${task.title}" (ID: ${task.id})`);
  console.log(`   Status: ${task.status}`);
  console.log(`   Due: ${task.dueAt?.toLocaleDateString()}`);
  console.log(`   Linked to person: ${client.id}`);

  // Create another task with different status
  console.log('\nCreating second task...');
  const task2 = await taskRepo.createTask({
    title: 'Prepare quarterly report',
    status: 'IN_PROGRESS',
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
    linkedPersonIds: [client.id],
  });
  console.log(`✅ Created task: "${task2.title}" (ID: ${task2.id})`);
  console.log(`   Status: ${task2.status}`);
  console.log(`   Due: ${task2.dueAt?.toLocaleDateString()}`);

  // Create another note
  console.log('\nCreating second note...');
  const note2 = await noteRepo.createNote({
    title: 'Project Ideas',
    content: `**Brainstorming Session**

## Ideas to Explore
1. Mobile app development
2. API improvements
3. UI/UX enhancements
4. Performance optimization

## Resources Needed
- Development team availability
- Budget approval
- Timeline planning`,
    linkedPersonIds: [client.id],
  });
  console.log(`✅ Created note: "${note2.title}" (ID: ${note2.id})`);

  console.log('\n✨ Sample activities created successfully!');
  console.log('\n📋 Summary:');
  console.log(`   Person: ${client.firstName} ${client.lastName}`);
  console.log(`   Person ID: ${client.id}`);
  console.log(`   Notes: 2`);
  console.log(`   Tasks: 2`);
  console.log('\n👉 Check the Twenty UI to see these activities!');
  console.log(`   Look for person: ${client.firstName} ${client.lastName}`);
}

main().catch((error) => {
  console.error('\n❌ Error creating sample activities:', error);
  process.exit(1);
});
