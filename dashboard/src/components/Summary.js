import React from "react";
import { Link } from "react-router-dom";
import useCollection from "../useCollection";
import { holdingTotals, money, orderValue } from "../analytics";
import { CollectionState } from "./CollectionState";
import { EmptyState, MetricCard, PageHeader } from "./AnalyticsUI";
import { AllocationChart } from "./AnalyticsCharts";
const Summary = ({ user }) => {
  const holdings = useCollection("/allHoldings");
  const orders = useCollection("/allOrders");
  const totals = holdingTotals(holdings.rows);
  const profit = totals.value - totals.investment;
  return <>
    <PageHeader eyebrow="Account overview" title={`Hi, ${user?.name || "User"}!`} description="A clear view of your saved demo portfolio. No live quotes or exchange execution.">
      <Link className="btn" to="/holdings">Explore holdings ↗</Link><Link className="btn btn-grey" to="/orders">View orders</Link>
    </PageHeader>
    <p className="scope-note">Snapshot scope: latest 100 holdings and latest 100 orders. Values use stored prices, not live market data.</p>
    <CollectionState collection={holdings} />
    {!holdings.loading && !holdings.error && <>
      <div className="metric-grid">
        <MetricCard label="Invested capital" value={money(totals.investment)} detail={`${holdings.rows.length} holding records loaded`} />
        <MetricCard label="Portfolio value" value={money(totals.value)} detail="Quantity × stored price" />
        <MetricCard label="Unrealized P&L" value={money(profit)} tone={profit < 0 ? "loss" : "profit"} detail={totals.investment ? `${(profit / totals.investment * 100).toFixed(2)}% return on invested capital` : "No invested capital in this snapshot"} hint="Current value minus invested cost. This is not a daily change or realized trading return." />
      </div>
      <div className="analytics-grid">
        <section className="analytics-panel"><div className="panel-heading"><div><span className="eyebrow">Portfolio composition</span><h2>Where your value sits</h2></div><span className="status-badge">Stored data</span></div>
          {totals.value > 0 ? <><AllocationChart rows={holdings.rows} /><Link to="/holdings">Explore allocation and exact values →</Link></> : <EmptyState title="Your portfolio starts here">There are no positive holding values to chart. Recorded orders do not automatically create holdings.</EmptyState>}
        </section>
        <section className="analytics-panel"><div className="panel-heading"><div><span className="eyebrow">Account activity</span><h2>Recently recorded</h2></div><Link to="/orders">All orders →</Link></div>
          <CollectionState collection={orders} />
          {!orders.loading && !orders.error && (orders.rows.length ? <ul className="activity-list">{orders.rows.slice(0, 5).map((order) => <li key={order._id}><div><strong>{order.name}</strong><span>{order.qty} units · {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Date unavailable"}</span></div><div><span className={`status-badge ${order.mode === "SELL" ? "badge-sell" : "badge-buy"}`}>{order.mode}</span><strong>{money(orderValue(order))}</strong></div></li>)}</ul> : <EmptyState title="No activity yet">Choose an instrument in the sample watchlist to record your first demo order.</EmptyState>)}
        </section>
      </div>
    </>}
  </>;
};
export default Summary;
