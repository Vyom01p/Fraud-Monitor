import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config.js";

const RULES = [
  {
    key: "velocity",
    name: "VELOCITY_SPIKE",
    label: "Velocity spike",
    help: "Too many transactions from one user in a short window",
  },
  {
    key: "amountAnomaly",
    name: "AMOUNT_ANOMALY",
    label: "Amount anomaly",
    help: "Amount far above the user's 30-day average",
  },
  {
    key: "geoFence",
    name: "BLOCKED_COUNTRY",
    label: "Blocked country",
    help: "Billing country is on the blocklist",
  },
  {
    key: "cardTesting",
    name: "CARD_TESTING_PATTERN",
    label: "Card testing",
    help: "Several tiny charges in a row",
  },
];

const box = {
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "14px 16px",
  marginBottom: "14px",
};
const input = {
  background: "#111",
  color: "inherit",
  border: "1px solid #333",
  borderRadius: "6px",
  padding: "6px 8px",
  width: "110px",
};

function Field({ label, children }) {
  return (
    <label
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "0.9em" }}>{label}</span>
      {children}
    </label>
  );
}

export default function RuleManager() {
  const [form, setForm] = useState(null);
  const [countries, setCountries] = useState("");
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem("adminKey") || "",
  );
  const [status, setStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/v1/rules`)
      .then(({ data }) => {
        setForm(data.rules);
        setCountries((data.rules.blockedCountries || []).join(", "));
      })
      .catch((err) =>
        setStatus({
          type: "error",
          text: `Could not load rules: ${err.message}`,
        }),
      );
  }, []);

  if (!form)
    return (
      <p style={{ padding: "1rem" }}>{status.text || "Loading rules..."}</p>
    );

  const setNum = (key, value) =>
    setForm({ ...form, [key]: value === "" ? "" : Number(value) });
  const toggleEnabled = (key) =>
    setForm({
      ...form,
      enabled: { ...form.enabled, [key]: !form.enabled[key] },
    });
  const toggleHard = (name) => {
    const list = form.hardBlockRules || [];
    setForm({
      ...form,
      hardBlockRules: list.includes(name)
        ? list.filter((n) => n !== name)
        : [...list, name],
    });
  };

  async function save() {
    setSaving(true);
    setStatus({ type: "", text: "" });
    sessionStorage.setItem("adminKey", adminKey);

    const payload = {
      velocityMaxTxPerWindow: form.velocityMaxTxPerWindow,
      velocityWindowSeconds: form.velocityWindowSeconds,
      amountAnomalyMultiplier: form.amountAnomalyMultiplier,
      cardTestingSmallAmountMax: form.cardTestingSmallAmountMax,
      cardTestingCountThreshold: form.cardTestingCountThreshold,
      reviewThreshold: form.reviewThreshold,
      blockThreshold: form.blockThreshold,
      mlBlockThreshold: form.mlBlockThreshold,
      blockedCountries: countries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
      hardBlockRules: form.hardBlockRules,
      enabled: form.enabled,
    };

    try {
      const { data } = await axios.put(`${API_URL}/api/v1/rules`, payload, {
        headers: adminKey ? { "x-admin-key": adminKey } : {},
      });
      setForm(data.rules);
      setCountries((data.rules.blockedCountries || []).join(", "));
      setStatus({
        type: "ok",
        text: "Saved. New rules apply to the next transaction.",
      });
    } catch (err) {
      const res = err.response;
      if (res?.status === 401)
        setStatus({ type: "error", text: "Wrong or missing admin key." });
      else if (res?.data?.details)
        setStatus({
          type: "error",
          text: res.data.details
            .map((d) => `${d.field}: ${d.message}`)
            .join(" | "),
        });
      else setStatus({ type: "error", text: res?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: "760px" }}
    >
      <h2>Rule Management</h2>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Rules</h3>
        {RULES.map((r) => (
          <div
            key={r.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 0",
              borderBottom: "1px solid #222",
            }}
          >
            <div>
              <strong style={{ fontSize: "0.92em" }}>{r.label}</strong>
              <div style={{ fontSize: "0.8em", opacity: 0.65 }}>{r.help}</div>
            </div>
            <div style={{ display: "flex", gap: "18px", fontSize: "0.85em" }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!form.enabled[r.key]}
                  onChange={() => toggleEnabled(r.key)}
                />{" "}
                Enabled
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={(form.hardBlockRules || []).includes(r.name)}
                  onChange={() => toggleHard(r.name)}
                />{" "}
                Hard block
              </label>
            </div>
          </div>
        ))}
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Thresholds</h3>
        <Field label="Velocity: max transactions per window">
          <input
            style={input}
            type="number"
            value={form.velocityMaxTxPerWindow}
            onChange={(e) => setNum("velocityMaxTxPerWindow", e.target.value)}
          />
        </Field>
        <Field label="Velocity: window (seconds)">
          <input
            style={input}
            type="number"
            value={form.velocityWindowSeconds}
            onChange={(e) => setNum("velocityWindowSeconds", e.target.value)}
          />
        </Field>
        <Field label="Amount anomaly: multiple of 30-day average">
          <input
            style={input}
            type="number"
            step="0.5"
            value={form.amountAnomalyMultiplier}
            onChange={(e) => setNum("amountAnomalyMultiplier", e.target.value)}
          />
        </Field>
        <Field label="Card testing: max 'small' amount ($)">
          <input
            style={input}
            type="number"
            step="0.5"
            value={form.cardTestingSmallAmountMax}
            onChange={(e) =>
              setNum("cardTestingSmallAmountMax", e.target.value)
            }
          />
        </Field>
        <Field label="Card testing: small charges to trigger">
          <input
            style={input}
            type="number"
            value={form.cardTestingCountThreshold}
            onChange={(e) =>
              setNum("cardTestingCountThreshold", e.target.value)
            }
          />
        </Field>
        <Field label="Blocked countries (ISO codes, comma separated)">
          <input
            style={{ ...input, width: "200px" }}
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
          />
        </Field>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Decision thresholds</h3>
        <Field label="Review at score >=">
          <input
            style={input}
            type="number"
            value={form.reviewThreshold}
            onChange={(e) => setNum("reviewThreshold", e.target.value)}
          />
        </Field>
        <Field label="Block at score >=">
          <input
            style={input}
            type="number"
            value={form.blockThreshold}
            onChange={(e) => setNum("blockThreshold", e.target.value)}
          />
        </Field>
        <Field label="Auto-block when ML probability >=">
          <input
            style={input}
            type="number"
            step="0.01"
            value={form.mlBlockThreshold}
            onChange={(e) => setNum("mlBlockThreshold", e.target.value)}
          />
        </Field>
      </div>

      <div style={box}>
        <Field label="Admin key">
          <input
            style={{ ...input, width: "200px" }}
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="only if the server sets one"
          />
        </Field>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 20px",
          cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : "Save rules"}
      </button>
      {status.text && (
        <p
          style={{
            color: status.type === "ok" ? "#16a34a" : "#dc2626",
            fontSize: "0.9em",
          }}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
