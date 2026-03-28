export function cleanPercent(value) {
  if (value === null || value === undefined) return "";

  // Convert to string
  let v = String(value).trim();

  // Remove ALL % symbols
  v = v.replace(/%+/g, "");

  // Remove non-numeric characters (just in case)
  v = v.replace(/[^\d]/g, "");

  if (v === "") return "";

  // Convert to number and clamp between 0–100
  let num = Math.max(0, Math.min(100, parseInt(v, 10)));

  return num.toString(); // store as plain number (NO %)
}
