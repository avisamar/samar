import "dotenv/config";
import { auth } from "../lib/auth";

async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("Usage: bun run scripts/create-user.ts <email> <password> <name>");
    process.exit(1);
  }

  const [email, password, name] = args;

  try {
    const { user } = await auth.api.createUser({
      body: {
        email,
        password,
        name,
        role: "user",
      },
    });

    console.log("User created successfully:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
  } catch (error) {
    console.error("Failed to create user:", error);
    process.exit(1);
  }
}

createUser();
