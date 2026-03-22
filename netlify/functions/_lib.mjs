import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
const STORE_NAME = "straight-up-sites-crm";
const DATA_KEY = "crm-data-v2";
export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
export function bad(message, status = 400) { return json({ error: message }, status); }
export function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    const [k, ...v] = p.split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}
function sign(value, secret) { return crypto.createHmac("sha256", secret).update(value).digest("base64url"); }
export function makeSession(username, secret) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const payload = `${username}|${exp}`;
  return Buffer.from(`${payload}|${sign(payload, secret)}`).toString("base64url");
}
export function verifySession(token, secret) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [username, expStr, sig] = raw.split("|");
    const payload = `${username}|${expStr}`;
    const expected = sign(payload, secret);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Date.now() > Number(expStr)) return null;
    return { username };
  } catch { return null; }
}
export function requireAuth(request) {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) return { error: "SESSION_SECRET is not set." };
  const token = getCookie(request, "crm_session");
  const session = token ? verifySession(token, secret) : null;
  if (!session) return { error: "Unauthorized", status: 401 };
  return { session };
}
export function newId() { return crypto.randomUUID(); }
export function addNote(contact, type, text) {
  contact.notes ||= [];
  contact.notes.push({ id: newId(), type, text, createdAt: new Date().toISOString() });
}
export function normalizeContact(input = {}) {
  return {
    id: input.id || newId(),
    businessName: String(input.businessName || "").trim(),
    mainContact: String(input.mainContact || "").trim(),
    mobile: String(input.mobile || "").trim(),
    landline: String(input.landline || "").trim(),
    email: String(input.email || "").trim(),
    probability: String(input.probability || "").trim(),
    sold: !!input.sold,
    nextActionDate: String(input.nextActionDate || "").trim(),
    instagram: String(input.instagram || "").trim(),
    facebook: String(input.facebook || "").trim(),
    tiktok: String(input.tiktok || "").trim(),
    x: String(input.x || "").trim(),
    notes: Array.isArray(input.notes) ? input.notes : [],
  };
}
export function normalizeTemplate(input = {}) {
  return {
    id: input.id || newId(),
    name: String(input.name || "").trim(),
    body: String(input.body || "").trim(),
  };
}
export async function getData() {
  const store = getStore(STORE_NAME);
  const current = await store.get(DATA_KEY, { type: "json" });
  if (current && Array.isArray(current.contacts)) {
    current.templates ||= [
      { id: newId(), name: "Website intro", body: "Hi {{businessName}}, I help businesses get a clean professional website. Would you like a free demo?" },
      { id: newId(), name: "Follow-up", body: "Hi {{mainContact}}, just following up on my last message. Happy to put together a free website mock-up for {{businessName}}." }
    ];
    return current;
  }
  const seed = {
    contacts: [],
    templates: [
      { id: newId(), name: "Website intro", body: "Hi {{businessName}}, I help businesses get a clean professional website. Would you like a free demo?" },
      { id: newId(), name: "Follow-up", body: "Hi {{mainContact}}, just following up on my last message. Happy to put together a free website mock-up for {{businessName}}." }
    ]
  };
  await saveData(seed);
  return seed;
}
export async function saveData(data) {
  const store = getStore(STORE_NAME);
  await store.setJSON(DATA_KEY, data);
  return data;
}
