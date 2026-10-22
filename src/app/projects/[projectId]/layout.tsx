import Link from "next/link";
import { requireProjectPage } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PROJECT_NAV } from "@/lib/nav";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { ProjectNav } from "@/components/ProjectNav";
import { LogoutButton } from "@/components/LogoutButton";
import { Badge } from "@/components/ui";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { user, member, project } = await requireProjectPage(projectId);
  const items = PROJECT_NAV.filter((i) => !i.cap || can(member.role, i.cap));
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/projects" className="text-sm font-semibold text-indigo-700">Renovation Planner</Link>
            <span className="text-slate-300">/</span>
            <span className="font-medium" data-testid="project-name">{project.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span data-testid="current-user">{user.name}</span>
            <Badge color="indigo">{ROLE_LABELS[member.role as Role] ?? member.role}</Badge>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-52 md:shrink-0">
          <ProjectNav projectId={projectId} items={items} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
