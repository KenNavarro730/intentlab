/**
 * Supabase Database Types
 * Generated types for the IntentLab database schema
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    updated_at?: string;
                };
            };
            subscriptions: {
                Row: {
                    id: string;
                    user_id: string;
                    stripe_customer_id: string | null;
                    stripe_subscription_id: string | null;
                    plan: 'free' | 'starter' | 'growth' | 'agency';
                    status: 'active' | 'canceled' | 'past_due' | 'trialing';
                    simulations_limit: number;
                    credits_limit: number;
                    credits_overage_enabled: boolean;
                    current_period_start: string;
                    current_period_end: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    plan?: 'free' | 'starter' | 'growth' | 'agency';
                    status?: 'active' | 'canceled' | 'past_due' | 'trialing';
                    simulations_limit?: number;
                    credits_limit?: number;
                    credits_overage_enabled?: boolean;
                    current_period_start?: string;
                    current_period_end?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    plan?: 'free' | 'starter' | 'growth' | 'agency';
                    status?: 'active' | 'canceled' | 'past_due' | 'trialing';
                    simulations_limit?: number;
                    credits_limit?: number;
                    credits_overage_enabled?: boolean;
                    current_period_start?: string;
                    current_period_end?: string;
                    updated_at?: string;
                };
            };
            usage: {
                Row: {
                    id: string;
                    user_id: string;
                    period_start: string;
                    simulations_used: number;
                    credits_used: number;
                    credits_remaining: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    period_start: string;
                    simulations_used?: number;
                    credits_used?: number;
                    credits_remaining?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    simulations_used?: number;
                    credits_used?: number;
                    credits_remaining?: number;
                    updated_at?: string;
                };
            };
            simulations: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    concept: Json;
                    config: Json;
                    status: 'pending' | 'running' | 'completed' | 'failed';
                    results: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    concept: Json;
                    config?: Json;
                    status?: 'pending' | 'running' | 'completed' | 'failed';
                    results?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    name?: string;
                    concept?: Json;
                    config?: Json;
                    status?: 'pending' | 'running' | 'completed' | 'failed';
                    results?: Json | null;
                    updated_at?: string;
                };
            };
        };
    };
}

// Helper types
export type User = Database['public']['Tables']['users']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Usage = Database['public']['Tables']['usage']['Row'];
export type Simulation = Database['public']['Tables']['simulations']['Row'];

// Plan limits (credit-based)
export const PLAN_LIMITS = {
    free: { credits: 5, pricePoints: 3, segments: 1 },
    starter: { credits: 30, pricePoints: 5, segments: 2 },
    growth: { credits: 100, pricePoints: 7, segments: 4 },
    agency: { credits: 300, pricePoints: 99, segments: 99 },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
