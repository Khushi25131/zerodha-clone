import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { api } from "../api";
import GeneralContext from "./GeneralContext";
import BuyActionWindow from "./BuyActionWindow";
import WatchList from "./WatchList";
import Holdings, { holdingTotals } from "./Holdings";
import Orders from "./Orders";
import Menu from "./Menu";
jest.mock("../api", () => ({ api: { get: jest.fn(), post: jest.fn() }, apiError: () => "API unavailable" }));
jest.mock("./VerticalGraph", () => ({ VerticalGraph: () => null }));
jest.mock("./DoughnoutChart", () => ({ DoughnutChart: () => null }));
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
beforeEach(() => jest.clearAllMocks());
function dialog(close = jest.fn()) {
  render(<GeneralContext.Provider value={{ closeBuyWindow: close }}><BuyActionWindow uid="INFY" price={100} /></GeneralContext.Provider>);
  return close;
}
test("cancel closes via context", () => {
  const close = dialog();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledTimes(1);
});
test("awaits save, prevents duplicate submission, and closes only on success", async () => {
  let finish;
  api.post.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const close = dialog();
  fireEvent.click(screen.getByRole("button", { name: "Buy" }));
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  fireEvent.submit(screen.getByRole("form", { name: "Demo order" }));
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith("/newOrder", { name: "INFY", qty: 1, price: 100, mode: "BUY" });
  finish({ data: {} });
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});
test("failed save stays open with retry guidance", async () => {
  api.post.mockRejectedValue(new Error("network"));
  const close = dialog();
  fireEvent.click(screen.getByRole("button", { name: "Buy" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("check Orders before retrying");
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Buy" })).toBeEnabled();
});
test("rejects fractional quantities before API call", () => {
  dialog();
  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "1.5" } });
  fireEvent.submit(screen.getByRole("form", { name: "Demo order" }));
  expect(screen.getByRole("alert")).toHaveTextContent("whole quantity");
  expect(api.post).not.toHaveBeenCalled();
});
test("watchlist searches and offers keyboard-accessible buy and sell actions", () => {
  const openBuyWindow = jest.fn();
  render(<GeneralContext.Provider value={{ openBuyWindow }}><WatchList /></GeneralContext.Provider>);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "infy" } });
  expect(screen.queryByRole("button", { name: "Buy TCS" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sell INFY" }));
  expect(openBuyWindow).toHaveBeenCalledWith("INFY", 1555.45, "SELL");
});
test("holdings calculates totals from API values instead of hardcoded samples", async () => {
  api.get.mockResolvedValue({ data: [{ _id: "1", name: "INFY", qty: 2, avg: 10, price: 12, day: "-1%" }] });
  expect(holdingTotals([{ qty: 2, avg: 10, price: 12 }])).toEqual({ investment: 20, value: 24 });
  render(<Holdings />);
  expect(await screen.findByText("INFY")).toBeInTheDocument();
  expect(screen.getByText("4.00 (20.00%)")).toBeInTheDocument();
  expect(screen.getByText("-1%")).toHaveClass("loss");
});
test("holdings retries network failure and handles an empty result", async () => {
  api.get.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ data: [] });
  render(<Holdings />);
  expect(await screen.findByRole("alert")).toHaveTextContent("API unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("No holdings on this page.")).toBeInTheDocument();
});
test("orders displays real API history", async () => {
  api.get.mockResolvedValue({ data: [{ _id: "1", name: "INFY", qty: 2, price: 100, mode: "BUY" }] });
  render(<MemoryRouter><Orders /></MemoryRouter>);
  expect(await screen.findByText("INFY")).toBeInTheDocument();
  expect(screen.getByText("BUY")).toBeInTheDocument();
});
test("direct navigation selects the actual active menu", () => {
  render(<MemoryRouter initialEntries={["/positions"]}><Menu /></MemoryRouter>);
  expect(screen.getByRole("link", { name: "Positions" })).toHaveClass("selected");
  expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass("selected");
});
