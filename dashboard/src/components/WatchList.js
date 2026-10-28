import React, { useContext, useState } from "react";
import GeneralContext from "./GeneralContext";
import { watchlist } from "../data/data";
import { DoughnutChart } from "./DoughnoutChart";
const WatchList = () => {
  const [search, setSearch] = useState("");
  const { openBuyWindow } = useContext(GeneralContext);
  const stocks = watchlist.filter((stock) => stock.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="watchlist-container" aria-label="Sample watchlist">
    <div className="watchlist-heading"><h2>Watchlist</h2><span>DEMO</span></div>
    <div className="search-container"><input type="search" aria-label="Search watchlist" className="search" placeholder="Search instruments" value={search} onChange={(e) => setSearch(e.target.value)} /><span className="counts">{stocks.length} / {watchlist.length}</span></div>
    <p>Sample prices — not live market data</p>
    {!stocks.length && <p>No matching instruments.</p>}
    <ul className="list">{stocks.map((stock) => <li key={stock.name}>
      <div className="item"><p className={stock.isDown ? "down" : "up"}>{stock.name}</p><div className="item-info"><span>{stock.percent}</span><span>{stock.price}</span></div></div>
      <div className="trade-actions"><button className="buy" aria-label={`Buy ${stock.name}`} onClick={() => openBuyWindow(stock.name, stock.price, "BUY")}>Buy</button> <button className="sell" aria-label={`Sell ${stock.name}`} onClick={() => openBuyWindow(stock.name, stock.price, "SELL")}>Sell</button></div>
    </li>)}</ul>
    <div className="chart-panel"><h3>Sample price comparison</h3><DoughnutChart data={{ labels: stocks.map((stock) => stock.name), datasets: [{ label: "Sample price", data: stocks.map((stock) => stock.price), backgroundColor: ["#a5b4ff", "#65d6e8", "#c2a3ed", "#48d6a0", "#f5bd67"], borderColor: "#111827", borderWidth: 3 }] }} /></div>
  </section>;
};
export default WatchList;
