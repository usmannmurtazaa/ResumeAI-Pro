// ─────────────────────────────────────────────────────────────────────────────
// Maniesta CareerOS — Client-side AI Service (C-04)
//
// Thin client wrapper around the server-side Gemini proxy at
// `/.netlify/functions/ai`. Its responsibilities:
//
//   1. Obtain a fresh Firebase ID token from `authService`.
//   2. POST `{ task, input }` to the Netlify Function.
//   3. Normalize the response to a single shape that callers can branch
//      on without inspecting HTTP statuses:
//         { success: true,  text: "<model output>" }
//         { success: false, error: "<human-readable message>", code: "<code>" }
//   4. Enforce a client-side timeout so a hung request cannot leave the
//      UI in a permanent loading state.
//   5. Track in-flight requests by `requestKey` and abort the previous
//      request for the same key when a new one starts. This is the
//      mechanism that prevents a slow first request from overwriting the
//      result of a faster second request.
//   6. Provide `cancel(requestKey)` and `cancelAll()` so components can
//      abort outstanding requests on unmount.
//
// Design notes:
//
//   • The service NEVER throws. Every path returns a normalized object.
//     This is deliberate: the three call sites (PersonalInfo,
//     Experience, Projects) all need to decide between "show the AI
//     result" and "run the local fallback generator", and a
//     non-throwing contract makes that decision a simple `if`. A
//     thrown error would force every caller to wrap each call in
//     `try/catch` and would make the fallback path easy to forget.
//
//   • The service has NO knowledge of resume content beyond forwarding
//     the caller's `input` object. All prompt construction and all
//     validation happen server-side.
//
//   • The client cannot supply a model name, system prompt, temperature,
//     or any other model parameter. Only `task` and `input` cross the
//     network boundary, and the server ignores any extra fields.
//
//   • No API key, no secret, no configuration is present in this file.
//
// Error codes returned in `code`:
//   'auth'            — the caller is not signed in, or the token was
//                       rejected by the server. The UI should prompt for
//                       sign-in again.
//   'rate_limit'      — the caller hit the application daily AI limit.
//                       The UI should show a "come back tomorrow" message
//                       and, for free users, a link to Pricing.
//   'invalid_request' — the task or input failed server-side validation.
//                       This should not happen for a well-behaved caller;
//                       the UI should fall back without retrying.
//   'timeout'         — the request exceeded the client-side timeout, or
//                       the server returned 504. The UI should offer a
//                       retry.
//   'upstream'        — Gemini returned an error, an empty response, or
//                       a finish reason other than STOP. The UI should
//                       fall back to the local generator.
//   'network'         — the request failed before reaching the server
//                       (offline, DNS failure, CORS, etc.). The UI
//                       should fall back.
//   'aborted'         — the request was cancelled via `cancel()` or
//                       `cancelAll()`, or superseded by a newer request
//                       for the same key. The UI should IGNORE this
//                       result — it is not a user-visible error.
//   'superseded'      — a newer request for the same key replaced this
//                       one. Same handling as 'aborted'.
//   'unknown'         — defensive fallback for an unrecognised error.
// ─────────────────────────────────────────────────────────────────────────────

import { authService } from './authService';

// ── Constants ───────────────────────────────────────────────────────────────

// Serverless endpoint. Same-origin, so no CORS configuration is needed
// and the Firebase ID token is sent as a normal `Authorization` header.
const AI_ENDPOINT = '/.netlify/functions/ai';

// Client-side timeout. The server has a 20-second upstream timeout; this
// is deliberately 5 seconds longer so that a slow-but-successful server
// response is not discarded by an over-eager client. The client timeout
// only fires when the network path itself is stuck.
const DEFAULT_CLIENT_TIMEOUT_MS = 25000;

// The task identifiers accepted by the server. Kept here so that callers
// have a single source of truth and typos are caught by editors. The
// server independently validates the task name; this list is a
// convenience, not a security boundary.
export const AI_TASKS = Object.freeze({
  IMPROVE_SUMMARY: 'improve_summary',
  GENERATE_SUMMARY: 'generate_summary',
  IMPROVE_EXPERIENCE: 'improve_experience',
  GENERATE_EXPERIENCE: 'generate_experience',
  IMPROVE_PROJECT: 'improve_project',
  GENERATE_PROJECT: 'generate_project',
  GENERATE_SKILLS: 'generate_skills',
  IMPROVE_BULLET: 'improve_bullet',
});

