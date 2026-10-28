import React from "react";

import Menu from "./Menu";

const TopBar = ({ user, onLogout }) => {
  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className="index-points">{100.2} </p>
          <p className="percent">sample</p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className="index-points">{100.2}</p>
          <p className="percent">sample</p>
        </div>
      </div>

      <Menu user={user} onLogout={onLogout} />
    </div>
  );
};

export default TopBar;
