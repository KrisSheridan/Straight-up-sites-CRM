import { bad, json, requireAuth, getData, saveData, addNote } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const { id = "", text = "", type = "note" } = await request.json().catch(() => ({}));
  const data = await getData(); const contact = data.contacts.find(c => c.id === id);
  if (!contact) return bad("Contact not found.", 404);
  addNote(contact, type, String(text || ""));
  await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates });
};