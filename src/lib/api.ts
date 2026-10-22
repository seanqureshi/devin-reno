import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "./auth";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/**
 * Wrap a route handler: converts ApiError / ZodError into JSON error responses.
 * Usage: export const GET = withApi(async (req, { params }) => { ... });
 */
export function withApi<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError)
        return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400 });
      console.error(err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Expected JSON body");
  }
  return schema.parse(json);
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
