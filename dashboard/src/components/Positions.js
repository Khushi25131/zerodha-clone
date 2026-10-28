import React from "react";
import useCollection from "../useCollection";
import { CollectionState, Pagination } from "./CollectionState";
const Positions = () => {
  const collection = useCollection("/allPositions");
  return <>
    <h3 className="title">Positions</h3><CollectionState collection={collection} />
    {!collection.loading && !collection.error && (collection.rows.length ? <div className="order-table"><table>
      <thead><tr>{["Product", "Instrument", "Qty.", "Avg.", "LTP", "P&L", "Chg."].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{collection.rows.map((stock) => {
        const profit = ((Number(stock.price) || 0) - (Number(stock.avg) || 0)) * (Number(stock.qty) || 0);
        return <tr key={stock._id}><td>{stock.product}</td><td>{stock.name}</td><td>{stock.qty}</td><td>{Number(stock.avg || 0).toFixed(2)}</td><td>{Number(stock.price || 0).toFixed(2)}</td><td className={profit < 0 ? "loss" : "profit"}>{profit.toFixed(2)}</td><td className={parseFloat(stock.day) < 0 ? "loss" : "profit"}>{stock.day || "—"}</td></tr>;
      })}</tbody>
    </table></div> : <p>No positions on this page.</p>)}
    <Pagination collection={collection} />
  </>;
};
export default Positions;
