import { bad, json, requireAuth, getData, saveData, normalizeContact, addNote } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const body = await request.json().catch(() => ({}));
  if (!String(body.businessName || "").trim()) return bad("Business name is required.");
  const data = await getData();
  if (body.id) {
    const idx = data.contacts.findIndex(c => c.id === body.id);
    if (idx === -1) return bad("Contact not found.", 404);
    const existing = data.contacts[idx];
    data.contacts[idx] = { ...existing, ...normalizeContact({ ...existing, ...body, notes: existing.notes }) };
    addNote(data.contacts[idx], "note", "Contact details updated.");
  } else {
    const contact = normalizeContact(body);
    addNote(contact, "note", "Contact created.");
    data.contacts.unshift(contact);
  }
  await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates, selectedId: body.id || data.contacts[0]?.id || null });
};