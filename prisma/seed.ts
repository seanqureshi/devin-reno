/* Sample data: Kitchen + Primary Bath remodel, ~$85k total (77k room budgets + 8k contingency).
 * Dates are relative to "today" so the schedule always looks live. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const d = (offset: number) => new Date(today.getTime() + offset * DAY);
const $ = (dollars: number) => Math.round(dollars * 100);

export const DEMO_PASSWORD = "password123";

async function main() {
  // wipe (order matters for FKs)
  await prisma.taskDependency.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.task.deleteMany();
  await prisma.quote.updateMany({ data: { selectedBidId: null } });
  await prisma.bid.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.budgetLine.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.room.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const mkUser = (email: string, name: string) => prisma.user.create({ data: { email, name, passwordHash } });
  const owner = await mkUser("owner@example.com", "Alex Rivera");
  const partner = await mkUser("partner@example.com", "Jordan Rivera");
  const mike = await mkUser("mike@brightline-electric.example", "Mike Chen");
  const sara = await mkUser("sara@summit-plumbing.example", "Sara Lopez");

  const project = await prisma.project.create({
    data: {
      name: "Kitchen & Primary Bath Remodel",
      address: "1428 Elm Street, Portland, OR",
      description: "Full gut of the kitchen (new layout, island, quartz counters) and primary bath (curbless shower, double vanity).",
      startDate: d(-38),
      targetEndDate: d(40),
      contingencyCents: $(8000),
      approvalThresholdCents: $(1000),
    },
  });
  const P = project.id;

  const kitchen = await prisma.room.create({ data: { projectId: P, name: "Kitchen", description: "New layout with island, quartz counters, all-new cabinets and appliances.", sortOrder: 0 } });
  const bath = await prisma.room.create({ data: { projectId: P, name: "Primary Bath", description: "Curbless tiled shower, double vanity, heated floor.", sortOrder: 1 } });

  const lines: [string, string, number][] = [
    [kitchen.id, "LABOR", 22000], [kitchen.id, "MATERIALS", 14000], [kitchen.id, "FIXTURES", 13500], [kitchen.id, "PERMITS", 2500],
    [bath.id, "LABOR", 11000], [bath.id, "MATERIALS", 6500], [bath.id, "FIXTURES", 6800], [bath.id, "PERMITS", 700],
  ];
  for (const [roomId, category, amt] of lines) await prisma.budgetLine.create({ data: { projectId: P, roomId, category, amountCents: $(amt) } });

  const c = async (companyName: string, contactName: string, email: string, phone: string, trade: string) =>
    prisma.contractor.create({ data: { projectId: P, companyName, contactName, email, phone, trade } });
  const brightline = await c("Brightline Electric", "Mike Chen", "mike@brightline-electric.example", "(503) 555-0142", "Electrical");
  const summit = await c("Summit Plumbing", "Sara Lopez", "sara@summit-plumbing.example", "(503) 555-0187", "Plumbing");
  const oakIron = await c("Oak & Iron Builders", "Dave Patel", "dave@oakiron.example", "(503) 555-0110", "General / Carpentry");
  const voltBros = await c("Volt Brothers Electric", "Ray Okafor", "ray@voltbros.example", "(503) 555-0199", "Electrical");
  const sparkPro = await c("Spark Pro Electric", "Tina Walsh", "tina@sparkpro.example", "(503) 555-0123", "Electrical");
  const tileWorks = await c("TileWorks Co", "Nina Brooks", "nina@tileworks.example", "(503) 555-0166", "Tile");
  const bayside = await c("Bayside Tile & Stone", "Luis Ortega", "luis@baysidetile.example", "(503) 555-0175", "Tile");
  const stoneCreek = await c("Stone Creek Countertops", "Priya Shah", "priya@stonecreek.example", "(503) 555-0151", "Countertops");
  const graniteMasters = await c("Granite Masters", "Tom Becker", "tom@granitemasters.example", "(503) 555-0138", "Countertops");
  const precision = await c("Precision Drywall", "Ken Ito", "ken@precisiondrywall.example", "(503) 555-0104", "Drywall");

  await prisma.projectMember.createMany({
    data: [
      { projectId: P, userId: owner.id, role: "OWNER" },
      { projectId: P, userId: partner.id, role: "PARTNER" },
      { projectId: P, userId: mike.id, role: "CONTRACTOR", contractorId: brightline.id },
      { projectId: P, userId: sara.id, role: "CONTRACTOR", contractorId: summit.id },
    ],
  });
  await prisma.invite.create({
    data: { projectId: P, email: "dave@oakiron.example", role: "CONTRACTOR", contractorId: oakIron.id, token: "demo-invite-oak-iron", invitedById: owner.id },
  });

  // ---- Quotes & bids ----
  async function quote(
    roomId: string,
    category: string,
    title: string,
    description: string,
    bids: { contractorId: string; amount: number; timelineDays: number; warrantyMonths?: number; includes: string; notes?: string; startIn?: number }[],
    winnerIdx?: number,
  ) {
    const q = await prisma.quote.create({ data: { projectId: P, roomId, category, title, description } });
    const created = [];
    for (const [i, b] of bids.entries()) {
      created.push(
        await prisma.bid.create({
          data: {
            quoteId: q.id,
            contractorId: b.contractorId,
            amountCents: $(b.amount),
            timelineDays: b.timelineDays,
            warrantyMonths: b.warrantyMonths,
            includes: b.includes,
            notes: b.notes,
            startAvailable: b.startIn !== undefined ? d(b.startIn) : null,
            status: winnerIdx === undefined ? "SUBMITTED" : i === winnerIdx ? "ACCEPTED" : "REJECTED",
            createdAt: d(-45 + i),
          },
        }),
      );
    }
    if (winnerIdx !== undefined)
      await prisma.quote.update({ where: { id: q.id }, data: { status: "AWARDED", selectedBidId: created[winnerIdx].id } });
    return { quote: q, bids: created };
  }

  const qKitchenElec = await quote(kitchen.id, "LABOR", "Kitchen electrical rough-in & lighting", "New 20A circuits for island and appliances, 8 recessed cans, under-cabinet lighting, panel tie-in.", [
    { contractorId: brightline.id, amount: 9800, timelineDays: 12, warrantyMonths: 24, includes: "Permit, all wiring, 8 LED cans, under-cabinet LEDs, panel work", startIn: -12 },
    { contractorId: voltBros.id, amount: 11200, timelineDays: 10, warrantyMonths: 12, includes: "Permit, wiring, 8 cans; under-cabinet lighting extra", startIn: -5 },
    { contractorId: sparkPro.id, amount: 8900, timelineDays: 15, warrantyMonths: 12, includes: "Wiring and cans only", notes: "Permit not included; owner pulls permit.", startIn: 0 },
  ], 0);
  const qBathPlumb = await quote(bath.id, "LABOR", "Primary bath plumbing rough-in & fixture install", "Relocate shower drain for curbless shower, new valve, double vanity supply/drains, toilet.", [
    { contractorId: summit.id, amount: 6400, timelineDays: 8, warrantyMonths: 24, includes: "Linear drain, thermostatic valve rough, vanity & toilet set", startIn: -6 },
    { contractorId: oakIron.id, amount: 7100, timelineDays: 9, warrantyMonths: 12, includes: "Subcontracted plumber; same scope" },
  ], 0);
  const qCabinets = await quote(kitchen.id, "LABOR", "Kitchen demo, framing & cabinet install", "Demo existing kitchen, adjust framing for island, install new cabinets and trim.", [
    { contractorId: oakIron.id, amount: 8500, timelineDays: 14, warrantyMonths: 12, includes: "Demo, haul-away, framing, cabinet & trim install", startIn: -36 },
  ], 0);
  const qBathTile = await quote(bath.id, "LABOR", "Primary bath tile (floor + curbless shower)", "Approx. 65 sq ft floor and 110 sq ft shower walls; heated floor mat install.", [
    { contractorId: tileWorks.id, amount: 4800, timelineDays: 7, warrantyMonths: 12, includes: "Labor, thinset, grout; heated mat install", startIn: 6 },
    { contractorId: bayside.id, amount: 5600, timelineDays: 6, warrantyMonths: 24, includes: "Labor, premium epoxy grout, sealing, heated mat install", startIn: 8 },
    { contractorId: oakIron.id, amount: 5200, timelineDays: 8, warrantyMonths: 12, includes: "Labor and setting materials; heated mat by others", startIn: 5 },
  ]);
  const qCounters = await quote(kitchen.id, "MATERIALS", "Kitchen quartz countertops", "~52 sq ft quartz with waterfall island edge, undermount sink cutout.", [
    { contractorId: stoneCreek.id, amount: 6900, timelineDays: 10, warrantyMonths: 120, includes: "Template, fabrication, install, 1 sink cutout", startIn: 18 },
    { contractorId: graniteMasters.id, amount: 7450, timelineDays: 7, warrantyMonths: 60, includes: "Template, fabrication, install, waterfall edge, sink & cooktop cutouts", startIn: 16 },
  ]);

  // ---- Tasks ----
  const posCounter = new Map<string, number>();
  async function task(
    roomId: string,
    title: string,
    status: string,
    startOffset: number,
    durationDays: number,
    opts: { contractorId?: string; quoteId?: string; description?: string; dueOffset?: number } = {},
  ) {
    const k = `${roomId}:${status}`;
    const position = posCounter.get(k) ?? 0;
    posCounter.set(k, position + 1);
    return prisma.task.create({
      data: {
        projectId: P,
        roomId,
        title,
        status,
        position,
        description: opts.description,
        contractorId: opts.contractorId,
        quoteId: opts.quoteId,
        startDate: d(startOffset),
        durationDays,
        dueDate: d(opts.dueOffset ?? startOffset + durationDays),
        completedAt: status === "DONE" ? d(startOffset + durationDays) : null,
      },
    });
  }

  const k1 = await task(kitchen.id, "Demo cabinets, counters & flooring", "DONE", -35, 3, { contractorId: oakIron.id, quoteId: qCabinets.quote.id });
  const k11 = await task(kitchen.id, "Order appliances", "DONE", -30, 1, { description: "Fridge, range, dishwasher, hood. Delivery scheduled for install week." });
  const k2 = await task(kitchen.id, "Framing adjustments for island", "DONE", -31, 3, { contractorId: oakIron.id, quoteId: qCabinets.quote.id });
  const k4 = await task(kitchen.id, "Rough-in plumbing (sink relocation)", "DONE", -20, 4, { contractorId: summit.id });
  const k3 = await task(kitchen.id, "Rough-in electrical (circuits, cans, under-cabinet)", "IN_PROGRESS", -10, 12, { contractorId: brightline.id, quoteId: qKitchenElec.quote.id });
  const k5 = await task(kitchen.id, "City rough-in inspection", "NOT_STARTED", 3, 1, { description: "Electrical + plumbing rough-in inspection. Owner to schedule." });
  const k6 = await task(kitchen.id, "Insulation & drywall", "NOT_STARTED", 5, 6, { contractorId: precision.id });
  const k7 = await task(kitchen.id, "Install cabinets & trim", "NOT_STARTED", 12, 5, { contractorId: oakIron.id, quoteId: qCabinets.quote.id });
  const k8 = await task(kitchen.id, "Countertop template & install", "NOT_STARTED", 18, 7, { quoteId: qCounters.quote.id });
  const k9 = await task(kitchen.id, "Backsplash tile", "NOT_STARTED", 26, 3);
  const k10 = await task(kitchen.id, "Install appliances & light fixtures", "NOT_STARTED", 30, 2, { contractorId: brightline.id });

  const b9 = await task(bath.id, "Choose tile & fixtures", "DONE", -40, 5);
  const b1 = await task(bath.id, "Demo bathroom to studs", "DONE", -30, 3, { contractorId: oakIron.id });
  const b2 = await task(bath.id, "Subfloor repair (rot under old tub)", "DONE", -26, 2, { contractorId: oakIron.id, description: "Unexpected rot found during demo — paid from contingency." });
  const b3 = await task(bath.id, "Plumbing rough-in (linear drain, valve, vanity)", "IN_PROGRESS", -6, 8, { contractorId: summit.id, quoteId: qBathPlumb.quote.id });
  const b4 = await task(bath.id, "Exhaust fan & vanity light rough-in", "BLOCKED", -4, 2, { contractorId: brightline.id, description: "Waiting on fan delivery (backordered).", dueOffset: -2 });
  const b5 = await task(bath.id, "Waterproof shower & floor", "NOT_STARTED", 3, 2);
  const b6 = await task(bath.id, "Tile floor & shower", "NOT_STARTED", 6, 7, { quoteId: qBathTile.quote.id });
  const b7 = await task(bath.id, "Install vanity, faucets & toilet", "NOT_STARTED", 14, 2, { contractorId: summit.id, quoteId: qBathPlumb.quote.id });
  const b8 = await task(bath.id, "Glass shower door install", "NOT_STARTED", 17, 1);
  void b9;
  void k11;

  const deps: [{ id: string }, { id: string }][] = [
    [k2, k1], [k4, k2], [k3, k2], [k5, k3], [k5, k4], [k6, k5], [k7, k6], [k8, k7], [k9, k8], [k10, k9],
    [b2, b1], [b3, b2], [b4, b2], [b5, b3], [b5, b4], [b6, b5], [b7, b6], [b8, b6],
  ];
  for (const [t, pre] of deps) await prisma.taskDependency.create({ data: { taskId: t.id, dependsOnId: pre.id } });

  // ---- Expenses ----
  async function expense(
    roomId: string | null,
    category: string,
    vendor: string,
    amount: number,
    dayOffset: number,
    opts: { description?: string; status?: string; bidId?: string; fromContingency?: boolean; by?: string } = {},
  ) {
    const status = opts.status ?? "APPROVED";
    const needsApproval = $(amount) >= project.approvalThresholdCents;
    return prisma.expense.create({
      data: {
        projectId: P,
        roomId,
        category,
        vendor,
        amountCents: $(amount),
        date: d(dayOffset),
        description: opts.description,
        status,
        bidId: opts.bidId,
        fromContingency: opts.fromContingency ?? false,
        createdById: opts.by ?? owner.id,
        approvedById: status === "APPROVED" && needsApproval ? partner.id : null,
        approvedAt: status === "APPROVED" && needsApproval ? d(dayOffset) : null,
      },
    });
  }

  // Kitchen
  await expense(kitchen.id, "LABOR", "Oak & Iron Builders", 3500, -33, { description: "Demo & framing progress payment", bidId: qCabinets.bids[0].id });
  await expense(kitchen.id, "LABOR", "Brightline Electric", 4000, -10, { description: "Electrical deposit (40%)", bidId: qKitchenElec.bids[0].id });
  await expense(kitchen.id, "MATERIALS", "Cabinet Depot", 10900, -28, { description: "Shaker cabinets, 14 boxes + island" });
  await expense(kitchen.id, "MATERIALS", "Waste Pro", 650, -35, { description: "20-yard dumpster rental" });
  await expense(kitchen.id, "MATERIALS", "Home Depot", 480.35, -31, { description: "Framing lumber & fasteners" });
  await expense(kitchen.id, "FIXTURES", "Best Buy", 10900, -30, { description: "Appliance package (fridge, range, DW, hood)" });
  await expense(kitchen.id, "FIXTURES", "Ferguson", 1450, -24, { description: "Undermount sink & pull-down faucet" });
  await expense(kitchen.id, "PERMITS", "City of Portland BDS", 1850, -40, { description: "Building permit" });
  await expense(kitchen.id, "PERMITS", "City of Portland BDS", 250, -14, { description: "Electrical permit" });
  // Bath
  await expense(bath.id, "LABOR", "Summit Plumbing", 2000, -6, { description: "Plumbing deposit", bidId: qBathPlumb.bids[0].id });
  await expense(bath.id, "LABOR", "Oak & Iron Builders", 1200, -26, { description: "Subfloor rot repair (unplanned)", fromContingency: true });
  await expense(bath.id, "MATERIALS", "Floor & Decor", 2350.8, -22, { description: "Porcelain floor + shower wall tile" });
  await expense(bath.id, "MATERIALS", "Schluter Supply", 780, -8, { description: "Waterproofing membrane & linear drain" });
  await expense(bath.id, "FIXTURES", "Ferguson", 2900, -20, { description: "Double vanity with quartz top" });
  await expense(bath.id, "FIXTURES", "Ferguson", 1150, -20, { description: "Thermostatic shower valve & trim" });
  await expense(bath.id, "FIXTURES", "Lowe's", 680.5, -18, { description: "Toilet" });
  await expense(bath.id, "PERMITS", "City of Portland BDS", 790, -38, { description: "Plumbing permit" });
  await expense(bath.id, "FIXTURES", "Clearview Glass", 1500, -1, { description: "Frameless shower door deposit", status: "PENDING" });

  console.log(`Seeded project ${project.id} (${project.name})`);
  console.log(`Logins (password "${DEMO_PASSWORD}"): owner@example.com, partner@example.com, mike@brightline-electric.example, sara@summit-plumbing.example`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
