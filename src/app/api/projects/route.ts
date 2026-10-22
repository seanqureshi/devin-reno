import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth";
import { json, parseBody, withApi } from "@/lib/api";
import { parseMoneyToCents } from "@/lib/money";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  contingency: z.union([z.string(), z.number()]).optional(),
});

export const GET = withApi(async () => {
  const user = await requireUserApi();
  const members = await prisma.projectMember.findMany({ where: { userId: user.id }, include: { project: true } });
  return json(members.map((m) => ({ ...m.project, role: m.role })));
});

export const POST = withApi(async (req) => {
  const user = await requireUserApi();
  const body = await parseBody(req, Body);
  const project = await prisma.project.create({
    data: {
      name: body.name,
      address: body.address,
      description: body.description,
      contingencyCents: parseMoneyToCents(body.contingency ?? null) ?? 0,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  return json(project, { status: 201 });
});
