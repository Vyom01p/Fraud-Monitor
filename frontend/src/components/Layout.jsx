import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight,
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  Lock,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Unlock,
  X,
} from "lucide-react";
import { useAdmin } from "../context/AdminContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useStats } from "../context/StatsContext.jsx";
import { Button, cx } from "./ui.jsx";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "review", label: "Review", icon: ShieldAlert },
  { id: "try", label: "Try it", icon: FlaskConical },
  { id: "rules", label: "Rules", icon: SlidersHorizontal },
];

function Badge({ n }) {
  if (!n) return null;
  return (
    <span className="ml-auto rounded-full bg-bad/20 px-2 py-0.5 text-[11px] font-semibold text-bad">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function AdminButton({ compact }) {
  const admin = useAdmin();
  const Icon = admin.unlocked ? Unlock : Lock;
  return (
    <button
      onClick={() => admin.setOpen(true)}
      aria-label={admin.unlocked ? "Admin unlocked" : "Unlock admin access"}
      className={cx(
        "flex items-center gap-2 rounded-xl border border-line bg-white/0.03 text-xs font-medium transition hover:bg-white/[0.07]",
        compact ? "p-2.5" : "w-full px-3 py-2.5",
        admin.unlocked ? "text-ok" : "text-mute",
      )}
    >
      <Icon className="size-4" />
      {!compact && (admin.unlocked ? "Admin unlocked" : "Unlock admin access")}
    </button>
  );
}

function AdminModal() {
  const admin = useAdmin();
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    admin.save(value.trim());
    setValue("");
    admin.setOpen(false);
  }

  return (
    <AnimatePresence>
      {admin.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-90 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => admin.setOpen(false)}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="card w-full max-w-sm p-6"
          >
            <div className="flex items-start justify-between">
              <div className="grid size-11 place-items-center rounded-xl bg-brand/15 text-brand">
                <KeyRound className="size-5" />
              </div>
              <button
                type="button"
                onClick={() => admin.setOpen(false)}
                aria-label="Close"
                className="text-mute hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            <h2 className="mt-4 text-lg font-semibold">Admin access</h2>
            <p className="mt-1 text-sm text-mute">
              Needed to edit rules, review transactions and export data. The key
              stays in this browser tab only.
            </p>
            <input
              autoFocus
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                admin.unlocked ? "Enter a new key to replace it" : "Admin key"
              }
              className="mt-4 w-full rounded-xl border border-line bg-white/0.03 px-4 py-2.5 text-sm outline-none placeholder:text-mute focus:border-brand/60"
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={!value.trim()}
                className="flex-1"
              >
                Unlock
              </Button>
              {admin.unlocked && (
                <Button
                  type="button"
                  onClick={() => {
                    admin.clear();
                    admin.setOpen(false);
                  }}
                >
                  Lock
                </Button>
              )}
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Layout({ route, children }) {
  const { connected } = useSocket();
  const { stats } = useStats();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 p-4 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="btn-primary grid size-10 place-items-center rounded-xl">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Fraud Monitor</p>
            <p className="text-xs text-mute">Real-time risk engine</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = route === id;
            return (
              <a
                key={id}
                href={`#/${id}`}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-white"
                    : "text-mute hover:bg-white/[0.04] hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-brand/20 ring-1 ring-brand/35"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className="relative size-[18px]" />
                <span className="relative">{label}</span>
                {id === "review" && (
                  <span className="relative ml-auto">
                    <Badge n={stats?.pendingReview} />
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-xs">
            <span
              className={cx(
                "relative size-2 rounded-full",
                connected ? "live-dot bg-ok" : "bg-warn",
              )}
            />
            <span className="text-mute">
              {connected ? "Live stream connected" : "Connecting to stream"}
            </span>
          </div>
          <AdminButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="btn-primary grid size-8 place-items-center rounded-lg">
              <ShieldCheck className="size-4 text-white" />
            </div>
            <span className="text-sm font-semibold">Fraud Monitor</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cx(
                "relative size-2 rounded-full",
                connected ? "live-dot bg-ok" : "bg-warn",
              )}
            />
            <AdminButton compact />
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={route}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.22 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-line bg-surface/90 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
      >
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = route === id;
          return (
            <a
              key={id}
              href={`#/${id}`}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium",
                active ? "text-white" : "text-mute",
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-pill"
                  className="absolute inset-0 rounded-xl bg-brand/20"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon className="relative size-5" />
              <span className="relative">{label}</span>
              {id === "review" && stats?.pendingReview > 0 && (
                <span className="absolute right-3 top-1 size-2 rounded-full bg-bad" />
              )}
            </a>
          );
        })}
      </nav>

      <AdminModal />
    </div>
  );
}
