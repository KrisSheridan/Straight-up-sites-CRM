import { bad, json, requireAuth, getData, saveData } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const { id = "" } = await request.json().catch(() => ({}));
  const data = await getData(); data.contacts = data.contacts.filter(c => c.id !== id); await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates });
};