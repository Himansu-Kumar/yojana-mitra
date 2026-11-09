import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";
import { connectDB, disconnectDB } from "../../config/db.js";
import { config } from "../../config/env.js";
import { User } from "../users/user.model.js";
import { Scheme } from "./scheme.model.js";
import { signToken } from "../../middleware/auth.js";

let server;
let baseUrl;
let citizenToken;
let officialToken;

before(async () => {
  // Empty MONGO_URI starts mongodb-memory-server automatically
  process.env.MONGO_URI = "";
  config.mongoUri = "";
  if (!process.env.MONGOMS_SYSTEM_BINARY) {
    process.env.MONGOMS_SYSTEM_BINARY = "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe";
  }
  await connectDB();
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });

  const citizen = await User.create({
    name: "Citizen Test",
    email: "citizen.test@example.com",
    passwordHash: "hash123",
    role: "citizen",
  });
  citizenToken = signToken(citizen);

  const official = await User.create({
    name: "Official Test",
    email: "official.test@example.com",
    passwordHash: "hash123",
    role: "official",
  });
  officialToken = signToken(official);
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

test("citizen POST /schemes returns 403 Forbidden", async () => {
  const res = await fetch(`${baseUrl}/schemes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${citizenToken}`,
    },
    body: JSON.stringify({
      slug: "citizen-created",
      name: "Should Fail",
      description: "Not allowed",
    }),
  });
  assert.equal(res.status, 403);
});

test("official POST /schemes with invalid rules returns 400 with details", async () => {
  const res = await fetch(`${baseUrl}/schemes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${officialToken}`,
    },
    body: JSON.stringify({
      slug: "invalid-rules-scheme",
      name: "Invalid Rules Scheme",
      description: "Has bad rules",
      rules: [
        { field: "invalidField", op: "eq", value: 10, label: "Invalid field" },
        { field: "age", op: "between", value: [10, 20, 30], label: "Invalid between" },
      ],
    }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.details, "Expected details array in error response");
  assert.ok(data.details.length >= 2, "Expected multiple validation issues");
});

test("official POST /schemes with valid scheme creates scheme (201)", async () => {
  const res = await fetch(`${baseUrl}/schemes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${officialToken}`,
    },
    body: JSON.stringify({
      slug: "odisha-farmer-support",
      name: "Odisha Farmer Support",
      level: "state",
      state: "Odisha",
      description: "State assistance for small farmers",
      benefit: {
        amount: 5000,
        frequency: "yearly",
        summary: "₹5,000 per year",
      },
      rules: [
        { field: "occupation", op: "in", value: ["farmer", "agri_labourer"], label: "Farmer or agricultural labourer" },
        { field: "annualIncome", op: "lte", value: 150000, label: "Annual income up to ₹1.5 lakh" },
      ],
      markVerified: true,
    }),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.scheme.slug, "odisha-farmer-support");
  assert.equal(data.scheme.state, "Odisha");
  assert.equal(data.scheme.level, "state");
  assert.equal(data.scheme.rulesStatus, "approved");
  assert.ok(data.scheme.lastVerified, "Expected lastVerified date when markVerified: true");
  assert.equal(data.scheme.isActive, true);
});

test("official GET /schemes/admin/all returns list including all schemes", async () => {
  const res = await fetch(`${baseUrl}/schemes/admin/all`, {
    headers: {
      Authorization: `Bearer ${officialToken}`,
    },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.items));
  assert.ok(data.items.some((s) => s.slug === "odisha-farmer-support"));
});

test("official DELETE /schemes/:slug soft-deactivates scheme and removes from public list", async () => {
  // Confirm it shows up in public list before deactivate
  const preRes = await fetch(`${baseUrl}/schemes`);
  assert.equal(preRes.status, 200);
  const preData = await preRes.json();
  assert.ok(preData.items.some((s) => s.slug === "odisha-farmer-support"));

  // Deactivate
  const delRes = await fetch(`${baseUrl}/schemes/odisha-farmer-support`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${officialToken}`,
    },
  });
  assert.equal(delRes.status, 200);
  const delData = await delRes.json();
  assert.equal(delData.scheme.isActive, false);

  // Confirm missing from public GET /schemes
  const postRes = await fetch(`${baseUrl}/schemes`);
  assert.equal(postRes.status, 200);
  const postData = await postRes.json();
  assert.equal(
    postData.items.some((s) => s.slug === "odisha-farmer-support"),
    false,
    "Deactivated scheme should not be in public list"
  );
});
