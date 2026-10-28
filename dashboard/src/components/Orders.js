import React from "react";
import { Link } from "react-router-dom";
import useCollection from "../useCollection";
import { CollectionState, Pagination } from "./CollectionState";
const Orders = () => {
  const collection = useCollection("/allOrders");
  return <section className="orders">
    <h3>Recorded demo orders</h3><p>These orders are stored only; they are not executed and do not update holdings or cash.</p>
    <CollectionState collection={collection} />
    {!collection.loading && !collection.error && (collection.rows.length ? <div className="order-table"><table>
      <thead><tr>{["Instrument", "Mode", "Quantity", "Price", "Recorded at"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{collection.rows.map((order) => <tr key={order._id}><td>{order.name}</td><td>{order.mode}</td><td>{order.qty}</td><td>{Number(order.price).toFixed(2)}</td><td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</td></tr>)}</tbody>
    </table></div> : <div className="no-orders"><p>No orders on this page.</p><Link to="/" className="btn">Get started</Link></div>)}
    <Pagination collection={collection} />
  </section>;
};
export default Orders;
