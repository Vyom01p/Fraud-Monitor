import { createContext, useContext, useMemo, useState } from "react";
import RiskDrawer from "../components/RiskDrawer.jsx";

const DrawerContext = createContext(null);

export function DrawerProvider({ children }) {
  const [tx, setTx] = useState(null);
  const value = useMemo(() => ({ open: setTx, close: () => setTx(null) }), []);

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <RiskDrawer tx={tx} onChange={setTx} onClose={() => setTx(null)} />
    </DrawerContext.Provider>
  );
}

export const useDrawer = () => useContext(DrawerContext);
