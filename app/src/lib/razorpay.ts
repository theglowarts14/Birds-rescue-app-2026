// Razorpay Checkout client wrapper. Loads the checkout SDK lazily on first
// use, then opens the modal for a given order. The server has already created
// the order + pending donation; we just hand the payload over.
//
// Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

import { supabase } from './supabase';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;        // paise
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
}
interface RazorpayInstance {
  open(): void;
  on(event: string, cb: (data: unknown) => void): void;
}

const SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.Razorpay) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { sdkPromise = null; reject(new Error('Failed to load Razorpay SDK')); };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export interface OrderInput {
  org_id: string;
  product_id?: string;
  case_id?: string;
  amount_inr?: number;
  donor: { name: string; email: string; phone_e164?: string; pan?: string; display_consent?: boolean };
}

export interface OrderResult {
  donation_id: string;
  payment_id: string;
  order_id: string;
  signature: string;
}

interface OrderPayload {
  key_id: string;
  order_id: string;
  donation_id: string;
  amount: number;
  currency: string;
  name: string;
  donor: { name: string; email: string; contact: string };
}

/**
 * Create the order via Edge Function and open Razorpay Checkout.
 * Resolves on payment success; rejects on user dismiss or network error.
 */
export async function donateViaRazorpay(input: OrderInput, opts?: { brandColor?: string; description?: string }): Promise<OrderResult> {
  // 1. Create the order server-side.
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`;
  const session = (await supabase.auth.getSession()).data.session;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${session?.access_token ?? anonKey}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
    throw new Error(body.error ?? `Order create failed (${res.status})`);
  }
  const payload = await res.json() as OrderPayload;

  // 2. Load Razorpay SDK + open Checkout.
  await loadSdk();
  if (!window.Razorpay) throw new Error('Razorpay SDK unavailable');

  return new Promise<OrderResult>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: payload.key_id,
      amount: payload.amount,
      currency: payload.currency,
      name: payload.name,
      description: opts?.description ?? 'Karuna',
      order_id: payload.order_id,
      prefill: payload.donor,
      theme: { color: opts?.brandColor ?? '#c44a1a' },
      modal: { ondismiss: () => reject(new Error('CHECKOUT_DISMISSED')) },
      handler: (r) => resolve({
        donation_id: payload.donation_id,
        payment_id: r.razorpay_payment_id,
        order_id: r.razorpay_order_id,
        signature: r.razorpay_signature,
      }),
    });
    rzp.on('payment.failed', (err) => reject(new Error((err as { error?: { description?: string } }).error?.description ?? 'Payment failed')));
    rzp.open();
  });
}
