import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { dailyActivity, money, number } from "../analytics";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);
const colors = ["#a5b4ff", "#65d6e8", "#c2a3ed", "#48d6a0", "#f5bd67", "#ff8b9c"];
function baseOptions() {
  return { responsive: true, maintainAspectRatio: false, animation: typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? false : { duration: 200 }, plugins: { legend: { position: "bottom", labels: { color: "#abb5c8", boxWidth: 10, padding: 16 } }, tooltip: { backgroundColor: "#192234", titleColor: "#f3f5fa", bodyColor: "#abb5c8", borderColor: "#ffffff29", borderWidth: 1 } } };
}
const axes = { x: { ticks: { color: "#abb5c8", maxRotation: 0 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: "#abb5c8" }, grid: { color: "#ffffff0d" } } };
export function AllocationChart({ rows }) {
  const entries = rows.map((row) => ({ name: row.name, value: Math.max(0, number(row.qty) * number(row.price)) })).filter((row) => row.value > 0);
  const total = entries.reduce((sum, row) => sum + row.value, 0);
  const options = baseOptions();
  options.cutout = "74%";
  options.plugins.tooltip.callbacks = { label: (context) => `${context.label}: ${money(context.raw)} (${(context.raw / total * 100).toFixed(1)}%)` };
  return <div className="chart-frame"><Doughnut role="img" aria-label={`Holding allocation by current value. Total ${money(total)}. Exact values are in the holdings table.`} options={options} data={{ labels: entries.map((row) => row.name), datasets: [{ label: "Current value (INR)", data: entries.map((row) => row.value), backgroundColor: entries.map((_, index) => colors[index % colors.length]), borderColor: "#111827", borderWidth: 3 }] }} /></div>;
}
export function ExposureChart({ rows, metric }) {
  const options = baseOptions();
  options.scales = { ...axes, y: { ...axes.y, title: { display: true, text: "INR", color: "#abb5c8" } } };
  options.plugins.tooltip.callbacks = { label: (context) => `${context.dataset.label}: ${money(context.raw)}` };
  const datasets = metric === "profit" ? [{ label: "Unrealized P&L", data: rows.map((row) => row.profit), backgroundColor: rows.map((row) => row.profit < 0 ? "#ff8b9c" : "#48d6a0"), borderRadius: 5 }] : [
    { label: "Invested", data: rows.map((row) => row.investment), backgroundColor: "#a5b4ff99", borderRadius: 5 },
    { label: "Current value", data: rows.map((row) => row.value), backgroundColor: "#65d6e8bb", borderRadius: 5 },
  ];
  return <div className="chart-frame"><Bar role="img" aria-label={metric === "profit" ? "Unrealized profit and loss by instrument; exact values in table" : "Investment versus current value by instrument; exact values in table"} options={options} data={{ labels: rows.map((row) => row.name), datasets }} /></div>;
}
export function ActivityChart({ rows }) {
  const days = dailyActivity(rows);
  if (!days.length) return <p className="chart-empty">No dated orders in this selection. Undated records remain in the table.</p>;
  const options = baseOptions();
  options.scales = { ...axes, x: { ...axes.x, title: { display: true, text: "Recorded date · UTC", color: "#abb5c8" } }, y: { ...axes.y, ticks: { color: "#abb5c8", precision: 0 }, title: { display: true, text: "Order count", color: "#abb5c8" } } };
  return <><div className="chart-frame"><Line role="img" aria-label="Recorded buy and sell order counts by UTC day; accessible totals below" options={options} data={{ labels: days.map((day) => day.date), datasets: ["BUY", "SELL"].map((mode, index) => ({ label: mode, data: days.map((day) => day[mode]), borderColor: colors[index], backgroundColor: index ? "#65d6e80c" : "#a5b4ff15", fill: true, tension: 0.25, pointRadius: 4 })) }} /></div><details className="chart-data"><summary>View chart data</summary><ul>{days.map((day) => <li key={day.date}>{day.date} UTC · Buy: {day.BUY} · Sell: {day.SELL}</li>)}</ul></details></>;
}
