import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export const options = {
  responsive: true,
  scales: {
    x: { ticks: { color: "#abb5c8" }, grid: { display: false } },
    y: { ticks: { color: "#abb5c8" }, grid: { color: "#ffffff0d" } },
  },
  plugins: {
    tooltip: { backgroundColor: "#192234", titleColor: "#f3f5fa", bodyColor: "#abb5c8" },
    legend: { position: "top", labels: { color: "#abb5c8", boxWidth: 10 } },
    title: { display: true, text: "Holdings", color: "#f3f5fa" },
  },
};
export function VerticalGraph({ data }) {
  return <Bar aria-label="Holding prices" role="img" options={options} data={data} />;
}
