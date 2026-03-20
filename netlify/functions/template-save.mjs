import { bad, json, requireAuth, getData, saveData, normalizeTemplate } from "./_lib.mjs";
export default async (request) => {
  const auth=requireAuth(request); if(auth.error) return bad(auth.error, auth.status||401);
  if (request.method !== "POST") return bad("Method not allowed", 405);
  const body = await request.json().catch(() => ({}));
  if (!String(body.name || "").trim() || !String(body.body || "").trim()) return bad("Template name and body are required.");
  const data = await getData();
  if (body.id) {
    const idx = data.templates.findIndex(t => t.id === body.id);
    if (idx === -1) return bad("Template not found.", 404);
    data.templates[idx] = normalizeTemplate({ ...data.templates[idx], ...body });
  } else {
    data.templates.unshift(normalizeTemplate(body));
  }
  await saveData(data);
  return json({ templates: data.templates, contacts: data.contacts });
};