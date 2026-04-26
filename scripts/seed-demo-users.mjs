import fs from "node:fs";
import path from "node:path";
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!clerkSecretKey) {
  throw new Error("Missing CLERK_SECRET_KEY");
}

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
}

const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
const convex = new ConvexHttpClient(convexUrl);

const demoUsers = [
  {
    email: "teacher.demo.uniboard@example.com",
    password: "TeacherDemo123!",
    firstName: "Dr. Ayesha",
    lastName: "Khan",
    username: "teacher_demo",
    role: "teacher",
    batch: "SP26-BS(SE)-AM",
    department: "Software Engineering",
    bio: "Course instructor focused on clarity, rigor, and high-signal class operations."
  },
  {
    email: "admin.demo.uniboard@example.com",
    password: "AdminDemo123!",
    firstName: "Usman",
    lastName: "Raza",
    username: "admin_demo",
    role: "super_admin",
    batch: "SP26-BS(SE)-AM",
    department: "Software Engineering",
    bio: "Platform super admin for audit, moderation, and cross-room validation."
  },
  {
    email: "student.sara.uniboard@example.com",
    password: "StudentSara123!",
    firstName: "Sara",
    lastName: "Ali",
    username: "student_sara",
    role: "student",
    batch: "SP26-BS(SE)-AM",
    department: "Software Engineering",
    studentId: "SE-2026-001",
    bio: "Strong systems student who asks sharp anonymous questions when needed."
  },
  {
    email: "student.hamza.uniboard@example.com",
    password: "StudentHamza123!",
    firstName: "Hamza",
    lastName: "Noor",
    username: "student_hamza",
    role: "student",
    batch: "SP26-BS(SE)-AM",
    department: "Software Engineering",
    studentId: "SE-2026-002",
    bio: "Resource curator who shares practical references and review material."
  },
  {
    email: "student.mina.uniboard@example.com",
    password: "StudentMina123!",
    firstName: "Mina",
    lastName: "Yousaf",
    username: "student_mina",
    role: "student",
    batch: "SP26-BS(SE)-AM",
    department: "Software Engineering",
    studentId: "SE-2026-003",
    bio: "Design-oriented student who keeps project rooms organized and active."
  }
];

async function ensureUser(user) {
  const existing = await clerkClient.users.getUserList({
    emailAddress: [user.email]
  });

  for (const entry of existing.data) {
    await clerkClient.users.deleteUser(entry.id);
  }

  const created = await clerkClient.users.createUser({
    emailAddress: [user.email],
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    skipPasswordChecks: true,
    skipPasswordRequirement: false
  });

  return created;
}

const createdUsers = [];
for (const demoUser of demoUsers) {
  const created = await ensureUser(demoUser);
  createdUsers.push({
    ...demoUser,
    clerkId: created.id,
    imageUrl: created.imageUrl ?? undefined
  });
}

for (const user of createdUsers) {
  await convex.mutation("users:upsertFromClerk", {
    clerkId: user.clerkId,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    imageUrl: user.imageUrl
  });
}

const result = await convex.mutation("devSeed:resetAndSeed", {
  key: "uniboard-dev-seed-2026",
  users: createdUsers.map((user) => ({
    clerkId: user.clerkId,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    imageUrl: user.imageUrl,
    role: user.role,
    batch: user.batch,
    department: user.department,
    studentId: user.studentId,
    bio: user.bio
  }))
});

console.log("Seed complete.");
console.log(JSON.stringify({
  summary: result,
  credentials: demoUsers.map((user) => ({
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    password: user.password
  }))
}, null, 2));
