import { bad, json, requireAuth, getData, saveData, normalizeProbability } from "./_lib.mjs";

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export default async (request) => {
  const auth = requireAuth(request);
  if (auth.error) return bad(auth.error, auth.status || 401);
  if (request.method !== "POST") return bad("Method not allowed", 405);

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];
  const data = await getData();

  for (const c of data.contacts) {
    if (!ids.includes(c.id)) continue;

    // Update fields only when the frontend deliberately sends them.
    // This keeps "blank fields stay unchanged" for bulk edit,
    // while making probability and boolean changes reliable.
    if (hasOwn(body, "nextActionDate")) c.nextActionDate = String(body.nextActionDate || "").trim();
    if (hasOwn(body, "mainContact")) c.mainContact = String(body.mainContact || "").trim();
    if (hasOwn(body, "mobile")) c.mobile = String(body.mobile || "").trim();
    if (hasOwn(body, "landline")) c.landline = String(body.landline || "").trim();
    if (hasOwn(body, "email")) c.email = String(body.email || "").trim();
    if (hasOwn(body, "probability")) c.probability = normalizeProbability(body.probability);
    if (hasOwn(body, "websiteUrl")) c.websiteUrl = String(body.websiteUrl || "").trim();
    if (hasOwn(body, "subscription")) c.subscription = String(body.subscription || "").trim();
    if (hasOwn(body, "sold")) c.sold = String(body.sold) === "true" || body.sold === true;
  }

  await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates, updated: ids.length });
};
