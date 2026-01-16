/**
 * Stripe Configuration
 * Server-side Stripe client (only import in server-side code)
 */

import Stripe from 'stripe';

// Lazy initialization to avoid throwing in client context
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
    if (!_stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not set');
        }
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            typescript: true,
        });
    }
    return _stripe;
}

// For backward compatibility
export const stripe = {
    get customers() { return getStripeServer().customers; },
    get checkout() { return getStripeServer().checkout; },
    get billingPortal() { return getStripeServer().billingPortal; },
    get subscriptions() { return getStripeServer().subscriptions; },
    get webhooks() { return getStripeServer().webhooks; },
};

/**
 * Price IDs for each plan (set these after creating products in Stripe Dashboard)
 */
export const STRIPE_PRICES = {
    starter: process.env.STRIPE_PRICE_STARTER || '',
    growth: process.env.STRIPE_PRICE_GROWTH || '',
    agency: process.env.STRIPE_PRICE_AGENCY || '',
} as const;
