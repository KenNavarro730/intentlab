/**
 * Supabase Auth Callback Route
 * Handles OAuth and magic link redirects with proper cookie handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    // Create response that we'll add cookies to
    const response = NextResponse.redirect(`${origin}/dashboard`);

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                            maxAge: 0,
                        });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Create user record and free subscription if new user
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Check if user exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', user.id)
                    .single();

                if (!existingUser) {
                    // Create user record
                    await supabase.from('users').insert({
                        id: user.id,
                        email: user.email || '',
                        name: user.user_metadata?.full_name || null,
                        avatar_url: user.user_metadata?.avatar_url || null,
                    });

                    // Create free subscription with credits
                    await supabase.from('subscriptions').insert({
                        user_id: user.id,
                        plan: 'free',
                        status: 'active',
                        simulations_limit: 3,
                        credits_limit: 5,
                        credits_overage_enabled: false,
                        current_period_start: new Date().toISOString(),
                        current_period_end: new Date('2099-12-31').toISOString(),
                    });

                    // Initialize usage tracking with credits
                    await supabase.from('usage').insert({
                        user_id: user.id,
                        period_start: new Date().toISOString().slice(0, 7) + '-01',
                        simulations_used: 0,
                        credits_used: 0,
                        credits_remaining: 5,
                    });

                    // Create default user preferences (if table exists)
                    try {
                        await supabase.from('user_preferences').insert({
                            user_id: user.id,
                        });
                    } catch {
                        // Table may not exist yet if schema not migrated
                    }
                }
            }

            return response;
        }
    }

    // Auth error, redirect to login
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
