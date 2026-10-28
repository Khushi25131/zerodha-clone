// Analytics are computed only from the loaded API page, never inferred market history.
export const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
export const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(number(value));
export const holdingTotals = (rows) => rows.reduce((total, row) => ({ investment: total.investment + number(row.avg) * number(row.qty), value: total.value + number(row.price) * number(row.qty) }), { investment: 0, value: 0 });
export const orderValue = (row) => number(row.qty) * number(row.price);
export function filterOrders(rows, { search = "", mode = "ALL", days = "ALL" } = {}, now = Date.now()) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    const date = Date.parse(row.createdAt);
    return String(row.name).toLowerCase().includes(query) && (mode === "ALL" || row.mode === mode) &&
      (days === "ALL" || (Number.isFinite(date) && date >= now - Number(days) * 86400000 && date <= now));
  });
}
export function dailyActivity(rows) {
  const days = new Map();
  rows.forEach((row) => {
    const date = new Date(row.createdAt);
    if (!Number.isFinite(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    const day = days.get(key) || { date: key, BUY: 0, SELL: 0 };
    if (row.mode === "BUY" || row.mode === "SELL") day[row.mode] += 1;
    days.set(key, day);
  });
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function portfolioRows(rows, search = "", sort = "value") {
  return rows.filter((row) => String(row.name).toLowerCase().includes(search.trim().toLowerCase()))
    .map((row) => ({ ...row, value: number(row.qty) * number(row.price), investment: number(row.qty) * number(row.avg), profit: number(row.qty) * (number(row.price) - number(row.avg)) }))
    .sort((a, b) => sort === "name" ? String(a.name).localeCompare(String(b.name)) : b[sort] - a[sort]);
}
