/** Formats rupees the way people say them: ₹6,000 / ₹2.5 lakh / ₹1.2 crore. */
export function formatINR(amount) {
  if (amount == null || Number.isNaN(amount)) return "";
  const abs = Math.abs(amount);
  const trim = (n) => Number(n.toFixed(2)).toString();
  if (abs >= 1e7) return `₹${trim(amount / 1e7)} crore`;
  if (abs >= 1e5) return `₹${trim(amount / 1e5)} lakh`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
