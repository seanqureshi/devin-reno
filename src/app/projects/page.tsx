import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { Badge, Card, PageHeader } from "@/components/ui";
import { LogoutButton } from "@/components/LogoutButton";
import { NewProjectForm } from "./NewProjectForm";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUserPage();
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: { project: { include: { _count: { select: { rooms: true, tasks: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return (
    <main className="mx-auto max-w-4xl p-6">
      <PageHeader title="Your projects" description={`Signed in as ${user.name}`} actions={<LogoutButton />} />
      <div className="grid gap-4 md:grid-cols-2">
        {memberships.map((m) => (
          <Link key={m.id} href={`/projects/${m.projectId}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{m.project.name}</h2>
              <Badge color="indigo">{ROLE_LABELS[m.role as Role] ?? m.role}</Badge>
            </div>
            {m.project.address && <p className="mt-1 text-sm text-slate-600">{m.project.address}</p>}
            <p className="mt-2 text-xs text-slate-500">
              {m.project._count.rooms} rooms · {m.project._count.tasks} tasks
            </p>
          </Link>
        ))}
      </div>
      <Card title="Start a new project" className="mt-8">
        <NewProjectForm />
      </Card>
    </main>
  );
}
