/**
 * Deterministic mock-data generator.
 *
 * Produces the static JSON "dataset" consumed by the server data layer
 * (`src/lib/server/store.ts`) and exposed through the mock API routes:
 *   - src/data/customers.json   56 customers
 *   - src/data/orders.json      ~180 days of orders (with line items)
 *   - src/data/traffic.json     daily visitor counts (drives conversion rate)
 *   - src/data/activities.json  recent system / order / customer events
 *
 * It is seeded (mulberry32) so re-running produces identical data, which keeps
 * charts and screenshots stable. All timestamps are UTC-day aligned so that
 * daily bucketing on the server is unambiguous. Run with:  pnpm generate:data
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "src", "data");

// ---- Seeded PRNG so output is reproducible --------------------------------
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260101);

const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const round2 = (n) => Math.round(n * 100) / 100;

const DAY_MS = 86_400_000;
const DAYS = 180;

// "Today" at UTC midnight. The last generated day is today (partial day).
const now = new Date();
const TODAY_UTC = Date.UTC(
  now.getUTCFullYear(),
  now.getUTCMonth(),
  now.getUTCDate(),
);
const dayStartMs = (daysAgo) => TODAY_UTC - daysAgo * DAY_MS;
const dateKey = (ms) => new Date(ms).toISOString().slice(0, 10);

// ---- Reference catalogs ----------------------------------------------------
const FIRST_NAMES = [
  "Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia", "Mason",
  "Isabella", "Lucas", "Mia", "Oliver", "Amelia", "Elijah", "Harper",
  "James", "Evelyn", "Benjamin", "Abigail", "Henry", "Emily", "Alexander",
  "Aisha", "Mateo", "Yuki", "Chen", "Priya", "Omar", "Sofia", "Diego",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Patel", "Nakamura", "Khan", "Silva",
  "Costa", "Dubois", "Rossi", "Nguyen", "Kim", "Okafor", "Haddad",
];
const COMPANIES = [
  "Acme Corp", "Globex", "Initech", "Umbrella", "Soylent", "Hooli",
  "Vehement", "Massive Dynamic", "Stark Industries", "Wayne Enterprises",
  "Wonka", "Cyberdyne", "Tyrell", "Aperture", "Pied Piper", "Nebula Labs",
  "Northwind", "Contoso", "Fabrikam", "Lumon",
];
const PRODUCTS = [
  { name: "Starter Plan", price: 29 },
  { name: "Pro Plan", price: 99 },
  { name: "Business Plan", price: 299 },
  { name: "Enterprise Seat", price: 49 },
  { name: "Analytics Add-on", price: 19 },
  { name: "Extra Storage (1TB)", price: 10 },
  { name: "Priority Support", price: 79 },
  { name: "API Access", price: 149 },
  { name: "Custom Domain", price: 15 },
  { name: "Onboarding Package", price: 499 },
];
// Weighted status distribution (completed dominates a healthy business).
const STATUS_WEIGHTS = [
  ["completed", 58],
  ["processing", 14],
  ["pending", 12],
  ["cancelled", 9],
  ["refunded", 7],
];
function weightedStatus() {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [status, w] of STATUS_WEIGHTS) {
    if ((r -= w) <= 0) return status;
  }
  return "completed";
}

// ---- Customers -------------------------------------------------------------
const CUSTOMER_COUNT = 56;
const usedEmails = new Set();
const customers = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
  let first = pick(FIRST_NAMES);
  let last = pick(LAST_NAMES);
  let email = `${first}.${last}`.toLowerCase() + "@example.com";
  while (usedEmails.has(email)) {
    first = pick(FIRST_NAMES);
    last = pick(LAST_NAMES);
    email = `${first}.${last}`.toLowerCase() + "@example.com";
  }
  usedEmails.add(email);
  const createdDaysAgo = randInt(DAYS + 10, 720);
  return {
    id: `CUST-${1001 + i}`,
    name: `${first} ${last}`,
    email,
    company: pick(COMPANIES),
    status: rand() > 0.2 ? "active" : "inactive",
    createdAt: new Date(dayStartMs(createdDaysAgo) + randInt(0, DAY_MS - 1)).toISOString(),
    totalSpent: 0, // filled after orders are generated
    orderCount: 0,
  };
});

// ---- Orders + traffic ------------------------------------------------------
const orders = [];
const traffic = [];
let orderSeq = 10000;

for (let d = DAYS - 1; d >= 0; d--) {
  const dayStart = dayStartMs(d);
  const dow = new Date(dayStart).getUTCDay(); // 0 = Sunday
  // Weekly seasonality (weekends quieter) + gentle upward trend over time.
  const weekendFactor = dow === 0 || dow === 6 ? 0.55 : 1;
  const trend = 1 + (0.8 * (DAYS - d)) / DAYS; // ~1.0 -> ~1.8 across the window
  const baseOrders = 5 * weekendFactor * trend;
  const ordersToday = Math.max(0, Math.round(baseOrders + (rand() - 0.5) * 4));

  // Visitors are generated independently so conversion rate moves realistically
  // (roughly 2-5%), rather than being a constant ratio of orders.
  const visitors = Math.round(
    (120 + 90 * trend) * weekendFactor * (0.85 + rand() * 0.3),
  );
  traffic.push({ date: dateKey(dayStart), visitors });

  for (let o = 0; o < ordersToday; o++) {
    const customer = pick(customers);
    const itemCount = randInt(1, 4);
    const items = Array.from({ length: itemCount }, () => {
      const product = pick(PRODUCTS);
      return {
        id: `ITM-${Math.floor(rand() * 1e9).toString(36)}`,
        name: product.name,
        quantity: randInt(1, 3),
        unitPrice: product.price,
      };
    });
    const total = round2(
      items.reduce((s, it) => s + it.unitPrice * it.quantity, 0),
    );
    // Keep "today" realistic: no orders from the future.
    const maxOffset = d === 0 ? Math.max(1, now.getTime() - TODAY_UTC - 1) : DAY_MS - 1;
    orders.push({
      id: `ORD-${++orderSeq}`,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      status: weightedStatus(),
      total,
      items,
      createdAt: new Date(dayStart + randInt(0, maxOffset)).toISOString(),
    });
  }
}

// newest first
orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// ---- Roll up per-customer spend/counts (recognized revenue only) -----------
const revenueStatuses = new Set(["completed", "processing", "pending"]);
const byId = new Map(customers.map((c) => [c.id, c]));
for (const order of orders) {
  const customer = byId.get(order.customerId);
  if (!customer) continue;
  customer.orderCount += 1;
  if (revenueStatuses.has(order.status)) {
    customer.totalSpent = round2(customer.totalSpent + order.total);
  }
}

// ---- Activities ------------------------------------------------------------
const activities = [];
let actSeq = 5000;
const messageFor = {
  completed: (o) => `Order ${o.id} completed for ${o.customerName}`,
  processing: (o) => `Order ${o.id} is now processing`,
  pending: (o) => `New order ${o.id} placed by ${o.customerName}`,
  cancelled: (o) => `Order ${o.id} was cancelled`,
  refunded: (o) => `Refund issued for order ${o.id}`,
};
const typeFor = {
  completed: "order",
  processing: "order",
  pending: "order",
  cancelled: "system",
  refunded: "refund",
};
for (const order of orders.slice(0, 18)) {
  activities.push({
    id: `ACT-${++actSeq}`,
    type: typeFor[order.status],
    message: messageFor[order.status](order),
    actor: order.customerName,
    createdAt: order.createdAt,
  });
}
const recentActivityAt = () =>
  new Date(
    Math.min(
      now.getTime() - randInt(1, 60) * 60_000,
      dayStartMs(randInt(0, 6)) + randInt(0, DAY_MS - 1),
    ),
  ).toISOString();

for (const c of [...customers]
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, 6)) {
  activities.push({
    id: `ACT-${++actSeq}`,
    type: "customer",
    message: `${c.name} signed up from ${c.company}`,
    actor: c.name,
    createdAt: recentActivityAt(),
  });
}
for (const [type, msg] of [
  ["payment", "Payout of $12,480.00 settled to bank account"],
  ["system", "Nightly database backup completed"],
  ["system", "Payment gateway latency returned to normal"],
  ["system", "New API key generated for integration"],
  ["payment", "Monthly invoice batch sent to 41 customers"],
]) {
  activities.push({
    id: `ACT-${++actSeq}`,
    type,
    message: msg,
    actor: "System",
    createdAt: recentActivityAt(),
  });
}
activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// ---- Write -----------------------------------------------------------------
mkdirSync(DATA_DIR, { recursive: true });
const write = (name, data) =>
  writeFileSync(join(DATA_DIR, name), JSON.stringify(data, null, 2) + "\n");
write("customers.json", customers);
write("orders.json", orders);
write("traffic.json", traffic);
write("activities.json", activities);

console.log(
  `Generated ${customers.length} customers, ${orders.length} orders, ${traffic.length} traffic days, ${activities.length} activities -> src/data/`,
);
