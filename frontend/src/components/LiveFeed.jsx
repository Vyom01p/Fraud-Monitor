import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, Radio } from "lucide-react";
import { useSocket } from "../context/SocketContext.jsx";
import { useDrawer } from "../context/DrawerContext.jsx";
import { money, ruleLabel, timeAgo } from "../lib/format.js";
import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  StatusPill,
  useTick,
} from "./ui.jsx";

export default function LiveFeed({ limit = 10 }) {
  const {
    transactions = [],
    connected = false,
    historyLoaded = false,
  } = useSocket() || {};
  const { open } = useDrawer();
  const [frozen, setFrozen] = useState(null);
  useTick(15000);

  const source = Array.isArray(frozen ?? transactions)
    ? (frozen ?? transactions)
    : [];
  const list = source.slice(0, limit);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Live activity</h2>
          <span className="flex items-center gap-2 text-xs text-mute">
            <span
              className={`relative size-2 rounded-full ${connected ? "live-dot bg-ok" : "bg-warn"}`}
            />
            {connected ? "Streaming" : "Connecting"}
          </span>
        </div>
        <Button
          icon={frozen ? Play : Pause}
          onClick={() => setFrozen(frozen ? null : transactions)}
          className="px-3 py-1.5 text-xs"
        >
          {frozen ? "Resume" : "Pause"}
        </Button>
      </div>

      {!historyLoaded && list.length === 0 ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="Waiting for transactions"
          hint="Run the simulator or use the Try it tab to send one."
        />
      ) : (
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false} mode="popLayout">
            {list.map((tx) => (
              <motion.li
                key={tx._id}
                layout
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                onClick={() => open(tx)}
                className="flash flex cursor-pointer items-center gap-4 px-5 py-3 hover:bg-white/[0.035]"
              >
                <StatusPill
                  status={tx.status}
                  className="w-24 shrink-0 justify-center"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm">{tx.userId}</p>
                  <p className="truncate text-xs text-mute">
                    {Array.isArray(tx.rulesTriggered) &&
                    tx.rulesTriggered.length
                      ? tx.rulesTriggered.map(ruleLabel).join(" · ")
                      : "No rules fired"}
                  </p>
                </div>
                <p className="font-mono text-sm tabular-nums">
                  {money(tx.amount)}
                </p>
                <p className="hidden w-10 text-right font-mono text-sm tabular-nums text-mute sm:block">
                  {tx.finalScore ?? 0}
                </p>
                <p className="hidden w-20 text-right text-xs text-mute md:block">
                  {timeAgo(tx.createdAt)}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
}
