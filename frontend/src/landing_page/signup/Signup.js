import React from 'react';
export default function Signup() {
  return <main className="container p-5">
    <h1>Explore the educational demo</h1>
    <p>This clone is not affiliated with Zerodha. The dashboard supports demo-only accounts to isolate sample data. Identity verification, real trading and money movement are not implemented. Do not enter personal or financial information beyond disposable demo credentials.</p>
    <a className="btn btn-primary" href={process.env.REACT_APP_DASHBOARD_URL || 'http://localhost:3001'}>Open demo dashboard</a>
    <p className="mt-3">For a real account, visit <a href="https://zerodha.com/open-account/">Zerodha’s official website (external)</a>.</p>
  </main>;
}
