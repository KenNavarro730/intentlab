/**
 * Stripe Customer Portal API
 * Redirects users to manage their subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        const sub = subscription as { stripe_customer_id: string | null } | null;
        if (!sub?.stripe_customer_id) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: sub.stripe_customer_id,
            return_url: `${request.headers.get('origin')}/dashboard`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Portal error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Portal failed' },
            { status: 500 }
        );
    }
}
