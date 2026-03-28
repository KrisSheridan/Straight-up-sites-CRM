import { bad, json, requireAuth, getData, saveData, normalizeContact, findDuplicateContact } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const body = await request.json().catch(() => ({}));
  if (!String(body.businessName || "").trim()) return bad("Business name is required.");
  const data = await getData();

  const duplicate = findDuplicateContact(data.contacts, body, body.id || '');
  if (duplicate && !body.duplicateAction) {
    return json({ error: "Duplicate contact found.", code: "DUPLICATE_CONTACT", duplicate: { id: duplicate.id, businessName: duplicate.businessName, mobile: duplicate.mobile, email: duplicate.email } }, 409);
  }

  if (body.id) {
    const idx = data.contacts.findIndex(c => c.id === body.id);
    if (idx === -1) return bad("Contact not found.", 404);
    const existing = data.contacts[idx];
    data.contacts[idx] = { ...existing, ...normalizeContact({ ...existing, ...body, notes: existing.notes }) };
    await saveData(data);
    return json({ contacts: data.contacts, templates: data.templates, selectedId: body.id });
  }

  if (duplicate && body.duplicateAction === 'replace_existing') {
    const idx = data.contacts.findIndex(c => c.id === (body.duplicateId || duplicate.id));
    if (idx === -1) return bad("Duplicate contact not found.", 404);
    const existing = data.contacts[idx];
    data.contacts[idx] = { ...existing, ...normalizeContact({ ...existing, ...body, id: existing.id, notes: existing.notes }) };
    await saveData(data);
    return json({ contacts: data.contacts, templates: data.templates, selectedId: existing.id });
  }

  const contact = normalizeContact(body);
  data.contacts.unshift(contact);
  await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates, selectedId: contact.id });
};
