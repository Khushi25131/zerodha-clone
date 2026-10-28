import React, { useMemo, useState } from "react";
import useCollection from "../useCollection";
import { holdingTotals, portfolioRows } from "../analytics";
import { CollectionState, Pagination } from "./CollectionState";
import { EmptyState, FilterBar, PageHeader } from "./AnalyticsUI";
import { AllocationChart, ExposureChart } from "./AnalyticsCharts";
export { holdingTotals } from "../analytics";
const money = (n) => Number.isFinite(Number(n)) ? Number(n).toFixed(2) : "—";
const Holdings = () => {
  const collection = useCollection("/allHoldings");
  const { rows, loading, error } = collection;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("value");
  const [metric, setMetric] = useState("value");
  const filtered = useMemo(() => portfolioRows(rows, search, sort), [rows, search, sort]);
  const totals = holdingTotals(filtered);
  return <>
    <PageHeader eyebrow="Portfolio analytics" title="Holdings" description="Understand exposure, invested cost and unrealized returns from your stored holdings." />
    <CollectionState collection={collection} />
    {!loading && !error && <>
      <FilterBar count={filtered.length} onReset={() => { setSearch(""); setSort("value"); setMetric("value"); }}>
        <label>Find instrument<input type="search" aria-label="Search holdings" placeholder="Symbol or name" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="value">Current value ↓</option><option value="profit">P&L ↓</option><option value="name">Instrument A–Z</option></select></label>
      </FilterBar>
      <p className="scope-note">All totals and charts reflect matching records on this page only · Prices are stored, not live · INR</p>
      {!filtered.length ? <EmptyState title={rows.length ? "No matching holdings" : "No holdings on this page."}>{rows.length ? "Try another symbol or reset your filters." : "Your saved holdings will appear here. Demo orders do not execute or create holdings."}</EmptyState> : <>
        <div className="row">
          <div className="col"><h5>{money(totals.investment)}</h5><p>Investment (this page)</p></div>
          <div className="col"><h5>{money(totals.value)}</h5><p>Current value (this page)</p></div>
          <div className="col"><h5 className={totals.value < totals.investment ? "loss" : "profit"}>{money(totals.value - totals.investment)} ({totals.investment ? ((totals.value / totals.investment - 1) * 100).toFixed(2) : "0.00"}%)</h5><p>P&L (this page)</p></div>
        </div>
        <div className="analytics-grid"><section className="analytics-panel"><div className="panel-heading"><h2>Instrument performance</h2><label className="compact-control">Compare<select aria-label="Chart metric" value={metric} onChange={(event) => setMetric(event.target.value)}><option value="value">Cost vs value</option><option value="profit">Unrealized P&L</option></select></label></div><ExposureChart rows={filtered.slice(0, 10)} metric={metric} /><p className="chart-caption">First 10 matching instruments in selected sort order. Toggle a legend to hide a series.</p></section>
          <section className="analytics-panel"><div className="panel-heading"><h2>Value allocation</h2><span className="status-badge">INR</span></div>{totals.value > 0 ? <AllocationChart rows={filtered} /> : <p>No positive current values to allocate.</p>}<p className="chart-caption">Positive current values across matching records. Hover for share and value; exact values below.</p></section></div>
        <div className="order-table" role="region" aria-label="Holdings details" tabIndex="0"><table><caption>Matching holdings · INR · scroll horizontally for all columns</caption>
          <thead><tr>{["Instrument", "Qty.", "Avg. cost", "LTP", "Cur. val", "P&L", "Net chg.", "Day chg."].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{filtered.map((stock) => <tr key={stock._id}><td>{stock.name}</td><td>{stock.qty}</td><td>{money(stock.avg)}</td><td>{money(stock.price)}</td><td>{money(stock.value)}</td><td className={stock.profit >= 0 ? "profit" : "loss"}>{money(stock.profit)}</td><td>{stock.net || "—"}</td><td className={parseFloat(stock.day) < 0 ? "loss" : "profit"}>{stock.day || "—"}</td></tr>)}</tbody>
        </table></div>
      </>}
    </>}
    <Pagination collection={collection} />
  </>;
};
export default Holdings;
