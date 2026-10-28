import React from "react";

import Dashboard from "./Dashboard";
import TopBar from "./TopBar";

const Home = () => {
  return (
    <>
      <aside className="demo-notice">Educational shared demo — not affiliated with Zerodha. Watchlist, index quotes, funds and summary are sample data. No real trading or accounts.</aside>
      <TopBar />
      <Dashboard />
    </>
  );
};

export default Home;
