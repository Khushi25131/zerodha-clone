import React, { useEffect, useState } from "react";

import { api } from "../api";
import { clearSession, getStoredUser } from "../auth";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";

const Home = () => {
  const [user, setUser] = useState(getStoredUser());
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    api.get("/auth/me").then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setChecking(false));
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    clearSession();
    setUser(null);
  };
  if (checking) return <p role="status">Checking session…</p>;
  if (!user) return <AuthPage onAuthenticated={setUser} />;
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="demo-notice">Educational clone — not affiliated with Zerodha. Account data is isolated after login. Watchlist, index quotes and funds are sample data. Portfolio summaries use stored account records. No real trading or accounts.</aside>
      <TopBar user={user} onLogout={logout} />
      <Dashboard user={user} />
    </>
  );
};

export default Home;
