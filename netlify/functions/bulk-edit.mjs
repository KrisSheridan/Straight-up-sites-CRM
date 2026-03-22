import { bad, json, requireAuth, getData, saveData, addNote } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];
  const data = await getData();
  for (const c of data.contacts) {
    if (!ids.includes(c.id)) continue;
    let changed = false;
    if (body.nextActionDate) { c.nextActionDate = String(body.nextActionDate).trim(); changed = true; }
    if (body.mainContact) { c.mainContact = String(body.mainContact).trim(); changed = true; }
    if (body.mobile) { c.mobile = String(body.mobile).trim(); changed = true; }
    if (body.landline) { c.landline = String(body.landline).trim(); changed = true; }
    if (body.email) { c.email = String(body.email).trim(); changed = true; }
    if (body.probability !== undefined && body.probability !== "") { c.probability = String(body.probability).trim(); changed = true; }
    if (body.sold !== undefined && body.sold !== null) { c.sold = !!body.sold; changed = true; }
    if (changed) addNote(c, "note", "Bulk edit applied.");
  }
  await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates });
};
