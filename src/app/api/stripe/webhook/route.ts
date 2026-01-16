/**
 * Stripe Webhook Handler
 * Processes subscription events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { PLANS } from '@/lib/stripe/plans';
import { createClient } from '@supabase/supabase-js';

// Use service role for webhook (no user context, untyped for flexibility)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription as string;

                if (userId && subscriptionId) {
                    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
                        items: { data: Array<{ price: { id: string } }> };
                        current_period_start: number;
                        current_period_end: number;
                    };
                    const priceId = stripeSubscription.items.data[0]?.price.id;

                    // Determine plan from price
                    let plan: keyof typeof PLANS = 'starter';
                    if (priceId === process.env.STRIPE_PRICE_GROWTH) plan = 'growth';
                    if (priceId === process.env.STRIPE_PRICE_AGENCY) plan = 'agency';

                    await supabase
                        .from('subscriptions')
                        .update({
                            stripe_subscription_id: subscriptionId,
                            plan,
                            status: 'active',
                            credits_limit: PLANS[plan].credits,
                            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                        })
                        .eq('user_id', userId);

                    // Reset usage for new billing period
                    const periodStart = new Date().toISOString().slice(0, 7) + '-01';
                    await supabase
                        .from('usage')
                        .upsert({
                            user_id: userId,
                            period_start: periodStart,
                            simulations_used: 0,
                            credits_used: 0,
                            credits_remaining: PLANS[plan].credits,
                        }, { onConflict: 'user_id,period_start' });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer as string;

                const { data: userSub } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (userSub) {
                    const sub = subscription as unknown as {
                        items: { data: Array<{ price: { id: string } }> };
                        status: string;
                        current_period_start: number;
                        current_period_end: number;
                    };
                    const priceId = sub.items.data[0]?.price.id;
                    let plan: keyof typeof PLANS = 'starter';
                    if (priceId === process.env.STRIPE_PRICE_GROWTH) plan = 'growth';
                    if (priceId === process.env.STRIPE_PRICE_AGENCY) plan = 'agency';

                    await supabase
                        .from('subscriptions')
                        .update({
                            plan,
                            status: sub.status === 'active' ? 'active' :
                                sub.status === 'past_due' ? 'past_due' : 'canceled',
                            credits_limit: PLANS[plan].credits,
                            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                        })
                        .eq('user_id', userSub.user_id);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer as string;

                const { data: userSub } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (userSub) {
                    // Downgrade to free
                    await supabase
                        .from('subscriptions')
                        .update({
                            plan: 'free',
                            status: 'active',
                            credits_limit: PLANS.free.credits,
                            stripe_subscription_id: null,
                        })
                        .eq('user_id', userSub.user_id);
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Webhook failed' },
            { status: 500 }
        );
    }
}