// ── In-flight request registry ──────────────────────────────────────────────
//
// Maps `requestKey -> { controller, promise, meta }`. A `requestKey` is
// any string the caller wants to use to identify a logical AI slot. Two
// callers using the same key are considered to be operating on the same
// UI surface (e.g. the same summary field), and only the newest request
// for that key is allowed to complete.
//
// If a caller does not supply a key, the task name is used as the
// default key. This means that two calls to `improveSummary` from
// different UI surfaces would collide — so callers that need
// independence should pass a unique `requestKey`.
//
// The `meta` object carries flags used to distinguish the cause of an
// `AbortError`:
//   • `meta.timedOut`    — the client-side timeout fired.
//   • `meta.cancelled`   — the caller invoked `cancel()` or `cancelAll()`.
//   • `meta.superseded`  — a newer request for the same key started.
// Checking these on catch is more reliable than inspecting
// `error.name`, because a caller-triggered abort and a timeout both
// surface as `AbortError` on the fetch promise.
const inFlight = new Map();

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Maps an HTTP status code from the serverless function to a
 * client-facing error code. The server's response body carries a
 * user-safe `error` string; this function only decides how the UI should
 * categorise the failure.
 */
const statusToErrorCode = (status) => {
  if (status === 400) return 'invalid_request';
  if (status === 401) return 'auth';
  if (status === 405) return 'invalid_request';
  if (status === 429) return 'rate_limit';
  if (status === 504) return 'timeout';
  if (status >= 500) return 'upstream';
  return 'unknown';
};

/**
 * Builds the default error message for a client-side failure that never
 * reached the server (network error, DNS failure, offline).
 */
const networkErrorMessage = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'You appear to be offline.';
    }
  } catch {
    // navigator unavailable — fall through
  }
  return 'Could not reach the AI service.';
};

/**
 * Returns true if the caller's `input` is a plain object. Arrays, null,
 * primitives, and functions are rejected early to avoid a pointless
 * network round-trip that the server would reject anyway.
 */
const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// ── Public API ──────────────────────────────────────────────────────────────

