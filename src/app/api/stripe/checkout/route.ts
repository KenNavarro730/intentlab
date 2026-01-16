/**
 * Stripe Checkout Session API
 * Creates a checkout session for subscription upgrades
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const { priceId } = await request.json();

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
        }

        // Get current user
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create Stripe customer
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId: string | undefined = (subscription as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? undefined;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            });
            customerId = customer.id;

            // Save customer ID
            await supabase
                .from('subscriptions')
                .update({ stripe_customer_id: customerId } as never)
                .eq('user_id', user.id);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${request.headers.get('origin')}/dashboard?success=true`,
            cancel_url: `${request.headers.get('origin')}/pricing?canceled=true`,
            metadata: { userId: user.id },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Checkout failed' },
            { status: 500 }
        );
    }
}
