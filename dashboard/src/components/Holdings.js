import React from "react";
import { VerticalGraph } from "./VerticalGraph";
import useCollection from "../useCollection";
import { CollectionState, Pagination } from "./CollectionState";
export const holdingTotals = (rows) => rows.reduce((total, stock) => ({ investment: total.investment + (Number(stock.avg) || 0) * (Number(stock.qty) || 0), value: total.value + (Number(stock.price) || 0) * (Number(stock.qty) || 0) }), { investment: 0, value: 0 });
const money = (n) => Number.isFinite(Number(n)) ? Number(n).toFixed(2) : "—";
const Holdings = () => {
  const collection = useCollection("/allHoldings");
  const { rows, loading, error } = collection;
  const totals = holdingTotals(rows);
  return <>
    <h3 className="title">Holdings</h3>
    <CollectionState collection={collection} />
    {!loading && !error && <>
      {!rows.length ? <p>No holdings on this page.</p> : <>
        <div className="order-table"><table>
          <thead><tr>{["Instrument", "Qty.", "Avg. cost", "LTP", "Cur. val", "P&L", "Net chg.", "Day chg."].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{rows.map((stock) => {
            const value = (Number(stock.price) || 0) * (Number(stock.qty) || 0);
            const profit = value - (Number(stock.avg) || 0) * (Number(stock.qty) || 0);
            return <tr key={stock._id}><td>{stock.name}</td><td>{stock.qty}</td><td>{money(stock.avg)}</td><td>{money(stock.price)}</td><td>{money(value)}</td><td className={profit >= 0 ? "profit" : "loss"}>{money(profit)}</td><td>{stock.net || "—"}</td><td className={parseFloat(stock.day) < 0 ? "loss" : "profit"}>{stock.day || "—"}</td></tr>;
          })}</tbody>
        </table></div>
        <div className="row">
          <div className="col"><h5>{money(totals.investment)}</h5><p>Investment (this page)</p></div>
          <div className="col"><h5>{money(totals.value)}</h5><p>Current value (this page)</p></div>
          <div className="col"><h5>{money(totals.value - totals.investment)} ({totals.investment ? ((totals.value / totals.investment - 1) * 100).toFixed(2) : "0.00"}%)</h5><p>P&L (this page)</p></div>
        </div>
        <VerticalGraph data={{ labels: rows.map((row) => row.name), datasets: [{ label: "Stock price", data: rows.map((row) => row.price), backgroundColor: "#a5b4ff99", borderRadius: 6 }] }} />
      </>}
    </>}
    <Pagination collection={collection} />
  </>;
};
export default Holdings;
