import { apiClient } from '../apiClient';
import { randomUUID } from 'crypto';

const RMS = [
  {
    firstName: 'RM',
    lastName: 'A',
    id: '26e67cd5-25ee-4803-97eb-5202d0ac2cae',
    email: 'rma@example.com',
  },
  // {
  //   firstName: 'RM',
  //   lastName: 'B',
  //   email: 'rmb@example.com',
  // },
];

async function main() {
  console.log('Provisioning Relationship Managers...');

  for (const rm of RMS) {
    try {
      console.log(`Checking if RM ${rm.email} exists...`);
      // Twenty API filter format: field[eq]:value
      const filter = `userEmail[eq]:${rm.email}`;
      
      const { data: existing } = await apiClient.get('/workspaceMembers', {
        params: {
          filter: filter,
        },
      });

      if (existing.data && existing.data.workspaceMembers && existing.data.workspaceMembers.length > 0) {
        console.log(`✅ RM ${rm.email} already exists. ID: ${existing.data.workspaceMembers[0].id}`);
        continue;
      }

      console.log(`Attempting to create RM ${rm.email}...`);

      // Note: In a real scenario, we might need to create a User first via a different API.
      // Here we try to create a WorkspaceMember. The API requires userId.
      // We will generate a UUID, but this will likely fail if the User doesn't exist in the auth system.
      // If it fails, we'll log it.
      
      // const userId = randomUUID(); 
      
      const payload = {
        name: {
            firstName: rm.firstName,
            lastName: rm.lastName
        },
        userEmail: rm.email,
        // userId: rm.id, 
        colorScheme: 'Green',
        locale: 'en',
        dateFormat: 'DAY_FIRST'
      };

      const { data: created } = await apiClient.post('/workspaceMembers', payload);
      
      if (created.data && created.data.createWorkspaceMember) {
        console.log(`✅ Created RM ${rm.email}. ID: ${created.data.createWorkspaceMember.id}`);
      } else {
         console.warn(`⚠️ Created RM ${rm.email} but got unexpected response format.`);
      }

    } catch (error: any) {
        const status = error.response?.status;
        const msg = JSON.stringify(error.response?.data || error.message);
        console.error(`❌ Failed to create RM ${rm.email} (Status: ${status}): ${msg}`);
        
        if (status === 500 && msg.includes("Foreign key constraint")) {
             console.error("   -> This is expected if the User does not exist in the database (userId constraint).");
             console.error("   -> To fix: Create users manually in Twenty Settings or via Auth API if available.");
        }
    }
  }
}

main();

