import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "../config/env.js";

// Very simple sliding window counter per IP
const buckets = new Map(); // ip -> { windowStart, count }

export const rateLimit = (request, h) => {
  const ip = request.info.remoteAddress || "unknown";
  const now = Date.now();
  const state = buckets.get(ip) || { windowStart: now, count: 0 };
  if (now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    state.windowStart = now;
    state.count = 0;
  }
  state.count += 1;
  buckets.set(ip, state);

  if (state.count > RATE_LIMIT_MAX) {
    const err = new Error("Too Many Requests");
    err.output = { statusCode: 429 };
    throw err;
  }

  return h.continue;
};
