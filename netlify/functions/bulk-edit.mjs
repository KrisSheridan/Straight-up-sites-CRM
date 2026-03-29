import { bad, json, requireAuth, getData, saveData, normalizeProbability } from "./_lib.mjs";

export default async (request) => {
  const auth = requireAuth(request);
  if (auth.error) return bad(auth.error, auth.status || 401);
  if (request.method !== "POST") return bad("Method not allowed", 405);

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];
  const data = await getData();

  for (const c of data.contacts) {
    if (!ids.includes(c.id)) continue;
    if (body.nextActionDate) c.nextActionDate = String(body.nextActionDate).trim();
    if (body.mainContact) c.mainContact = String(body.mainContact).trim();
    if (body.mobile) c.mobile = String(body.mobile).trim();
    if (body.landline) c.landline = String(body.landline).trim();
    if (body.email) c.email = String(body.email).trim();
    if (body.probability !== undefined && body.probability !== "") c.probability = normalizeProbability(body.probability);
    if (body.websiteUrl !== undefined && body.websiteUrl !== "") c.websiteUrl = String(body.websiteUrl).trim();
    if (body.subscription !== undefined && body.subscription !== "") c.subscription = String(body.subscription).trim();
    if (body.sold !== undefined && body.sold !== null && body.sold !== "") c.sold = String(body.sold) === "true" || body.sold === true;
  }

  await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates, updated: ids.length });
};
