// HMAC-SHA256 verification for Razorpay webhooks and Checkout responses.
// Reference: https://razorpay.com/docs/webhooks/validate-test/

import { crypto } from 'jsr:@std/crypto';
import { encodeHex } from 'jsr:@std/encoding/hex';

const enc = new TextEncoder();

export async function verifyRazorpayWebhook(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const expected = encodeHex(new Uint8Array(sig));
  return constantTimeEqual(expected, signature);
}

// Razorpay Checkout returns three values to the browser: order_id, payment_id, signature.
// We verify on the server when the client posts them to us before marking paid.
export async function verifyCheckoutSignature(
  orderId: string, paymentId: string, signature: string, secret: string,
): Promise<boolean> {
  const payload = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return constantTimeEqual(encodeHex(new Uint8Array(sig)), signature);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
