import { getCloudflareContext } from "@opennextjs/cloudflare";
export type D1Result<T = Record<string, unknown>> = { results?: T[]; success: boolean; meta?: unknown };
export interface D1Prepared { bind(...values: unknown[]): D1Prepared; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<D1Result<T>>; run(): Promise<D1Result> }
export interface D1Database { prepare(query: string): D1Prepared; batch(statements: D1Prepared[]): Promise<unknown[]>; }
export async function database(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("D1 binding DB is unavailable");
  return db;
}
