import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useCollection from "../useCollection";
import { filterOrders, money, orderValue } from "../analytics";
import { CollectionState, Pagination } from "./CollectionState";
import { EmptyState, FilterBar, MetricCard, PageHeader } from "./AnalyticsUI";
import { ActivityChart } from "./AnalyticsCharts";
const Orders = () => {
  const collection = useCollection("/allOrders");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("ALL");
  const [days, setDays] = useState("ALL");
  const rows = useMemo(() => filterOrders(collection.rows, { search, mode, days }), [collection.rows, search, mode, days]);
  return <section className="orders">
    <PageHeader eyebrow="Activity explorer" title="Recorded demo orders" description="These orders are stored only; they are not executed and do not update holdings or cash." />
    <CollectionState collection={collection} />
    {!collection.loading && !collection.error && <>
      <FilterBar count={rows.length} onReset={() => { setSearch(""); setMode("ALL"); setDays("ALL"); }}>
        <label>Instrument<input type="search" aria-label="Search orders" placeholder="Search recorded symbols" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Side<select aria-label="Order side" value={mode} onChange={(event) => setMode(event.target.value)}><option value="ALL">All sides</option><option value="BUY">Buy</option><option value="SELL">Sell</option></select></label>
        <label>Recorded within<select aria-label="Order time range" value={days} onChange={(event) => setDays(event.target.value)}><option value="ALL">All loaded dates</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
      </FilterBar>
      <p className="scope-note">Filters, totals and charts apply to this API page only (up to 100 records). Time ranges are rolling periods; charts group dates in UTC.</p>
      <div className="metric-grid"><MetricCard label="Recorded orders" value={rows.length} detail="Matching records on this page" /><MetricCard label="Buy / sell" value={`${rows.filter((row) => row.mode === "BUY").length} / ${rows.filter((row) => row.mode === "SELL").length}`} detail="Recorded sides, not execution status" /><MetricCard label="Recorded notional" value={money(rows.reduce((sum, row) => sum + orderValue(row), 0))} detail="Sum of quantity × price; not money spent" /></div>
      {rows.length ? <><section className="analytics-panel"><div className="panel-heading"><h2>Recording activity</h2><span className="status-badge">Not market performance</span></div><ActivityChart rows={rows} /></section><div className="order-table" role="region" aria-label="Order details" tabIndex="0"><table>
        <caption>Recorded orders · prices and notional in INR</caption><thead><tr>{["Instrument", "Mode", "Quantity", "Price", "Notional", "Recorded at"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{rows.map((order) => <tr key={order._id}><td>{order.name}</td><td><span className={`status-badge ${order.mode === "SELL" ? "badge-sell" : "badge-buy"}`}>{order.mode}</span></td><td>{order.qty}</td><td>{Number(order.price).toFixed(2)}</td><td>{money(orderValue(order))}</td><td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</td></tr>)}</tbody>
      </table></div></> : <EmptyState title={collection.rows.length ? "No matching orders" : "No orders on this page."}>{collection.rows.length ? "Adjust the filters or reset them to see loaded records." : <>Choose an instrument in the sample watchlist, or <Link to="/">return to overview</Link>.</>}</EmptyState>}
    </>}
    <Pagination collection={collection} />
  </section>;
};
export default Orders;
