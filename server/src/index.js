import { config } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { Scheme } from "./modules/schemes/scheme.model.js";
import { seedSchemes, seedDemoUsers } from "./modules/schemes/scheme.seed.js";

await connectDB();

// First run (or in-memory DB): load schemes and demo users automatically
if ((await Scheme.estimatedDocumentCount()) === 0) {
  const n = await seedSchemes();
  const u = await seedDemoUsers();
  console.log(`[seed] loaded ${n} schemes and ${u} demo users (password: demo1234)`);
}

createApp().listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port}`);
});
