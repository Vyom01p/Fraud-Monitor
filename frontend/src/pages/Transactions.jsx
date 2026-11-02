import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Search,
} from "lucide-react";
import { api, errorMessage } from "../lib/api.js";
import {
  REVIEW_LABEL,
  STATUS,
  money,
  ruleLabel,
  timeAgo,
} from "../lib/format.js";
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
  Segmented,
  Skeleton,
  StatusPill,
  Switch,
  useDebounced,
  useTick,
} from "../components/ui.jsx";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "REVIEW", label: "Review" },
  { value: "BLOCKED", label: "Blocked" },
];

const REVIEW_OPTIONS = [
  { value: "", label: "Any" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
];

const PAGE_SIZE = 15;

function ScoreBar({ score, status }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(score, 100)}%`,
            background: STATUS[status].hex,
          }}
        />
      </div>
      <span className="w-7 font-mono text-xs tabular-nums">{score}</span>
    </div>
  );
}

export default function Transactions() {
  const admin = useAdmin();
  const toast = useToast();
  const { open } = useDrawer();
  const { ticks } = useSocket();
  useTick(20000);

  const [filters, setFilters] = useState({ q: "", status: "", review: "" });
  const [page, setPage] = useState(1);
  const [live, setLive] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const dq = useDebounced(filters.q, 300);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(dq && { q: dq }),
      ...(filters.status && { status: filters.status }),
      ...(filters.review && { review: filters.review }),
    }),
    [page, dq, filters.status, filters.review],
  );

  const fetchData = useCallback(
    (signal) =>
      api
        .get("/transactions", { params, signal })
        .then(({ data }) => setData(data)),
    [params],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError("");
    fetchData(ctrl.signal)
      .catch((err) => !axios.isCancel(err) && setError(errorMessage(err)))
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [fetchData]);

  useEffect(() => {
    if (!live || page !== 1) return;
    const id = setTimeout(() => fetchData().catch(() => {}), 800);
    return () => clearTimeout(id);
  }, [ticks.tx, ticks.alert, live, page, fetchData]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  async function exportCsv() {
    if (!admin.unlocked) return admin.setOpen(true);
    setExporting(true);
    try {
      const { page: _p, limit: _l, ...filterParams } = params;
      const res = await api.get("/transactions/export", {
        params: filterParams,
        headers: admin.headers,
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export ready",
        description: "Up to 5,000 matching rows",
        tone: "ok",
      });
    } catch (err) {
      toast({
        title:
          err.response?.status === 401 ? "Wrong admin key" : "Export failed",
        description:
          err.response?.status === 401
            ? "Unlock admin access with the correct key."
            : err.message,
        tone: "bad",
      });
    } finally {
      setExporting(false);
    }
  }

  const rows = data?.transactions ?? [];

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={
          data
            ? `${data.total.toLocaleString("en-US")} matching transactions`
            : "Search and filter every decision"
        }
        actions={
          <>
            <label className="flex items-center gap-2 text-xs text-mute">
              Auto-refresh{" "}
              <Switch checked={live} onChange={setLive} label="Auto-refresh" />
            </label>
            <Button icon={Download} loading={exporting} onClick={exportCsv}>
              Export CSV
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input
            value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
            placeholder="Search by user id"
            aria-label="Search by user id"
            className="w-full rounded-xl border border-line bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-mute focus:border-brand/60"
          />
        </div>
        <Segmented
          id="status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
        />
        <Segmented
          id="review"
          options={REVIEW_OPTIONS}
          value={filters.review}
          onChange={(v) => setFilter("review", v)}
        />
      </div>

      <Card className="overflow-hidden">
        {error && (
          <p className="border-b border-line bg-bad/10 px-5 py-3 text-sm text-bad">
            {error}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
                {[
                  "Time",
                  "User",
                  "Amount",
                  "Country",
                  "Score",
                  "Status",
                  "Rules",
                  "Review",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && !data
                ? Array.from({ length: 8 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-5 py-2.5">
                        <Skeleton className="h-8" />
                      </td>
                    </tr>
                  ))
                : rows.map((tx) => (
                    <tr
                      key={tx._id}
                      onClick={() => open(tx)}
                      className="cursor-pointer transition-colors hover:bg-white/[0.035]"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-mute">
                        {timeAgo(tx.createdAt)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {tx.userId}
                      </td>
                      <td className="px-5 py-3 font-mono tabular-nums">
                        {money(tx.amount)}
                      </td>
                      <td className="px-5 py-3 text-xs text-mute">
                        {tx.billingCountry || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <ScoreBar score={tx.finalScore} status={tx.status} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={tx.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tx.rulesTriggered?.length ? (
                            tx.rulesTriggered.map((r) => (
                              <Chip key={r}>{ruleLabel(r)}</Chip>
                            ))
                          ) : (
                            <span className="text-xs text-mute">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {tx.review?.decision ? (
                          <span
                            className={
                              tx.review.decision === "CONFIRMED_FRAUD"
                                ? "text-bad"
                                : "text-ok"
                            }
                          >
                            {REVIEW_LABEL[tx.review.decision]}
                          </span>
                        ) : (
                          <span className="text-mute">
                            {tx.status === "APPROVED" ? "—" : "Pending"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="No transactions match"
            hint="Try clearing a filter or searching a different user id."
          />
        )}

        {data && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-mute">
            <span>
              Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <Button
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs"
              >
                Prev
              </Button>
              <Button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs"
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
