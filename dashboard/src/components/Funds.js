import React from "react";
export default function Funds() {
  return <section><h1>Funds — sample data</h1>
    <p>Transfers, withdrawals and commodity accounts are not implemented. This demo never moves real money.</p>
    <div className="funds"><button className="btn btn-green" disabled title="Not available in this demo">Add funds</button><button className="btn btn-blue" disabled title="Not available in this demo">Withdraw</button></div>
    <div className="table"><div className="data"><p>Sample available margin</p><p>4,043.10</p></div><div className="data"><p>Sample used margin</p><p>3,757.30</p></div><div className="data"><p>Sample available cash</p><p>4,043.10</p></div></div>
  </section>;
}
