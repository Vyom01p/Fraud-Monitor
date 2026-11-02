import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lock, PartyPopper, ShieldCheck, ShieldX } from "lucide-react";
import { api, errorMessage } from "../lib/api.js";
import { REVIEW_LABEL, money, ruleLabel, timeAgo } from "../lib/format.js";
import { useAdmin } from "../context/AdminContext.jsx";
import { useDrawer } from "../context/DrawerContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  PageHeader,
  Skeleton,
  StatusPill,
} from "../components/ui.jsx";

export default function ReviewQueue() {
  const admin = useAdmin();
  const toast = useToast();
  const { open } = useDrawer();
  const { ticks } = useSocket();
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(null);

  const load = useCallback(
    () =>
      api
        .get("/transactions", { params: { review: "pending", limit: 30 } })
        .then(({ data }) => {
          setItems(data.transactions);
          setTotal(data.total);
        }),
    [],
  );

  useEffect(() => {
    load().catch(() => setItems((cur) => cur ?? []));
  }, [load, ticks.alert]);

  async function decide(tx, decision) {
    if (!admin.unlocked) return admin.setOpen(true);
    setBusy(tx._id + decision);
    try {
      await api.patch(
        `/transactions/${tx._id}/review`,
        { decision },
        { headers: admin.headers },
      );
      setItems((list) => list.filter((t) => t._id !== tx._id));
      setTotal((n) => Math.max(0, n - 1));
      toast({
        title: REVIEW_LABEL[decision],
        description: `${tx.userId} · ${money(tx.amount)}`,
        tone: decision === "CONFIRMED_FRAUD" ? "bad" : "ok",
      });
    } catch (err) {
      toast({
        title:
          err.response?.status === 401 ? "Wrong admin key" : "Could not save",
        description: errorMessage(err),
        tone: "bad",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Review queue"
        subtitle={`${total.toLocaleString("en-US")} flagged transactions waiting for an analyst decision`}
      />

      {!admin.unlocked && (
        <Card className="mb-4 flex items-center justify-between gap-4 border-warn/30 p-4">
          <p className="flex items-center gap-2 text-sm text-warn">
            <Lock className="size-4" /> Unlock admin access to resolve cases.
          </p>
          <Button
            onClick={() => admin.setOpen(true)}
            className="px-3 py-1.5 text-xs"
          >
            Unlock
          </Button>
        </Card>
      )}

      {items === null ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={PartyPopper}
            title="Queue is empty"
            hint="Every flagged transaction has been reviewed."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((tx) => (
              <motion.article
                key={tx._id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="card flex flex-col p-5"
              >
                <div className="flex items-center justify-between">
                  <StatusPill status={tx.status} />
                  <span className="text-xs text-mute">
                    {timeAgo(tx.createdAt)}
                  </span>
                </div>
                <button onClick={() => open(tx)} className="mt-4 text-left">
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    {money(tx.amount)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-mute">
                    {tx.userId} · {tx.billingCountry || "—"}
                  </p>
                </button>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tx.rulesTriggered?.length ? (
                    tx.rulesTriggered.map((r) => (
                      <Chip key={r}>{ruleLabel(r)}</Chip>
                    ))
                  ) : (
                    <Chip>ML signal only</Chip>
                  )}
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-mute">Risk score</span>
                    <span className="font-mono">{tx.finalScore}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-warn to-bad"
                      style={{ width: `${tx.finalScore}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button
                    variant="danger"
                    icon={ShieldX}
                    loading={busy === tx._id + "CONFIRMED_FRAUD"}
                    onClick={() => decide(tx, "CONFIRMED_FRAUD")}
                    className="px-2 text-xs"
                  >
                    Confirm fraud
                  </Button>
                  <Button
                    variant="success"
                    icon={ShieldCheck}
                    loading={busy === tx._id + "FALSE_POSITIVE"}
                    onClick={() => decide(tx, "FALSE_POSITIVE")}
                    className="px-2 text-xs"
                  >
                    False positive
                  </Button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
