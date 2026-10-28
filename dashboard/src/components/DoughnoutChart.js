import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export function DoughnutChart({ data }) {
  return <Doughnut aria-label="Sample instrument price comparison" role="img" data={data} options={{ cutout: "72%", plugins: { legend: { position: "bottom", labels: { color: "#abb5c8", boxWidth: 8, padding: 14, font: { size: 10 } } }, tooltip: { backgroundColor: "#192234", titleColor: "#f3f5fa", bodyColor: "#abb5c8", borderColor: "#ffffff29", borderWidth: 1 } } }} />;
}
