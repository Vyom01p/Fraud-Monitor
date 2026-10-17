import crypto from "node:crypto";

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function requireKey(headerName, expected) {
  return (req, res, next) => {
    if (!expected) return next();
    const provided = req.get(headerName);
    if (!provided || !safeEqual(provided, expected)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };
}
