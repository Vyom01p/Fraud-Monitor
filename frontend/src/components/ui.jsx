import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Loader2 } from "lucide-react";
import { STATUS } from "../lib/format.js";

export const cx = (...a) => a.filter(Boolean).join(" ");

export function useTick(ms = 15000) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function Card({ className = "", children, ...props }) {
  return (
    <div className={cx("card", className)} {...props}>
      {children}
    </div>
  );
}

export function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StatusPill({ status, className = "" }) {
  const s = STATUS[status] ?? STATUS.APPROVED;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        s.text,
        s.bg,
        s.ring,
        className,
      )}
    >
      <span className={cx("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function Chip({ children, className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md border border-line bg-white/0.04 px-2 py-0.5 text-[11px] text-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}

const VARIANTS = {
  primary: "btn-primary text-white hover:brightness-110",
  ghost: "border border-line bg-white/[0.03] text-ink hover:bg-white/[0.07]",
  danger: "bg-bad/15 text-bad ring-1 ring-bad/30 hover:bg-bad/25",
  success: "bg-ok/15 text-ok ring-1 ring-ok/30 hover:bg-ok/25",
};

export function Button({
  variant = "ghost",
  loading,
  icon: Icon,
  children,
  className = "",
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      {...props}
      disabled={loading || props.disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        Icon && <Icon className="size-4" />
      )}
      {children}
    </motion.button>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={cx("shimmer rounded-lg", className)} />;
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-line bg-white/0.03 text-mute">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-xs text-mute">{hint}</p>}
    </div>
  );
}

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, format);
  useEffect(() => {
    const controls = animate(mv, value ?? 0, {
      duration: 0.9,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

export function Segmented({ options, value, onChange, id }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-white/0.03 p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "text-white" : "text-mute hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-brand/25 ring-1 ring-brand/40"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        checked ? "bg-brand" : "bg-white/15",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
        className={cx(
          "absolute top-1 size-4 rounded-full bg-white shadow",
          checked ? "right-1" : "left-1",
        )}
      />
    </button>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
