import { bad, json, requireAuth, getData, saveData, normalizeContact, addNote } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const { contacts = [] } = await request.json().catch(() => ({}));
  const data = await getData();
  for (const row of contacts) {
    const contact = normalizeContact(row);
    if (!contact.businessName && !contact.mainContact && !contact.mobile && !contact.landline && !contact.email) continue;
    addNote(contact, "note", "Contact imported from CSV.");
    data.contacts.unshift(contact);
  }
  await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates });
};