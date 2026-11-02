import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { fmtUptime } from "../lib/format.js";
import { Card, Skeleton, cx } from "./ui.jsx";

function Row({ label, ok, detail }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="flex items-center gap-2.5">
        <span
          className={cx(
            "size-2 rounded-full",
            ok
              ? "bg-ok shadow-[0_0_8px_#34d399]"
              : "bg-bad shadow-[0_0_8px_#fb7185]",
          )}
        />
        {label}
      </span>
      <span className="font-mono text-xs text-mute">{detail}</span>
    </div>
  );
}

export default function SystemStatus() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await api.get("/system");
        if (active) {
          setData(res.data);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">System health</h2>
      {!data && !failed ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-5" /> <Skeleton className="h-5" />{" "}
          <Skeleton className="h-5" />
        </div>
      ) : (
        <div className="mt-1 divide-y divide-line">
          <Row
            label="API"
            ok={!failed}
            detail={
              failed ? "unreachable" : `up ${fmtUptime(data.api.uptimeSec)}`
            }
          />
          <Row
            label="Database"
            ok={Boolean(data?.db.ok)}
            detail={data?.db.ok ? "connected" : "down"}
          />
          <Row
            label="ML service"
            ok={Boolean(data?.ml.ok)}
            detail={data?.ml.ok ? `${data.ml.latencyMs} ms` : "unreachable"}
          />
        </div>
      )}
    </Card>
  );
}
