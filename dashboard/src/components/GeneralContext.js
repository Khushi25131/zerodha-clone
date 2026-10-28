import React, { useState } from "react";
import BuyActionWindow from "./BuyActionWindow";
const GeneralContext = React.createContext({ openBuyWindow: () => {}, closeBuyWindow: () => {} });
export const GeneralContextProvider = ({ children }) => {
  const [order, setOrder] = useState(null);
  return <GeneralContext.Provider value={{ openBuyWindow: (uid, price, mode = "BUY") => setOrder({ uid, price, mode }), closeBuyWindow: () => setOrder(null) }}>
    {children}
    {order && <BuyActionWindow key={`${order.uid}-${order.mode}`} {...order} />}
  </GeneralContext.Provider>;
};
export default GeneralContext;
