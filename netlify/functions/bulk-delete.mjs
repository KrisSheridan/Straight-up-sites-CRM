import { bad, json, requireAuth, getData, saveData } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const { ids = [] } = await request.json().catch(() => ({}));
  const idSet = new Set(Array.isArray(ids) ? ids : []);
  const data = await getData(); data.contacts = data.contacts.filter(c => !idSet.has(c.id)); await saveData(data);
  return json({ contacts: data.contacts, templates: data.templates });
};