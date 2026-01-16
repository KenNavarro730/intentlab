'use client';

/**
 * Stripe Client-Side Utilities
 * Uses URL redirect approach (compatible with Stripe SDK v20+)
 */

/**
 * Redirect to Stripe Checkout via session URL
 */
export async function redirectToCheckout(priceId: string) {
    const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
    });

    const { url, error } = await response.json();

    if (error) {
        throw new Error(error);
    }

    // Redirect to Stripe Checkout URL
    window.location.href = url;
}

/**
 * Redirect to Stripe Customer Portal
 */
export async function redirectToPortal() {
    const response = await fetch('/api/stripe/portal', {
        method: 'POST',
    });

    const { url, error } = await response.json();

    if (error) {
        throw new Error(error);
    }

    window.location.href = url;
}
