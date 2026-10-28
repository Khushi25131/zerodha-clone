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
    <section className="auth-card">
      <h1>{mode === "signup" ? "Create demo account" : "Log in to dashboard"}</h1>
      <p>Accounts isolate this educational demo data. Orders are still records only; no real trades or money movement occur.</p>
      <form onSubmit={submit}>
        {mode === "signup" && <label>Name<input required maxLength="64" value={form.name} onChange={update("name")} /></label>}
        <label>Email<input required type="email" value={form.email} onChange={update("email")} /></label>
        <label>Password<input required type="password" minLength="8" maxLength="128" value={form.password} onChange={update("password")} /></label>
        {error && <p role="alert">{error}</p>}
        <button className="btn btn-blue" disabled={pending} type="submit">{pending ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}</button>
      </form>
      <button className="link-button" type="button" onClick={() => { setError(""); setMode(mode === "signup" ? "login" : "signup"); }}>
        {mode === "signup" ? "Already have an account? Log in" : "Need an account? Create one"}
      </button>
    </section>
  </main>;
};

export default AuthPage;
