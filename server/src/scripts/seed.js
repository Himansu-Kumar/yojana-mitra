// npm run seed: (re)loads data/schemes.json and the demo users into MONGO_URI
import { connectDB, disconnectDB } from "../config/db.js";
import { seedSchemes, seedDemoUsers } from "../modules/schemes/scheme.seed.js";

await connectDB();
console.log(`[seed] ${await seedSchemes()} schemes upserted`);
console.log(`[seed] ${await seedDemoUsers()} demo users upserted (password: demo1234)`);
await disconnectDB();
