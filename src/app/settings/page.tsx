'use client';

/**
 * Settings Page
 * User account settings, preferences, and subscription management
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Sparkles,
    ArrowLeft,
    User,
    CreditCard,
    Zap,
    Mail,
    Loader2,
    Save,
    ExternalLink
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
}

interface SubscriptionData {
    plan: string;
    credits_limit: number;
    credits_overage_enabled: boolean;
    status: string;
    current_period_end: string;
}

interface UsageData {
    credits_used: number;
    credits_remaining: number;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserData | null>(null);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [name, setName] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const supabase = createClient();

        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            window.location.href = '/login';
            return;
        }

        // Load user profile
        const { data: userData } = await supabase
            .from('users')
            .select('id, email, name, avatar_url')
            .eq('id', authUser.id)
            .single();

        if (userData) {
            const typedUserData = userData as { id: string; email: string; name: string | null; avatar_url: string | null };
            setUser(typedUserData);
            setName(typedUserData.name || '');
        }

        // Load subscription
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('plan, credits_limit, credits_overage_enabled, status, current_period_end')
            .eq('user_id', authUser.id)
            .single();

        if (subData) {
            setSubscription(subData as SubscriptionData);
        }

        // Load usage
        const { data: usageData } = await supabase
            .from('usage')
            .select('credits_used, credits_remaining')
            .eq('user_id', authUser.id)
            .order('period_start', { ascending: false })
            .limit(1)
            .single();

        if (usageData) {
            setUsage(usageData as UsageData);
        }

        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        const supabase = createClient();

        await supabase
            .from('users')
            .update({ name } as never)
            .eq('id', user.id);

        setSaving(false);
    };

    const handleManageBilling = async () => {
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Failed to open billing portal:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="size-4" />
                                Back to Dashboard
                            </Link>
                        </div>
                        <Logo size="md" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <User className="size-5 text-primary" />
                                <CardTitle>Profile</CardTitle>
                            </div>
                            <CardDescription>
                                Manage your account information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Email</label>
                                <div className="flex items-center gap-2">
                                    <Mail className="size-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{user?.email}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Display Name</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="max-w-xs"
                                    />
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                        <span className="ml-2">Save</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard className="size-5 text-primary" />
                                <CardTitle>Subscription</CardTitle>
                            </div>
                            <CardDescription>
                                Manage your plan and billing
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg capitalize">
                                            {subscription?.plan || 'Free'} Plan
                                        </span>
                                        <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                                            {subscription?.status || 'Active'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {subscription?.credits_limit || 5} credits per month
                                    </p>
                                </div>
                                <Link href="/pricing">
                                    <Button variant="outline">
                                        {subscription?.plan === 'free' ? 'Upgrade' : 'Change Plan'}
                                    </Button>
                                </Link>
                            </div>

                            {subscription?.plan !== 'free' && (
                                <Button variant="outline" onClick={handleManageBilling}>
                                    <ExternalLink className="size-4 mr-2" />
                                    Manage Billing
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Usage Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="size-5 text-primary" />
                                <CardTitle>Usage</CardTitle>
                            </div>
                            <CardDescription>
                                Your credit usage this billing period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Credits Used</span>
                                        <span className="font-medium">
                                            {usage?.credits_used ?? 0} / {subscription?.credits_limit ?? 5}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{
                                                width: `${((usage?.credits_used ?? 0) / (subscription?.credits_limit ?? 5)) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {usage?.credits_remaining ?? subscription?.credits_limit ?? 5} credits remaining
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
