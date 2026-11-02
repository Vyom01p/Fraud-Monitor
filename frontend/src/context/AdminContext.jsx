import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [key, setKey] = useState(
    () => sessionStorage.getItem("adminKey") ?? "",
  );
  const [open, setOpen] = useState(false);

  const save = useCallback((value) => {
    sessionStorage.setItem("adminKey", value);
    setKey(value);
  }, []);

  const clear = useCallback(() => {
    sessionStorage.removeItem("adminKey");
    setKey("");
  }, []);

  const value = useMemo(
    () => ({
      key,
      unlocked: Boolean(key),
      headers: key ? { "x-admin-key": key } : {},
      save,
      clear,
      open,
      setOpen,
    }),
    [key, open, save, clear],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
