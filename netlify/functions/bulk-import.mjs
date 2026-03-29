import {
  bad,
  json,
  requireAuth,
  getData,
  saveData,
  normalizeContact,
  findDuplicateContact,
  summarizeDuplicate,
} from "./_lib.mjs";

export default async (request) => {
  const auth = requireAuth(request);
  if (auth.error) return bad(auth.error, auth.status || 401);
  if (request.method !== "POST") return bad("Method not allowed", 405);

  const { contacts = [] } = await request.json().catch(() => ({}));
  const data = await getData();

  let imported = 0;
  const skippedDuplicates = [];

  for (const row of contacts) {
    const contact = normalizeContact(row);
    if (!contact.businessName && !contact.mainContact && !contact.mobile && !contact.landline && !contact.email) {
      continue;
    }

    const duplicate = findDuplicateContact(data.contacts, contact);
    if (duplicate) {
      skippedDuplicates.push({
        incoming: summarizeDuplicate(contact),
        existing: summarizeDuplicate(duplicate),
      });
      continue;
    }

    data.contacts.unshift(contact);
    imported += 1;
  }

  await saveData(data);
  return json({
    contacts: data.contacts,
    templates: data.templates,
    imported,
    skippedDuplicates,
  });
};
