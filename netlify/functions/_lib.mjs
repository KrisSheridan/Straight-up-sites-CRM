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
export function normalizeProbability(value='') {
  const str = String(value ?? '').trim().replace(/%+/g,'');
  if (!str) return '';
  const match = str.match(/-?\d+(\.\d+)?/);
  if (!match) return '';
  const num = Math.max(0, Math.min(100, Math.round(Number(match[0]))));
  return `${num}%`;
}
export function normalizeUkPhone(value='') {
  let raw = String(value ?? '').trim();
  if (!raw) return '';
  let digits = raw.replace(/[^\d+]/g,'');
  if (digits.startsWith('+44')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('44') && digits.length >= 12) digits = '0' + digits.slice(2);
  digits = digits.replace(/\D/g,'');
  if (digits.length === 10 && !digits.startsWith('0')) digits = '0' + digits;
  return digits;
}
export function normalizeName(value='') { return String(value ?? '').trim().toLowerCase().replace(/\s+/g,' '); }
export function normalizeEmail(value='') { return String(value ?? '').trim().toLowerCase(); }
export function isCustomerContact(contact={}) { return !!(contact?.sold || String(contact?.subscription || '').trim()); }
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
    probability: normalizeProbability(input.probability),
    sold: !!input.sold,
    nextActionDate: String(input.nextActionDate || "").trim(),
    websiteUrl: String(input.websiteUrl || "").trim(),
    subscription: String(input.subscription || "").trim(),
    instagram: String(input.instagram || "").trim(),
    facebook: String(input.facebook || "").trim(),
    tiktok: String(input.tiktok || "").trim(),
    x: String(input.x || "").trim(),
    notes: Array.isArray(input.notes) ? input.notes : [],
  };
}
export function findDuplicateContact(contacts = [], input = {}, ignoreId = '') {
  const targetName = normalizeName(input.businessName);
  const targetEmail = normalizeEmail(input.email);
  const targetPhones = [normalizeUkPhone(input.mobile), normalizeUkPhone(input.landline)].filter(Boolean);
  return contacts.find(c => {
    if (ignoreId && c.id === ignoreId) return false;
    const nameMatch = !!targetName && normalizeName(c.businessName) === targetName;
    const emailMatch = !!targetEmail && normalizeEmail(c.email) === targetEmail;
    const existingPhones = [normalizeUkPhone(c.mobile), normalizeUkPhone(c.landline)].filter(Boolean);
    const phoneMatch = targetPhones.some(p => existingPhones.includes(p));
    return nameMatch || emailMatch || phoneMatch;
  }) || null;
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
