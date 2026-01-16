/**
 * Supabase Server Client
 * Server-side client for Supabase in Next.js App Router
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Handle in middleware
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // Handle in middleware
                    }
                },
            },
        }
    );
}

/**
 * Get current user from server context
 */
export async function getUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Get user's subscription and usage data
 */
export async function getUserSubscription() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    const { data: usage } = await supabase
        .from('usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_start', new Date().toISOString().slice(0, 7) + '-01') // Current month
        .single();

    return { subscription, usage };
}
