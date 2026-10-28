import React, { useState } from "react";
import { api, apiError } from "../api";
import { setSession } from "../auth";
import "./AuthPage.css";

const AuthPage = ({ onAuthenticated }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const path = mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload = mode === "signup" ? form : { email: form.email, password: form.password };
      const { data } = await api.post(path, payload);
      setSession({ token: data.token, user: data.user });
      onAuthenticated(data.user);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setPending(false);
    }
  };
  return <main className="auth-page">
    <div className="auth-layout">
      <div className="auth-intro">
        <div className="brand-mark"><span className="brand-symbol" aria-hidden="true">↗</span> Khushi / markets</div>
        <span className="eyebrow">Your space to explore</span>
        <h2>A clearer view.<br /><span>A calmer workspace.</span></h2>
        <p>Explore the markets in a focused workspace. Build confidence with account-scoped demo orders.</p>
        <div className="auth-note">Educational experience · No real trades · Not affiliated with Zerodha</div>
      </div>
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="eyebrow">Demo workspace</span>
        <h1 id="auth-title">{mode === "signup" ? "Create demo account" : "Log in to dashboard"}</h1>
        <p>Accounts isolate this educational demo data. Orders are still records only; no real trades or money movement occur.</p>
        <form onSubmit={submit}>
          {mode === "signup" && <label>Name<input autoComplete="name" required maxLength="64" value={form.name} onChange={update("name")} /></label>}
          <label>Email<input autoComplete="username" required type="email" value={form.email} onChange={update("email")} /></label>
          <label>Password<input autoComplete={mode === "signup" ? "new-password" : "current-password"} required type="password" minLength="8" maxLength="128" value={form.password} onChange={update("password")} /></label>
          {error && <p role="alert">{error}</p>}
          <button className="btn btn-blue" disabled={pending} type="submit">{pending ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}</button>
        </form>
        <button className="link-button" disabled={pending} type="button" onClick={() => { setError(""); setMode(mode === "signup" ? "login" : "signup"); }}>
          {mode === "signup" ? "Already have an account? Log in" : "Need an account? Create one"}
        </button>
      </section>
    </div>
  </main>;
};
export default AuthPage;
