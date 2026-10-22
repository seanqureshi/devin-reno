import { clearSession } from "@/lib/session";
import { json, withApi } from "@/lib/api";

export const POST = withApi(async () => {
  await clearSession();
  return json({ ok: true });
});
