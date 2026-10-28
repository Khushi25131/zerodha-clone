import React, { useContext, useEffect, useRef, useState } from "react";
import { api, apiError } from "../api";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid, price = 0, mode = "BUY" }) => {
  const { closeBuyWindow } = useContext(GeneralContext);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(price);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const qty = Number(stockQuantity);
    const priceValue = Number(stockPrice);
    if (!Number.isSafeInteger(qty) || qty < 1 || qty > 1000000 || !Number.isFinite(priceValue) || priceValue < 0.01 || priceValue > 100000000) {
      setError("Enter a whole quantity (1–1000000) and price (0.01–100000000).");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      await api.post("/newOrder", { name: uid, qty, price: priceValue, mode });
      window.dispatchEvent(new Event("order-saved"));
      closeBuyWindow();
    } catch (err) {
      setError(`${apiError(err)} If the request timed out, check Orders before retrying to avoid duplicates.`);
      submitting.current = false;
      setPending(false);
    }
  };
  return <dialog ref={dialog} className="container" id="buy-window" aria-labelledby="order-title" onCancel={(event) => { event.preventDefault(); if (!submitting.current) closeBuyWindow(); }}>
    <form aria-label="Demo order" onSubmit={submit}>
      <div className="regular-order">
        <h2 id="order-title">{mode === "BUY" ? "Buy" : "Sell"} {uid}</h2>
        <p>Demo order only. No exchange execution or funds movement.</p>
        <div className="inputs">
          <label htmlFor="qty">Quantity<input autoFocus disabled={pending} type="number" id="qty" min="1" max="1000000" step="1" required value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} /></label>
          <label htmlFor="price">Price<input disabled={pending} type="number" id="price" min="0.01" max="100000000" step="0.01" required value={stockPrice} onChange={(e) => setStockPrice(e.target.value)} /></label>
        </div>
        {error && <p role="alert">{error}</p>}
      </div>
      <div className="buttons">
        <span>Order value ₹{(Number(stockQuantity) * Number(stockPrice) || 0).toFixed(2)}</span>
        <div><button className="btn btn-blue" disabled={pending} type="submit">{pending ? "Saving…" : mode === "BUY" ? "Buy" : "Sell"}</button>
          <button className="btn btn-grey" disabled={pending} type="button" onClick={closeBuyWindow}>Cancel</button></div>
      </div>
    </form>
  </dialog>;
};
export default BuyActionWindow;
