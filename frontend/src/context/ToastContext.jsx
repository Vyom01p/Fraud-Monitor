import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(() => {});
let nextId = 1;

const TONES = {
  info: { icon: Info, cls: "text-brand" },
  ok: { icon: CheckCircle2, cls: "text-ok" },
  bad: { icon: AlertTriangle, cls: "text-bad" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const toast = useCallback(
    ({ title, description, tone = "info", duration = 5000 }) => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-3), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-100 flex w-[min(92vw,22rem)] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const tone = TONES[t.tone] ?? TONES.info;
            const Icon = tone.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="card pointer-events-auto flex items-start gap-3 p-3"
              >
                <Icon className={`mt-0.5 size-5 shrink-0 ${tone.cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 wrap-words text-xs text-mute">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="text-mute hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
