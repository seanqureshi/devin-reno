import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import { ApiError } from "@/lib/auth";
import { json, parseBody, withApi } from "@/lib/api";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export const POST = withApi(async (req) => {
  const { email, password } = await parseBody(req, Body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, "Invalid email or password");
  await setSession(user.id);
  return json({ id: user.id, name: user.name, email: user.email });
});
