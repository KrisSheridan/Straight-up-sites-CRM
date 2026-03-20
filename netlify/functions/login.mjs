import { bad, json, makeSession } from "./_lib.mjs";
export default async (request) => {
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const { username = "", password = "" } = await request.json().catch(() => ({}));
  const adminUser = process.env.ADMIN_USERNAME || "";
  const adminPass = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.SESSION_SECRET || "";
  if (!adminUser || !adminPass || !secret) return bad("Set ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET in Netlify.");
  if (username !== adminUser || password !== adminPass) return bad("Incorrect username or password.", 401);
  const token = makeSession(username, secret);
  return json({ ok: true }, 200, { "set-cookie": `crm_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*30}` });
};