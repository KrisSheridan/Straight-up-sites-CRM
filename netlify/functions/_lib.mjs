export function bad(message, status = 400) {
  return {
    statusCode: status,
    body: JSON.stringify({ error: message }),
  };
}

export function json(data) {
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
}

export function requireAuth(request) {
  // simple pass-through (keeping your current setup intact)
  return {};
}

export async function getData() {
  const data = globalThis.__crmData || { contacts: [] };
  return data;
}

export async function saveData(data) {
  globalThis.__crmData = data;
}

/* =========================
   🔥 FIXED PERCENT HANDLING
   ========================= */
export function cleanPercent(value) {
  if (value === null || value === undefined) return "";

  let v = String(value).trim();

  // Remove ALL % signs (fixes 100%% issue)
  v = v.replace(/%+/g, "");

  // Remove any non-numbers
  v = v.replace(/[^\d]/g, "");

  if (!v) return "";

  let num = parseInt(v, 10);

  // Clamp between 0–100
  num = Math.max(0, Math.min(100, num));

  return num.toString(); // stored WITHOUT %
}
