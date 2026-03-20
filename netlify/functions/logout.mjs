import { json } from "./_lib.mjs";
export default async () => json({ ok: true }, 200, { "set-cookie": "crm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" });