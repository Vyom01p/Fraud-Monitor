import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const h = vi.hoisted(() => {
  const tx = {
    _id: "507f1f77bcf86cd799439011",
    userId: "user_42",
    amount: 129.5,
    billingCountry: "US",
    ip: "1.2.3.4",
    cardToken: "tok_1",
    status: "REVIEW",
    finalScore: 46,
    mlRiskScore: 0.15,
    isAnomaly: false,
    mlAvailable: true,
    rulesTriggered: ["VELOCITY_SPIKE", "CARD_TESTING_PATTERN"],
    decisionReason: "Score threshold",
    source: "api",
    createdAt: new Date().toISOString(),
  };
  const stats = {
    range: "30m",
    total: 864,
    volume: 352559,
    avgScore: 21.4,
    approved: 392,
    review: 472,
    blocked: 0,
    blockedRate: 0,
    flaggedRate: 54.6,
    confirmedFraud: 3,
    falsePositive: 1,
    pendingReview: 12,
    series: [{ time: new Date().toISOString(), total: 24, flagged: 5 }],
    ruleCounts: [{ rule: "VELOCITY_SPIKE", count: 9 }],
    scoreBuckets: [
      { from: 0, count: 30 },
      { from: 40, count: 12 },
    ],
  };
  const rules = {
    velocityMaxTxPerWindow: 3,
    velocityWindowSeconds: 60,
    amountAnomalyMultiplier: 3,
    cardTestingSmallAmountMax: 2,
    cardTestingCountThreshold: 3,
    reviewThreshold: 31,
    blockThreshold: 71,
    mlBlockThreshold: 0.95,
    blockedCountries: ["XX"],
    hardBlockRules: ["BLOCKED_COUNTRY"],
    enabled: {
      velocity: true,
      amountAnomaly: true,
      geoFence: true,
      cardTesting: true,
    },
  };
  const system = {
    api: { ok: true, uptimeSec: 120 },
    db: { ok: true },
    ml: { ok: true, latencyMs: 42 },
  };
  return { tx, stats, rules, system };
});

vi.mock("./lib/api.js", () => ({
  errorMessage: (e) => e.message,
  api: {
    get: vi.fn(async (url) => {
      if (url.includes("/stats")) return { data: h.stats };
      if (url === "/system") return { data: h.system };
      if (url === "/rules") return { data: { rules: h.rules } };
      if (url === "/transactions")
        return { data: { transactions: [h.tx], total: 1, page: 1, pages: 1 } };
      throw new Error(`unmocked GET ${url}`);
    }),
    post: vi.fn(async () => ({ data: { transactions: [h.tx] } })),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, disconnect() {} }),
}));

import App from "./App.jsx";

const go = async (route) => {
  await act(async () => {
    window.location.hash = `#/${route}`;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
};
const wait = { timeout: 4000 };

describe("dashboard smoke test", () => {
  beforeEach(() => {
    window.location.hash = "";
    sessionStorage.clear();
  });

  it("renders the overview with stats and live activity", async () => {
    render(<App />);
    expect(await screen.findByText("Volume screened", {}, wait)).toBeTruthy();
    expect(await screen.findByText("Live activity", {}, wait)).toBeTruthy();
    expect(await screen.findByText("Detection quality", {}, wait)).toBeTruthy();
    expect(
      (await screen.findAllByText("user_42", {}, wait)).length,
    ).toBeGreaterThan(0);
  });

  it("opens the risk drawer from a row", async () => {
    render(<App />);
    const rows = await screen.findAllByText("user_42", {}, wait);
    fireEvent.click(rows[0]);
    expect(
      await screen.findByText("Transaction details", {}, wait),
    ).toBeTruthy();
    expect(await screen.findByText("Score composition", {}, wait)).toBeTruthy();
  });

  it("navigates to every page", async () => {
    render(<App />);
    await screen.findByText("Volume screened", {}, wait);

    await go("transactions");
    expect(
      await screen.findByText("1 matching transactions", {}, wait),
    ).toBeTruthy();

    await go("review");
    expect(await screen.findByText("Confirm fraud", {}, wait)).toBeTruthy();

    await go("try");
    expect(
      await screen.findByText("Known fraud pattern", {}, wait),
    ).toBeTruthy();

    await go("rules");
    expect(
      await screen.findByText("Decision thresholds", {}, wait),
    ).toBeTruthy();
  });

  it("shows the unsaved-changes bar after editing a rule", async () => {
    render(<App />);
    await go("rules");
    const input = (await screen.findAllByRole("spinbutton", {}, wait))[0];
    fireEvent.change(input, { target: { value: "9" } });
    expect(
      await screen.findByText("You have unsaved changes", {}, wait),
    ).toBeTruthy();
  });

  it("falls back to the overview for an unknown route", async () => {
    render(<App />);
    await go("does-not-exist");
    expect(await screen.findByText("Volume screened", {}, wait)).toBeTruthy();
  });
});
