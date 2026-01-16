// Client-safe exports (PLANS can be used in pricing page)
export { PLANS } from './plans';
export type { PlanId } from './plans';
export { redirectToCheckout, redirectToPortal } from './client';

// Server-only exports (use direct import for these)
// import { stripe, STRIPE_PRICES } from '@/lib/stripe/config'