export const aiService = {
  /**
   * Sends a task and an input object to the AI endpoint.
   *
   * @param {string} task  — one of the values in `AI_TASKS`.
   * @param {object} input — task-specific payload. Plain object only.
   * @param {object} [options]
   * @param {string} [options.requestKey] — a caller-supplied key used to
   *   deduplicate and supersede in-flight requests for the same logical
   *   UI slot. Defaults to the task name.
   * @param {number} [options.timeoutMs] — client-side timeout override.
   *
   * @returns {Promise<{success: true, text: string} | {success: false,
   *   error: string, code: string}>}
   */
  async generate(task, input, options = {}) {
    // ── Local validation (fail fast, save a round-trip) ─────────────────
    if (typeof task !== 'string' || !task) {
      return { success: false, error: 'Invalid task.', code: 'invalid_request' };
    }
    if (!isPlainObject(input)) {
      return { success: false, error: 'Invalid input.', code: 'invalid_request' };
    }

    const requestKey =
      typeof options.requestKey === 'string' && options.requestKey ? options.requestKey : task;
    const timeoutMs =
      Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
        ? options.timeoutMs
        : DEFAULT_CLIENT_TIMEOUT_MS;

    // ── Supersede any in-flight request for the same key ────────────────
    const existing = inFlight.get(requestKey);
    if (existing) {
      existing.meta.superseded = true;
      try {
        existing.controller.abort();
      } catch {
        // Abort is best-effort. If the underlying fetch has already
        // settled, the abort is a no-op.
      }
    }

    // ── Set up this request's controller and metadata ───────────────────
    const controller = new AbortController();
    const meta = { timedOut: false, cancelled: false, superseded: false };

    let timeoutId = null;
    const armTimeout = () => {
      timeoutId = setTimeout(() => {
        meta.timedOut = true;
        try {
          controller.abort();
        } catch {
          // Ignore — the fetch will handle the abort signal path.
        }
      }, timeoutMs);
    };

    const promise = (async () => {
      try {
        // ── Obtain a fresh Firebase ID token ───────────────────────────
        // `getIdToken(true)` forces a refresh, matching the pattern used
        // by the other Netlify Function call sites in this project. The
        // extra latency is offset by guaranteeing the server will not
        // reject a token that expired mid-flight.
        const token = await authService.getIdToken(true);
        if (!token) {
          return {
            success: false,
            error: 'Please sign in to use AI suggestions.',
            code: 'auth',
          };
        }

        armTimeout();

        // ── Send the request ───────────────────────────────────────────
        let response;
        try {
          response = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ task, input }),
            signal: controller.signal,
          });
        } catch (error) {
          // Distinguish the three causes of an aborted fetch.
          if (meta.superseded) {
            return {
              success: false,
              error: 'Superseded by a newer request.',
              code: 'superseded',
            };
          }
          if (meta.cancelled) {
            return {
              success: false,
              error: 'Request cancelled.',
              code: 'aborted',
            };
          }
          if (meta.timedOut) {
            return {
              success: false,
              error: 'The AI request took too long. Please try again.',
              code: 'timeout',
            };
          }
          if (error && error.name === 'AbortError') {
            // Defensive: an abort we did not initiate.
            return {
              success: false,
              error: 'Request cancelled.',
              code: 'aborted',
            };
          }
          return {
            success: false,
            error: networkErrorMessage(),
            code: 'network',
          };
        }

        // ── Parse the response body ────────────────────────────────────
        let data = null;
        try {
          data = await response.json();
        } catch {
          // Non-JSON response. Fall through; the status check below will
          // decide whether to return a generic error.
        }

        if (!response.ok) {
          const message =
            data && typeof data.error === 'string' && data.error
              ? data.error
              : 'The AI service is temporarily unavailable.';
          return {
            success: false,
            error: message,
            code: statusToErrorCode(response.status),
          };
        }

        if (!data || data.success !== true || typeof data.text !== 'string') {
          return {
            success: false,
            error: 'The AI service returned an unexpected response.',
            code: 'upstream',
          };
        }

        return { success: true, text: data.text };
      } catch (error) {
        // Any unexpected error before or during the fetch. None of the
        // paths above should reach here, but if one does, return a
        // safe generic result rather than letting the promise reject.
        if (meta.superseded) {
          return {
            success: false,
            error: 'Superseded by a newer request.',
            code: 'superseded',
          };
        }
        if (meta.cancelled) {
          return { success: false, error: 'Request cancelled.', code: 'aborted' };
        }
        if (meta.timedOut) {
          return {
            success: false,
            error: 'The AI request took too long. Please try again.',
            code: 'timeout',
          };
        }
        return {
          success: false,
          error: networkErrorMessage(),
          code: 'network',
        };
      } finally {
        if (timeoutId !== null) clearTimeout(timeoutId);
        // Only remove the entry if this request is still the current one
        // for this key. If a newer request has already taken its place,
        // leave that newer entry alone.
        const current = inFlight.get(requestKey);
        if (current && current.controller === controller) {
          inFlight.delete(requestKey);
        }
      }
    })();

    inFlight.set(requestKey, { controller, promise, meta });
    return promise;
  },

  /**
   * Cancels the in-flight request for the given key, if any. The
   * cancelled request resolves with `code: 'aborted'`.
   */
  cancel(requestKey) {
    const entry = inFlight.get(requestKey);
    if (!entry) return;
    entry.meta.cancelled = true;
    try {
      entry.controller.abort();
    } catch {
      // Ignore — the fetch may already have settled.
    }
  },

  /**
   * Cancels every in-flight request. Intended for use on component
   * unmount when the caller wants to be certain that no late response
   * arrives after the UI has gone away.
   */
  cancelAll() {
    for (const [, entry] of inFlight) {
      entry.meta.cancelled = true;
      try {
        entry.controller.abort();
      } catch {
        // Ignore.
      }
    }
  },

  // ── Task-specific convenience methods ─────────────────────────────────
  //
  // These are thin wrappers around `generate`. They exist so that the
  // call sites read naturally and so that the task names are declared in
  // exactly one place. Each forwards all `options`.
  //
  // The wrappers reference `aiService.generate` rather than `this.generate`
  // so that the methods continue to work when destructured —
  // `const { improveSummary } = aiService;` must not lose the receiver.

  improveSummary(input, options) {
    return aiService.generate(AI_TASKS.IMPROVE_SUMMARY, input, options);
  },

  generateSummary(input, options) {
    return aiService.generate(AI_TASKS.GENERATE_SUMMARY, input, options);
  },

  improveExperience(input, options) {
    return aiService.generate(AI_TASKS.IMPROVE_EXPERIENCE, input, options);
  },

  generateExperience(input, options) {
    return aiService.generate(AI_TASKS.GENERATE_EXPERIENCE, input, options);
  },

  improveProject(input, options) {
    return aiService.generate(AI_TASKS.IMPROVE_PROJECT, input, options);
  },

  generateProject(input, options) {
    return aiService.generate(AI_TASKS.GENERATE_PROJECT, input, options);
  },

  generateSkills(input, options) {
    return aiService.generate(AI_TASKS.GENERATE_SKILLS, input, options);
  },

  improveBullet(input, options) {
    return aiService.generate(AI_TASKS.IMPROVE_BULLET, input, options);
  },
};

export default aiService;
