// Email gate helpers: pull an address out of a free-text DM, and hand a captured
// address to an optional outbound webhook (Make, Zapier, n8n...).

export const DEFAULT_EMAIL_PROMPT =
  "Drop your best email below and I'll send it right over ⬇️";
export const DEFAULT_EMAIL_INVALID_MESSAGE =
  "That doesn't look like an email address. Can you send it again? Something like name@example.com";

// Deliberately permissive on the local part and strict on the domain: it has to
// accept real-world addresses and still reject "hello", "@home" or "a@b".
const EMAIL_PATTERN =
  /[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;

/**
 * Return the first email address found in a message, lowercased, or null.
 * People answer "my email is x@y.com" as often as a bare address, so the match
 * is searched for rather than required to span the whole message.
 */
export function extractEmail(text: string): string | null {
  if (!text) return null;
  const match = text.match(EMAIL_PATTERN);
  if (!match) return null;
  const email = match[0].toLowerCase();
  // RFC 5321 caps an address at 254 characters; anything longer is not one.
  return email.length <= 254 ? email : null;
}

export interface CapturedEmailPayload {
  email: string;
  username: string | null;
  instagramUserId: string;
  campaignId: string;
  campaignName: string;
  capturedAt: string;
}

/**
 * POST a captured address to EMAIL_CAPTURE_WEBHOOK_URL when it is configured.
 * Best-effort by design: the address is already stored in the database, and a
 * slow or failing receiver must never block or retry the link delivery.
 */
export async function notifyEmailCaptured(
  payload: CapturedEmailPayload
): Promise<void> {
  const url = process.env.EMAIL_CAPTURE_WEBHOOK_URL;
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.log(
        `[Email Capture] Webhook answered ${response.status} for campaign ${payload.campaignId}`
      );
    }
  } catch (error) {
    console.log(
      "[Email Capture] Webhook call failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
