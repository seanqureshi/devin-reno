import { notFound, redirect } from "next/navigation";
import type { Project, ProjectMember, User } from "@prisma/client";
import { prisma } from "./db";
import { getSessionUserId } from "./session";
import { can, type Capability } from "./permissions";

export type SafeUser = Pick<User, "id" | "email" | "name">;

export interface ProjectContext {
  user: SafeUser;
  member: ProjectMember;
  project: Project;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
}

async function loadProjectContext(projectId: string, user: SafeUser): Promise<ProjectContext | null> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
    include: { project: true },
  });
  if (!member) return null;
  const { project, ...m } = member;
  return { user, member: m, project };
}

// ---------- Pages (server components) ----------

export async function requireUserPage(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages under /projects/[projectId]. Redirects to login / 404s when not a member. */
export async function requireProjectPage(projectId: string, cap?: Capability): Promise<ProjectContext> {
  const user = await requireUserPage();
  const ctx = await loadProjectContext(projectId, user);
  if (!ctx) notFound();
  if (cap && !can(ctx.member.role, cap)) redirect(`/projects/${projectId}/forbidden`);
  return ctx;
}

// ---------- API route handlers ----------

export async function requireUserApi(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Not signed in");
  return user;
}

/** For /api/projects/[projectId]/... handlers. Throws ApiError(401/404/403). */
export async function requireProjectApi(projectId: string, cap?: Capability): Promise<ProjectContext> {
  const user = await requireUserApi();
  const ctx = await loadProjectContext(projectId, user);
  if (!ctx) throw new ApiError(404, "Project not found");
  if (cap && !can(ctx.member.role, cap)) throw new ApiError(403, "You don't have permission to do that");
  return ctx;
}
